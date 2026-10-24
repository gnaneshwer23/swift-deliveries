import { scopeHash } from "./scope.server";
import { neonTransaction, type DbTransaction } from "@/lib/db/neon.server";
import { UsageLimitError } from "./service";
import { spendKey, type GenerationResult, type SupervisedMission } from "./types";

export class ComparisonReconciliationRequired extends Error {
  constructor() {
    super(
      "A previous provider attempt may have run. Its allowance is held for operator reconciliation; it will not be called again automatically.",
    );
    this.name = "ComparisonReconciliationRequired";
  }
}

/** Reserve workspace and activated-pilot allowance together before an external call. */
export async function reservedComparison(
  mission: SupervisedMission,
  run: () => Promise<GenerationResult>,
  transact: DbTransaction = neonTransaction,
): Promise<GenerationResult> {
  const key = spendKey(scopeHash(mission.brief, mission.evidence));
  const cached = await transact(async (_db, query) => {
    // One shared lock serializes all missions in this workspace, not only this mission.
    const workspaces = await query(
      "select usage_ceiling, usage_consumed from wf_workspaces where id = $1::uuid for update",
      [mission.workspaceId],
    );
    const workspace = workspaces[0];
    if (!workspace) throw new Error("Workspace not found.");
    const owned = await query(
      "select id from psi_supervised_missions where id=$1::uuid and workspace_id=$2::uuid",
      [mission.id, mission.workspaceId],
    );
    if (!owned.length) throw new Error("Mission not found.");
    const previous = (
      await query(
        "select status,result,workspace_id from psi_comparison_reservations where mission_id=$1::uuid and spend_key=$2::text",
        [mission.id, key],
      )
    )[0];
    if (previous) {
      if (previous["workspace_id"] !== mission.workspaceId) throw new Error("Mission not found.");
      if (previous["status"] === "completed" || previous["status"] === "released") {
        if (!previous["result"]) throw new ComparisonReconciliationRequired();
        const result =
          typeof previous["result"] === "string"
            ? JSON.parse(previous["result"])
            : previous["result"];
        if (!result || typeof result.ran !== "boolean" || typeof result.output !== "string")
          throw new ComparisonReconciliationRequired();
        return result as GenerationResult;
      }
      throw new ComparisonReconciliationRequired();
    }
    if (Number(workspace["usage_consumed"]) + 1 > Number(workspace["usage_ceiling"]))
      throw new UsageLimitError();
    const activation = (
      await query(
        "select id,mission_allowance,missions_consumed from psi_pilot_activations where workspace_id=$1::uuid for update",
        [mission.workspaceId],
      )
    )[0];
    if (
      activation &&
      Number(activation["missions_consumed"]) >= Number(activation["mission_allowance"])
    )
      throw new UsageLimitError("Pilot comparison allowance is used. No provider call was made.");
    await query(
      "insert into psi_comparison_reservations(mission_id,workspace_id,spend_key,status,units,activation_id,requested_by,scope_hash) values($1::uuid,$2::uuid,$3::text,'reserved',1,nullif($4::text,'')::uuid,$5::text,$6::text)",
      [
        mission.id,
        mission.workspaceId,
        key,
        activation ? String(activation["id"]) : "",
        mission.ownerUserId,
        scopeHash(mission.brief, mission.evidence),
      ],
    );
    await query(
      "insert into psi_supervised_spend(mission_id,workspace_id,spend_key,units) values($1::uuid,$2::uuid,$3::text,1)",
      [mission.id, mission.workspaceId, key],
    );
    await query(
      "update wf_workspaces set usage_consumed=usage_consumed+1, updated_at=now() where id=$1::uuid",
      [mission.workspaceId],
    );
    if (activation)
      await query(
        "update psi_pilot_activations set missions_consumed=missions_consumed+1 where id=$1::uuid",
        [String(activation["id"])],
      );
    return null;
  });
  if (cached) return cached;

  let result: GenerationResult;
  try {
    result = await run();
  } catch (error) {
    // Provider failure is not proof that no billable work happened. Retain reservation.
    await transact(async (_db, query) => {
      await query(
        "update psi_comparison_reservations set status='uncertain',updated_at=now() where mission_id=$1::uuid and workspace_id=$2::uuid and spend_key=$3::text and status='reserved'",
        [mission.id, mission.workspaceId, key],
      );
    }).catch(() => undefined); // A still-reserved row is equally fail-closed after a DB outage.
    throw error;
  }
  await transact(async (_db, query) => {
    await query("select id from wf_workspaces where id=$1::uuid for update", [mission.workspaceId]);
    const rows = await query(
      "select status,activation_id from psi_comparison_reservations where mission_id=$1::uuid and workspace_id=$2::uuid and spend_key=$3::text for update",
      [mission.id, mission.workspaceId, key],
    );
    if (rows[0]?.["status"] !== "reserved") throw new ComparisonReconciliationRequired();
    if (!result.ran) {
      // Explicit no-dispatch result is safe to refund. Unknown/throwing results never use this path.
      await query(
        "update wf_workspaces set usage_consumed=usage_consumed-1,updated_at=now() where id=$1::uuid",
        [mission.workspaceId],
      );
      if (rows[0]["activation_id"])
        await query(
          "update psi_pilot_activations set missions_consumed=missions_consumed-1 where id=$1::uuid",
          [String(rows[0]["activation_id"])],
        );
      await query(
        "delete from psi_supervised_spend where mission_id=$1::uuid and spend_key=$2::text",
        [mission.id, key],
      );
    }
    await query(
      "update psi_comparison_reservations set status=$4::text,result=$5::jsonb,updated_at=now() where mission_id=$1::uuid and workspace_id=$2::uuid and spend_key=$3::text",
      [
        mission.id,
        mission.workspaceId,
        key,
        result.ran ? "completed" : "released",
        JSON.stringify(result),
      ],
    );
  });
  return result;
}
