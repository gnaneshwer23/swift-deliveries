import { buildPmBriefingPack } from "@/lib/pilot-mission/pm-briefing-pack";
import { buildCustomerJobsPipeline } from "@/lib/pilot-mission/customer-jobs-pipeline";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

export function ProjectBriefingBanner({ mission }: { mission: SupervisedMission }) {
  const pack = buildPmBriefingPack(mission);
  const jobs = buildCustomerJobsPipeline(mission);
  const { brief } = mission;

  return (
    <div className="ps-indigo-briefing-stack">
      <section className="ps-indigo-synthesis-banner" aria-label="Synthesized understanding">
        <p className="ps-exec-section-kicker mb-1">Synthesized understanding</p>
        <p className="text-sm mb-2">
          {pack.ready
            ? pack.understoodIdea
            : "Understanding builds after research and options are on the record — not before."}
        </p>
        {pack.recommendationLabel ? (
          <p className="ps-exec-meta mb-0">
            Agent-reviewed recommendation: {pack.recommendationLabel}
            {pack.recommendationRationale ? ` — ${pack.recommendationRationale.slice(0, 160)}` : ""}
          </p>
        ) : (
          <p className="ps-exec-meta mb-0">
            No recommendation label yet — Simulated draft spine only.
          </p>
        )}
      </section>

      <ol className="ps-indigo-jobs-pipeline" aria-label="Customer jobs pipeline">
        {jobs.map((job) => (
          <li key={job.id} data-state={job.state}>
            <span className="ps-indigo-job-label">{job.label}</span>
            <span className="cc-muted text-xs">{job.detail}</span>
          </li>
        ))}
      </ol>

      <section className="ps-exec-card ps-indigo-brief-fields" aria-label="Editable brief summary">
        <p className="ps-exec-section-kicker">Brief on record</p>
        <dl className="ps-indigo-brief-dl">
          <div>
            <dt>Problem / question</dt>
            <dd>{brief.question || "—"}</dd>
          </div>
          <div>
            <dt>Customer / audience</dt>
            <dd>{brief.audience || "—"}</dd>
          </div>
          <div>
            <dt>Value / outcome</dt>
            <dd>{brief.outcome || "—"}</dd>
          </div>
          <div>
            <dt>Constraints</dt>
            <dd>{brief.constraints || "—"}</dd>
          </div>
        </dl>
        <p className="cc-muted text-xs mb-0">
          Edit the full brief under Inspect full record. Fields above mirror persisted storage.
        </p>
      </section>

      {(pack.supporting.length > 0 || pack.counterevidence.length > 0) && (
        <div className="ps-indigo-epistemic-grid">
          <section className="ps-exec-card" aria-label="Evidence supporting">
            <p className="ps-exec-section-kicker">Supporting</p>
            {pack.supporting.length ? (
              <ul className="cc-muted text-sm ps-indigo-list mb-0">
                {pack.supporting.map((line) => (
                  <li key={line.slice(0, 40)}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="cc-muted text-sm mb-0">None listed yet.</p>
            )}
          </section>
          <section className="ps-exec-card" aria-label="Evidence opposing">
            <p className="ps-exec-section-kicker">Opposing / gaps</p>
            {pack.counterevidence.length ? (
              <ul className="cc-muted text-sm ps-indigo-list mb-0">
                {pack.counterevidence.map((line) => (
                  <li key={line.slice(0, 40)}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="cc-muted text-sm mb-0">No counterevidence tagged yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
