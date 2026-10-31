import { useEffect, useState, type ReactNode } from "react";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import { CaseEvidenceView } from "@/components/command/case-evidence-view";
import { CaseOverviewView } from "@/components/command/case-overview-view";
import { CasePackageView } from "@/components/command/case-package-view";
import { CaseTimelineView } from "@/components/command/case-timeline-view";
import { IndigoCaseStudioShell } from "@/components/command/indigo-case-studio-shell";
import { InvestigationExperience } from "@/components/command/investigation-experience";
import { InvestigationPmBriefingStage } from "@/components/command/investigation-pm-briefing-stage";
import { InvestigationScopeReview } from "@/components/command/investigation-scope-review";
import { InvestigationTeamFormation } from "@/components/command/investigation-team-formation";
import type { MissionTheatreActions } from "@/components/command/mission-theatre";
import { decisionLog, evidenceRegister } from "@/lib/pilot-mission/case-log";
import {
  deriveInvestigationStagePhase,
  type InvestigationStagePhase,
} from "@/lib/pilot-mission/investigation-stage-phase";
import { buildMissionDashboard } from "@/lib/pilot-mission/mission-dashboard-screen";
import { nextRequiredAction, type SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/studio-system.css";

/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */

type ShellProps = {
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
};

/**
 * One case page in two modes (design.md § Case structure):
 * - before a decision, a four-step decision path;
 * - after it, a workspace with Overview, Team, Timeline, Evidence & decisions, Package and Ask
 *   Aria, with the decision path still one click away.
 */
export function InvestigationStageShell(props: ShellProps) {
  const { mission } = props;
  const decisionRecorded = Boolean(mission.approval || mission.continuationPlan);
  const next = nextRequiredAction(mission);
  const waiting = buildMissionDashboard(mission).waitingOnYou.length;

  return (
    <div className="sx sx-case" data-studio-screen="case">
      <header className="sx-case-head">
        <p className="sx-muted" style={{ fontSize: "var(--sx-text-sm)" }}>
          DeliverX Studio · {decisionRecorded ? "Case workspace" : "Decision path"}
        </p>
        <h1>{mission.brief.question}</h1>
        <p className="sx-case-meta">
          <span>
            Next: <strong>{next.title}</strong>
          </span>
          {waiting ? (
            <span className="sx-status" data-state="waiting">
              {waiting} waiting on you
            </span>
          ) : (
            <span className="sx-status">Nothing waiting on you</span>
          )}
        </p>
      </header>
      {decisionRecorded ? <CaseWorkspace {...props} /> : <DecisionPath {...props} />}
    </div>
  );
}

/* ── Decision path: Brief · Investigation · Briefing · Decide ─────────────────────────── */

const STEPS = [
  {
    id: 1,
    title: "Brief",
    description: "Your idea and the answers you gave. Edit before approving.",
  },
  {
    id: 2,
    title: "Investigation",
    description: "Recorded evidence, risks and workstream progress after you approve the plan.",
  },
  {
    id: 3,
    title: "Briefing",
    description: "Aria’s synthesis, the options and her recommendation.",
  },
  {
    id: 4,
    title: "Decide",
    description: "Challenge the recommendation, then record your decision.",
  },
] as const;

function stepForPhase(phase: InvestigationStagePhase): number {
  if (phase === "scope") return 1;
  if (phase === "canvas" || phase === "converge") return 2;
  if (phase === "briefing") return 3;
  return 4;
}

function DecisionPath({
  mission,
  missionId,
  theatre,
  onDone,
  onError,
  pathSlot,
  scopeContext,
}: ShellProps) {
  const planApproved = Boolean(mission.team?.approvedAt);
  const decisionRecorded = Boolean(mission.approval || mission.continuationPlan);
  const active = decisionRecorded ? 4 : stepForPhase(deriveInvestigationStagePhase(mission));
  const [selected, setSelected] = useState(active);
  useEffect(() => setSelected(active), [active]);
  const go = (step: number) => setSelected(Math.max(1, Math.min(STEPS.length, step)));
  const step = STEPS[selected - 1]!;

  return (
    <div className="sx-surface">
      <ol className="sx-steps" aria-label="Decision path">
        {STEPS.map((s) => {
          const done = s.id < active || (s.id === 4 && decisionRecorded);
          return (
            <li key={s.id} data-state={done ? "done" : undefined}>
              <button
                type="button"
                aria-current={s.id === selected ? "step" : undefined}
                onClick={() => go(s.id)}
              >
                <span>
                  {s.title}
                  <span className="sr-only">
                    {done ? " (done)" : s.id === active ? " (next)" : " (not started)"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="sx-step-heading">
        <h2>{step.title}</h2>
        <p>{step.description}</p>
      </div>

      {selected === 1 ? (
        !planApproved && scopeContext ? (
          <>
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
          <div className="sx-gate">
            <strong>{mission.brief.question}</strong>
            <p>
              The brief is approved. It is the shared context for the investigation, the briefing
              and every decision on this case.
            </p>
          </div>
        )
      ) : null}

      {selected === 2 ? (
        planApproved ? (
          <InvestigationExperience
            mission={mission}
            missionId={missionId}
            recordVersion={mission.version}
            onDone={onDone}
            onError={onError}
          />
        ) : (
          <Gate
            title="The investigation starts after you approve the brief"
            body="Approve the bounded plan in Brief. This step then shows recorded evidence and activity."
            action="Review the brief"
            onAction={() => go(1)}
          />
        )
      ) : null}

      {selected === 3 ? (
        planApproved && (mission.proposal || mission.evidence.length) ? (
          <InvestigationPmBriefingStage
            mission={mission}
            onContinueToDecision={(intent) => {
              // Discuss opens an in-place Aria sheet; other actions move to Decide.
              if (intent !== "discuss") go(4);
            }}
          />
        ) : (
          <Gate
            title="The briefing follows the investigation"
            body="Aria’s briefing appears when the investigation has produced enough to summarise."
            action="View the investigation"
            onAction={() => go(2)}
          />
        )
      ) : null}

      {selected === 4 ? <div id="mission-next-action">{pathSlot ?? theatre}</div> : null}

      <nav className="sx-step-foot" aria-label="Move between steps">
        <button
          type="button"
          className="sx-btn"
          onClick={() => go(selected - 1)}
          disabled={selected === 1}
        >
          ← Back
        </button>
        {selected < STEPS.length ? (
          <button type="button" className="sx-btn sx-btn-primary" onClick={() => go(selected + 1)}>
            Continue to {STEPS[selected]!.title.toLowerCase()} →
          </button>
        ) : null}
      </nav>
    </div>
  );
}

function Gate({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="sx-gate">
      <strong>{title}</strong>
      <p>{body}</p>
      <button type="button" className="sx-btn" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

/* ── Case workspace (after the decision) ──────────────────────────────────────────────── */

type View = "overview" | "team" | "timeline" | "evidence" | "package" | "aria" | "path";

const VIEW_COPY: Record<View, { label: string; title: string; description: string }> = {
  overview: {
    label: "Overview",
    title: "Overview",
    description: "Where the case is, what waits on you, and what is at risk.",
  },
  team: {
    label: "Team",
    title: "Team",
    description: "The specialists on this path. Open a card for their work record.",
  },
  timeline: {
    label: "Timeline",
    title: "Timeline",
    description: "Case milestones and the delivery plan, from saved records only.",
  },
  evidence: {
    label: "Evidence & decisions",
    title: "Evidence and decisions",
    description: "Why each decision was made, and the evidence register behind it.",
  },
  package: {
    label: "Package",
    title: "Package",
    description: "What this case hands over, and how each piece was produced.",
  },
  aria: {
    label: "Ask Aria",
    title: "Ask Aria",
    description: "Questions about this case, answered from its saved record.",
  },
  path: {
    label: "Decision path",
    title: "Decision path",
    description: "The brief, investigation, briefing and decision that led here.",
  },
};

function CaseWorkspace(props: ShellProps) {
  const { mission, missionId, recordHash, theatre, downloadsSlot, onDone } = props;
  const [view, setView] = useState<View>(mission.delivery ? "overview" : "team");
  const waiting = buildMissionDashboard(mission).waitingOnYou.length;
  const counts: Partial<Record<View, string>> = {
    overview: waiting ? `${waiting}` : "",
    evidence: `${decisionLog(mission).length} · ${evidenceRegister(mission).length}`,
  };
  const copy = VIEW_COPY[view];
  const items = (Object.keys(VIEW_COPY) as View[]).map((id) => (
    <li key={id}>
      <button
        type="button"
        aria-current={view === id ? "page" : undefined}
        onClick={() => setView(id)}
      >
        <span>{VIEW_COPY[id].label}</span>
        {counts[id] ? (
          <span className="sx-rail-count" data-waiting={id === "overview" ? "" : undefined}>
            {counts[id]}
            <span className="sr-only">
              {id === "overview" ? " waiting on you" : " decisions · evidence items"}
            </span>
          </span>
        ) : null}
      </button>
    </li>
  ));

  return (
    <div className="sx-workspace">
      <nav className="sx-rail" aria-label="Case sections">
        <ul className="sx-rail-list">{items}</ul>
        <details>
          <summary className="sx-rail-sub">Advanced case dossier</summary>
          <IndigoCaseStudioShell
            mission={mission}
            missionId={missionId}
            recordHash={recordHash}
            theatre={theatre}
            downloadsSlot={downloadsSlot}
          />
        </details>
      </nav>

      <main className="sx-surface">
        <details className="sx-rail-mobile">
          <summary>Sections · {copy.label}</summary>
          <ul className="sx-rail-list" aria-label="Case sections">
            {items}
          </ul>
        </details>
        <div className="sx-surface-head">
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>

        {view === "overview" ? (
          <CaseOverviewView mission={mission} onOpen={(v) => setView(v)} nextStep={theatre} />
        ) : null}
        {view === "team" ? (
          <InvestigationTeamFormation
            mission={mission}
            onBeginDelivery={() => setView("overview")}
            onDone={onDone}
          />
        ) : null}
        {view === "timeline" ? <CaseTimelineView mission={mission} /> : null}
        {view === "evidence" ? <CaseEvidenceView mission={mission} /> : null}
        {view === "package" ? (
          <CasePackageView mission={mission} downloadsSlot={downloadsSlot} />
        ) : null}
        {view === "aria" ? (
          <CaseChatPanel
            mission={mission}
            title="Ask Aria about this case"
            helperText="Ask about the next step, approvals, the recommendation, risks, evidence, the team or usage."
            suggestedPrompts={[
              "What is waiting on me?",
              "What is the biggest risk?",
              "Summarise what is on the record so far",
            ]}
          />
        ) : null}
        {view === "path" ? <DecisionPath {...props} /> : null}
      </main>
    </div>
  );
}
