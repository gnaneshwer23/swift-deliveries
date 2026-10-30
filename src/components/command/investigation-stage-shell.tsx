import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { InvestigationExperience } from "@/components/command/investigation-experience";
import { InvestigationPmBriefingStage } from "@/components/command/investigation-pm-briefing-stage";
import { IndigoCaseStudioShell } from "@/components/command/indigo-case-studio-shell";
import { ProjectRoomNav } from "@/components/command/project-room-nav";
import {
  deriveInvestigationStagePhase,
  INVESTIGATION_STAGE_LABELS,
  type InvestigationStagePhase,
} from "@/lib/pilot-mission/investigation-stage-phase";
import { InvestigationScopeReview } from "@/components/command/investigation-scope-review";
import type { MissionTheatreActions } from "@/components/command/mission-theatre";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const STAGE_ORDER: InvestigationStagePhase[] = [
  "scope",
  "canvas",
  "converge",
  "briefing",
  "path",
  "room",
  "history",
];

function stageHref(phase: InvestigationStagePhase): string {
  return `#investigation-${phase}`;
}

export function InvestigationStageShell({
  mission,
  missionId,
  recordHash,
  theatre,
  downloadsSlot,
  onDone,
  onError,
  scopeContext,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordHash: string;
  theatre: ReactNode;
  downloadsSlot: ReactNode | null;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
  scopeContext?: {
    missionOpen: boolean;
    usageWarning: string | null;
    research: MissionTheatreActions["research"];
  };
}) {
  const current = deriveInvestigationStagePhase(mission);
  const planApproved = Boolean(mission.team?.approvedAt);

  return (
    <div className="ps-investigation-stage">
      <header className="ps-investigation-stage-header">
        <p className="ps-foyer-brand">DeliverX Studio</p>
        <h1 className="ps-investigation-stage-title">{mission.brief.question}</h1>
        <p className="cc-muted text-sm">
          Investigation → briefing → your path. Dense case tables live under Advanced.
        </p>
        <ol className="ps-investigation-stage-rail" aria-label="Investigation progress">
          {STAGE_ORDER.map((phase) => {
            const state =
              phase === current
                ? "current"
                : STAGE_ORDER.indexOf(phase) < STAGE_ORDER.indexOf(current)
                  ? "done"
                  : "upcoming";
            return (
              <li key={phase} data-state={state}>
                <a href={stageHref(phase)} className="ps-investigation-stage-step">
                  {INVESTIGATION_STAGE_LABELS[phase]}
                </a>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="ps-investigation-stage-main">
        <section
          id="investigation-scope"
          className="ps-investigation-stage-panel"
          hidden={current !== "scope" && planApproved}
          aria-label={INVESTIGATION_STAGE_LABELS.scope}
        >
          {!planApproved ? (
            <>
              <p className="cc-kicker">Scope &amp; approve</p>
              <p className="text-sm">
                Review the interpreted brief and approve the investigation plan. Nothing billable
                runs until you approve.
              </p>
              {scopeContext ? (
                <InvestigationScopeReview
                  mission={mission}
                  missionId={missionId}
                  missionOpen={scopeContext.missionOpen}
                  usageWarning={scopeContext.usageWarning}
                  research={scopeContext.research}
                  onDone={onDone}
                  onError={onError}
                />
              ) : null}
              {theatre}
            </>
          ) : null}
        </section>

        {planApproved ? (
          <>
            <section
              id="investigation-canvas"
              className="ps-investigation-stage-panel"
              hidden={current !== "canvas" && current !== "converge"}
              aria-label="Living investigation"
            >
              <InvestigationExperience
                mission={mission}
                missionId={missionId}
                recordVersion={mission.version}
                onDone={onDone}
                onError={onError}
              />
            </section>

            <section
              id="investigation-briefing"
              className="ps-investigation-stage-panel"
              hidden={current !== "briefing" && current !== "path"}
              aria-label="PM briefing"
            >
              <InvestigationPmBriefingStage mission={mission} />
            </section>

            <section
              id="investigation-path"
              className="ps-investigation-stage-panel"
              hidden={current !== "path"}
              aria-label="Choose path"
            >
              <p className="cc-kicker">Your gate</p>
              <p className="text-sm cc-muted">
                Authorise test, investigate further, revise, or pause — continuation plan before
                build.
              </p>
              {theatre}
            </section>

            <section
              id="investigation-room"
              className="ps-investigation-stage-panel"
              hidden={current !== "room"}
              aria-label="Project room"
            >
              <p className="cc-kicker">Project room</p>
              <p className="cc-muted text-sm mb-3">
                Shared context → evidence → use → downstream — inspect connections in the full
                record.
              </p>
              <ProjectRoomNav mission={mission} />
              {theatre}
            </section>

            <section
              id="investigation-history"
              className="ps-investigation-stage-panel"
              hidden={current !== "history"}
              aria-label="Downloads"
            >
              <p className="cc-kicker">History &amp; downloads</p>
              <p className="cc-muted text-sm">
                Decision pack, roadmap, and full archive disclose simulated vs observed content in{" "}
                <code>project-manifest.json</code>.
              </p>
              {downloadsSlot ?? <p className="cc-muted text-sm">No export on record yet.</p>}
              <p className="mt-3">
                <Link to="/command/portfolio" className="cc-btn cc-btn-secondary">
                  Portfolio history
                </Link>
              </p>
            </section>

            {current === "canvas" || current === "converge" || current === "briefing" ? (
              <div className="ps-investigation-stage-gates">{theatre}</div>
            ) : null}
          </>
        ) : null}
      </div>

      <details className="ps-investigation-advanced mt-6">
        <summary>Advanced · indigo case dossier</summary>
        <IndigoCaseStudioShell
          mission={mission}
          missionId={missionId}
          recordHash={recordHash}
          theatre={theatre}
          downloadsSlot={downloadsSlot}
        />
      </details>
    </div>
  );
}
