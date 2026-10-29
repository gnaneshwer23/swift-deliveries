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
  const themes = experience.keywords;

  function themeList(side: "left" | "right") {
    const items = themes.filter((_, index) => index % 2 === (side === "left" ? 0 : 1));
    return (
      <ul className={`ps-investigation-themes ps-investigation-themes-${side}`}>
        {items.map((kw) => (
          <li key={kw.id} data-source={kw.source}>
            <span>{kw.label}</span>
            <small>
              {kw.source === "research"
                ? "Research record"
                : kw.source === "teamCollaboration"
                  ? "Shared work"
                  : "Activity"}
            </small>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section
      className="ps-investigation-experience"
      aria-label="Investigation"
      data-state={experience.state}
    >
      <header className="ps-investigation-experience-head">
        <div>
          <p className="ps-investigation-eyebrow">Investigation stage</p>
          <h3>Understanding the opportunity</h3>
        </div>
        <p className="ps-investigation-status" role="status">
          {experience.statusLabel}
        </p>
      </header>

      <div className="ps-investigation-visual" aria-label="Investigation topics">
        <div className="ps-investigation-stage">
          {themes.length ? themeList("left") : null}
          <div className="ps-investigation-core">
            <span className="ps-investigation-core-kicker">Your idea</span>
            <strong>{mission.brief.question}</strong>
          </div>
          {themes.length ? themeList("right") : null}
          {!themes.length ? (
            <p className="ps-investigation-no-themes">
              Research topics will appear as work is recorded.
            </p>
          ) : null}
        </div>
      </div>

      <div className="ps-investigation-record">
        <div className="ps-investigation-record-heading">
          <h4>Recorded activity</h4>
          <p className="ps-investigation-leave cc-muted text-xs">{experience.leaveNote}</p>
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
            No research activity has been recorded yet.
          </p>
        )}
      </div>

      <details className="ps-investigation-map-inspect">
        <summary>Inspect work and controls</summary>
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
