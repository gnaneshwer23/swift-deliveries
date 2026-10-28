import { buildHonestyPosture } from "@/lib/pilot-mission/honesty-posture";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** R9 — cross-cutting honesty derived from the mission record. */
export function HonestyPosturePanel({ mission }: { mission: SupervisedMission }) {
  const posture = buildHonestyPosture(mission);

  return (
    <section className="cc-panel" aria-label="Honesty posture" id="honesty-posture">
      <h2 className="cc-panel-title">Honesty posture</h2>
      <dl className="ps-honesty-dl mt-3 text-sm">
        <div>
          <dt>Buildability vs desirability</dt>
          <dd>{posture.buildabilityVsDesirability}</dd>
        </div>
        <div>
          <dt>Cost ceilings</dt>
          <dd>
            <ul className="cc-muted mb-0">
              {posture.costSplit.map((line) => (
                <li key={line.slice(0, 48)}>{line}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Notifications</dt>
          <dd>{posture.notifications}</dd>
        </div>
        <div>
          <dt>Recovery</dt>
          <dd>{posture.recovery}</dd>
        </div>
        <div>
          <dt>Accountability</dt>
          <dd>{posture.accountability}</dd>
        </div>
        <div>
          <dt>Accessibility</dt>
          <dd>{posture.accessibility}</dd>
        </div>
        <div>
          <dt>Deliverables</dt>
          <dd>{posture.deliverables}</dd>
        </div>
        <div>
          <dt>Data lifecycle</dt>
          <dd>{posture.dataLifecycle}</dd>
        </div>
      </dl>
      {posture.interviewLabels.length ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium">Interview-related evidence labels</h3>
          <ul className="cc-muted mt-1 text-sm">
            {posture.interviewLabels.map((row) => (
              <li key={row.evidenceId}>
                [{row.evidenceId}] {row.label} — {row.note}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="cc-muted mt-3 text-sm mb-0">
          No interview-labelled evidence on this register (planning/rehearsal/completed).
        </p>
      )}
      {posture.staleEvidence.length ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium">Stale / undated findings to recheck</h3>
          <ul className="cc-muted mt-1 text-sm">
            {posture.staleEvidence.map((row) => (
              <li key={row.evidenceId}>
                [{row.evidenceId}] {row.statement} — {row.guidance}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
