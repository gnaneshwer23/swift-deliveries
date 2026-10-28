import { IntelligenceCanvasPanel } from "@/components/command/intelligence-canvas-panel";
import { buildInvestigationExperience } from "@/lib/pilot-mission/investigation-experience";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** Phase 3 — calm mandala front stage; motion reflects persisted events only. */
export function InvestigationExperience({
  mission,
  missionId,
  recordVersion,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordVersion: number;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const experience = buildInvestigationExperience(mission);

  return (
    <section
      className="ps-investigation-experience"
      aria-label="Investigation"
      data-state={experience.state}
    >
      <header className="ps-investigation-experience-head">
        <p className="ps-investigation-status" role="status">
          {experience.statusLabel}
        </p>
        <p className="ps-investigation-leave cc-muted text-xs">{experience.leaveNote}</p>
      </header>

      <div className="ps-investigation-visual">
        <div className="ps-investigation-mandala" aria-hidden="true">
          <div className="ps-investigation-mandala-core" data-state={experience.state}>
            <span className="ps-investigation-mandala-core-label">{experience.state}</span>
          </div>
          <ul className="ps-investigation-orbit">
            {experience.keywords.map((kw, index) => (
              <li
                key={kw.id}
                className="ps-investigation-orbit-item"
                style={{ ["--orbit-index" as string]: index }}
                title={`${kw.label} (${kw.basis})`}
              >
                {kw.label}
              </li>
            ))}
          </ul>
        </div>

        <ul
          className="ps-investigation-static ps-investigation-static-a11y"
          aria-label="Investigation keywords"
        >
          {experience.keywords.length ? (
            experience.keywords.map((kw) => (
              <li key={kw.id}>
                <span>{kw.label}</span>
                <span className="cc-muted text-xs">{kw.source}</span>
              </li>
            ))
          ) : (
            <li className="cc-muted text-sm">
              Keywords appear as persisted task and research events land.
            </li>
          )}
        </ul>
      </div>

      {experience.updates.length ? (
        <ul className="ps-investigation-updates" aria-label="Recent persisted updates">
          {experience.updates.map((update) => (
            <li key={update.id}>
              <span className="ps-investigation-update-actor">{update.actor}</span>
              <span className="ps-investigation-update-summary">{update.summary}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ps-investigation-updates-empty cc-muted text-sm">
          Agent lines appear here only when activity, handoffs, or research fields are on the
          record.
        </p>
      )}

      <details className="ps-investigation-map-inspect">
        <summary>Map &amp; controls</summary>
        <IntelligenceCanvasPanel
          mission={mission}
          missionId={missionId}
          recordVersion={recordVersion}
          onDone={onDone}
          onError={onError}
        />
      </details>
    </section>
  );
}
