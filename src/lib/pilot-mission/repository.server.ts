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

export function createMissionStore(db: Db): MissionStore {
  return {
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

export async function postWorkspaceSpend(
  db: Db,
  mission: SupervisedMission,
  spend: SpendRecord,
): Promise<void> {
  if (spend.units <= 0) return;
  const existing = await db
    .from("psi_supervised_spend")
    .select("spend_key")
    .eq("mission_id", mission.id)
    .eq("spend_key", spend.key)
    .maybeSingle();
  if (existing.error) {
    if (unavailable(existing.error)) throw new MissionStoreUnavailableError();
    throw new Error(existing.error.message);
  }
  if (existing.data) return;

  const inserted = await db
    .from("psi_supervised_spend")
    .insert({
      mission_id: mission.id,
      workspace_id: mission.workspaceId,
      spend_key: spend.key,
      units: spend.units,
    })
    .select("spend_key")
    .maybeSingle();
  if (inserted.error) {
    if (unavailable(inserted.error)) throw new MissionStoreUnavailableError();
    if (inserted.error.code === "23505" || /duplicate|unique/i.test(inserted.error.message)) return;
    throw new Error(inserted.error.message);
  }
  if (!inserted.data) return;

  const workspace = await db
    .from("wf_workspaces")
    .select("usage_ceiling, usage_consumed")
    .eq("id", mission.workspaceId)
    .maybeSingle();
  if (workspace.error || !workspace.data) {
    await db
      .from("psi_supervised_spend")
      .delete()
      .eq("mission_id", mission.id)
      .eq("spend_key", spend.key);
    throw new Error(workspace.error?.message ?? "Workspace not found.");
  }
  const ceiling = Number(workspace.data.usage_ceiling);
  const consumed = Number(workspace.data.usage_consumed);
  if (consumed + spend.units > ceiling) {
    await db
      .from("psi_supervised_spend")
      .delete()
      .eq("mission_id", mission.id)
      .eq("spend_key", spend.key);
    throw new Error("Workspace usage ceiling reached. This step was not run.");
  }
  const updated = await db
    .from("wf_workspaces")
    .update({
      usage_consumed: consumed + spend.units,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mission.workspaceId)
    .eq("usage_consumed", consumed)
    .select("id");
  if (updated.error || !((updated.data ?? []) as unknown[]).length) {
    await db
      .from("psi_supervised_spend")
      .delete()
      .eq("mission_id", mission.id)
      .eq("spend_key", spend.key);
    throw new Error(updated.error?.message ?? "Workspace usage changed. Retry this step.");
  }
}
