/**
 * The Room — one Aria-led story per case, built only from the saved record.
 *
 * Each beat is something that has happened (or is happening) on the case, told by Aria in
 * plain words. The model never invents progress, scores, prices or findings: every line is
 * derived from the mission document, and a beat appears only once its record exists.
 */
import { buildEstimate, type BuildEstimate } from "./build-estimate";
import { evidenceLabel, type EvidenceLabel } from "./case-log";
import { deliveryEligibility } from "./delivery";
import { nextGateLabel } from "./next-gate";
import { buildPmBrief } from "./pm-brief";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { buildPmBriefingScreen } from "./pm-briefing-screen";
import { buildTeamFormationCards, teamFormationIntro } from "./team-formation-screen";
import { nextRequiredAction, type SupervisedMission } from "./types";

export type RoomStreamId =
  "market" | "users" | "competition" | "risks" | "opportunities" | "direction";

export const ROOM_STREAMS: Array<{ id: RoomStreamId; label: string }> = [
  { id: "market", label: "Market" },
  { id: "users", label: "Users" },
  { id: "competition", label: "Competition" },
  { id: "risks", label: "Risks" },
  { id: "opportunities", label: "Opportunities" },
  { id: "direction", label: "Direction" },
];

/** Honest badge for a map event. Evidence uses the register labels; activity is not evidence. */
export type RoomBadge = EvidenceLabel | "Team note";

/** One recorded event shown on the live stage. `kind` drives its colour; `badge` is the label. */
export type RoomFinding = {
  id: string;
  /** Short line for the map chip. */
  text: string;
  /** Full saved statement. The chip never invents a shorter claim. */
  statement: string;
  stream: RoomStreamId;
  kind: "finding" | "gap" | "assumption" | "activity";
  badge: RoomBadge;
  /** http(s) source, when the record has one. */
  source: string | null;
  /** Non-URL source text already stored on the evidence row. */
  sourceNote: string | null;
  at: string | null;
  /** Anchor into the full record for evidence rows. Team notes have none. */
  recordHref: "#mission-evidence" | null;
};

export type RoomAgent = {
  name: string;
  role: string;
  task: string;
  state: "working" | "done" | "waiting";
};

export type RoomFact = { label: string; value: string };

export type RoomBeat =
  | { kind: "idea"; question: string; context: RoomFact[] }
  | {
      kind: "plan";
      approved: boolean;
      approvedAt: string | null;
      steps: string[];
      facts: RoomFact[];
    }
  | {
      kind: "investigation";
      live: boolean;
      /** Supplied evidence rows. */
      findings: number;
      assumptions: number;
      /** Gap rows — unverified, not interviews. */
      gaps: number;
      provider: string | null;
    }
  | {
      kind: "briefing";
      /** False until a comparison or a decision is saved. The card then names the next gate. */
      ready: boolean;
      headline: string;
      /** Small label above the main line: next step, or draft vs recorded recommendation. */
      kicker: string;
      verdict: string;
      summary: string;
      /** Same gate label as the checkpoint and the dock. */
      nextLabel: string;
      facts: RoomFact[];
      detail: RoomFact[];
      options: Array<{ id: string; title: string; detail: string }>;
      /** What building the first version would take, with its method. Hidden until the briefing is ready. */
      estimate: BuildEstimate;
      howMade: string;
    }
  | { kind: "decision"; choice: string; option: string | null; note: string; decidedAt: string }
  | {
      kind: "team";
      message: string;
      members: Array<{ name: string; role: string; responsibility: string; status: string }>;
    }
  | { kind: "delivery"; approvedAt: string }
  | { kind: "package"; ready: boolean };

/** The single thing the case needs next, and who it is waiting on. */
export type RoomNext = {
  id: string;
  label: string;
  detail: string;
  /** True when a person has to act; false while specialists or the worker are busy. */
  waitingOnYou: boolean;
  /** Which existing control set completes this step (opened in a side sheet). */
  panel: "plan" | "work" | "decide" | "none";
};

export type RoomModel = {
  title: string;
  status: { working: boolean; line: string };
  beats: RoomBeat[];
  next: RoomNext;
  /** Begin delivery is offered once a decision exists and delivery may start. */
  deliveryAvailable: boolean;
  stage: { idea: string; findings: RoomFinding[]; agents: RoomAgent[] };
};

const STREAM_PATTERNS: Array<[RoomStreamId, RegExp]> = [
  ["competition", /competit|alternativ|incumbent|rival|vs\.?\s|existing (tool|product|solution)/i],
  ["users", /\buser|customer|buyer|owner|persona|audience|interview|need|pain|job/i],
  ["market", /market|demand|size|segment|trend|revenue|pric|spend|growth|industry/i],
  ["risks", /risk|unknown|unclear|not yet|unverified|blocker|regulat|complian|cost/i],
  ["opportunities", /opportunit|gap in|underserved|could|potential|advantage|wedge/i],
];

function streamFor(text: string, fallback: RoomStreamId): RoomStreamId {
  for (const [id, pattern] of STREAM_PATTERNS) if (pattern.test(text)) return id;
  return fallback;
}

function clip(text: string, max = 72): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Record references such as "(basis: e1)" stay in the full briefing, not the summary. */
function plain(text: string): string {
  return text.replace(/\s*\(basis:[^)]*\)/gi, "").trim();
}

function firstSentence(text: string): string {
  const t = plain(text);
  const match = t.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : t).trim();
}

/** Agent display names by capability id, for activity events. */
function agentNames(mission: SupervisedMission): Map<string, { name: string; role: string }> {
  const map = new Map<string, { name: string; role: string }>();
  for (const card of buildTeamFormationCards(mission)) {
    if (card.capabilityId) map.set(card.capabilityId, { name: card.name, role: card.role });
  }
  return map;
}

export function roomFindings(mission: SupervisedMission): RoomFinding[] {
  const names = agentNames(mission);
  const fromEvidence: RoomFinding[] = mission.evidence.map((item) => {
    const kind =
      item.classification === "gap"
        ? "gap"
        : item.classification === "assumption"
          ? "assumption"
          : "finding";
    const fallback: RoomStreamId =
      kind === "gap" ? "risks" : kind === "assumption" ? "opportunities" : "direction";
    const source = item.source.trim();
    const url = /^https?:\/\//i.test(source);
    return {
      id: `e:${item.id}`,
      text: clip(item.statement),
      statement: item.statement,
      stream: kind === "gap" ? "risks" : streamFor(item.statement, fallback),
      kind,
      badge: evidenceLabel(item),
      source: url ? source : null,
      sourceNote: source && !url ? source : null,
      at: null,
      recordHref: "#mission-evidence",
    };
  });
  const fromActivity: RoomFinding[] = mission.activity
    .filter((event) => event.actor !== "human" && event.summary.trim())
    .map((event) => {
      const who = names.get(event.actor)?.name;
      const statement = who ? `${who}: ${event.summary}` : event.summary;
      return {
        id: `a:${event.id}`,
        text: clip(statement),
        statement,
        stream: streamFor(event.summary, "direction"),
        kind: "activity" as const,
        badge: "Team note" as const,
        source: null,
        sourceNote: null,
        at: event.at,
        recordHref: null,
      };
    });
  // Activity first (chronological), then findings: the order the team produced them.
  return [...fromActivity.sort((a, b) => (a.at ?? "").localeCompare(b.at ?? "")), ...fromEvidence];
}

function isLive(mission: SupervisedMission): boolean {
  return (
    Boolean(mission.researchPassQueuedAt && !mission.researchPassCompletedAt) ||
    mission.job.status === "leased"
  );
}

function roomAgents(mission: SupervisedMission, live: boolean): RoomAgent[] {
  return buildTeamFormationCards(mission)
    .filter((card) => card.assigned)
    .slice(0, 5)
    .map((card) => ({
      name: card.name,
      role: card.role,
      task: card.tasks[0] ?? card.responsibility,
      state:
        card.status === "complete"
          ? "done"
          : card.status === "working" || live
            ? "working"
            : card.status === "blocked"
              ? "waiting"
              : "done",
    }));
}

const NEXT_PANEL: Record<string, { panel: RoomNext["panel"]; you: boolean }> = {
  approve_plan: { panel: "plan", you: true },
  evidence: { panel: "work", you: true },
  compare: { panel: "work", you: true },
  retry: { panel: "work", you: true },
  recover: { panel: "work", you: false },
  research_queued: { panel: "none", you: false },
  decide: { panel: "decide", you: true },
  expectation: { panel: "work", you: true },
  artefact: { panel: "work", you: true },
  export: { panel: "work", you: true },
  cancelled: { panel: "none", you: false },
};

function roomNext(mission: SupervisedMission): RoomNext {
  const next = nextRequiredAction(mission);
  const copy = NEXT_PANEL[next.id] ?? { panel: "work" as const, you: true };
  return {
    id: next.id,
    label: nextGateLabel(next),
    detail: next.detail,
    waitingOnYou: copy.you,
    panel: copy.panel,
  };
}

function listPhrase(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Aria's line above the map: counts from the register, then the same next gate as the dock. */
export function roomInvestigationLine(
  beat: { findings: number; assumptions: number; gaps: number; provider: string | null },
  next: { label: string; waitingOnYou: boolean },
): string {
  const parts: string[] = [];
  if (beat.findings) parts.push(`${beat.findings} finding${beat.findings === 1 ? "" : "s"}`);
  if (beat.assumptions)
    parts.push(`${beat.assumptions} assumption${beat.assumptions === 1 ? "" : "s"}`);
  if (beat.gaps) parts.push(`${beat.gaps} unverified`);
  const recorded = parts.length
    ? `The team recorded ${listPhrase(parts)}${beat.provider ? ` with ${beat.provider} web research` : ""}.`
    : "No evidence rows are on the register yet.";
  if (!next.waitingOnYou) return recorded;
  return `${recorded} Next: ${next.label}.`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function buildRoomModel(mission: SupervisedMission): RoomModel {
  const live = isLive(mission);
  const findings = roomFindings(mission);
  const next = roomNext(mission);
  const beats: RoomBeat[] = [];

  const context: RoomFact[] = [];
  const audience = mission.brief.audience.trim();
  if (audience && !/specialists will refine/i.test(audience))
    context.push({ label: "For", value: audience });
  if (mission.brief.outcome.trim())
    context.push({ label: "Outcome", value: mission.brief.outcome.trim() });
  beats.push({ kind: "idea", question: mission.brief.question, context });

  if (mission.team) {
    const brief = buildPmBrief(mission);
    beats.push({
      kind: "plan",
      approved: Boolean(mission.team.approvedAt),
      approvedAt: mission.team.approvedAt ?? null,
      steps: brief.whatWillHappen.slice(0, 3),
      facts: [
        { label: "Time", value: brief.roughTime.label },
        { label: "Cost", value: brief.roughCost.band },
        {
          label: "Team",
          value: `${brief.team.activeLabels.length} specialist${brief.team.activeLabels.length === 1 ? "" : "s"}`,
        },
      ],
    });
  }

  const planApproved = Boolean(mission.team?.approvedAt);
  if (planApproved) {
    beats.push({
      kind: "investigation",
      live,
      findings: mission.evidence.filter((e) => e.classification === "supplied").length,
      assumptions: mission.evidence.filter((e) => e.classification === "assumption").length,
      gaps: mission.evidence.filter((e) => e.classification === "gap").length,
      provider: mission.researchProvider,
    });
  }

  if (planApproved && !live && (mission.proposal || mission.researchPassCompletedAt)) {
    const pack = buildPmBriefingPack(mission);
    const estimate = buildEstimate(mission.brief);
    const awaitingComparison =
      next.id === "compare" ||
      next.id === "evidence" ||
      next.id === "retry" ||
      next.id === "recover";
    if (!pack.ready || awaitingComparison) {
      beats.push({
        kind: "briefing",
        ready: false,
        headline: "Research is on the record",
        kicker: "Next step",
        verdict: next.label,
        summary: next.detail,
        nextLabel: next.label,
        facts: [],
        detail: [],
        options: [],
        estimate,
        howMade: pack.ready
          ? "A comparison draft may already be saved. This card still follows the open gate, not a build. You decide after that; nothing external runs from this step."
          : "Directions and a recommendation are drafted when this comparison is saved. They are not on the record yet. You decide after that; nothing external runs from this step.",
      });
    } else {
      const screen = buildPmBriefingScreen(mission);
      const cardValue = (pattern: RegExp) =>
        screen.cards.find((card) => pattern.test(card.title))?.body ?? null;
      const facts: RoomFact[] = [
        { label: "Who it’s for", value: cardValue(/users/i) },
        { label: "Competitors", value: cardValue(/competitor/i) },
        { label: "Recommended next step", value: cardValue(/recommended|first version/i) },
        { label: "Investigation time and cost", value: cardValue(/timeline|cost/i) },
      ]
        .filter((f): f is RoomFact => Boolean(f.value))
        .map((f) => ({ label: f.label, value: firstSentence(f.value) }));
      beats.push({
        kind: "briefing",
        ready: true,
        headline: screen.headline,
        kicker: mission.approval ? "Recommendation on record" : "Draft recommendation",
        verdict: pack.recommendationLabel ?? "No recommendation yet",
        summary: firstSentence(pack.recommendationRationale || pack.smallestNextStep),
        nextLabel: next.label,
        facts,
        detail: screen.cards.map((card) => ({ label: card.title, value: card.body })),
        options: screen.options.map((o) => ({ id: o.id, title: o.title, detail: plain(o.detail) })),
        estimate,
        howMade: `${screen.roleDisclosure} ${screen.honesty}`.trim(),
      });
    }
  }

  if (mission.approval) {
    const pack = buildPmBriefingPack(mission);
    const option = mission.proposal?.options.find((o) => o.id === mission.approval?.optionId);
    beats.push({
      kind: "decision",
      choice: pack.humanNextPathLabel ?? "Decision recorded",
      option: option?.title ?? null,
      note: mission.approval.note,
      decidedAt: mission.approval.decidedAt,
    });
  }

  if (mission.approval || mission.continuationPlan) {
    const members = buildTeamFormationCards(mission).filter((card) => card.assigned);
    beats.push({
      kind: "team",
      // Only the assigned specialists appear in the Room, so the intro names only them.
      message: members.length
        ? `For the path you chose, I’ve selected ${members.length} specialist${members.length === 1 ? "" : "s"}. Their status changes only when work is saved to this case.`
        : teamFormationIntro(mission).message,
      members: members.map((card) => ({
        name: card.name,
        role: card.role,
        responsibility: card.responsibility,
        status: card.statusLabel,
      })),
    });
  }

  if (mission.delivery) beats.push({ kind: "delivery", approvedAt: mission.delivery.approvedAt });

  if (mission.artefact || mission.exportBody) {
    beats.push({ kind: "package", ready: Boolean(mission.exportBody) });
  }

  const working = live || next.id === "recover";
  const line = working
    ? "The team is working. Aria will come back with an update."
    : next.id === "cancelled"
      ? "This case is cancelled."
      : `Aria needs you: ${next.label.toLowerCase()}.`;

  return {
    title: mission.brief.question,
    status: { working, line },
    beats,
    next,
    deliveryAvailable:
      Boolean(mission.approval) && !mission.delivery && deliveryEligibility(mission).ok,
    stage: { idea: mission.brief.question, findings, agents: roomAgents(mission, live) },
  };
}

export { dateLabel as roomDateLabel };
