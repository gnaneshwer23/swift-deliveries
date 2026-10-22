/**
 * DXSI end-to-end product mission (vision §3, roadmap Phase 1–2 proof point).
 *
 * One objective → eight lifecycle stages expressed as a dependency graph.
 * Discovery runs as three parallel tracks; humans approve scope, design and
 * the release candidate before anything downstream may consume them.
 *
 * Only Wave 1 Available capabilities are assigned. Stages whose specialist
 * departments are still Planned are disclosed as limitations, never faked.
 */
import type { PlanCapabilityLimitation, PlannedTask } from "./types";

export const STAGE_CONTRACTS = {
  charter: [
    "Problem",
    "Target users",
    "Desired outcome",
    "Constraints",
    "Success criteria",
    "Open questions",
  ],
  market: [
    "Market landscape",
    "Customer segments",
    "Competitors",
    "Demand hypotheses",
    "Evidence gaps",
  ],
  research: ["Research questions", "Findings", "Evidence quality", "Unresolved questions"],
  foresight: ["Technology radar", "Maturity assessment", "Recommendations"],
  prd: [
    "Problem statement",
    "Target users",
    "Value proposition",
    "Requirements",
    "Acceptance criteria",
    "Success metrics",
    "Risks",
    "Out of scope",
  ],
  ux: ["User journeys", "Information architecture", "Screens", "Accessibility"],
  architecture: [
    "System context",
    "Components",
    "Data model",
    "Security and privacy",
    "Trade-offs",
    "Delivery plan",
  ],
  release: [
    "Release candidate",
    "Evidence summary",
    "Unresolved risks",
    "Rollout plan",
    "Rollback plan",
  ],
  evolution: ["Product metrics", "Instrumentation", "Feedback loops", "Next experiments"],
} as const satisfies Record<string, readonly string[]>;

const clip = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 160);

export function productMissionTasks(request: string, external: boolean): PlannedTask[] {
  const req = clip(request);
  const tasks: PlannedTask[] = [
    {
      key: "charter",
      stage: "capture",
      dependsOn: [],
      title: "Mission charter",
      description: `Turn the objective into a problem, users, outcome, constraints and success criteria: “${req}”.`,
      acceptanceCriteria:
        "Charter states problem, users, outcome, constraints, success criteria and open questions.",
      estimatedUsage: 6,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-001", "DX-002"],
      requiredSections: [...STAGE_CONTRACTS.charter],
      produces: "mission_charter",
    },
    {
      key: "market",
      stage: "discover",
      dependsOn: ["charter"],
      title: "Market & customer evidence",
      description:
        "Map the market, segments, competitors and demand hypotheses; separate evidence from assumption.",
      acceptanceCriteria:
        "Every claim is classified; evidence gaps are listed rather than filled with invention.",
      estimatedUsage: 8,
      permissionRequired: "execute_internally",
      isExternal: false,
      capabilityIds: ["DX-012", "DX-021", "DX-020"],
      requiredSections: [...STAGE_CONTRACTS.market],
      produces: "research_dossier",
    },
    {
      key: "research",
      stage: "discover",
      dependsOn: ["charter"],
      title: "Deep research dossier",
      description:
        "Define research questions, assess prior art and evidence quality, and record unresolved questions.",
      acceptanceCriteria: "Findings carry a confidence level; unresolved questions are explicit.",
      estimatedUsage: 8,
      permissionRequired: "execute_internally",
      isExternal: false,
      capabilityIds: ["DX-011", "DX-018", "DX-020"],
      requiredSections: [...STAGE_CONTRACTS.research],
      produces: "research_dossier",
    },
    {
      key: "foresight",
      stage: "discover",
      dependsOn: ["charter"],
      title: "Technology foresight scan",
      description:
        "Assess relevant emerging technologies by maturity and recommend adopt / experiment / monitor / defer / reject.",
      acceptanceCriteria:
        "Each technology has a maturity level and one recommendation; nothing enters scope without evidence.",
      estimatedUsage: 6,
      permissionRequired: "execute_internally",
      isExternal: false,
      capabilityIds: ["DX-011", "DX-012", "DX-018"],
      requiredSections: [...STAGE_CONTRACTS.foresight],
      produces: "tech_radar",
    },
    {
      key: "prd",
      stage: "define",
      dependsOn: ["market", "research", "foresight"],
      title: "PRD & success metrics",
      description:
        "Synthesise discovery into a PRD with requirements, acceptance criteria, metrics, risks and scope.",
      acceptanceCriteria:
        "PRD acceptance criteria are observable and traceable to discovery evidence.",
      estimatedUsage: 10,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-023", "DX-021", "DX-002"],
      requiredSections: [...STAGE_CONTRACTS.prd],
      produces: "prd",
    },
    {
      key: "gate_scope",
      stage: "define",
      dependsOn: ["prd"],
      gate: true,
      title: "Human gate: approve product scope",
      description: "Operator reviews the PRD before design begins. Agents cannot pass this gate.",
      acceptanceCriteria: "Explicit operator approval recorded in the audit trail.",
      estimatedUsage: 0,
      permissionRequired: "plan",
      isExternal: false,
      capabilityIds: [],
    },
    {
      key: "ux",
      stage: "design",
      dependsOn: ["gate_scope"],
      title: "UX journeys & UI specification",
      description:
        "Design journeys, information architecture, screen specifications and accessibility requirements.",
      acceptanceCriteria: "Every PRD requirement maps to at least one journey or screen.",
      estimatedUsage: 8,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-035", "DX-021"],
      requiredSections: [...STAGE_CONTRACTS.ux],
      produces: "design_spec",
    },
    {
      key: "architecture",
      stage: "design",
      dependsOn: ["gate_scope"],
      title: "Architecture, data model & delivery plan",
      description:
        "Define system context, components, data model, security/privacy boundaries, trade-offs and delivery plan.",
      acceptanceCriteria:
        "Trade-offs and security boundaries are explicit; delivery plan is dependency-ordered.",
      estimatedUsage: 8,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-041"],
      requiredSections: [...STAGE_CONTRACTS.architecture],
      produces: "architecture",
    },
    {
      key: "gate_design",
      stage: "design",
      dependsOn: ["ux", "architecture"],
      gate: true,
      title: "Human gate: approve design & architecture",
      description:
        "Operator reviews assumptions, costs, dependencies and risks before build work starts.",
      acceptanceCriteria: "Explicit operator approval recorded in the audit trail.",
      estimatedUsage: 0,
      permissionRequired: "plan",
      isExternal: false,
      capabilityIds: [],
    },
    {
      key: "prototype",
      stage: "build",
      dependsOn: ["gate_design"],
      title: "Build sandboxed working prototype",
      description: "Implement the primary journey as a self-contained, sandboxed HTML prototype.",
      acceptanceCriteria:
        "Prototype opens standalone, makes no network calls and shows the primary journey.",
      estimatedUsage: 12,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-035", "DX-041"],
      produces: "prototype_html",
    },
    {
      key: "verify",
      stage: "verify",
      dependsOn: ["prototype"],
      title: "Automated verification",
      description:
        "Re-check every stage contract, run static prototype checks and trace PRD acceptance criteria.",
      acceptanceCriteria: "All checks reported with pass/fail; failures block release.",
      estimatedUsage: 4,
      permissionRequired: "execute_internally",
      isExternal: false,
      capabilityIds: ["DX-071", "DX-049"],
      produces: "test_report",
    },
    {
      key: "release_pack",
      stage: "release",
      dependsOn: ["verify"],
      title: "Release candidate pack",
      description:
        "Assemble the release candidate, evidence summary, unresolved risks, rollout and rollback plans.",
      acceptanceCriteria: "Unresolved risks are listed; rollback plan exists.",
      estimatedUsage: 6,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-001", "DX-049"],
      requiredSections: [...STAGE_CONTRACTS.release],
      produces: "release_pack",
    },
    {
      key: "gate_release",
      stage: "release",
      dependsOn: ["release_pack"],
      gate: true,
      title: "Human gate: approve release candidate",
      description: "Operator accepts the release candidate and its unresolved risks.",
      acceptanceCriteria: "Explicit operator approval recorded in the audit trail.",
      estimatedUsage: 0,
      permissionRequired: "plan",
      isExternal: false,
      capabilityIds: [],
    },
    {
      key: "evolution",
      stage: "evolve",
      dependsOn: ["gate_release"],
      title: "Measurement & evolution plan",
      description:
        "Define product metrics, instrumentation, feedback loops and the next validated experiments.",
      acceptanceCriteria:
        "Metrics have a baseline plan; experiments state hypothesis and success threshold.",
      estimatedUsage: 6,
      permissionRequired: "create",
      isExternal: false,
      capabilityIds: ["DX-020", "DX-001"],
      requiredSections: [...STAGE_CONTRACTS.evolution],
      produces: "evolution_plan",
    },
  ];
  if (external) {
    tasks.push({
      key: "publish",
      stage: "release",
      dependsOn: ["gate_release"],
      title: "Publish release externally",
      description:
        "Deploy or share the release outside DeliverX (requires Act externally approval).",
      acceptanceCriteria: "Runs only after explicit external-action approval.",
      estimatedUsage: 6,
      permissionRequired: "act_externally",
      isExternal: true,
      capabilityIds: ["DX-001"],
    });
  }
  return tasks;
}

/** Honest disclosure of what Stage 1 cannot yet do inside a product mission. */
export function productMissionLimitations(): PlanCapabilityLimitation[] {
  return [
    {
      code: "capability_not_available",
      message:
        "Stage 5 produces a sandboxed prototype and delivery plan, not production code: Software Engineering roles DX-042–DX-050 are Planned.",
      requested_department: "Software Engineering",
      requested_capability_ids: ["DX-042", "DX-043", "DX-044"],
      alternative: {
        summary:
          "Architecture (DX-041) plus a sandboxed prototype (DX-035) with automated checks (DX-071).",
        capability_ids: ["DX-041", "DX-035", "DX-071"],
      },
    },
    {
      code: "capability_not_available",
      message:
        "Discovery uses the model's knowledge and your inputs; live web, patent and literature connectors are not yet connected, so findings are labelled inferences unless you supply sources.",
      requested_department: "Research and Intelligence",
      requested_capability_ids: ["DX-013", "DX-019"],
    },
  ];
}
