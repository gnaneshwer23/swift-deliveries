import { neonTransaction, type DbTransaction } from "@/lib/db/neon.server";

export type ReconciliationInput = {
  workspaceId: string;
  missionId: string;
  spendKey: string;
  outcome: "charged" | "not_dispatched";
  evidenceNote: string;
};

export async function reconcileComparison(
  input: ReconciliationInput,
  operator: { authorised: boolean; id: string },
  transact: DbTransaction = neonTransaction,
) {
  if (!operator.authorised || !operator.id) throw new Error("Not authorised.");
  const note = input.evidenceNote.trim();
  if (note.length < 20 || note.length > 2000)
    throw new Error("Record the provider evidence for this decision.");
  if (!["charged", "not_dispatched"].includes(input.outcome)) throw new Error("Invalid decision.");
  return transact(async (_db, query) => {
    const workspace = (
      await query("select id,usage_consumed from wf_workspaces where id=$1::uuid for update", [
        input.workspaceId,
      ])
    )[0];
    if (!workspace) throw new Error("Workspace not found.");
    const row = (
      await query(
        `select r.*, r.updated_at < now() - interval '10 minutes' as settled,
        (m.job_status='leased' and (m.document->'job'->>'leaseUntil')::timestamptz > now()) as active
        from psi_comparison_reservations r
        join psi_supervised_missions m on m.id=r.mission_id and m.workspace_id=r.workspace_id
        where r.mission_id=$1::uuid and r.spend_key=$2::text and r.workspace_id=$3::uuid
        for update of r`,
        [input.missionId, input.spendKey, input.workspaceId],
      )
    )[0];
    if (!row) throw new Error("Reservation not found.");
    const existing = (
      await query(
        "select outcome from psi_comparison_reconciliations where mission_id=$1::uuid and spend_key=$2::text",
        [input.missionId, input.spendKey],
      )
    )[0];
    if (existing) {
      if (existing["outcome"] !== input.outcome)
        throw new Error("This attempt was already reconciled differently.");
      return { already: true };
    }
    if (!["reserved", "uncertain"].includes(String(row["status"])))
      throw new Error("Only unresolved attempts can be reconciled.");
    // Wait beyond the deployed invocation lifetime before resolving an abandoned reservation.
    if (row["active"]) throw new Error("The comparison is still running.");
    if (!row["settled"])
      throw new Error("Wait ten minutes after the attempt before reconciling it.");
    if (input.outcome === "not_dispatched") {
      const units = Number(row["units"]);
      if (Number(workspace["usage_consumed"]) < units)
        throw new Error("Usage counters need investigation.");
      if (row["activation_id"]) {
        const activation = (
          await query(
            "select missions_consumed from psi_pilot_activations where id=$1::uuid and workspace_id=$2::uuid for update",
            [String(row["activation_id"]), input.workspaceId],
          )
        )[0];
        if (!activation || Number(activation["missions_consumed"]) < units)
          throw new Error("Pilot counters need investigation.");
        await query(
          "update psi_pilot_activations set missions_consumed=missions_consumed-$2::int where id=$1::uuid",
          [String(row["activation_id"]), String(units)],
        );
      }
      await query(
        "update wf_workspaces set usage_consumed=usage_consumed-$2::int,updated_at=now() where id=$1::uuid",
        [input.workspaceId, String(units)],
      );
      await query(
        "delete from psi_supervised_spend where mission_id=$1::uuid and spend_key=$2::text",
        [input.missionId, input.spendKey],
      );
      const result = {
        ran: false,
        label: "not run - operator confirmed no provider dispatch",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [
          "Operator released the reservation after checking provider evidence. No model output is available.",
        ],
      };
      await query(
        "update psi_comparison_reservations set status='released',result=$3::jsonb,updated_at=now() where mission_id=$1::uuid and spend_key=$2::text",
        [input.missionId, input.spendKey, JSON.stringify(result)],
      );
    }
    await query(
      "insert into psi_comparison_reconciliations(mission_id,spend_key,outcome,operator_id,evidence_note) values($1::uuid,$2::text,$3::text,$4::text,$5::text)",
      [input.missionId, input.spendKey, input.outcome, operator.id, note],
    );
    return { already: false };
  });
}
