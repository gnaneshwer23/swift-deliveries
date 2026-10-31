import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { InvestigationExperience } from "@/components/command/investigation-experience";
import { InvestigationTeamFormation } from "@/components/command/investigation-team-formation";
import { InvestigationPmBriefingStage } from "@/components/command/investigation-pm-briefing-stage";
import { IndigoCaseStudioShell } from "@/components/command/indigo-case-studio-shell";
import { MissionDashboardScreen } from "@/components/command/mission-dashboard-screen";
import { ProjectRoomNav } from "@/components/command/project-room-nav";
import {
  deriveInvestigationStagePhase,
  type InvestigationStagePhase,
} from "@/lib/pilot-mission/investigation-stage-phase";
import { InvestigationScopeReview } from "@/components/command/investigation-scope-review";
import type { MissionTheatreActions } from "@/components/command/mission-theatre";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type JourneyStep = {
  id: number;
  title: string;
  description: string;
  /** Studio screen label for the interactive 10-screen flow. */
  screenLabel: string;
  continueLabel: string;
};
const JOURNEY: JourneyStep[] = [
  {
    id: 1,
    title: "Your idea",
    description: "Shape the brief and its constraints",
    screenLabel: "Screens 3–4 · Idea & clarify",
    continueLabel: "Continue to investigation",
  },
  {
    id: 2,
    title: "Investigation",
    description: "Product intelligence map, evidence and risks",
    screenLabel: "Screen 5 · Intelligence map",
    continueLabel: "Continue to PM briefing",
  },
  {
    id: 3,
    title: "PM briefing",
    description: "Recommendation, options and next decision",
    screenLabel: "Screen 6 · PM briefing",
    continueLabel: "Continue to discuss & decide",
  },
  {
    id: 4,
    title: "Discuss & decide",
    description: "Challenge Aria’s recommendation and save your decision",
    screenLabel: "Screen 7 · Discussion",
    continueLabel: "Continue to meet the team",
  },
  {
    id: 5,
    title: "Meet the team",
    description: "Specialists selected for the approved first phase · open a card for Screen 9",
    screenLabel: "Screens 8–9 · Team & agent workspace",
    continueLabel: "Continue to mission dashboard",
  },
  {
    id: 6,
    title: "Mission dashboard",
    description: "One place for stage, agents, outputs, approvals and risks",
    screenLabel: "Screen 10 · Mission dashboard",
    continueLabel: "Continue to iterate & deliver",
  },
  {
    id: 7,
    title: "Iterate & deliver",
    description: "Review updates, decisions and project files",
    screenLabel: "Delivery record",
    continueLabel: "You’re on the last project step",
  },
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
  const canAdvance = selectedStep < 7 && (selectedStep < 5 || decisionRecorded);
  const nextStep = JOURNEY.find((item) => item.id === selectedStep + 1) ?? null;

  return (
    <div className="ps-journey-dashboard">
      <header className="ps-journey-header">
        <div>
          <p className="ps-foyer-brand">
            DELIVERX STUDIO <span>· PROJECT WORKSPACE</span>
          </p>
          <h1>{mission.brief.question}</h1>
          <p className="cc-muted text-sm">
            One shared project space. Use the left rail or Back / Continue to move between Studio
            screens. Each stage builds on the same brief and evidence.
          </p>
        </div>
        <div className="ps-journey-current">
          <span>{step.screenLabel}</span>
          <strong>{step.title}</strong>
          <small>Step {selectedStep} of 7 · interactive path</small>
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
              <p className="cc-kicker">
                STEP {selectedStep} · {step.screenLabel}
              </p>
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
                className="cc-btn cc-btn-primary"
                onClick={() => go(selectedStep + 1)}
                disabled={!canAdvance}
                title={
                  !canAdvance && selectedStep >= 5 && !decisionRecorded
                    ? "Record a decision first to open the team and dashboard"
                    : undefined
                }
              >
                {canAdvance && nextStep ? `${step.continueLabel} →` : "End of path"}
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
                <InvestigationPmBriefingStage
                  mission={mission}
                  missionId={missionId}
                  onContinueToDecision={(intent) => {
                    // Discuss opens an in-place Aria sheet; other actions move to Step 4.
                    if (intent === "discuss") return;
                    go(4);
                    if (typeof document !== "undefined") {
                      window.setTimeout(() => {
                        document.getElementById("mission-next-action")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 50);
                    }
                  }}
                />
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
                <InvestigationTeamFormation mission={mission} onBeginDelivery={() => go(6)} />
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
            <section className="ps-journey-panel" aria-label="Mission dashboard">
              {decisionRecorded ? (
                <MissionDashboardScreen
                  mission={mission}
                  downloadsSlot={downloadsSlot}
                  onOpenTeam={() => go(5)}
                />
              ) : (
                <div className="ps-journey-gate">
                  <strong>The mission dashboard opens after your decision</strong>
                  <p>
                    Approve a direction and meet the team first. The dashboard then shows recorded
                    stage, agents, outputs and blockers — never invented live progress.
                  </p>
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

          <footer
            className="ps-journey-controls ps-journey-footer"
            aria-label="Move between screens"
          >
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => go(selectedStep - 1)}
              disabled={selectedStep === 1}
            >
              ← Previous screen
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-primary"
              onClick={() => go(selectedStep + 1)}
              disabled={!canAdvance}
            >
              {canAdvance && nextStep ? `${step.continueLabel} →` : "Last project step"}
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
