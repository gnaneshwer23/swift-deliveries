/**
 * The Room — one Aria-led story per case, built only from the saved record.
 *
 * Each beat is something that has happened (or is happening) on the case, told by Aria in
 * plain words. The model never invents progress, scores, prices or findings: every line is
 * derived from the mission document, and a beat appears only once its record exists.
 */
import { deliveryEligibility } from "./delivery";
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

/** One recorded event shown on the live stage. `kind` drives its colour and wording. */
export type RoomFinding = {
  id: string;
  text: string;
  stream: RoomStreamId;
  kind: "finding" | "gap" | "assumption" | "activity";
  source: string | null;
  at: string | null;
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
      findings: number;
      gaps: number;
      provider: string | null;
    }
  | {
      kind: "briefing";
      headline: string;
      verdict: string;
      summary: string;
      facts: RoomFact[];
      detail: RoomFact[];
      options: Array<{ id: string; title: string; detail: string }>;
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
    return {
      id: `e:${item.id}`,
      text: clip(item.statement),
      stream: kind === "gap" ? "risks" : streamFor(item.statement, fallback),
      kind,
      source: /^https?:\/\//i.test(item.source) ? item.source : null,
      at: null,
    };
  });
  const fromActivity: RoomFinding[] = mission.activity
    .filter((event) => event.actor !== "human" && event.summary.trim())
    .map((event) => {
      const who = names.get(event.actor)?.name;
      return {
        id: `a:${event.id}`,
        text: clip(who ? `${who}: ${event.summary}` : event.summary),
        stream: streamFor(event.summary, "direction"),
        kind: "activity" as const,
        source: null,
        at: event.at,
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

const NEXT_COPY: Record<string, { label: string; panel: RoomNext["panel"]; you: boolean }> = {
  approve_plan: { label: "Review and approve the plan", panel: "plan", you: true },
  evidence: { label: "Let the team compare options", panel: "work", you: true },
  compare: { label: "Let the team compare options", panel: "work", you: true },
  retry: { label: "Try the comparison again", panel: "work", you: true },
  recover: { label: "Check on the comparison", panel: "work", you: false },
  research_queued: { label: "The team is investigating", panel: "none", you: false },
  decide: { label: "Make your decision", panel: "decide", you: true },
  expectation: { label: "Say what you expect to happen", panel: "work", you: true },
  artefact: { label: "Prepare the decision pack", panel: "work", you: true },
  export: { label: "Download the decision pack", panel: "work", you: true },
  cancelled: { label: "This case is cancelled", panel: "none", you: false },
};

function roomNext(mission: SupervisedMission): RoomNext {
  const next = nextRequiredAction(mission);
  const copy = NEXT_COPY[next.id] ?? { label: next.title, panel: "work" as const, you: true };
  return {
    id: next.id,
    label: copy.label,
    detail: next.detail,
    waitingOnYou: copy.you,
    panel: copy.panel,
  };
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
      gaps: mission.evidence.filter((e) => e.classification !== "supplied").length,
      provider: mission.researchProvider,
    });
  }

  const screen = buildPmBriefingScreen(mission);
  if (planApproved && !live && (mission.proposal || mission.researchPassCompletedAt)) {
    const pack = buildPmBriefingPack(mission);
    const cardValue = (pattern: RegExp) =>
      screen.cards.find((card) => pattern.test(card.title))?.body ?? null;
    const facts: RoomFact[] = [
      { label: "Who it’s for", value: cardValue(/users/i) },
      { label: "Competitors", value: cardValue(/competitor/i) },
      { label: "First version", value: cardValue(/recommended|first version/i) },
      { label: "Time and cost", value: cardValue(/timeline|cost/i) },
    ]
      .filter((f): f is RoomFact => Boolean(f.value))
      .map((f) => ({ label: f.label, value: firstSentence(f.value) }));
    beats.push({
      kind: "briefing",
      headline: screen.headline,
      verdict: pack.recommendationLabel ?? "No recommendation yet",
      summary: firstSentence(pack.recommendationRationale || pack.smallestNextStep),
      facts,
      detail: screen.cards.map((card) => ({ label: card.title, value: card.body })),
      options: screen.options.map((o) => ({ id: o.id, title: o.title, detail: plain(o.detail) })),
      howMade: `${screen.roleDisclosure} ${screen.honesty}`.trim(),
    });
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

  const next = roomNext(mission);
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
