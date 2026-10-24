import { neonTransaction, type DbTransaction } from "@/lib/db/neon.server";
import type { Db } from "@/lib/db/builder";
import { isMissingRelationError } from "@/lib/workforce/db";
import {
  MissionConflictError,
  MissionStoreUnavailableError,
  missionFromRow,
  type MissionStore,
} from "./service";
import type { SpendRecord, SupervisedMission } from "./types";

function unavailable(
  error: { message?: string | undefined; code?: string | undefined } | null | undefined,
): boolean {
  if (!error) return false;
  const probe: { message?: string; code?: string } = {};
  if (typeof error.message === "string") probe.message = error.message;
  if (typeof error.code === "string") probe.code = error.code;
  return (
    isMissingRelationError(probe) || /unknown table: psi_supervised/i.test(error.message ?? "")
  );
}

function rowFrom(mission: SupervisedMission): Record<string, unknown> {
  return {
    id: mission.id,
    workspace_id: mission.workspaceId,
    owner_user_id: mission.ownerUserId,
    version: mission.version,
    stage: mission.stage,
    job_status: mission.job.status,
    usage_consumed: mission.usageConsumed,
    usage_ceiling: mission.usageCeiling,
    document: mission,
    updated_at: mission.updatedAt,
  };
}

export function createMissionStore(
  db: Db,
  transact: DbTransaction = neonTransaction,
): MissionStore {
  return {
    async saveFollowUp(parent, expectedVersion, child) {
      if (parent.workspaceId !== child.workspaceId) throw new MissionConflictError();
      return transact(async (tx) => {
        const store = createMissionStore(tx, transact);
        await store.save(parent, expectedVersion);
        await store.save(child, 0);
        return parent;
      });
    },
    async get(workspaceId, id) {
      const res = await db
        .from("psi_supervised_missions")
        .select("*")
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (res.error) {
        if (unavailable(res.error)) throw new MissionStoreUnavailableError();
        throw new Error(res.error.message);
      }
      return missionFromRow(res.data as Record<string, unknown> | null, workspaceId);
    },
    async list(workspaceId) {
      const res = await db
        .from("psi_supervised_missions")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (res.error) {
        if (unavailable(res.error)) throw new MissionStoreUnavailableError();
        throw new Error(res.error.message);
      }
      return ((res.data ?? []) as Record<string, unknown>[]).flatMap((row) => {
        const mission = missionFromRow(row, workspaceId);
        return mission ? [mission] : [];
      });
    },
    async save(mission, expectedVersion) {
      if (expectedVersion === 0) {
        const ins = await db
          .from("psi_supervised_missions")
          .insert(rowFrom(mission))
          .select("id")
          .maybeSingle();
        if (ins.error) {
          if (unavailable(ins.error)) throw new MissionStoreUnavailableError();
          throw new Error(ins.error.message);
        }
        return mission;
      }
      const upd = await db
        .from("psi_supervised_missions")
        .update(rowFrom(mission))
        .eq("id", mission.id)
        .eq("workspace_id", mission.workspaceId)
        .eq("version", expectedVersion)
        .select("id");
      if (upd.error) {
        if (unavailable(upd.error)) throw new MissionStoreUnavailableError();
        throw new Error(upd.error.message);
      }
      if (!((upd.data ?? []) as unknown[]).length) throw new MissionConflictError();
      return mission;
    },
  };
}

/** Legacy spend reconciliation is atomic. New provider attempts reserve this row before dispatch. */
export async function postWorkspaceSpend(
  _db: Db,
  mission: SupervisedMission,
  spend: SpendRecord,
  transact: DbTransaction = neonTransaction,
): Promise<void> {
  if (spend.units <= 0) return;
  await transact(async (_tx, query) => {
    const workspace = await query(
      "select usage_ceiling, usage_consumed from wf_workspaces where id = $1::uuid for update",
      [mission.workspaceId],
    );
    if (!workspace[0]) throw new Error("Workspace not found.");
    const exists = await query(
      "select 1 from psi_supervised_spend where mission_id = $1::uuid and spend_key = $2::text",
      [mission.id, spend.key],
    );
    if (exists.length) return;
    const consumed = Number(workspace[0]["usage_consumed"]);
    if (consumed + spend.units > Number(workspace[0]["usage_ceiling"]))
      throw new Error(
        "Workspace usage ceiling reached; the prior provider usage needs reconciliation.",
      );
    await query(
      "insert into psi_supervised_spend(mission_id,workspace_id,spend_key,units) values ($1::uuid,$2::uuid,$3::text,$4::int)",
      [mission.id, mission.workspaceId, spend.key, String(spend.units)],
    );
    await query(
      "update wf_workspaces set usage_consumed = usage_consumed + $2::int, updated_at = now() where id = $1::uuid",
      [mission.workspaceId, String(spend.units)],
    );
  });
}
