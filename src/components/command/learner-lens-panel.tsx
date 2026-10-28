import { buildLearnerSummary } from "@/lib/pilot-mission/learner-lens";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** P-D — your contributions and judgements on this case (not agent activity volume). */
export function LearnerLensPanel({ mission }: { mission: SupervisedMission }) {
  const summary = buildLearnerSummary(mission);

  return (
    <section className="cc-panel" id="learner-lens" aria-label="Learner lens">
      <h2 className="cc-panel-title">Your contributions</h2>
      <p className="cc-muted text-sm">{summary.headline}</p>
      <p className="cc-muted mt-1 text-xs">{summary.notCounted}</p>

      <h3 className="mt-4 text-sm font-medium">What you contributed</h3>
      <ol className="mt-2 grid gap-2">
        {summary.contributions.map((item) => (
          <li key={`${item.kind}-${item.at ?? item.title}`} className="text-sm">
            <span className="cc-chip">{item.title}</span>
            <p className="cc-muted mt-1">{item.detail}</p>
          </li>
        ))}
      </ol>

      {summary.judgements.length ? (
        <>
          <h3 className="mt-4 text-sm font-medium">How you judged</h3>
          <ul className="mt-2 grid gap-2">
            {summary.judgements.map((item) => (
              <li key={item.id} className="text-sm">
                <p>
                  <strong>{item.title}</strong> — {item.stance}
                </p>
                <p className="cc-muted mt-1">{item.detail}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {summary.prompts.length ? (
        <>
          <h3 className="mt-4 text-sm font-medium">Reflection (optional)</h3>
          <p className="cc-muted text-xs">
            These prompts do not block Compare, Decide, or Export.
          </p>
          <ul className="mt-2 grid gap-2">
            {summary.prompts.map((item) => (
              <li key={item.id} className="text-sm cc-muted">
                {item.prompt}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
