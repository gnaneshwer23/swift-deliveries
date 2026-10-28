import {
  type CollaborationEdgeKind,
  ensureTeamCollaboration,
  traceFindingToRecommendation,
} from "@/lib/pilot-mission/team-collaboration";
import { AGENT_RECOMMENDATION_LABELS } from "@/lib/pilot-mission/verdict";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const EDGE_LABELS: Record<CollaborationEdgeKind, string> = {
  planned_dependency: "Planned dependency",
  actual_share: "Actual information shared",
  actual_use: "Actual downstream use",
  resulting_artefact: "Resulting artefact / decision",
};

export function TeamActivityPanel({ mission }: { mission: SupervisedMission }) {
  const record = ensureTeamCollaboration(mission);
  if (!record) return null;

  const primaryFindingId = record.recommendation?.sourceFindingIds[0];
  const trace =
    primaryFindingId && record.recommendation
      ? traceFindingToRecommendation(record, primaryFindingId, mission.evidence)
      : null;

  return (
    <section className="cc-panel" aria-label="Team activity and handoffs" id="pr-team-activity">
      <h2 className="cc-panel-title">Team activity</h2>
      <p className="cc-muted text-sm">
        Structured assignments and handoffs from persisted events — not staged agent chat. Simulated
        drafts are labelled honestly.
      </p>

      <h3 className="cc-subhead mt-4">Investigation assignments</h3>
      <ul className="mt-2 grid gap-2 text-sm">
        {record.assignments.map((a) => (
          <li key={a.taskKey} className="cc-panel">
            <strong>
              {a.ownerLabel}
              {a.capabilityId ? ` (${a.capabilityId})` : ""}
            </strong>
            <p className="cc-muted">{a.why}</p>
            <p className="text-xs cc-muted mt-1">
              Inputs: {a.inputsExpected.join(" · ")} → {a.outputExpected}
            </p>
          </li>
        ))}
      </ul>

      {record.handoffs.length > 0 ? (
        <>
          <h3 className="cc-subhead mt-4">Handoffs</h3>
          <ol className="mt-2 grid gap-3 text-sm">
            {record.handoffs
              .filter((h) => !h.id.endsWith("-use"))
              .map((h) => (
                <li key={h.id} className="cc-panel">
                  <p>
                    <strong>
                      {h.fromTaskKey} → {h.toTaskKey}
                    </strong>{" "}
                    <span className="cc-muted">({h.productionLabel})</span>
                  </p>
                  <p>{h.findingSummary}</p>
                  <p className="cc-muted">Request: {h.request}</p>
                  {h.evidenceIds.length ? (
                    <p className="text-xs cc-muted">Evidence ids: {h.evidenceIds.join(", ")}</p>
                  ) : null}
                  {h.uncertainty ? (
                    <p className="text-xs cc-muted">Uncertainty: {h.uncertainty}</p>
                  ) : null}
                  {h.actualResult ? <p className="mt-1">{h.actualResult}</p> : null}
                </li>
              ))}
          </ol>
        </>
      ) : (
        <p className="cc-muted text-sm mt-3">Handoffs appear after plan approval and specialist work.</p>
      )}

      <h3 className="cc-subhead mt-4">Information flow</h3>
      <ul className="mt-2 grid gap-1 text-xs cc-muted">
        {record.edges.map((e) => (
          <li key={e.id}>
            <strong>{EDGE_LABELS[e.kind]}</strong>: {e.fromTaskKey} → {e.toTaskKey} — {e.label}
          </li>
        ))}
      </ul>

      {record.recommendation ? (
        <div className="cc-panel mt-4">
          <h3 className="cc-subhead">Agent recommendation (on record)</h3>
          <p>
            {AGENT_RECOMMENDATION_LABELS[record.recommendation.recommendation]}
            {record.recommendation.executionLimited ? " · execution-limited" : ""}
          </p>
          <p className="cc-muted text-sm">{record.recommendation.rationale}</p>
          {trace ? (
            <p className="text-xs cc-muted mt-2">
              Trace: finding {trace.findingId} via handoffs {trace.handoffIds.join(" → ")}.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
