import { IntelligenceCanvasPanel } from "@/components/command/intelligence-canvas-panel";
import {
  buildInvestigationExperience,
  type InvestigationHandoffPulse,
  type InvestigationTheme,
  type InvestigationThemeId,
} from "@/lib/pilot-mission/investigation-experience";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const THEME_LAYOUT: Record<InvestigationThemeId, { x: number; y: number }> = {
  customer_problem: { x: 50, y: 18 },
  alternatives: { x: 82, y: 42 },
  commercial: { x: 18, y: 42 },
  feasibility: { x: 28, y: 78 },
  evidence_gaps: { x: 72, y: 78 },
};

function HandoffSvg({ pulses }: { pulses: InvestigationHandoffPulse[] }) {
  if (!pulses.length) return null;
  return (
    <svg className="ps-investigation-handoffs" aria-hidden="true" viewBox="0 0 100 100">
      {pulses.map((pulse) => {
        const from = THEME_LAYOUT[pulse.fromTheme];
        const to = THEME_LAYOUT[pulse.toTheme];
        return (
          <line
            key={pulse.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="ps-investigation-handoff-line"
            data-basis={pulse.basis}
          />
        );
      })}
    </svg>
  );
}

function ThemeCluster({ theme }: { theme: InvestigationTheme }) {
  const pos = THEME_LAYOUT[theme.id];
  return (
    <article
      className="ps-investigation-theme"
      data-kind={theme.kind}
      style={{ ["--theme-x" as string]: `${pos.x}%`, ["--theme-y" as string]: `${pos.y}%` }}
      title={theme.basis}
    >
      <h3 className="ps-investigation-theme-label">{theme.label}</h3>
      <p className="ps-investigation-theme-detail">{theme.detail}</p>
      <p className="ps-investigation-theme-kind cc-muted text-xs">
        {theme.kind === "supported"
          ? "Supported on register"
          : theme.kind === "gap"
            ? "Gap labelled"
            : "Under investigation"}
      </p>
    </article>
  );
}

/** Investigation canvas — motion and connections reflect persisted events only. */
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
      data-converging={experience.converging ? "true" : undefined}
    >
      <header className="ps-investigation-experience-head">
        <p className="ps-investigation-status" role="status">
          {experience.statusLabel}
        </p>
        <p className="ps-investigation-leave cc-muted text-xs">{experience.leaveNote}</p>
      </header>

      <div className="ps-investigation-visual ps-investigation-canvas">
        <HandoffSvg pulses={experience.handoffPulses} />
        <div className="ps-investigation-idea-core" aria-label="Your idea">
          <p className="ps-investigation-idea-kicker">Idea</p>
          <p className="ps-investigation-idea-text">{experience.ideaLabel}</p>
        </div>
        <div className="ps-investigation-theme-field" aria-label="Research themes">
          {experience.themes.map((theme) => (
            <ThemeCluster key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {experience.artefactPreviews.length ? (
        <ul className="ps-investigation-artefacts" aria-label="Artefact previews">
          {experience.artefactPreviews.map((preview) => (
            <li key={preview.id}>
              <article className="ps-investigation-artefact-card">
                <p className="ps-investigation-artefact-title">{preview.title}</p>
                <p className="cc-muted text-sm mb-0">{preview.summary}</p>
                <p className="cc-muted text-xs mb-0">{preview.honestyLabel}</p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}

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
          Updates appear when activity, handoffs, or research fields land on the record — not on a
          timer.
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
