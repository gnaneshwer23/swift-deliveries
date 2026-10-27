/**
 * Specialist team for the supervised decision pilot.
 * Uses only Available Wave 1 registry roles — not the full catalogue.
 * Complexity band selects a deterministic subset (S/M/L/XL → 4/6/8/8).
 */
import { getCapability } from "@/lib/workforce/registry/load";
import { validateTaskGraph, type GraphNode } from "@/lib/workforce/graph";
import type { MissionStage, SupervisedMission } from "./types";

/** Matches PM-brief complexity bands. Kept local to avoid import cycles. */
export type StaffingBand = "S" | "M" | "L" | "XL";

export const DECISION_LOOP_STEPS = [
  "objective",
  "evidence",
  "options",
  "decision",
  "approved_work",
  "outcome",
  "next_mission",
] as const;

export type DecisionLoopStep = (typeof DECISION_LOOP_STEPS)[number];

export const DECISION_LOOP_LABELS: Record<DecisionLoopStep, string> = {
  objective: "Objective",
  evidence: "Evidence",
  options: "Options",
  decision: "Decision",
  approved_work: "Approved work",
  outcome: "Outcome",
  next_mission: "Next mission",
};

export type PilotTaskStatus =
  | "pending"
  | "ready"
  | "blocked"
  | "awaiting_approval"
  | "completed"
  | "skipped";

export type PilotSpecialistTask = {
  key: string;
  title: string;
  loopStep: DecisionLoopStep;
  /** Registry capability id, or null for a human-only gate. */
  capabilityId: string | null;
  ownerLabel: string;
  dependsOn: string[];
  status: PilotTaskStatus;
  /** What information this task is allowed to use. */
  uses: string[];
  /** What it is expected to produce. */
  produces: string;
  blockedReason: string | null;
  /** Human contribution vs AI draft — never conflated in the UI. */
  actor: "specialist" | "human";
};

export type PilotActivityEvent = {
  id: string;
  at: string;
  taskKey: string | null;
  kind: string;
  summary: string;
  /** Who caused the event: a specialist id, "human", or "system". */
  actor: string;
};

export type PilotTeamPlan = {
  version: "pilot-team-v1";
  /** Assignable Wave 1 specialists staffing this mission. */
  capabilityIds: string[];
  /** Complexity band that selected this subset. */
  staffingBand: StaffingBand;
  tasks: PilotSpecialistTask[];
  approvedAt: string | null;
  approvedBy: string | null;
};

const ROLE = (id: string, fallback: string) => getCapability(id)?.name ?? fallback;

/** Decision-loop spine — always included. */
export const STAFFING_CORE_IDS = ["DX-002", "DX-018", "DX-020", "DX-001"] as const;
/** Options / challenge path. */
export const STAFFING_OPTIONS_IDS = ["DX-021", "DX-071"] as const;
/** Post-decision delivery artefacts. */
export const STAFFING_DELIVERY_IDS = ["DX-023", "DX-035"] as const;

export const WAVE1_AVAILABLE_CAP = 8;

/** Deterministic Available-only selection by band. Never pulls Planned / catalogue-150 roles. */
export function selectCapabilityIdsForBand(band: StaffingBand): string[] {
  if (band === "S") return [...STAFFING_CORE_IDS];
  if (band === "M") return [...STAFFING_CORE_IDS, ...STAFFING_OPTIONS_IDS];
  return [...STAFFING_CORE_IDS, ...STAFFING_OPTIONS_IDS, ...STAFFING_DELIVERY_IDS].slice(
    0,
    WAVE1_AVAILABLE_CAP,
  );
}

function ownerFor(
  preferred: string,
  capabilityIds: readonly string[],
  fallback: string,
): { capabilityId: string; ownerLabel: string } {
  const id = capabilityIds.includes(preferred) ? preferred : fallback;
  const labels: Record<string, string> = {
    "DX-001": "Chief of Staff Agent",
    "DX-002": "Problem-Framing Agent",
    "DX-018": "Evidence Integrity Agent",
    "DX-020": "Research Synthesis Agent",
    "DX-021": "Market Intelligence Agent",
    "DX-023": "Product Requirements Agent",
    "DX-035": "UX Prototype Agent",
    "DX-071": "QA Reliability Agent",
  };
  return { capabilityId: id, ownerLabel: ROLE(id, labels[id] ?? id) };
}

/** Bounded plan shown before any specialist work advances. Sized by complexity band. */
export function buildPilotTeamPlan(input?: { band?: StaffingBand }): PilotTeamPlan {
  const band = input?.band ?? "M";
  const capabilityIds = selectCapabilityIdsForBand(band);
  const frame = ownerFor("DX-002", capabilityIds, "DX-002");
  const evidence = ownerFor("DX-018", capabilityIds, "DX-018");
  const synthesis = ownerFor("DX-020", capabilityIds, "DX-020");
  const draft = ownerFor("DX-021", capabilityIds, "DX-001");
  const challenge = ownerFor("DX-071", capabilityIds, "DX-020");
  const structure = ownerFor("DX-001", capabilityIds, "DX-001");
  const product = ownerFor("DX-023", capabilityIds, "DX-001");
  const pack = ownerFor("DX-035", capabilityIds, "DX-001");
  const follow = ownerFor("DX-001", capabilityIds, "DX-001");

  const tasks: PilotSpecialistTask[] = [
    {
      key: "frame_objective",
      title: "Frame the product objective",
      loopStep: "objective",
      capabilityId: frame.capabilityId,
      ownerLabel: frame.ownerLabel,
      dependsOn: [],
      status: "pending",
      uses: ["Mission brief (founder-supplied)"],
      produces: "Scoped objective, audience and constraints",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "register_evidence",
      title: "Register evidence and claims",
      loopStep: "evidence",
      capabilityId: evidence.capabilityId,
      ownerLabel: evidence.ownerLabel,
      dependsOn: ["frame_objective"],
      status: "pending",
      uses: ["Founder-supplied evidence", "Research mode selection"],
      produces: "Evidence register with source refs and access limits",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "synthesise_findings",
      title: "Synthesise findings and gaps",
      loopStep: "evidence",
      capabilityId: synthesis.capabilityId,
      ownerLabel: synthesis.ownerLabel,
      dependsOn: ["register_evidence"],
      status: "pending",
      uses: ["Evidence register", "Assumptions flagged as such"],
      produces: "Findings, uncertainties and contradictions",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "draft_options",
      title: "Draft options",
      loopStep: "options",
      capabilityId: draft.capabilityId,
      ownerLabel: draft.ownerLabel,
      dependsOn: ["synthesise_findings"],
      status: "pending",
      uses: ["Findings", "Mission constraints"],
      produces: "Option set with trade-offs",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "challenge_options",
      title: "Challenge options",
      loopStep: "options",
      capabilityId: challenge.capabilityId,
      ownerLabel: challenge.ownerLabel,
      dependsOn: ["draft_options"],
      status: "pending",
      uses: ["Draft options", "Evidence gaps"],
      produces: "Challenge notes and weak-basis flags",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "structure_recommendation",
      title: "Structure recommendation for decision",
      loopStep: "decision",
      capabilityId: structure.capabilityId,
      ownerLabel: structure.ownerLabel,
      dependsOn: ["challenge_options"],
      status: "pending",
      uses: ["Options", "Challenge notes"],
      produces: "Recommendation draft (not a decision)",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "human_decision",
      title: "Human decision gate",
      loopStep: "decision",
      capabilityId: null,
      ownerLabel: "You (human)",
      dependsOn: ["structure_recommendation"],
      status: "pending",
      uses: ["Recommendation draft", "Alternatives on the record"],
      produces: "Owner decision and approval history",
      blockedReason: null,
      actor: "human",
    },
    {
      key: "product_brief",
      title: "Draft product / experiment brief",
      loopStep: "approved_work",
      capabilityId: product.capabilityId,
      ownerLabel: product.ownerLabel,
      dependsOn: ["human_decision"],
      status: "pending",
      uses: ["Owner decision", "Measurement plan"],
      produces: "Product / experiment brief",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "assemble_pack",
      title: "Assemble decision pack",
      loopStep: "approved_work",
      capabilityId: pack.capabilityId,
      ownerLabel: pack.ownerLabel,
      dependsOn: ["product_brief"],
      status: "pending",
      uses: ["Decision brief", "Experiment brief", "Provenance labels"],
      produces: "Exportable decision pack (PDF + Markdown)",
      blockedReason: null,
      actor: "specialist",
    },
    {
      key: "outcome_observation",
      title: "Record expected outcome / observation",
      loopStep: "outcome",
      capabilityId: null,
      ownerLabel: "You (human)",
      dependsOn: ["assemble_pack"],
      status: "pending",
      uses: ["Exported pack", "Owner-supplied result only"],
      produces: "Expectation and later observation (owner-supplied)",
      blockedReason: null,
      actor: "human",
    },
    {
      key: "propose_follow_up",
      title: "Propose follow-up mission",
      loopStep: "next_mission",
      capabilityId: follow.capabilityId,
      ownerLabel: follow.ownerLabel,
      dependsOn: ["outcome_observation"],
      status: "pending",
      uses: ["Outcome review"],
      produces: "Follow-up proposal (not started until you approve)",
      blockedReason: null,
      actor: "specialist",
    },
  ];

  const graph: GraphNode[] = tasks.map((t, i) => ({
    key: t.key,
    dependsOn: t.dependsOn,
    status: "pending",
    sortOrder: i,
  }));
  const validation = validateTaskGraph(graph);
  if (!validation.ok) {
    throw new Error(`Pilot team plan is invalid: ${validation.reason} (${validation.detail})`);
  }

  return {
    version: "pilot-team-v1",
    capabilityIds,
    staffingBand: band,
    tasks,
    approvedAt: null,
    approvedBy: null,
  };
}

/** Map stored mission progress onto the specialist DAG without inventing activity. */
export function syncTeamWithMission(
  plan: PilotTeamPlan,
  mission: Pick<
    SupervisedMission,
    | "stage"
    | "proposal"
    | "approval"
    | "artefact"
    | "exportBody"
    | "expectation"
    | "observation"
    | "reviews"
    | "followUp"
    | "team"
    | "researchPassCompletedAt"
  >,
): PilotTeamPlan {
  const approved = Boolean(plan.approvedAt);
  const researchDone = Boolean(mission.researchPassCompletedAt);
  const completed = new Set<string>();

  const mark = (key: string, when: boolean) => {
    if (when) completed.add(key);
  };

  mark("frame_objective", approved && mission.stage !== "brief");
  mark(
    "register_evidence",
    researchDone ||
      Boolean(mission.proposal) ||
      ["alternatives", "decision", "artefact", "exported"].includes(mission.stage),
  );
  mark(
    "synthesise_findings",
    researchDone ||
      Boolean(mission.proposal) ||
      ["alternatives", "decision", "artefact", "exported"].includes(mission.stage),
  );
  mark(
    "draft_options",
    Boolean(mission.proposal) ||
      ["alternatives", "decision", "artefact", "exported"].includes(mission.stage),
  );
  mark(
    "challenge_options",
    Boolean(mission.proposal) ||
      ["alternatives", "decision", "artefact", "exported"].includes(mission.stage),
  );
  mark(
    "structure_recommendation",
    Boolean(mission.proposal) ||
      ["alternatives", "decision", "artefact", "exported"].includes(mission.stage),
  );
  mark("human_decision", Boolean(mission.approval));
  mark("product_brief", Boolean(mission.artefact));
  mark("assemble_pack", Boolean(mission.exportBody));
  mark(
    "outcome_observation",
    Boolean(mission.observation) || Boolean(mission.reviews.length),
  );
  mark("propose_follow_up", mission.followUp?.status === "approved");

  const tasks = plan.tasks.map((task) => {
    if (mission.stage === "cancelled") {
      return {
        ...task,
        status: completed.has(task.key) ? ("completed" as const) : ("skipped" as const),
        blockedReason: completed.has(task.key) ? null : "Mission cancelled.",
      };
    }
    if (completed.has(task.key)) {
      return { ...task, status: "completed" as const, blockedReason: null };
    }
    if (!approved) {
      return {
        ...task,
        status: "awaiting_approval" as const,
        blockedReason: "Specialist plan awaits your approval.",
      };
    }
    const depsMet = task.dependsOn.every((d) => completed.has(d));
    if (!depsMet) {
      const missing = task.dependsOn.filter((d) => !completed.has(d));
      return {
        ...task,
        status: "blocked" as const,
        blockedReason: `Waiting on: ${missing.join(", ")}`,
      };
    }
    if (task.key === "human_decision") {
      return {
        ...task,
        status: "awaiting_approval" as const,
        blockedReason: "Waiting for your decision on the proposal.",
      };
    }
    if (task.key === "propose_follow_up" && mission.followUp?.status === "proposed") {
      return {
        ...task,
        status: "awaiting_approval" as const,
        blockedReason: "Follow-up proposed — not started until you approve.",
      };
    }
    if (task.key === "outcome_observation" && !mission.exportBody) {
      return {
        ...task,
        status: "blocked" as const,
        blockedReason: "Export the decision pack before recording an outcome.",
      };
    }
    return { ...task, status: "ready" as const, blockedReason: null };
  });

  return { ...plan, tasks };
}

export function activityEvent(input: {
  at: string;
  taskKey: string | null;
  kind: string;
  summary: string;
  actor: string;
}): PilotActivityEvent {
  return {
    id: crypto.randomUUID(),
    at: input.at,
    taskKey: input.taskKey,
    kind: input.kind,
    summary: input.summary,
    actor: input.actor,
  };
}

export function loopStepForStage(stage: MissionStage): DecisionLoopStep {
  switch (stage) {
    case "brief":
      return "objective";
    case "evidence":
      return "evidence";
    case "alternatives":
      return "options";
    case "decision":
      return "decision";
    case "artefact":
      return "approved_work";
    case "exported":
      return "outcome";
    case "cancelled":
      return "objective";
  }
}
