/**
 * PT-1 — Intelligence Canvas: calm, event-backed map of the investigation.
 * Nodes only activate/settle from mission evidence, activity, tasks, or proposal.
 */
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type CanvasNodeKind =
  | "idea"
  | "market"
  | "needs"
  | "alternatives"
  | "risks"
  | "assumptions"
  | "evidence";

export type CanvasNodeState = "idle" | "active" | "settled" | "blocked" | "review";

export type CanvasNode = {
  id: CanvasNodeKind;
  label: string;
  state: CanvasNodeState;
  /** What on the record justifies this state — never decorative fiction. */
  eventBasis: string[];
  detail: string;
};

export type CanvasEdge = {
  id: string;
  from: CanvasNodeKind;
  to: CanvasNodeKind;
  label: string;
  /** True only when a persisted handoff/activity supports the link. */
  eventBacked: boolean;
};

export type IntelligenceCanvas = {
  version: "canvas-v1";
  statusLine: string;
  leaveAllowed: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inspectHint: string;
};

function cited(mission: SupervisedMission) {
  return mission.evidence.filter(
    (e) =>
      e.classification === "supplied" &&
      (/\[Cited/i.test(e.statement) ||
        /tavily|exa|brave/i.test(e.source) ||
        /^https?:\/\//i.test(e.source)),
  );
}

function gaps(mission: SupervisedMission) {
  return mission.evidence.filter((e) => e.classification === "gap");
}

function assumptions(mission: SupervisedMission) {
  return mission.evidence.filter((e) => e.classification === "assumption");
}

function activityKinds(mission: SupervisedMission): string[] {
  return (mission.activity ?? []).map((e) => e.kind);
}

function statusLineFor(mission: SupervisedMission): string {
  const next = nextRequiredAction(mission);
  if (mission.stage === "cancelled") return "This investigation is cancelled. The record remains.";
  if (!mission.team?.approvedAt) {
    return "Waiting for you to approve the specialist plan before research runs.";
  }
  if (mission.approval) {
    return `Briefing on record. Your next path is recorded — ${next.title.toLowerCase()}.`;
  }
  if (mission.proposal) {
    return "Comparing options and preparing the product briefing from the evidence register.";
  }
  if (mission.researchPassCompletedAt) {
    const n = cited(mission).length;
    return n > 0
      ? `Research pass settled with ${n} cited finding(s). Ready for options when you continue.`
      : "Research pass settled with honest gaps — no invented web hits.";
  }
  if (activityKinds(mission).some((k) => /research|evidence|synthes/i.test(k))) {
    return "Comparing existing alternatives and checking whether the proposed difference is meaningful.";
  }
  return "Research in progress from the approved plan. You can leave this page.";
}

export function buildIntelligenceCanvas(mission: SupervisedMission): IntelligenceCanvas {
  const planOn = Boolean(mission.team?.approvedAt);
  const citedItems = cited(mission);
  const gapItems = gaps(mission);
  const assumptionItems = assumptions(mission);
  const kinds = activityKinds(mission);
  const researchRunning =
    planOn &&
    !mission.researchPassCompletedAt &&
    !mission.proposal &&
    kinds.some((k) => /research|evidence|pass\.started/i.test(k));
  const researchSettled = Boolean(mission.researchPassCompletedAt) || citedItems.length > 0;
  const blocked =
    (mission.researchGaps ?? []).length > 0 && !researchSettled && planOn;
  const hasContradiction =
    citedItems.length > 0 &&
    gapItems.some((g) => /contradict|conflict|disagree|vs\b/i.test(g.statement));

  const nodes: CanvasNode[] = [
    {
      id: "idea",
      label: "Your product idea",
      state: mission.brief.question.trim() ? "settled" : "idle",
      eventBasis: mission.brief.question.trim() ? ["brief.question"] : [],
      detail: mission.brief.question.trim() || "No idea on record yet.",
    },
    {
      id: "market",
      label: "Market landscape",
      state: researchSettled
        ? "settled"
        : researchRunning
          ? "active"
          : blocked
            ? "blocked"
            : planOn
              ? "active"
              : "idle",
      eventBasis: [
        ...citedItems.slice(0, 3).map((e) => e.id),
        ...(mission.researchPassCompletedAt ? ["research.pass.completed"] : []),
        ...(researchRunning ? kinds.filter((k) => /research/i.test(k)).slice(-2) : []),
      ],
      detail: researchSettled
        ? `${citedItems.length} cited finding(s) on the register.`
        : blocked
          ? "Research limited by provider/gaps — not spun as progress."
          : planOn
            ? "Specialists working from the approved plan."
            : "Idle until you approve the plan.",
    },
    {
      id: "needs",
      label: "Customer needs",
      state: citedItems.some((e) => /customer|parent|user|need|pain|commuter/i.test(e.statement))
        ? "settled"
        : researchRunning
          ? "active"
          : "idle",
      eventBasis: citedItems
        .filter((e) => /customer|parent|user|need|pain|commuter/i.test(e.statement))
        .slice(0, 3)
        .map((e) => e.id),
      detail: "Only settles when the register carries need-related findings.",
    },
    {
      id: "alternatives",
      label: "Existing alternatives",
      state: citedItems.some((e) =>
        /competitor|alternative|already|existing|franchise|restaurant|café|cafe/i.test(
          e.statement,
        ),
      )
        ? hasContradiction
          ? "review"
          : "settled"
        : researchRunning
          ? "active"
          : "idle",
      eventBasis: citedItems
        .filter((e) =>
          /competitor|alternative|already|existing|franchise|restaurant|café|cafe/i.test(
            e.statement,
          ),
        )
        .slice(0, 3)
        .map((e) => e.id),
      detail: hasContradiction
        ? "Review marker: findings and gaps may conflict — inspect the register."
        : "Settles from cited alternatives — never from a staged interview.",
    },
    {
      id: "risks",
      label: "Delivery risks",
      state: gapItems.some((e) => /risk|delivery|build|technical|ops/i.test(e.statement))
        ? "review"
        : assumptionItems.some((e) => /risk|delivery/i.test(e.statement))
          ? "active"
          : "idle",
      eventBasis: gapItems
        .filter((e) => /risk|delivery|build|technical|ops/i.test(e.statement))
        .slice(0, 2)
        .map((e) => e.id),
      detail: "Shown when gaps or assumptions name delivery risk.",
    },
    {
      id: "assumptions",
      label: "Commercial assumptions",
      state:
        assumptionItems.length >= 2
          ? "review"
          : assumptionItems.length === 1
            ? "active"
            : "idle",
      eventBasis: assumptionItems.slice(0, 4).map((e) => e.id),
      detail:
        assumptionItems.length > 0
          ? `${assumptionItems.length} assumption(s) on the register.`
          : "No commercial assumptions labelled yet.",
    },
    {
      id: "evidence",
      label: "Evidence review",
      state: mission.proposal
        ? "settled"
        : researchSettled
          ? "active"
          : gapItems.length > 0
            ? "review"
            : "idle",
      eventBasis: [
        ...mission.evidence.slice(0, 2).map((e) => e.id),
        ...(mission.proposal ? ["proposal.compare_options"] : []),
      ],
      detail: mission.proposal
        ? "Options compared from the register."
        : "Evidence review opens as findings settle.",
    },
  ];

  const edges: CanvasEdge[] = [
    {
      id: "idea-market",
      from: "idea",
      to: "market",
      label: "scope",
      eventBacked: planOn,
    },
    {
      id: "market-needs",
      from: "market",
      to: "needs",
      label: "findings",
      eventBacked: citedItems.length > 0 || researchRunning,
    },
    {
      id: "market-alt",
      from: "market",
      to: "alternatives",
      label: "alternatives",
      eventBacked: citedItems.length > 0 || researchRunning,
    },
    {
      id: "idea-risks",
      from: "idea",
      to: "risks",
      label: "risks",
      eventBacked: nodes.find((n) => n.id === "risks")!.state !== "idle",
    },
    {
      id: "idea-assumptions",
      from: "idea",
      to: "assumptions",
      label: "assumptions",
      eventBacked: assumptionItems.length > 0,
    },
    {
      id: "to-evidence",
      from: "market",
      to: "evidence",
      label: "review",
      eventBacked: researchSettled || Boolean(mission.proposal),
    },
  ];

  return {
    version: "canvas-v1",
    statusLine: statusLineFor(mission),
    leaveAllowed:
      planOn && !mission.approval
        ? "Research in progress. You can leave this page — work continues from persisted events."
        : "You can leave and return; this case keeps its record.",
    nodes,
    edges,
    inspectHint: "Inspect activity",
  };
}
