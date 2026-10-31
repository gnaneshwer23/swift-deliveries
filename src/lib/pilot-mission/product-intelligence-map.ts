/**
 * Screen 5 — Product Intelligence Map data.
 * Workstream states and notes come only from persisted mission fields.
 */
import { buildIntelligenceCanvas, type CanvasNodeState } from "./intelligence-canvas";
import { buildInvestigationExperience } from "./investigation-experience";
import type { SupervisedMission } from "./types";

export type WorkstreamVisualState = "not_started" | "active" | "complete" | "waiting";

export type ProductIntelligenceWorkstreamId =
  "market" | "users" | "competition" | "risks" | "opportunities" | "direction";

export type ProductIntelligenceAgentChip = {
  name: string;
  role: string;
  task: string;
  workstreamId: ProductIntelligenceWorkstreamId;
};

export type ProductIntelligenceWorkstream = {
  id: ProductIntelligenceWorkstreamId;
  label: string;
  state: WorkstreamVisualState;
  stateLabel: string;
  detail: string;
  eventBasis: string[];
  agent: ProductIntelligenceAgentChip;
};

export type ProductIntelligenceNote = {
  id: string;
  agent: string;
  action: string;
  at: string;
  sourceType: string;
  evidenceStatus: string;
};

export type ProductIntelligenceMapModel = {
  version: "product-intelligence-map-v1";
  projectName: string;
  stageLabel: "Investigation";
  ideaLabel: string;
  pmStatus: string;
  progressPercent: number;
  progressLabel: string;
  activeWorkstreamCount: number;
  planApproved: boolean;
  workstreams: ProductIntelligenceWorkstream[];
  insightCards: Array<{ id: string; title: string; summary: string; honestyLabel: string }>;
  notes: ProductIntelligenceNote[];
};

const WORKSTREAM_DEFS: Array<{
  id: ProductIntelligenceWorkstreamId;
  label: string;
  canvasId: "market" | "needs" | "alternatives" | "risks" | "assumptions" | "evidence";
  agentName: string;
  agentRole: string;
  idleTask: string;
  activeTask: string;
  completeTask: string;
  waitingTask: string;
}> = [
  {
    id: "market",
    label: "Market",
    canvasId: "market",
    agentName: "Scout",
    agentRole: "Market research",
    idleTask: "Waiting for plan approval",
    activeTask: "Exploring market context",
    completeTask: "Market findings on record",
    waitingTask: "Market gaps need your review",
  },
  {
    id: "users",
    label: "Users",
    canvasId: "needs",
    agentName: "Maya",
    agentRole: "User research",
    idleTask: "Waiting for plan approval",
    activeTask: "Mapping user needs",
    completeTask: "User findings on record",
    waitingTask: "User evidence needs review",
  },
  {
    id: "competition",
    label: "Competition",
    canvasId: "alternatives",
    agentName: "Rex",
    agentRole: "Competitive analysis",
    idleTask: "Waiting for plan approval",
    activeTask: "Comparing alternatives",
    completeTask: "Alternatives on record",
    waitingTask: "Conflicts need review",
  },
  {
    id: "risks",
    label: "Risks",
    canvasId: "risks",
    agentName: "Nova",
    agentRole: "Risk & gaps",
    idleTask: "Waiting for plan approval",
    activeTask: "Testing assumptions",
    completeTask: "Risks labelled on record",
    waitingTask: "Risks flagged for you",
  },
  {
    id: "opportunities",
    label: "Opportunities",
    canvasId: "assumptions",
    agentName: "Atlas",
    agentRole: "Commercial framing",
    idleTask: "Waiting for plan approval",
    activeTask: "Framing commercial bets",
    completeTask: "Assumptions on record",
    waitingTask: "Assumptions need your call",
  },
  {
    id: "direction",
    label: "Product direction",
    canvasId: "evidence",
    agentName: "Aria",
    agentRole: "AI Product Manager",
    idleTask: "Waiting for plan approval",
    activeTask: "Shaping product direction",
    completeTask: "Direction draft on record",
    waitingTask: "Direction ready for your review",
  },
];

function mapCanvasState(state: CanvasNodeState, planApproved: boolean): WorkstreamVisualState {
  if (!planApproved) return "not_started";
  if (state === "settled") return "complete";
  if (state === "active") return "active";
  if (state === "review" || state === "blocked") return "waiting";
  return "not_started";
}

function stateLabel(state: WorkstreamVisualState): string {
  switch (state) {
    case "complete":
      return "Complete";
    case "active":
      return "Active";
    case "waiting":
      return "Waiting on you";
    default:
      return "Not started";
  }
}

function taskFor(
  def: (typeof WORKSTREAM_DEFS)[number],
  state: WorkstreamVisualState,
  planApproved: boolean,
): string {
  if (!planApproved) return def.idleTask;
  if (state === "complete") return def.completeTask;
  if (state === "active") return def.activeTask;
  if (state === "waiting") return def.waitingTask;
  return "Queued — no recorded work yet";
}

function projectNameFromIdea(idea: string): string {
  const trimmed = idea.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Untitled investigation";
  const firstSentence = trimmed.split(/[.?!]/)[0]?.trim() || trimmed;
  if (firstSentence.length <= 48) return firstSentence;
  return `${firstSentence.slice(0, 45).trimEnd()}…`;
}

function notesFromMission(mission: SupervisedMission): ProductIntelligenceNote[] {
  const fromActivity = (mission.activity ?? [])
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 24)
    .map((event) => ({
      id: event.id,
      agent: event.actor === "human" ? "You" : event.actor === "system" ? "System" : event.actor,
      action: event.summary,
      at: event.at,
      sourceType: event.kind,
      evidenceStatus: "Recorded on case",
    }));

  if (fromActivity.length) return fromActivity;

  // Fall back to normalized experience updates (still event-backed).
  const experience = buildInvestigationExperience(mission);
  return experience.updates.slice(0, 24).map((update) => ({
    id: update.id,
    agent: update.actor,
    action: update.summary,
    at: update.at,
    sourceType: update.source,
    evidenceStatus: "Recorded on case",
  }));
}

export function buildProductIntelligenceMap(
  mission: SupervisedMission,
): ProductIntelligenceMapModel {
  const canvas = buildIntelligenceCanvas(mission);
  const experience = buildInvestigationExperience(mission);
  const planApproved = Boolean(mission.team?.approvedAt);

  const workstreams = WORKSTREAM_DEFS.map((def) => {
    const node = canvas.nodes.find((n) => n.id === def.canvasId);
    const state = mapCanvasState(node?.state ?? "idle", planApproved);
    const agent: ProductIntelligenceAgentChip = {
      name: def.agentName,
      role: def.agentRole,
      task: taskFor(def, state, planApproved),
      workstreamId: def.id,
    };
    return {
      id: def.id,
      label: def.label,
      state,
      stateLabel: stateLabel(state),
      detail: node?.detail ?? "No record yet.",
      eventBasis: node?.eventBasis ?? [],
      agent,
    };
  });

  const activeWorkstreamCount = workstreams.filter((w) => w.state === "active").length;
  const completeCount = workstreams.filter((w) => w.state === "complete").length;
  const waitingCount = workstreams.filter((w) => w.state === "waiting").length;

  // Honest progress: only from recorded node states, never a fake timer.
  const progressPercent = planApproved
    ? Math.round(
        ((completeCount * 1 + activeCountWeight(activeWorkstreamCount) + waitingCount * 0.35) /
          workstreams.length) *
          100,
      )
    : 0;

  const progressLabel = !planApproved
    ? "Investigation not started — approve the plan to begin."
    : `Investigation ${progressPercent}% complete — ${activeWorkstreamCount} workstream${
        activeWorkstreamCount === 1 ? "" : "s"
      } active.`;

  return {
    version: "product-intelligence-map-v1",
    projectName: projectNameFromIdea(mission.brief.question),
    stageLabel: "Investigation",
    ideaLabel: experience.ideaLabel,
    pmStatus: canvas.statusLine,
    progressPercent: Math.min(100, progressPercent),
    progressLabel,
    activeWorkstreamCount,
    planApproved,
    workstreams,
    insightCards: experience.artefactPreviews.map((preview) => ({
      id: preview.id,
      title: preview.title,
      summary: preview.summary,
      honestyLabel: preview.honestyLabel,
    })),
    notes: notesFromMission(mission),
  };
}

function activeCountWeight(active: number): number {
  return active * 0.55;
}
