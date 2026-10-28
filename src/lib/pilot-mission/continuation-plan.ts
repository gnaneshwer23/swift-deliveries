/**
 * P-B Act B — continuation plan for the human's authorised next path.
 * Distinct from the Act A research team. Team size follows the work.
 */
import { getCapability } from "@/lib/workforce/registry/load";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
  type AgentRecommendation,
  type HumanNextPath,
} from "./verdict";

export type ContinuationKind =
  | "bounded_test"
  | "reframe_investigate"
  | "evidence_collection"
  | "close"
  | "founder_requested_with_risks";

export type ContinuationRole = {
  capabilityId: string | null;
  label: string;
  responsibility: string;
  why: string;
  plannedArtefacts: string[];
};

export type ContinuationRoadmapStep = {
  id: string;
  title: string;
  ownerLabel: string;
  detail: string;
  blocked: boolean;
  blockedReason: string | null;
};

export type PlannedArtefact = {
  type: string;
  ownerLabel: string;
  note: string;
};

export type ContinuationPlan = {
  version: "continuation-v1";
  kind: ContinuationKind;
  title: string;
  summary: string;
  derivedFrom: {
    agentRecommendation: AgentRecommendation | null;
    humanNextPath: HumanNextPath;
    disagreesWithRecommendation: boolean;
    executionLimited: boolean;
  };
  roles: ContinuationRole[];
  roadmap: ContinuationRoadmapStep[];
  plannedArtefacts: PlannedArtefact[];
  unresolvedRisks: string[];
  notIncluded: string[];
  executionBlocked: boolean;
  executionBlockedReason: string | null;
  createdAt: string;
};

function role(
  capabilityId: string | null,
  fallbackLabel: string,
  responsibility: string,
  why: string,
  plannedArtefacts: string[],
): ContinuationRole {
  const label = capabilityId ? (getCapability(capabilityId)?.name ?? fallbackLabel) : fallbackLabel;
  return { capabilityId, label, responsibility, why, plannedArtefacts };
}

function kindForPath(path: HumanNextPath): ContinuationKind {
  switch (path) {
    case "authorise_bounded_test":
      return "bounded_test";
    case "authorise_revise":
      return "reframe_investigate";
    case "authorise_gather_evidence":
      return "evidence_collection";
    case "close_case":
      return "close";
    case "founder_requested_continuation":
      return "founder_requested_with_risks";
  }
}

function titles(kind: ContinuationKind): { title: string; summary: string } {
  switch (kind) {
    case "bounded_test":
      return {
        title: "Bounded test plan",
        summary:
          "Staff and sequence a specific next experiment. This is not a prediction of business success.",
      };
    case "reframe_investigate":
      return {
        title: "Bounded reframing plan",
        summary:
          "Staff a narrower investigation to revise the proposition before any build commitment.",
      };
    case "evidence_collection":
      return {
        title: "Evidence collection plan",
        summary:
          "Plan how missing evidence will be gathered. Execution stays blocked where inputs are missing.",
      };
    case "close":
      return {
        title: "Case close",
        summary:
          "Close the current proposition under the recorded recommendation and human path. No delivery team is staffed.",
      };
    case "founder_requested_with_risks":
      return {
        title: "Founder-requested continuation",
        summary:
          "Continuation proceeds despite the agent recommendation. Unresolved risks stay labelled; agents do not endorse this path.",
      };
  }
}

function rolesFor(kind: ContinuationKind): ContinuationRole[] {
  if (kind === "close") {
    return [
      role(
        null,
        "Founder (you)",
        "Confirm close and retain the decision pack",
        "Human authority to end this case",
        ["close-summary"],
      ),
    ];
  }
  if (kind === "evidence_collection") {
    return [
      role(
        "DX-018",
        "Evidence Integrity",
        "Define missing evidence and acceptance criteria",
        "Stops fake completion of diligence",
        ["evidence-collection-plan", "research-memo"],
      ),
      role(
        "DX-020",
        "Research Synthesis",
        "Assemble findings once inputs arrive",
        "Turns collected evidence into a usable brief",
        ["research-memo"],
      ),
      role(
        "DX-002",
        "Product Manager",
        "Hold the gate until inputs land",
        "Keeps execution blocked honestly",
        ["chosen-path-brief"],
      ),
      role(
        null,
        "Founder (you)",
        "Supply proprietary or interview evidence when required",
        "Only you can provide some inputs",
        ["owner-evidence"],
      ),
    ];
  }
  if (kind === "reframe_investigate") {
    return [
      role(
        "DX-020",
        "Research Synthesis",
        "Reframe opportunity from counterevidence",
        "Avoids polishing a weak proposition",
        ["research-memo"],
      ),
      role(
        "DX-001",
        "Strategy",
        "Propose a narrower proposition to test",
        "Makes revise concrete",
        ["chosen-path-brief", "reframing-plan"],
      ),
      role(
        "DX-071",
        "Challenge",
        "Attack the reframed claim",
        "Surfaces remaining risk before build",
        ["challenge-note"],
      ),
      role(
        "DX-002",
        "Product Manager",
        "Keep scope bounded to investigation",
        "Prevents premature PRD/build",
        ["chosen-path-brief"],
      ),
    ];
  }
  // bounded_test + founder_requested share a delivery-shaped but bounded cast
  const core: ContinuationRole[] = [
    role(
      "DX-002",
      "Product Manager",
      "Own the bounded test scope and gates",
      "Keeps the experiment specific",
      ["chosen-path-brief", "test-evidence-plan"],
    ),
    role(
      "DX-018",
      "Evidence Integrity",
      "Define what would falsify the test",
      "Protects honesty of the experiment",
      ["test-evidence-plan", "research-memo"],
    ),
    role(
      "DX-001",
      "Strategy",
      "State the change under test and exclusions",
      "Clarifies what success would mean",
      ["chosen-path-brief"],
    ),
    role(
      "DX-021",
      "Options / Spec",
      "Draft the minimal change description",
      "Only when a product change is in scope",
      ["prd-lite"],
    ),
    role(
      "DX-023",
      "UX Prototype",
      "Prepare a sandboxed prototype only after a later human gate",
      "Prototype is not implied by this plan alone",
      ["prototype-brief"],
    ),
  ];
  if (kind === "founder_requested_with_risks") {
    core.push(
      role(
        "DX-071",
        "Challenge",
        "Keep unresolved risks visible on every artefact",
        "Disagreement must not look like endorsement",
        ["unresolved-risk-register"],
      ),
    );
  }
  return core;
}

function artefactsFor(kind: ContinuationKind, roles: ContinuationRole[]): PlannedArtefact[] {
  const byType = new Map<string, PlannedArtefact>();
  const add = (type: string, ownerLabel: string, note: string) => {
    if (!byType.has(type)) byType.set(type, { type, ownerLabel, note });
  };
  if (kind === "close") {
    add("close-summary", "Founder (you)", "Record why the case is closed; retain Act A pack.");
    return [...byType.values()];
  }
  if (kind === "evidence_collection") {
    add(
      "evidence-collection-plan",
      "Evidence Integrity",
      "What to gather, from whom, and completion criteria.",
    );
    add("research-memo", "Research Synthesis", "Memo once inputs arrive — not before.");
    add("chosen-path-brief", "Product Manager", "Holds the pause gate and missing-input list.");
    return [...byType.values()];
  }
  if (kind === "reframe_investigate") {
    add("research-memo", "Research Synthesis", "What evidence forces a revise.");
    add("chosen-path-brief", "Product Manager", "The reframed proposition under investigation.");
    add("reframing-plan", "Strategy", "Bounded investigation steps — not a full PRD.");
    return [...byType.values()];
  }
  add("research-memo", "Research Synthesis", "Carry forward Act A findings relevant to the test.");
  add("chosen-path-brief", "Product Manager", "The authorised path and its bounds.");
  add("test-evidence-plan", "Evidence Integrity", "Hypothesis, metric, and falsifiers.");
  if (kind === "bounded_test" || kind === "founder_requested_with_risks") {
    add(
      "prd-lite",
      "Options / Spec",
      "Only if the bounded test includes a product change; omit for evidence-only tests.",
    );
  }
  if (kind === "founder_requested_with_risks") {
    add(
      "unresolved-risk-register",
      "Challenge",
      "Risks the agent recommendation raised that remain open.",
    );
  }
  // Ensure role-listed artefacts appear
  for (const r of roles) {
    for (const t of r.plannedArtefacts) {
      if (!byType.has(t)) add(t, r.label, "Role-expected output for this path.");
    }
  }
  return [...byType.values()];
}

function roadmapFor(
  kind: ContinuationKind,
  roles: ContinuationRole[],
  executionBlocked: boolean,
  blockedReason: string | null,
): ContinuationRoadmapStep[] {
  if (kind === "close") {
    return [
      {
        id: "close",
        title: "Close and archive",
        ownerLabel: "Founder (you)",
        detail: "Retain the Act A decision pack. No continuation execution.",
        blocked: false,
        blockedReason: null,
      },
    ];
  }
  const pm = roles.find((r) => r.capabilityId === "DX-002")?.label ?? "Product Manager";
  const evidence = roles.find((r) => r.capabilityId === "DX-018")?.label ?? "Evidence Integrity";
  const research = roles.find((r) => r.capabilityId === "DX-020")?.label ?? "Research Synthesis";
  const steps: ContinuationRoadmapStep[] = [
    {
      id: "brief",
      title: "Publish chosen-path brief",
      ownerLabel: pm,
      detail: "State the authorised path, bounds, and what is excluded.",
      blocked: false,
      blockedReason: null,
    },
    {
      id: "plan",
      title:
        kind === "evidence_collection"
          ? "Publish evidence-collection plan"
          : kind === "reframe_investigate"
            ? "Publish reframing investigation plan"
            : "Publish test / evidence plan",
      ownerLabel: evidence,
      detail: "Define inputs, success criteria, and falsifiers.",
      blocked: executionBlocked,
      blockedReason,
    },
    {
      id: "memo",
      title: "Produce research memo from authorised inputs",
      ownerLabel: research,
      detail: "Consume Act A findings; do not invent interviews or customers.",
      blocked: executionBlocked,
      blockedReason,
    },
  ];
  if (kind === "bounded_test" || kind === "founder_requested_with_risks") {
    steps.push({
      id: "spec",
      title: "Draft PRD-lite only if a product change is in scope",
      ownerLabel: roles.find((r) => r.capabilityId === "DX-021")?.label ?? "Options / Spec",
      detail: "Omit when the test is evidence-only.",
      blocked: executionBlocked,
      blockedReason,
    });
  }
  steps.push({
    id: "gate",
    title: "Human gate before Act C execution / prototype",
    ownerLabel: "Founder (you)",
    detail:
      "Nothing external runs without an explicit approval. This plan alone does not start Act C.",
    blocked: false,
    blockedReason: null,
  });
  return steps;
}

export function buildContinuationPlan(input: {
  mission: SupervisedMission;
  nowMs: number;
}): ContinuationPlan {
  const approval = input.mission.approval;
  if (!approval) {
    throw new Error("A human next path is required before building a continuation plan.");
  }
  const humanNextPath = approval.humanNextPath ?? normalizeDecisionChoice(approval.choice);
  const kind = kindForPath(humanNextPath);
  const { title, summary } = titles(kind);
  const disagrees = approval.disagreesWithRecommendation === true;
  const executionLimited = approval.executionLimited === true;
  const executionBlocked =
    kind === "evidence_collection" || (kind === "founder_requested_with_risks" && executionLimited);
  const executionBlockedReason = executionBlocked
    ? kind === "evidence_collection"
      ? "Waiting on missing evidence inputs declared in Act A. Collection may be planned; execution of downstream build steps stays blocked."
      : "Provider/execution limits from Act A remain unresolved."
    : null;

  const roles = rolesFor(kind);
  const unresolvedRisks: string[] = [];
  if (disagrees) {
    unresolvedRisks.push(
      `Human path (${HUMAN_NEXT_PATH_LABELS[humanNextPath]}) differs from agent recommendation (${
        approval.agentRecommendation
          ? AGENT_RECOMMENDATION_LABELS[approval.agentRecommendation]
          : "not recorded"
      }). Agents do not endorse this continuation.`,
    );
  }
  if (approval.recommendationRationale) {
    unresolvedRisks.push(`Act A rationale on record: ${approval.recommendationRationale}`);
  }
  for (const gap of input.mission.evidence.filter((e) => e.classification === "gap")) {
    unresolvedRisks.push(`Evidence gap: ${gap.statement}`);
  }
  for (const g of input.mission.researchGaps ?? []) {
    unresolvedRisks.push(`Research: ${g}`);
  }

  const notIncluded = [
    "Unlimited product development or open-ended build",
    "Act C case-room execution (separate phase)",
    "Fake customer interviews or fabricated meetings",
    "Automatic start of the next mission",
    "Catalogue of all possible roles (continuation team is path-scoped)",
  ];
  if (kind !== "bounded_test" && kind !== "founder_requested_with_risks") {
    notIncluded.push("Full PRD — not appropriate for this path");
  }

  return {
    version: "continuation-v1",
    kind,
    title,
    summary,
    derivedFrom: {
      agentRecommendation: approval.agentRecommendation ?? null,
      humanNextPath,
      disagreesWithRecommendation: disagrees,
      executionLimited,
    },
    roles,
    roadmap: roadmapFor(kind, roles, executionBlocked, executionBlockedReason),
    plannedArtefacts: artefactsFor(kind, roles),
    unresolvedRisks,
    notIncluded,
    executionBlocked,
    executionBlockedReason,
    createdAt: new Date(input.nowMs).toISOString(),
  };
}

export function buildContinuationPlanMarkdown(
  mission: SupervisedMission,
  plan: ContinuationPlan,
): string {
  const roles = plan.roles
    .map(
      (r) =>
        `- **${r.label}**${r.capabilityId ? ` (${r.capabilityId})` : ""}\n  - Responsibility: ${r.responsibility}\n  - Why: ${r.why}\n  - Planned artefacts: ${r.plannedArtefacts.join(", ") || "none"}`,
    )
    .join("\n");
  const roadmap = plan.roadmap
    .map(
      (s) =>
        `- ${s.id}: **${s.title}** · ${s.ownerLabel}${s.blocked ? ` · BLOCKED: ${s.blockedReason}` : ""}\n  ${s.detail}`,
    )
    .join("\n");
  const artefacts = plan.plannedArtefacts
    .map((a) => `- ${a.type} · ${a.ownerLabel} — ${a.note}`)
    .join("\n");
  const risks = plan.unresolvedRisks.map((r) => `- ${r}`).join("\n") || "- None recorded.";
  const notIncluded = plan.notIncluded.map((n) => `- ${n}`).join("\n");

  return [
    `# Continuation plan (Act B)`,
    ``,
    `## Honesty`,
    `- This pack plans the **continuation team** for the authorised next path.`,
    `- It is distinct from the Act A **research team**.`,
    `- Team size follows the work — more roles are not more value.`,
    plan.derivedFrom.disagreesWithRecommendation
      ? `- Founder-requested continuation despite the recommendation; agents do not endorse this path.`
      : `- Human path aligns with the recorded recommendation framing.`,
    plan.executionBlocked
      ? `- Execution blocked: ${plan.executionBlockedReason}`
      : `- Execution is not blocked by missing Act A inputs (later gates still apply).`,
    ``,
    `## Case`,
    `Question: ${mission.brief.question}`,
    `Audience: ${mission.brief.audience}`,
    `Agent recommendation: ${
      plan.derivedFrom.agentRecommendation
        ? AGENT_RECOMMENDATION_LABELS[plan.derivedFrom.agentRecommendation]
        : "not recorded"
    }`,
    `Human next path: ${HUMAN_NEXT_PATH_LABELS[plan.derivedFrom.humanNextPath]}`,
    ``,
    `## ${plan.title}`,
    plan.summary,
    ``,
    `## Continuation team`,
    roles,
    ``,
    `## Roadmap`,
    roadmap,
    ``,
    `## Planned artefacts`,
    artefacts,
    ``,
    `## Unresolved risks`,
    risks,
    ``,
    `## Not included`,
    notIncluded,
    ``,
    `## Provenance`,
    `Created at ${plan.createdAt}. Version ${plan.version}.`,
    `Linked sources are not bundled. No observed product outcome is claimed.`,
  ].join("\n");
}

export function continuationPlanFilename(missionId: string): string {
  return `continuation-plan-${missionId.slice(0, 8)}.md`;
}
