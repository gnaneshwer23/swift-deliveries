import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { InvestigationExperience } from "@/components/command/investigation-experience";
import { InvestigationTeamFormation } from "@/components/command/investigation-team-formation";
import { InvestigationPmBriefingStage } from "@/components/command/investigation-pm-briefing-stage";
import { IndigoCaseStudioShell } from "@/components/command/indigo-case-studio-shell";
import { ProjectRoomNav } from "@/components/command/project-room-nav";
import {
  deriveInvestigationStagePhase,
  type InvestigationStagePhase,
} from "@/lib/pilot-mission/investigation-stage-phase";
import { InvestigationScopeReview } from "@/components/command/investigation-scope-review";
import type { MissionTheatreActions } from "@/components/command/mission-theatre";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type JourneyStep = { id: number; title: string; description: string };
const JOURNEY: JourneyStep[] = [
  { id: 1, title: "Your idea", description: "Shape the brief and its constraints" },
  { id: 2, title: "AI analysis", description: "Research, evidence, risks and options" },
  { id: 3, title: "PM briefing", description: "Review the recommendation and roadmap" },
  {
    id: 4,
    title: "Discuss & decide",
    description: "Challenge assumptions and approve a direction",
  },
  { id: 5, title: "Meet the team", description: "See the specialists selected for this mission" },
  { id: 6, title: "Work in progress", description: "Follow recorded tasks, outputs and blockers" },
  { id: 7, title: "Iterate & deliver", description: "Review updates, decisions and project files" },
];

function phaseStep(phase: InvestigationStagePhase): number {
  if (phase === "scope") return 1;
  if (phase === "canvas" || phase === "converge") return 2;
  if (phase === "briefing") return 3;
  if (phase === "path") return 4;
  if (phase === "room") return 5;
  return 7;
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
  pathSlot,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordHash: string;
  theatre: ReactNode;
  downloadsSlot: ReactNode | null;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
  pathSlot?: ReactNode;
  scopeContext?: {
    missionOpen: boolean;
    usageWarning: string | null;
    research: MissionTheatreActions["research"];
  };
}) {
  const current = deriveInvestigationStagePhase(mission);
  const planApproved = Boolean(mission.team?.approvedAt);
  const decisionRecorded = Boolean(mission.approval || mission.continuationPlan);
  const activeStep =
    mission.exportBody || mission.artefact
      ? 7
      : planApproved && decisionRecorded
        ? 6
        : phaseStep(current);
  const [selectedStep, setSelectedStep] = useState(activeStep);
  useEffect(() => setSelectedStep(activeStep), [activeStep]);
  const step = JOURNEY.find((item) => item.id === selectedStep) ?? JOURNEY[0]!;
  const go = (next: number) => setSelectedStep(Math.max(1, Math.min(7, next)));

  return (
    <div className="ps-journey-dashboard">
      <header className="ps-journey-header">
        <div>
          <p className="ps-foyer-brand">
            DELIVERX STUDIO <span>· PROJECT WORKSPACE</span>
          </p>
          <h1>{mission.brief.question}</h1>
          <p className="cc-muted text-sm">
            One shared project space. Revisit earlier decisions at any time; each new stage builds
            on the same brief and evidence.
          </p>
        </div>
        <div className="ps-journey-current">
          <span>PROJECT STAGE</span>
          <strong>{step.title}</strong>
          <small>Step {selectedStep} of 7</small>
        </div>
      </header>

      <div className="ps-journey-layout">
        <nav className="ps-journey-nav" aria-label="Project journey">
          <p className="cc-kicker">THE JOURNEY</p>
          <ol>
            {JOURNEY.map((item) => {
              const done =
                item.id < activeStep ||
                (item.id === 1 && planApproved) ||
                (item.id === 4 && decisionRecorded);
              const state =
                item.id === selectedStep
                  ? "current"
                  : done
                    ? "complete"
                    : item.id < activeStep
                      ? "complete"
                      : "upcoming";
              return (
                <li key={item.id} data-state={state}>
                  <button
                    type="button"
                    aria-current={item.id === selectedStep ? "step" : undefined}
                    onClick={() => go(item.id)}
                  >
                    <span className="ps-journey-number">
                      {done && item.id !== selectedStep ? "✓" : item.id}
                    </span>
                    <span className="ps-journey-nav-copy">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    {item.id === selectedStep ? (
                      <span className="ps-journey-current-mark">Viewing</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="ps-journey-context">
            <span>SHARED PROJECT CONTEXT</span>
            <p>Idea · evidence · decisions · roadmap · team outputs</p>
          </div>
          <details className="ps-investigation-advanced">
            <summary>Advanced case dossier</summary>
            <IndigoCaseStudioShell
              mission={mission}
              missionId={missionId}
              recordHash={recordHash}
              theatre={theatre}
              downloadsSlot={downloadsSlot}
            />
          </details>
        </nav>

        <main className="ps-journey-workspace">
          <div className="ps-journey-step-heading">
            <div>
              <p className="cc-kicker">STEP {selectedStep} · PROJECT JOURNEY</p>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </div>
            <div className="ps-journey-controls">
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={() => go(selectedStep - 1)}
                disabled={selectedStep === 1}
              >
                ← Back
              </button>
              <button
                type="button"
                className="cc-btn cc-btn-secondary"
                onClick={() => go(selectedStep + 1)}
                disabled={selectedStep === 7 || (selectedStep >= 5 && !decisionRecorded)}
              >
                Next →
              </button>
            </div>
          </div>

          {selectedStep === 1 ? (
            <section className="ps-journey-panel" aria-label="Idea submission">
              {!planApproved && scopeContext ? (
                <>
                  <p className="cc-kicker">REFINE THE BRIEF</p>
                  <p className="cc-muted text-sm">
                    A short idea is enough to begin. Add context only where it changes the
                    recommendation.
                  </p>
                  <InvestigationScopeReview
                    mission={mission}
                    missionId={missionId}
                    missionOpen={scopeContext.missionOpen}
                    usageWarning={scopeContext.usageWarning}
                    research={scopeContext.research}
                    onDone={onDone}
                    onError={onError}
                  />
                  {theatre}
                </>
              ) : (
                <>
                  <p className="cc-kicker">SAVED PROJECT BRIEF</p>
                  <div className="ps-journey-idea-card">
                    <strong>{mission.brief.question}</strong>
                    <p className="cc-muted text-sm">
                      This idea is the shared source of context for the analysis, PM decisions, team
                      tasks and delivery record.
                    </p>
                  </div>
                  <button className="cc-btn cc-btn-secondary" type="button" onClick={() => go(2)}>
                    Continue to analysis →
                  </button>
                </>
              )}
            </section>
          ) : null}

          {selectedStep === 2 ? (
            <section className="ps-journey-panel" aria-label="AI analysis">
              {planApproved ? (
                <InvestigationExperience
                  mission={mission}
                  missionId={missionId}
                  recordVersion={mission.version}
                  onDone={onDone}
                  onError={onError}
                />
              ) : (
                <>
                  <p className="cc-kicker">ANALYSIS STARTS AFTER APPROVAL</p>
                  <p className="cc-muted text-sm">
                    Review the idea and approve the investigation plan in Step 1. The analysis view
                    will then show recorded evidence and activity.
                  </p>
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => go(1)}>
                    Review idea →
                  </button>
                </>
              )}
            </section>
          ) : null}

          {selectedStep === 3 ? (
            <section className="ps-journey-panel" aria-label="PM briefing">
              {planApproved && (mission.proposal || mission.evidence.length) ? (
                <InvestigationPmBriefingStage mission={mission} />
              ) : (
                <>
                  <p className="cc-kicker">BRIEFING FOLLOWS ANALYSIS</p>
                  <p className="cc-muted text-sm">
                    The PM briefing appears here when the investigation has produced enough material
                    to summarize.
                  </p>
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => go(2)}>
                    View analysis →
                  </button>
                </>
              )}
            </section>
          ) : null}

          {selectedStep === 4 ? (
            <section className="ps-journey-panel" aria-label="Discussion and approval">
              {pathSlot ?? (
                <>
                  <p className="cc-kicker">DISCUSS THE DIRECTION</p>
                  <p className="cc-muted text-sm">
                    When the PM briefing is ready, choose a direction, ask for more research or
                    record a decision here.
                  </p>
                  {theatre}
                </>
              )}
            </section>
          ) : null}

          {selectedStep === 5 ? (
            <section className="ps-journey-panel" aria-label="Team formation">
              {decisionRecorded ? (
                <InvestigationTeamFormation mission={mission} />
              ) : (
                <div className="ps-journey-gate">
                  <strong>Team formation follows your decision</strong>
                  <p>
                    Review the PM recommendation and approve a direction in Step 4. The team will be
                    matched to that scope.
                  </p>
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => go(4)}>
                    Return to discussion →
                  </button>
                </div>
              )}
            </section>
          ) : null}

          {selectedStep === 6 ? (
            <section className="ps-journey-panel" aria-label="Background execution">
              {decisionRecorded ? (
                <>
                  <p className="cc-kicker">WORKSPACE ACTIVITY</p>
                  <p className="cc-muted text-sm">
                    Recorded work, outputs and blockers are shown as they become available. This
                    view uses the project’s saved activity; it does not invent live agent progress.
                  </p>
                  <ProjectRoomNav mission={mission} />
                  {theatre}
                </>
              ) : (
                <div className="ps-journey-gate">
                  <strong>Work begins after the team and plan are approved</strong>
                  <p>Recorded tasks and outputs will appear here when available.</p>
                  <button type="button" className="cc-btn cc-btn-secondary" onClick={() => go(5)}>
                    Meet the team →
                  </button>
                </div>
              )}
            </section>
          ) : null}

          {selectedStep === 7 ? (
            <section className="ps-journey-panel" aria-label="Iteration and delivery">
              <p className="cc-kicker">ITERATION &amp; DELIVERY RECORD</p>
              <p className="cc-muted text-sm">
                Return to earlier steps to revise a decision. Keep each recorded update and export
                together here.
              </p>
              {decisionRecorded ? (
                <>
                  <ProjectRoomNav mission={mission} />
                  <div className="ps-journey-export">
                    <h3>Project files</h3>
                    {downloadsSlot ?? (
                      <p className="cc-muted text-sm">No export is recorded yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="ps-journey-gate">
                  <strong>Delivery history will build as work is completed</strong>
                  <p>
                    The project record will collect approved decisions, outputs and downloadable
                    files.
                  </p>
                </div>
              )}
              <p className="mt-3">
                <Link to="/command/portfolio" className="cc-btn cc-btn-secondary">
                  Portfolio history
                </Link>
              </p>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
