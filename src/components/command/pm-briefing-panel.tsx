import { buildPmBriefingPack } from "@/lib/pilot-mission/pm-briefing-pack";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const SWOT_LABEL = {
  strength: "Strength",
  weakness: "Weakness",
  opportunity: "Opportunity",
  threat: "Threat",
} as const;

/** PT-1 — product briefing when options/decision are ready; not a human-review claim. */
export function PmBriefingPanel({ mission }: { mission: SupervisedMission }) {
  const pack = buildPmBriefingPack(mission);
  if (!pack.ready) return null;

  return (
    <section className="ps-pm-briefing" aria-label="Product briefing">
      <p className="cc-kicker">Your product briefing is ready</p>
      <h3 className="ps-pm-briefing-title">Product briefing</h3>
      <p className="cc-muted text-sm">{pack.roleDisclosure}</p>
      <p className="cc-muted text-sm">{pack.honesty}</p>

      <h4 className="ps-pm-briefing-h">What we understood</h4>
      <p className="text-sm">{pack.understoodIdea}</p>

      {pack.recommendationLabel ? (
        <>
          <h4 className="ps-pm-briefing-h">Recommendation</h4>
          <p className="text-sm">
            <strong>{pack.recommendationLabel}</strong>
          </p>
          <p className="cc-muted text-sm">{pack.recommendationRationale}</p>
        </>
      ) : null}

      {pack.disagreesWithRecommendation && pack.humanNextPathLabel ? (
        <div className="ps-pm-briefing-disagree" role="status">
          <h4 className="ps-pm-briefing-h">Human path vs recommendation</h4>
          <p className="text-sm">
            Recommendation stays on the record: <strong>{pack.recommendationLabel}</strong>
          </p>
          <p className="text-sm">
            Your authorised path: <strong>{pack.humanNextPathLabel}</strong>
          </p>
          {pack.humanDecisionNote ? (
            <p className="cc-muted text-sm">Note: {pack.humanDecisionNote}</p>
          ) : null}
        </div>
      ) : pack.humanNextPathLabel ? (
        <>
          <h4 className="ps-pm-briefing-h">Human next path</h4>
          <p className="text-sm">{pack.humanNextPathLabel}</p>
        </>
      ) : null}

      <h4 className="ps-pm-briefing-h">Separate assessments</h4>
      <ul className="ps-pm-assessments">
        {pack.assessments.map((item) => (
          <li key={item.dimension}>
            <span className="cc-chip">
              {item.title} · {item.reading.replaceAll("_", " ")}
            </span>
            <p className="cc-muted mt-1 text-sm">{item.summary}</p>
            {item.basisIds.length ? (
              <p className="text-xs cc-muted">Basis: {item.basisIds.join(", ")}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {pack.supporting.length ? (
        <>
          <h4 className="ps-pm-briefing-h">Strongest support</h4>
          <ul className="text-sm cc-muted">
            {pack.supporting.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}

      {pack.counterevidence.length ? (
        <>
          <h4 className="ps-pm-briefing-h">Counterevidence & gaps</h4>
          <ul className="text-sm cc-muted">
            {pack.counterevidence.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}

      {pack.alternatives.length ? (
        <>
          <h4 className="ps-pm-briefing-h">Alternatives on the record</h4>
          <ul className="text-sm cc-muted">
            {pack.alternatives.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}

      {pack.unknowns.length ? (
        <>
          <h4 className="ps-pm-briefing-h">Important unknowns</h4>
          <ul className="text-sm cc-muted">
            {pack.unknowns.map((line) => (
              <li key={line.slice(0, 40)}>{line}</li>
            ))}
          </ul>
        </>
      ) : null}

      {pack.swot.length ? (
        <>
          <h4 className="ps-pm-briefing-h">Actionable SWOT</h4>
          <ul className="ps-pm-swot">
            {pack.swot.map((item) => (
              <li key={`${item.kind}-${item.statement.slice(0, 24)}`}>
                <strong>
                  {SWOT_LABEL[item.kind]}: {item.statement}
                </strong>
                <p className="cc-muted text-sm">Basis: {item.basis}</p>
                <p className="text-sm">Implication: {item.implication}</p>
                <p className="text-sm">Next question: {item.nextQuestion}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h4 className="ps-pm-briefing-h">Smallest defensible next step</h4>
      <p className="text-sm">{pack.smallestNextStep}</p>

      <p className="ps-pm-briefing-actions">
        <a className="cc-btn cc-btn-secondary" href="#mission-judgement">
          Open the evidence
        </a>
        <a className="cc-btn cc-btn-secondary" href="#mission-next-action">
          Choose a path
        </a>
      </p>
    </section>
  );
}
