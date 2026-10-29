/**
 * Phase 3 — Animated investigation experience (data layer).
 * Keywords, status, and agent lines come from persisted activity, teamCollaboration,
 * and research fields only — never timer-fake progress or fabricated dialogue.
 */
import type { TeamCollaborationRecord } from "./team-collaboration";
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

export type InvestigationThemeId =
  "customer_problem" | "alternatives" | "commercial" | "feasibility" | "evidence_gaps";

export type InvestigationThemeKind = "investigating" | "gap" | "supported";

export type InvestigationTheme = {
  id: InvestigationThemeId;
  label: string;
  kind: InvestigationThemeKind;
  detail: string;
  basis: string;
};

export type InvestigationHandoffPulse = {
  id: string;
  fromTheme: InvestigationThemeId;
  toTheme: InvestigationThemeId;
  at: string;
  basis: string;
};

export type InvestigationArtefactPreview = {
  id: string;
  title: string;
  summary: string;
  honestyLabel: string;
};

export type InvestigationExperience = {
  version: "investigation-experience-v2";
  active: boolean;
  state: InvestigationRunState;
  statusLabel: string;
  leaveNote: string;
  ideaLabel: string;
  converging: boolean;
  themes: InvestigationTheme[];
  handoffPulses: InvestigationHandoffPulse[];
  artefactPreviews: InvestigationArtefactPreview[];
  keywords: InvestigationKeyword[];
  updates: InvestigationAgentUpdate[];
};

const THEME_DEFS: Record<InvestigationThemeId, { label: string; defaultDetail: string }> = {
  customer_problem: {
    label: "Customer problem",
    defaultDetail: "Problem and audience — from your brief until evidence lands.",
  },
  alternatives: {
    label: "Alternatives",
    defaultDetail: "Competitive and build options — specialists when alternatives stage opens.",
  },
  commercial: {
    label: "Commercial questions",
    defaultDetail: "Pricing, demand, and go-to-market — tied to evidence rows.",
  },
  feasibility: {
    label: "Feasibility",
    defaultDetail: "Build and ops constraints — no feasibility claim without basis.",
  },
  evidence_gaps: {
    label: "Honest gaps",
    defaultDetail: "Unknowns recorded — not presented as founder-supplied proof.",
  },
};

function themeFromTaskKey(taskKey: string): InvestigationThemeId {
  const k = taskKey.toLowerCase();
  if (/altern|compet|option|compare/.test(k)) return "alternatives";
  if (/market|pricing|commercial|revenue|demand/.test(k)) return "commercial";
  if (/feasib|tech|build|proto|engineer/.test(k)) return "feasibility";
  if (/gap|unknown|risk/.test(k)) return "evidence_gaps";
  return "customer_problem";
}

function themesFromMission(mission: SupervisedMission): InvestigationTheme[] {
  const counts: Record<
    InvestigationThemeId,
    { supplied: number; gap: number; assumption: number }
  > = {
    customer_problem: { supplied: 0, gap: 0, assumption: 0 },
    alternatives: { supplied: 0, gap: 0, assumption: 0 },
    commercial: { supplied: 0, gap: 0, assumption: 0 },
    feasibility: { supplied: 0, gap: 0, assumption: 0 },
    evidence_gaps: { supplied: 0, gap: 0, assumption: 0 },
  };

  for (const row of mission.evidence) {
    const theme: InvestigationThemeId =
      row.classification === "gap"
        ? "evidence_gaps"
        : /altern|compet/i.test(row.statement)
          ? "alternatives"
          : /price|market|customer|demand/i.test(row.statement)
            ? "commercial"
            : /build|tech|feasib/i.test(row.statement)
              ? "feasibility"
              : "customer_problem";
    if (row.classification === "supplied") counts[theme].supplied += 1;
    else if (row.classification === "gap") counts[theme].gap += 1;
    else counts[theme].assumption += 1;
  }

  for (const event of mission.activity ?? []) {
    if (event.taskKey) {
      const t = themeFromTaskKey(event.taskKey);
      counts[t].assumption += 1;
    }
  }

  const collab = mission.teamCollaboration;
  if (collab) {
    for (const h of collab.handoffs) {
      if (h.id.endsWith("-use")) continue;
      counts[themeFromTaskKey(h.toTaskKey)].assumption += 1;
    }
  }

  return (Object.keys(THEME_DEFS) as InvestigationThemeId[]).map((id) => {
    const c = counts[id];
    let kind: InvestigationThemeKind = "investigating";
    let detail = THEME_DEFS[id].defaultDetail;
    if (c.supplied > 0) {
      kind = "supported";
      detail = `${c.supplied} supplied finding(s) on the register.`;
    } else if (c.gap > 0) {
      kind = "gap";
      detail = `${c.gap} gap(s) labelled — not presented as customer proof.`;
    } else if (mission.researchGaps?.length && id === "evidence_gaps") {
      kind = "gap";
      detail = `${mission.researchGaps.length} research gap(s) from the last pass.`;
    }
    return {
      id,
      label: THEME_DEFS[id].label,
      kind,
      detail,
      basis: `evidence+activity:${id}`,
    };
  });
}

function handoffPulsesFromMission(mission: SupervisedMission): InvestigationHandoffPulse[] {
  const collab = mission.teamCollaboration;
  if (!collab?.handoffs.length) return [];
  return collab.handoffs
    .filter((h) => !h.id.endsWith("-use") && h.findingSummary.trim())
    .slice(-6)
    .map((h) => ({
      id: h.id,
      fromTheme: themeFromTaskKey(h.fromTaskKey),
      toTheme: themeFromTaskKey(h.toTaskKey),
      at: h.sharedAt,
      basis: `handoff:${h.id}`,
    }));
}

function artefactPreviewsFromMission(mission: SupervisedMission): InvestigationArtefactPreview[] {
  const out: InvestigationArtefactPreview[] = [];
  if (mission.proposal) {
    const optionLine =
      mission.proposal.options[0]?.title ??
      `${mission.proposal.options.length} option(s) on the record`;
    out.push({
      id: "proposal",
      title: "Options draft",
      summary: optionLine.slice(0, 160),
      honestyLabel: mission.proposal.generation?.label ?? "Agent-reviewed draft",
    });
  }
  if (mission.artefact) {
    out.push({
      id: "artefact",
      title: mission.artefact.title,
      summary: mission.artefact.decisionBrief.slice(0, 160),
      honestyLabel: mission.artefact.provenance || "Human-reviewed pack",
    });
  }
  if (mission.exportBody && out.every((p) => p.id !== "export")) {
    out.push({
      id: "export",
      title: "Decision pack",
      summary: "Export markdown on the mission record.",
      honestyLabel: "Human-reviewed export",
    });
  }
  return out;
}

function deriveConverging(mission: SupervisedMission): boolean {
  const next = nextRequiredAction(mission);
  return (
    mission.stage === "alternatives" ||
    next.id === "compare" ||
    next.id === "prepare" ||
    next.id === "artefact" ||
    (Boolean(mission.researchPassCompletedAt) && !mission.proposal && mission.evidence.length > 0)
  );
}

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

const RECENT_UPDATE_LIMIT = 8;

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

  const collab: TeamCollaborationRecord | null = mission.teamCollaboration;
  if (collab) {
    for (const handoff of [...collab.handoffs].reverse()) {
      if (handoff.id.endsWith("-use")) continue;
      push({
        id: `kw-handoff-${handoff.id}`,
        label: handoff.toTaskKey.replace(/_/g, " "),
        source: "teamCollaboration",
        basis: `handoff:${handoff.id}`,
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
  const seenHandoffKeys = new Set<string>();

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

  const collab = mission.teamCollaboration;
  if (collab) {
    for (const handoff of collab.handoffs) {
      if (handoff.id.endsWith("-use")) continue;
      if (!handoff.findingSummary.trim()) continue;
      const dedupeKey = `${handoff.fromTaskKey}:${handoff.toTaskKey}:${handoff.findingSummary.slice(0, 80)}`;
      if (seenHandoffKeys.has(dedupeKey)) continue;
      seenHandoffKeys.add(dedupeKey);
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
    .slice(-RECENT_UPDATE_LIMIT)
    .reverse();
}

function leaseStillValid(mission: SupervisedMission, nowMs: number): boolean {
  if (mission.job.status !== "leased") return false;
  const until = Date.parse(mission.job.leaseUntil ?? "");
  return Number.isFinite(until) && until > nowMs;
}

export function deriveInvestigationRunState(
  mission: SupervisedMission,
  nowMs: number = Date.now(),
): InvestigationRunState {
  if (mission.stage === "cancelled") return "idle";
  if (!mission.team?.approvedAt) return "idle";

  const next = nextRequiredAction(mission);
  if (next.id === "cancelled" || next.id === "follow_up_approved") return "idle";

  if (leaseStillValid(mission, nowMs)) return "running";

  if (mission.job.status === "leased") {
    return next.id === "recover" ? "interrupted" : "waiting";
  }

  if (mission.studioMeta?.investigationPaused) return "interrupted";
  if (mission.job.status === "failed") return "interrupted";

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

export function buildInvestigationExperience(
  mission: SupervisedMission,
  nowMs: number = Date.now(),
): InvestigationExperience {
  const state = deriveInvestigationRunState(mission, nowMs);
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
    version: "investigation-experience-v2",
    active,
    state,
    statusLabel,
    leaveNote:
      "Closing this view or leaving the page does not stop the worker — progress stays on the mission record.",
    ideaLabel: mission.brief.question,
    converging: deriveConverging(mission),
    themes: themesFromMission(mission),
    handoffPulses: handoffPulsesFromMission(mission),
    artefactPreviews: artefactPreviewsFromMission(mission),
    keywords: keywordsFromMission(mission),
    updates: updatesFromMission(mission),
  };
}
