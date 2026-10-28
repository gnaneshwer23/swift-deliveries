/**
 * Phase 3 — Animated investigation experience (data layer).
 * Keywords, status, and agent lines come from persisted activity, teamCollaboration,
 * and research fields only — never timer-fake progress or fabricated dialogue.
 */
import { ensureTeamCollaboration } from "./team-collaboration";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type InvestigationRunState = "idle" | "running" | "waiting" | "interrupted" | "complete";

export type InvestigationEventSource = "activity" | "teamCollaboration" | "research";

export type InvestigationKeyword = {
  id: string;
  label: string;
  source: InvestigationEventSource;
  basis: string;
};

export type InvestigationAgentUpdate = {
  id: string;
  at: string;
  actor: string;
  summary: string;
  source: InvestigationEventSource;
  basis: string;
};

export type InvestigationExperience = {
  version: "investigation-experience-v1";
  active: boolean;
  state: InvestigationRunState;
  statusLabel: string;
  leaveNote: string;
  keywords: InvestigationKeyword[];
  updates: InvestigationAgentUpdate[];
};

const HUMAN_WAIT_IDS = new Set([
  "approve_plan",
  "decide",
  "expectation",
  "observation",
  "review",
  "approve_follow_up",
  "approve_prototype",
  "export",
  "evidence",
  "compare",
  "retry",
  "artefact",
]);

const STATE_LABELS: Record<InvestigationRunState, string> = {
  idle: "Idle",
  running: "Investigation running",
  waiting: "Waiting on you",
  interrupted: "Interrupted",
  complete: "Investigation complete",
};

function keywordFromActivity(
  event: SupervisedMission["activity"][number],
): InvestigationKeyword | null {
  const label = (event.taskKey ?? event.kind).replace(/[._]/g, " ").trim();
  if (!label) return null;
  return {
    id: `kw-act-${event.id}`,
    label: label.length > 28 ? `${label.slice(0, 25)}…` : label,
    source: "activity",
    basis: `activity:${event.kind}`,
  };
}

function keywordsFromMission(mission: SupervisedMission): InvestigationKeyword[] {
  const seen = new Set<string>();
  const out: InvestigationKeyword[] = [];

  const push = (kw: InvestigationKeyword | null) => {
    if (!kw) return;
    const key = kw.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(kw);
  };

  for (const event of [...(mission.activity ?? [])].reverse()) {
    push(keywordFromActivity(event));
    if (out.length >= 8) break;
  }

  const collab = ensureTeamCollaboration(mission);
  if (collab) {
    for (const handoff of [...collab.handoffs].reverse()) {
      push({
        id: `kw-handoff-${handoff.id}`,
        label: handoff.toTaskKey.replace(/_/g, " "),
        source: "teamCollaboration",
        basis: `handoff:${handoff.id}`,
      });
      if (out.length >= 8) break;
    }
    for (const assignment of collab.assignments) {
      push({
        id: `kw-assign-${assignment.taskKey}`,
        label: assignment.taskKey.replace(/_/g, " "),
        source: "teamCollaboration",
        basis: `assignment:${assignment.taskKey}`,
      });
      if (out.length >= 8) break;
    }
  }

  if (mission.researchProvider) {
    push({
      id: "kw-research-provider",
      label: mission.researchProvider,
      source: "research",
      basis: "researchProvider",
    });
  }
  for (const gap of (mission.researchGaps ?? []).slice(0, 3)) {
    const short = gap.length > 26 ? `${gap.slice(0, 23)}…` : gap;
    push({
      id: `kw-gap-${short}`,
      label: short,
      source: "research",
      basis: "researchGaps",
    });
    if (out.length >= 8) break;
  }

  return out.slice(0, 8);
}

function updatesFromMission(mission: SupervisedMission): InvestigationAgentUpdate[] {
  const rows: InvestigationAgentUpdate[] = [];

  for (const event of mission.activity ?? []) {
    rows.push({
      id: event.id,
      at: event.at,
      actor: event.actor,
      summary: event.summary,
      source: "activity",
      basis: `activity:${event.kind}`,
    });
  }

  const collab = ensureTeamCollaboration(mission);
  if (collab) {
    for (const handoff of collab.handoffs) {
      if (!handoff.findingSummary.trim()) continue;
      rows.push({
        id: `handoff-${handoff.id}`,
        at: handoff.sharedAt,
        actor: handoff.fromActor,
        summary: handoff.findingSummary,
        source: "teamCollaboration",
        basis: `handoff:${handoff.id}`,
      });
    }
  }

  if (mission.researchPassCompletedAt) {
    const cited = mission.evidence.filter((e) => e.classification === "supplied").length;
    const gaps = mission.evidence.filter((e) => e.classification === "gap").length;
    rows.push({
      id: "research-pass-completed",
      at: mission.researchPassCompletedAt,
      actor: "system",
      summary:
        cited > 0
          ? `Research pass settled — ${cited} supplied finding(s) on the register.`
          : gaps > 0
            ? `Research pass settled — ${gaps} honest gap(s) recorded; no invented web hits.`
            : "Research pass settled on the mission record.",
      source: "research",
      basis: "researchPassCompletedAt",
    });
  }

  return rows
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-4)
    .reverse();
}

export function deriveInvestigationRunState(mission: SupervisedMission): InvestigationRunState {
  if (mission.stage === "cancelled") return "idle";
  if (!mission.team?.approvedAt) return "idle";

  if (mission.studioMeta?.investigationPaused) return "interrupted";
  if (mission.job.status === "failed") return "interrupted";

  const next = nextRequiredAction(mission);
  if (next.id === "cancelled" || next.id === "follow_up_approved") return "idle";

  if (mission.job.status === "leased") return "running";

  const investigationOpen =
    !mission.approval &&
    (mission.stage === "evidence" ||
      mission.stage === "alternatives" ||
      (!mission.proposal && !mission.researchPassCompletedAt));

  if (!investigationOpen) {
    if (mission.researchPassCompletedAt || mission.proposal) return "complete";
    return "idle";
  }

  if (
    mission.researchPassCompletedAt &&
    mission.stage === "evidence" &&
    HUMAN_WAIT_IDS.has(next.id)
  ) {
    return "waiting";
  }

  if (HUMAN_WAIT_IDS.has(next.id) && next.id !== "recover") {
    return "waiting";
  }

  if (mission.researchPassCompletedAt && mission.proposal) return "complete";

  if (!mission.researchPassCompletedAt) {
    const kinds = (mission.activity ?? []).map((e) => e.kind);
    const researchMotion = kinds.some((k) => /research|evidence|pass|task/i.test(k));
    if (researchMotion || !mission.researchPassCompletedAt) return "running";
  }

  if (mission.researchPassCompletedAt) return "complete";

  return "waiting";
}

export function buildInvestigationExperience(mission: SupervisedMission): InvestigationExperience {
  const state = deriveInvestigationRunState(mission);
  const next = nextRequiredAction(mission);
  const active = Boolean(mission.team?.approvedAt) && mission.stage !== "cancelled";

  let statusLabel = STATE_LABELS[state];
  if (state === "waiting") {
    statusLabel = `Waiting — ${next.title}`;
  } else if (state === "interrupted") {
    statusLabel = mission.studioMeta?.investigationPaused
      ? "Paused — resume from map controls when ready"
      : `Interrupted — ${next.title}`;
  } else if (state === "running") {
    statusLabel = "Investigation running in the background";
  } else if (state === "complete") {
    statusLabel = "Investigation spine complete on the record";
  }

  return {
    version: "investigation-experience-v1",
    active,
    state,
    statusLabel,
    leaveNote:
      "Closing this view or leaving the page does not stop the worker — progress stays on the mission record.",
    keywords: keywordsFromMission(mission),
    updates: updatesFromMission(mission),
  };
}
