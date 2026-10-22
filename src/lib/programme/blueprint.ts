/**
 * Programme blueprint: business case → roadmap.
 *
 * Phases, milestones and a dependency graph of work items (meetings,
 * deliverables, customer interviews, human gates). Staffing is explicit: every
 * one of the 150 catalogue roles has a named place in the programme.
 */
import { hashSeed, rng } from "./rng";
import { member } from "./roster";
import {
  PHASES,
  PHASE_LABELS,
  type BusinessCase,
  type Criterion,
  type DecisionOption,
  type DecisionSpec,
  type Milestone,
  type Phase,
  type PhaseKey,
  type Roadmap,
  type WorkItem,
} from "./types";

const ids = (...n: number[]) => n.map((x) => `DX-${String(x).padStart(3, "0")}`);
const range = (a: number, b: number) => ids(...Array.from({ length: b - a + 1 }, (_, i) => a + i));

/** Share of the timeline per phase (sums to 1). */
const PHASE_SHARE: Record<PhaseKey, number> = {
  discovery: 0.18,
  definition: 0.12,
  design: 0.14,
  build: 0.32,
  verification: 0.1,
  launch: 0.08,
  growth: 0.06,
};

const PHASE_GOALS: Record<PhaseKey, string> = {
  discovery: "Validate the problem, segment and demand with evidence before committing scope.",
  definition: "Agree MVP scope, requirements, business model and a dependency-ordered roadmap.",
  design: "Design the experience and architecture; review security and privacy before build.",
  build: "Deliver the MVP in sprints with reviewed increments.",
  verification: "Prove release quality with automated checks and a go/no-go decision.",
  launch: "Launch to the agreed audience with instrumentation and a go-to-market plan.",
  growth: "Learn from usage and evidence; plan the next validated improvements.",
};

export const DELIVERABLE_SECTIONS: Record<string, string[]> = {
  business_case: [
    "Opportunity",
    "Problem",
    "Target users",
    "Business objectives",
    "Assumptions",
    "Risks",
    "Success metrics",
  ],
  market_research: [
    "Market landscape",
    "Competitors",
    "Customer segments",
    "Demand signals",
    "Evidence gaps",
  ],
  technology_radar: ["Technology radar", "Maturity assessment", "Recommendations"],
  prd: [
    "Problem statement",
    "Target users",
    "Requirements",
    "User stories",
    "Acceptance criteria",
    "Success metrics",
    "Out of scope",
  ],
  business_model: [
    "Revenue model",
    "Pricing",
    "Unit economics",
    "Cost forecast",
    "Commercial assumptions",
  ],
  roadmap: ["Milestones", "Workstreams", "Dependencies", "Capacity and budget", "Risks to plan"],
  ux_design: [
    "User journeys",
    "Information architecture",
    "Screens",
    "Content and copy",
    "Accessibility",
  ],
  architecture: ["System context", "Components", "Data model", "Integrations", "Trade-offs"],
  threat_model: [
    "Assets and trust boundaries",
    "Threats",
    "Privacy assessment",
    "Mitigations",
    "Residual risks",
  ],
  sprint_increment: ["Sprint goal", "Delivered stories", "Technical notes", "Known issues"],
  gtm_plan: [
    "Positioning",
    "Audience and channels",
    "Launch sequence",
    "Sales motion",
    "Launch metrics",
  ],
  analytics_plan: [
    "North star metric",
    "Event taxonomy",
    "Funnels and cohorts",
    "Dashboards",
    "Privacy",
  ],
  evolution_plan: [
    "What we learned",
    "Next experiments",
    "Roadmap changes",
    "Technology watchlist",
  ],
};

function phaseWindows(weeks: number): Phase[] {
  let cursor = 0;
  return PHASES.map((key) => {
    const len = Math.max(1, Math.round(weeks * PHASE_SHARE[key]));
    const start = cursor + 1;
    cursor = Math.min(weeks, cursor + len);
    return {
      key,
      name: PHASE_LABELS[key],
      goal: PHASE_GOALS[key],
      startWeek: Math.min(start, weeks),
      endWeek: Math.max(Math.min(start, weeks), cursor),
    };
  });
}

function segmentsOf(targetUsers: string): string[] {
  const parts = targetUsers
    .split(/,|;|\band\b|\/|\bor\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
  return parts.length ? parts.slice(0, 3) : [targetUsers.trim() || "Primary users"];
}

/** Plausible, seeded option scores around a qualitative profile. */
function scored(
  seed: number,
  id: string,
  label: string,
  summary: string,
  profile: Partial<Record<Criterion, number>>,
): DecisionOption {
  const rand = rng(hashSeed(String(seed), id));
  const base = (c: Criterion) =>
    Math.min(1, Math.max(0, (profile[c] ?? 0.55) + (rand() * 2 - 1) * 0.05));
  return {
    id,
    label,
    summary,
    scores: {
      customer_value: base("customer_value"),
      business_value: base("business_value"),
      cost: base("cost"),
      risk: base("risk"),
      time_to_market: base("time_to_market"),
      evidence: base("evidence"),
      feasibility: base("feasibility"),
    },
  };
}

function decisions(
  bc: BusinessCase,
  seed: number,
): Record<"segment" | "mvp" | "stack" | "journey" | "goNoGo", DecisionSpec> {
  const segs = segmentsOf(bc.targetUsers);
  const segmentOptions: DecisionOption[] = [
    ...segs.map((s, i) =>
      scored(seed, `seg-${i}`, `Focus on ${s}`, `Design the MVP around ${s} first.`, {
        customer_value: 0.72 - i * 0.06,
        evidence: 0.62 - i * 0.08,
        time_to_market: 0.7,
        business_value: 0.55 + i * 0.05,
        feasibility: 0.7,
        risk: 0.66,
        cost: 0.66,
      }),
    ),
    scored(
      seed,
      "seg-broad",
      "Serve all segments at launch",
      "Launch broadly and let usage reveal the best segment.",
      {
        customer_value: 0.5,
        business_value: 0.68,
        evidence: 0.35,
        time_to_market: 0.4,
        feasibility: 0.45,
        risk: 0.5,
        cost: 0.42,
      },
    ),
  ];

  return {
    segment: {
      key: "D1-segment",
      question: `Which segment and problem should ${bc.name} serve first?`,
      options: segmentOptions,
      owner: "DX-022",
      panel: ids(11, 14, 15, 16, 21, 31, 100, 97, 133, 126, 2, 20),
      domainDepartments: [2, 3, 13],
      impact: "high",
    },
    mvp: {
      key: "D2-mvp-scope",
      question: "What MVP scope do we commit to for the first release?",
      options: [
        scored(
          seed,
          "mvp-lean",
          "Lean MVP — one core journey",
          "Ship the single most valuable journey end-to-end.",
          {
            customer_value: 0.6,
            business_value: 0.55,
            cost: 0.8,
            risk: 0.75,
            time_to_market: 0.85,
            evidence: 0.6,
            feasibility: 0.85,
          },
        ),
        scored(
          seed,
          "mvp-balanced",
          "Balanced MVP — core journey plus retention loop",
          "Core journey plus the feature that brings users back.",
          {
            customer_value: 0.75,
            business_value: 0.7,
            cost: 0.6,
            risk: 0.62,
            time_to_market: 0.6,
            evidence: 0.55,
            feasibility: 0.65,
          },
        ),
        scored(
          seed,
          "mvp-full",
          "Full feature set",
          "Everything in the business case for launch.",
          {
            customer_value: 0.8,
            business_value: 0.75,
            cost: 0.2,
            risk: 0.35,
            time_to_market: 0.2,
            evidence: 0.4,
            feasibility: 0.3,
          },
        ),
      ],
      owner: "DX-026",
      panel: ids(21, 22, 23, 25, 6, 4, 131, 41, 101, 8, 132),
      domainDepartments: [3, 14],
      impact: "high",
    },
    stack: {
      key: "D3-build-approach",
      question: "Which build approach and platform should the MVP use?",
      options: [
        scored(
          seed,
          "stack-managed",
          "Managed platform (BaaS + serverless)",
          "Hosted database, auth and functions; minimal operations.",
          {
            cost: 0.7,
            risk: 0.6,
            time_to_market: 0.85,
            feasibility: 0.8,
            customer_value: 0.6,
            business_value: 0.55,
            evidence: 0.7,
          },
        ),
        scored(
          seed,
          "stack-custom",
          "Custom services on containers",
          "Own services and infrastructure from day one.",
          {
            cost: 0.4,
            risk: 0.78,
            time_to_market: 0.4,
            feasibility: 0.62,
            customer_value: 0.7,
            business_value: 0.75,
            evidence: 0.62,
          },
        ),
        scored(
          seed,
          "stack-nocode",
          "No-code tools stitched together",
          "Fastest path using third-party no-code tools.",
          {
            cost: 0.8,
            risk: 0.22,
            time_to_market: 0.95,
            feasibility: 0.6,
            customer_value: 0.5,
            business_value: 0.45,
            evidence: 0.5,
          },
        ),
      ],
      owner: "DX-041",
      panel: ids(42, 43, 44, 51, 52, 61, 81, 82, 85, 90, 132, 54, 53),
      domainDepartments: [5, 6, 7, 9],
      impact: "medium",
    },
    journey: {
      key: "D4-journey-direction",
      question: "Which experience direction should the primary journey take?",
      options: [
        scored(
          seed,
          "ux-guided",
          "Guided step-by-step flow",
          "A short wizard that takes the user to their first outcome.",
          {
            customer_value: 0.7,
            evidence: 0.6,
            feasibility: 0.8,
            time_to_market: 0.75,
            risk: 0.7,
            cost: 0.7,
            business_value: 0.5,
          },
        ),
        scored(
          seed,
          "ux-workspace",
          "Single workspace dashboard",
          "Everything on one screen for power users.",
          {
            customer_value: 0.64,
            evidence: 0.55,
            feasibility: 0.62,
            time_to_market: 0.55,
            risk: 0.72,
            cost: 0.6,
            business_value: 0.78,
          },
        ),
        scored(
          seed,
          "ux-assistant",
          "Conversational assistant",
          "Natural-language interaction as the primary interface.",
          {
            customer_value: 0.8,
            evidence: 0.4,
            feasibility: 0.5,
            time_to_market: 0.5,
            risk: 0.45,
            cost: 0.5,
            business_value: 0.72,
          },
        ),
      ],
      owner: "DX-036",
      panel: ids(31, 32, 33, 38, 39, 40, 23, 42, 34, 67, 101, 114, 123, 52),
      domainDepartments: [4],
      impact: "medium",
    },
    goNoGo: {
      key: "D5-go-no-go",
      question: "Is the release candidate ready to launch, and to whom?",
      options: [
        scored(seed, "go-full", "Launch to everyone", "General availability on the planned date.", {
          business_value: 0.8,
          customer_value: 0.7,
          risk: 0.4,
          evidence: 0.45,
          time_to_market: 0.9,
          feasibility: 0.6,
          cost: 0.6,
        }),
        scored(
          seed,
          "go-beta",
          "Launch to a beta cohort",
          "Controlled launch to early users with close monitoring.",
          {
            business_value: 0.6,
            customer_value: 0.65,
            risk: 0.75,
            evidence: 0.7,
            time_to_market: 0.7,
            feasibility: 0.8,
            cost: 0.7,
          },
        ),
        scored(seed, "go-delay", "Delay launch", "Hold the release until open risks are closed.", {
          business_value: 0.3,
          customer_value: 0.35,
          risk: 0.85,
          evidence: 0.6,
          time_to_market: 0.15,
          feasibility: 0.8,
          cost: 0.5,
        }),
      ],
      owner: "DX-080",
      panel: ids(70, 71, 79, 86, 87, 88, 89, 82, 60, 56, 10, 138, 78),
      domainDepartments: [7, 8, 9],
      impact: "high",
    },
  };
}

export function generateRoadmap(bc: BusinessCase, programmeId: string): Roadmap {
  const weeks = Math.min(52, Math.max(6, Math.round(bc.timelineWeeks)));
  const phases = phaseWindows(weeks);
  const at = (p: PhaseKey, f = 0) => {
    const ph = phases.find((x) => x.key === p)!;
    return Math.round(ph.startWeek + (ph.endWeek - ph.startWeek) * f);
  };
  const seed = hashSeed(programmeId, bc.idea);
  const d = decisions(bc, seed);
  const items: WorkItem[] = [];
  const add = (item: Omit<WorkItem, "status" | "actualCredits">) => {
    const reviewer =
      item.kind === "deliverable" ? reviewerFor(item.owner, item.produces) : undefined;
    items.push({ ...item, status: "pending", actualCredits: 0, ...(reviewer ? { reviewer } : {}) });
  };
  const deliverable = (
    key: string,
    phase: PhaseKey,
    week: number,
    title: string,
    produces: string,
    owner: string,
    team: string[],
    dependsOn: string[],
    description: string,
    credits = 6,
  ) =>
    add({
      key,
      kind: "deliverable",
      phase,
      week,
      title,
      produces,
      owner,
      team,
      dependsOn,
      description,
      requiredSections: DELIVERABLE_SECTIONS[produces] ?? [],
      estimatedCredits: credits,
    });

  // --- Discovery -----------------------------------------------------------
  add({
    key: "kickoff",
    kind: "meeting",
    meetingType: "kickoff",
    phase: "discovery",
    week: at("discovery"),
    title: "Programme kickoff",
    owner: "DX-001",
    team: ids(22, 11, 31, 41, 51, 61, 71, 81, 91, 101, 114, 121, 131, 142, 9, 5),
    dependsOn: [],
    estimatedCredits: 3,
    description:
      "Division leads align on the business case, ways of working, decision rights and the roadmap.",
  });
  deliverable(
    "business_case",
    "discovery",
    at("discovery", 0.2),
    "Business case & problem framing",
    "business_case",
    "DX-002",
    ids(3, 7, 135, 131, 133),
    ["kickoff"],
    "Frame the opportunity, problem, objectives, assumptions and success metrics.",
  );
  deliverable(
    "market_research",
    "discovery",
    at("discovery", 0.4),
    "Market & competitor research",
    "market_research",
    "DX-015",
    ids(12, 13, 14, 17, 19, 111, 113),
    ["kickoff"],
    "Map the market, competitors, segments and demand signals; list evidence gaps.",
  );
  deliverable(
    "tech_radar",
    "discovery",
    at("discovery", 0.4),
    "Technology foresight radar",
    "technology_radar",
    "DX-100",
    range(91, 99),
    ["kickoff"],
    "Assess relevant emerging technologies by maturity: adopt, experiment, monitor, defer or reject.",
  );
  add({
    key: "interviews",
    kind: "interviews",
    phase: "discovery",
    week: at("discovery", 0.6),
    title: "Customer interview programme",
    owner: "DX-016",
    team: ids(31, 21, 20, 18, 126, 119, 112),
    dependsOn: ["business_case"],
    estimatedCredits: 8,
    description:
      "Interview guide, recruitment profile, rehearsal interviews with synthetic personas, and synthesis. Real interview notes can be added at any time.",
  });
  add({
    key: "discovery_workshop",
    kind: "meeting",
    meetingType: "discovery_workshop",
    phase: "discovery",
    week: at("discovery", 0.9),
    title: "Discovery synthesis workshop",
    owner: "DX-020",
    team: d.segment.panel,
    dependsOn: ["market_research", "tech_radar", "interviews"],
    estimatedCredits: 4,
    decision: d.segment,
    description: "Synthesise research, foresight and interviews; decide the first segment.",
  });
  add({
    key: "gate_discovery",
    kind: "gate",
    phase: "discovery",
    week: at("discovery", 1),
    title: "Human gate: validate discovery and segment",
    owner: "DX-001",
    team: [],
    dependsOn: ["discovery_workshop"],
    estimatedCredits: 0,
    description:
      "You review the evidence and ratify (or override) the segment decision before scope is defined.",
  });

  // --- Definition ----------------------------------------------------------
  deliverable(
    "prd",
    "definition",
    at("definition", 0.3),
    "Product requirements (PRD)",
    "prd",
    "DX-023",
    ids(24, 27, 28, 26, 29, 34),
    ["gate_discovery"],
    "Requirements, user stories and acceptance criteria for the chosen segment.",
  );
  deliverable(
    "business_model",
    "definition",
    at("definition", 0.3),
    "Business model & pricing",
    "business_model",
    "DX-134",
    ids(135, 133, 131, 132, 114, 118),
    ["gate_discovery"],
    "Revenue model, pricing, unit economics and cost forecast.",
  );
  add({
    key: "prioritisation",
    kind: "meeting",
    meetingType: "prioritisation",
    phase: "definition",
    week: at("definition", 0.6),
    title: "MVP prioritisation session",
    owner: "DX-006",
    team: d.mvp.panel,
    dependsOn: ["prd", "business_model"],
    estimatedCredits: 4,
    decision: d.mvp,
    description: "Trade value against cost, risk and time; commit the MVP scope.",
  });
  deliverable(
    "roadmap",
    "definition",
    at("definition", 0.8),
    "Delivery roadmap",
    "roadmap",
    "DX-025",
    ids(6, 8, 142, 143, 146, 147),
    ["prioritisation"],
    "Milestones, workstreams, dependencies, capacity and plan risks.",
  );
  add({
    key: "gate_scope",
    kind: "gate",
    phase: "definition",
    week: at("definition", 1),
    title: "Human gate: approve MVP scope and roadmap",
    owner: "DX-001",
    team: [],
    dependsOn: ["roadmap"],
    estimatedCredits: 0,
    description: "You approve the scope, business model and roadmap before design starts.",
  });

  // --- Design --------------------------------------------------------------
  deliverable(
    "ux_design",
    "design",
    at("design", 0.3),
    "UX journeys & UI specification",
    "ux_design",
    "DX-032",
    ids(31, 33, 34, 35, 36, 37, 38),
    ["gate_scope"],
    "Journeys, information architecture, screens, copy and accessibility.",
  );
  deliverable(
    "architecture",
    "design",
    at("design", 0.3),
    "Solution architecture",
    "architecture",
    "DX-041",
    ids(45, 46, 47, 51, 55, 57, 59, 81, 84, 66),
    ["gate_scope"],
    "System context, components, data model, integrations and trade-offs.",
  );
  deliverable(
    "threat_model",
    "design",
    at("design", 0.5),
    "Threat model & privacy assessment",
    "threat_model",
    "DX-062",
    ids(61, 63, 64, 65, 66, 67, 68, 69, 137, 138),
    ["architecture"],
    "Assets, trust boundaries, threats, privacy, mitigations and residual risk.",
  );
  add({
    key: "design_review",
    kind: "meeting",
    meetingType: "design_review",
    phase: "design",
    week: at("design", 0.7),
    title: "Design review",
    owner: "DX-036",
    team: d.journey.panel,
    dependsOn: ["ux_design"],
    estimatedCredits: 3,
    decision: d.journey,
    description: "Critique the journeys and choose the primary experience direction.",
  });
  add({
    key: "architecture_review",
    kind: "meeting",
    meetingType: "architecture_review",
    phase: "design",
    week: at("design", 0.7),
    title: "Architecture review board",
    owner: "DX-041",
    team: d.stack.panel,
    dependsOn: ["architecture", "threat_model"],
    estimatedCredits: 3,
    decision: d.stack,
    description: "Review architecture against the threat model; choose the build approach.",
  });
  add({
    key: "gate_design",
    kind: "gate",
    phase: "design",
    week: at("design", 1),
    title: "Human gate: approve design and architecture",
    owner: "DX-001",
    team: [],
    dependsOn: ["design_review", "architecture_review"],
    estimatedCredits: 0,
    description:
      "You approve the experience direction, architecture and residual risks before build.",
  });

  // --- Build sprints ---------------------------------------------------------
  const buildPhase = phases.find((p) => p.key === "build")!;
  const sprintCount = Math.min(
    4,
    Math.max(2, Math.round((buildPhase.endWeek - buildPhase.startWeek + 1) / 2)),
  );
  let prev = "gate_design";
  const buildTeams = [
    ids(42, 43, 45, 46, 72, 27),
    ids(44, 47, 52, 53, 54, 55, 73),
    ids(42, 43, 56, 57, 58, 59, 60, 74),
    ids(44, 45, 48, 75, 83, 84),
  ];
  for (let s = 1; s <= sprintCount; s++) {
    const f = (s - 1) / sprintCount;
    const last = s === sprintCount;
    add({
      key: `sprint${s}_planning`,
      kind: "meeting",
      meetingType: "sprint_planning",
      phase: "build",
      week: at("build", f),
      sprint: s,
      title: `Sprint ${s} planning`,
      owner: "DX-143",
      team: ids(142, 144, 146, 27, 28, 42, 43, 44, 72, 83),
      dependsOn: [prev],
      estimatedCredits: 2,
      description: `Select stories for sprint ${s}, break them into tasks and confirm dependencies.`,
    });
    add({
      key: `sprint${s}_build`,
      kind: "deliverable",
      phase: "build",
      week: at("build", f + 0.5 / sprintCount),
      sprint: s,
      title: last ? `Sprint ${s}: working prototype` : `Sprint ${s} increment`,
      produces: last ? "prototype" : "sprint_increment",
      owner: "DX-044",
      team: buildTeams[(s - 1) % buildTeams.length]!,
      dependsOn: [`sprint${s}_planning`],
      estimatedCredits: last ? 10 : 6,
      requiredSections: last ? [] : DELIVERABLE_SECTIONS["sprint_increment"]!,
      reviewer: "DX-049",
      description: last
        ? "Integrate the sprint work into a sandboxed, working HTML prototype of the primary journey."
        : `Implement and document the sprint ${s} stories.`,
    } as Omit<WorkItem, "status" | "actualCredits">);
    add({
      key: `sprint${s}_review`,
      kind: "meeting",
      meetingType: "sprint_review",
      phase: "build",
      week: at("build", f + 0.9 / sprintCount),
      sprint: s,
      title: `Sprint ${s} review & retrospective`,
      owner: "DX-148",
      team: ids(1, 49, 48, 50, 79, 145, 147, 149, 150, 23),
      dependsOn: [`sprint${s}_build`],
      estimatedCredits: 2,
      description: `Demo the sprint ${s} increment, review quality and cost, and agree improvements.`,
    });
    prev = `sprint${s}_review`;
  }

  // --- Verification ----------------------------------------------------------
  add({
    key: "verification",
    kind: "deliverable",
    phase: "verification",
    week: at("verification", 0.4),
    title: "Verification report",
    produces: "verification_report",
    owner: "DX-071",
    team: ids(72, 73, 74, 75, 76, 77, 78, 40, 39, 58),
    dependsOn: [prev],
    estimatedCredits: 4,
    description:
      "Re-check every deliverable contract, run prototype checks and trace PRD acceptance criteria.",
  });
  add({
    key: "go_no_go",
    kind: "meeting",
    meetingType: "go_no_go",
    phase: "verification",
    week: at("verification", 0.8),
    title: "Go / no-go review",
    owner: "DX-080",
    team: d.goNoGo.panel,
    dependsOn: ["verification"],
    estimatedCredits: 3,
    decision: d.goNoGo,
    description: "Release readiness review across quality, security, operations and business.",
  });
  add({
    key: "gate_release",
    kind: "gate",
    phase: "verification",
    week: at("verification", 1),
    title: "Human gate: authorise release",
    owner: "DX-001",
    team: [],
    dependsOn: ["go_no_go"],
    estimatedCredits: 0,
    description: "You authorise the launch decision and accept the residual risks.",
  });

  // --- Launch ----------------------------------------------------------------
  deliverable(
    "gtm_plan",
    "launch",
    at("launch", 0.3),
    "Go-to-market & launch plan",
    "gtm_plan",
    "DX-030",
    ids(101, 102, 103, 104, 105, 106, 110, 115, 116, 120),
    ["gate_release"],
    "Positioning, channels, launch sequence, sales motion and launch metrics.",
  );
  deliverable(
    "analytics_plan",
    "launch",
    at("launch", 0.3),
    "Analytics & instrumentation plan",
    "analytics_plan",
    "DX-121",
    ids(122, 123, 124, 125, 127, 29, 109, 86),
    ["gate_release"],
    "North star metric, events, funnels, dashboards and privacy.",
  );
  add({
    key: "launch_review",
    kind: "meeting",
    meetingType: "launch_review",
    phase: "launch",
    week: at("launch", 0.8),
    title: "Launch review",
    owner: "DX-030",
    team: ids(107, 108, 109, 117, 119, 118, 10, 1, 88),
    dependsOn: ["gtm_plan", "analytics_plan"],
    estimatedCredits: 3,
    description: "Confirm launch readiness across marketing, sales, success and operations.",
  });

  // --- Growth ----------------------------------------------------------------
  deliverable(
    "evolution_plan",
    "growth",
    at("growth", 0.4),
    "Growth & evolution plan",
    "evolution_plan",
    "DX-130",
    ids(125, 128, 129, 108, 60, 99, 92, 141),
    ["launch_review"],
    "Lessons, next experiments, roadmap changes and technology watchlist.",
  );
  add({
    key: "retrospective",
    kind: "meeting",
    meetingType: "retrospective",
    phase: "growth",
    week: at("growth", 0.8),
    title: "Programme retrospective",
    owner: "DX-001",
    team: ids(141, 144, 145, 147, 150, 4, 10, 136, 139, 140),
    dependsOn: ["evolution_plan"],
    estimatedCredits: 3,
    description: "What worked, what did not, and how the workforce should operate next time.",
  });

  const milestones: Milestone[] = [
    {
      key: "M1",
      phase: "discovery",
      title: "Problem and segment validated",
      week: at("discovery", 1),
      itemKeys: ["gate_discovery"],
    },
    {
      key: "M2",
      phase: "definition",
      title: "MVP scope and roadmap approved",
      week: at("definition", 1),
      itemKeys: ["gate_scope"],
    },
    {
      key: "M3",
      phase: "design",
      title: "Design and architecture approved",
      week: at("design", 1),
      itemKeys: ["gate_design"],
    },
    {
      key: "M4",
      phase: "build",
      title: "Working prototype delivered",
      week: at("build", 1),
      itemKeys: [`sprint${sprintCount}_review`],
    },
    {
      key: "M5",
      phase: "verification",
      title: "Release authorised",
      week: at("verification", 1),
      itemKeys: ["gate_release"],
    },
    {
      key: "M6",
      phase: "launch",
      title: "Launched with instrumentation",
      week: at("launch", 1),
      itemKeys: ["launch_review"],
    },
    {
      key: "M7",
      phase: "growth",
      title: "Evolution plan agreed",
      week: at("growth", 1),
      itemKeys: ["retrospective"],
    },
  ];

  return { phases, milestones, items };
}

/** Peer reviewer from a different department than the author. */
function reviewerFor(owner: string, produces?: string): string {
  const map: Record<string, string> = {
    business_case: "DX-004",
    market_research: "DX-018",
    technology_radar: "DX-019",
    prd: "DX-024",
    business_model: "DX-138",
    roadmap: "DX-146",
    ux_design: "DX-039",
    architecture: "DX-070",
    threat_model: "DX-061",
    gtm_plan: "DX-022",
    analytics_plan: "DX-125",
    evolution_plan: "DX-150",
    verification_report: "DX-080",
  };
  const r = map[produces ?? ""] ?? "DX-049";
  return member(r).departmentNumber === member(owner).departmentNumber && r !== "DX-049"
    ? "DX-049"
    : r;
}

export function allStaffed(roadmap: Roadmap): Set<string> {
  const s = new Set<string>();
  for (const i of roadmap.items) {
    s.add(i.owner);
    i.team.forEach((t) => s.add(t));
    if (i.reviewer) s.add(i.reviewer);
    i.decision?.panel.forEach((t) => s.add(t));
  }
  return s;
}
