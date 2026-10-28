import { buildPmBriefingPack } from "@/lib/pilot-mission/pm-briefing-pack";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** Quiet Studio — focused briefing when options are ready; depth lives under Inspect. */
export function FocusedPmBriefing({ mission }: { mission: SupervisedMission }) {
  const pack = buildPmBriefingPack(mission);
  if (!pack.ready) return null;

  return (
    <section className="ps-pm-briefing-focused" aria-label="Product briefing summary">
      <p className="cc-kicker">Briefing ready</p>
      <h3 className="ps-pm-briefing-title">Recommendation</h3>
      {pack.recommendationLabel ? (
        <p className="text-sm">
          <strong>{pack.recommendationLabel}</strong>
        </p>
      ) : (
        <p className="cc-muted text-sm">Pending research and options.</p>
      )}
      <p className="cc-muted text-sm">{pack.recommendationRationale}</p>

      {pack.disagreesWithRecommendation && pack.humanNextPathLabel ? (
        <div className="ps-pm-briefing-disagree mt-3" role="status">
          <p className="text-sm">
            <strong>Your path differs from the recommendation.</strong>
          </p>
          <p className="cc-muted text-sm">
            Agent recommendation stays on the record: {pack.recommendationLabel}. Your authorised
            path: {pack.humanNextPathLabel}.
          </p>
          {pack.humanDecisionNote ? (
            <p className="cc-muted text-sm">Note: {pack.humanDecisionNote}</p>
          ) : null}
        </div>
      ) : null}

      <dl className="ps-pm-briefing-focused-grid">
        <div>
          <dt>Supporting evidence</dt>
          <dd>
            {pack.supporting.length ? (
              <ul className="text-sm cc-muted">
                {pack.supporting.slice(0, 3).map((line) => (
                  <li key={line.slice(0, 48)}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="cc-muted text-sm">None on the register yet.</p>
            )}
          </dd>
        </div>
        <div>
          <dt>Counterevidence</dt>
          <dd>
            {pack.counterevidence.length ? (
              <ul className="text-sm cc-muted">
                {pack.counterevidence.slice(0, 3).map((line) => (
                  <li key={line.slice(0, 48)}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="cc-muted text-sm">None labelled yet.</p>
            )}
          </dd>
        </div>
        <div>
          <dt>Important unknowns</dt>
          <dd>
            {pack.unknowns.length ? (
              <ul className="text-sm cc-muted">
                {pack.unknowns.slice(0, 3).map((line) => (
                  <li key={line.slice(0, 48)}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="cc-muted text-sm">None labelled yet.</p>
            )}
          </dd>
        </div>
      </dl>

      <h4 className="ps-pm-briefing-h">Next step</h4>
      <p className="text-sm">{pack.smallestNextStep}</p>

      <p className="ps-pm-briefing-actions">
        <a className="cc-btn cc-btn-secondary" href="#mission-judgement">
          Open evidence
        </a>
        <a className="cc-btn cc-btn-secondary" href="#mission-next-action">
          Choose path
        </a>
      </p>
    </section>
  );
}
