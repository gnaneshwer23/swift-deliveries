import type { ResearchMode } from "./research-mode";
import type { PilotActivityEvent, PilotTeamPlan } from "./specialist-team";

/** Exact record stored when no model provider is configured. */
export const NOT_RUN_LABEL = "not run — provider not configured";

export const LEASE_MS = 60_000;

export type EvidenceClassification = "supplied" | "assumption" | "gap";

export type Brief = {
  question: string;
  audience: string;
  outcome: string;
  constraints: string;
};

export type { ResearchMode, PilotActivityEvent, PilotTeamPlan };

export type EvidenceItem = {
  id: string;
  statement: string;
  source: string;
  classification: EvidenceClassification;
};

export type GenerationResult = {
  ran: boolean;
  label: string;
  provider: string | null;
  model: string | null;
  output: string;
  citations: string[];
  gaps: string[];
};

export type OptionDraft = {
  id: string;
  title: string;
  tradeoff: string;
  basis: string;
};

export type Proposal = {
  action: "compare_options";
  version: number;
  scopeHash: string;
  options: OptionDraft[];
  generation: GenerationResult;
};

export type DecisionChoice = "accept" | "request_more_evidence";

export type ApprovalRecord = {
  action: "compare_options";
  version: number;
  scopeHash: string;
  optionId: string;
  choice: DecisionChoice;
  note: string;
  actorId: string;
  decidedAt: string;
};

export type InvalidatedApproval = ApprovalRecord & { reason: string };

export type ArtefactPack = {
  title: string;
  decisionBrief: string;
  experimentBrief: string;
  provenance: string;
};

/** P5 — sandboxed HTML prototype produced after an explicit human gate. */
export type MissionPrototypeCheck = {
  id: string;
  label: string;
  passed: boolean;
};

export type MissionPrototype = {
  title: string;
  html: string;
  honesty: {
    mode: "simulated" | "model";
    label: string;
    modelId: string | null;
  };
  checks: MissionPrototypeCheck[];
  sandboxSafe: boolean;
  verified: boolean;
  failureDetail: string | null;
  approvedAt: string;
  approvedBy: string;
  producedAt: string;
  ownerCapabilityId: string;
  ownerLabel: string;
};

/** Stored on every owner-supplied result. DeliverX does not measure it. */
export const OWNER_SUPPLIED_OBSERVATION_LABEL =
  "Owner-supplied. DeliverX did not measure this result.";

export type DecisionBinding = {
  action: "compare_options";
  version: number;
  scopeHash: string;
  optionId: string;
  decidedAt: string;
};

export type OutcomeExpectation = {
  hypothesis: string;
  expectedMetric: string;
  baseline: string;
  observationWindow: string;
  recordedAt: string;
  actorId: string;
  decision: DecisionBinding;
};

export type OutcomeObservation = {
  id: string;
  result: string;
  evidence: string;
  source: string;
  provenance: "owner-supplied";
  label: typeof OWNER_SUPPLIED_OBSERVATION_LABEL;
  suppliedAt: string;
  actorId: string;
};

/** Qualitative reading. There is no numeric confidence. */
export type OutcomeReading = "consistent" | "different" | "uncertain";

export type OutcomeReview = {
  version: number;
  observationId: string;
  decision: DecisionBinding;
  artefactTitle: string;
  hypothesis: string;
  expectedMetric: string;
  baseline: string;
  observationWindow: string;
  observedResult: string;
  observationLabel: typeof OWNER_SUPPLIED_OBSERVATION_LABEL;
  reading: OutcomeReading;
  uncertainty: string;
  proposedFollowUp: Brief;
  createdAt: string;
  actorId: string;
};

export type FollowUpProposal = {
  reviewVersion: number;
  brief: Brief;
  status: "proposed" | "approved";
  missionId: string | null;
  proposedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
};

export type MissionOrigin = {
  parentMissionId: string;
  reviewVersion: number;
  decision: DecisionBinding;
  artefactTitle: string;
};

export type LearningLink = {
  step: "decision" | "observation" | "review" | "follow_up";
  title: string;
  state: "waiting" | "recorded" | "proposed" | "approved";
  detail: string;
};

export type SpendRecord = {
  key: string;
  units: number;
  reason: string;
};

export type JobState = {
  status: "idle" | "leased" | "failed" | "completed" | "cancelled";
  ownerId: string | null;
  leaseUntil: string | null;
  attempts: number;
  lastError: string | null;
  idempotencyKey: string | null;
};

export type MissionStage =
  "brief" | "evidence" | "alternatives" | "decision" | "artefact" | "exported" | "cancelled";

export type SupervisedMission = {
  id: string;
  workspaceId: string;
  ownerUserId: string;
  version: number;
  stage: MissionStage;
  brief: Brief;
  evidence: EvidenceItem[];
  proposal: Proposal | null;
  approval: ApprovalRecord | null;
  invalidatedApprovals: InvalidatedApproval[];
  artefact: ArtefactPack | null;
  archivedPacks?: Array<{
    recordVersion: number;
    pack: ArtefactPack;
    archivedAt: string;
    reason: string;
  }>;
  /**
   * Sandboxed HTML prototype after Pack (P5). Null until the human gate
   * approves the build. Additive document field — no SQL migration.
   */
  prototype: MissionPrototype | null;
  exportBody: string | null;
  /** Base64 PDF of the same decision pack; optional for older missions. */
  exportPdfBase64: string | null;
  job: JobState;
  usageCeiling: number;
  usageConsumed: number;
  spendRecords: SpendRecord[];
  expectation: OutcomeExpectation | null;
  observation: OutcomeObservation | null;
  reviews: OutcomeReview[];
  followUp: FollowUpProposal | null;
  origin: MissionOrigin | null;
  /** Provided | Web | Combined — disclosed before execution. */
  researchMode: ResearchMode;
  /** Honest gaps when web research was selected but unavailable. */
  researchGaps: string[];
  /**
   * When the post-approval research pass finished (findings and/or honest gaps).
   * Null until plan approval triggers the pass. Additive document field — no SQL migration.
   */
  researchPassCompletedAt: string | null;
  /**
   * Search provider that returned cited findings on the research pass (`tavily` / `exa` / `brave`).
   * Null when the pass ran without a configured provider or returned only gaps.
   * Additive document field — no SQL migration.
   */
  researchProvider: string | null;
  /** Small Available Wave 1 specialist team for this pilot. */
  team: PilotTeamPlan | null;
  /** Persisted task events only — no fake chat or timer theatre. */
  activity: PilotActivityEvent[];
  /**
   * Lightweight product-memory shelf (`wf_projects.id`) for this mission family.
   * Additive document field — null on older missions until attached.
   */
  projectId: string | null;
  updatedAt: string;
};

export type ApprovalClaim = {
  action: string;
  version: number;
  scopeHash: string;
  optionId: string;
};

export const PROGRESS_STEPS = [
  { id: "brief", label: "Objective" },
  { id: "evidence", label: "Evidence" },
  { id: "alternatives", label: "Options" },
  { id: "decision", label: "Decision" },
  { id: "artefact", label: "Approved work" },
  { id: "export", label: "Outcome" },
] as const;

export function spendKey(scope: string): string {
  return `alternatives:${scope}`;
}

export function workspaceAllowsSpend(input: {
  ceiling: number;
  consumed: number;
  cost: number;
  alreadyRecorded: boolean;
}): boolean {
  if (input.alreadyRecorded || input.cost <= 0) return true;
  return input.consumed + input.cost <= input.ceiling;
}

export function stepState(stage: MissionStage, stepIndex: number): "done" | "current" | "upcoming" {
  if (stage === "cancelled") return "upcoming";
  const current =
    stage === "exported" ? PROGRESS_STEPS.length : PROGRESS_STEPS.findIndex((s) => s.id === stage);
  if (stepIndex < current) return "done";
  if (stepIndex === current) return "current";
  return "upcoming";
}

export function nextRequiredAction(mission: SupervisedMission): {
  id: string;
  title: string;
  detail: string;
} {
  if (mission.stage === "cancelled") {
    return {
      id: "cancelled",
      title: "Cancelled",
      detail: "This mission will not run further steps.",
    };
  }
  if (mission.job.status === "failed") {
    return {
      id: "retry",
      title: "Retry the comparison",
      detail: mission.job.lastError ?? "The comparison failed before a usage record was stored.",
    };
  }
  if (mission.job.status === "leased") {
    return {
      id: "recover",
      title: "Comparison in progress",
      detail: mission.job.leaseUntil
        ? `A worker owns this step until ${mission.job.leaseUntil}. After that, recover it. A completed comparison is not charged again.`
        : "A worker owns this step.",
    };
  }
  if (mission.stage === "brief" || (mission.team && !mission.team.approvedAt)) {
    if (mission.team && !mission.team.approvedAt) {
      return {
        id: "approve_plan",
        title: "Approve the PM brief and specialist plan",
        detail:
          "Read the PM brief (plan, rough cost, time, team). Nothing runs until you approve this bounded plan. Specialists research before asking you for more detail.",
      };
    }
    if (mission.evidence.length) {
      return {
        id: "compare",
        title: "Let specialists compare options",
        detail:
          "Research placeholders are already on the record. Add a founder fact only if you have a decision-critical detail; otherwise compare from the research-first register.",
      };
    }
    return {
      id: "evidence",
      title: "Add what only you know (optional)",
      detail:
        "Prefer research over a questionnaire. Add observations only when specialists cannot obtain them.",
    };
  }
  if (mission.stage === "evidence") {
    return {
      id: "compare",
      title: "Compare options",
      detail: mission.researchPassCompletedAt
        ? "Research pass is on the record (findings and/or honest gaps). Review the work scene, then let specialists compare options. Web hits are never invented when a provider is missing."
        : "Review research mode and tools first. One comparison is prepared from the brief and evidence register — including research gaps marked honestly when web tools are unavailable.",
    };
  }
  if (mission.stage === "alternatives") {
    return {
      id: "decide",
      title: "Record your decision",
      detail: "The decision applies to this proposal version and scope only.",
    };
  }
  if (mission.stage === "decision") {
    if (!mission.expectation) {
      return {
        id: "expectation",
        title: "Record what you expect",
        detail:
          "Write the hypothesis, expected metric, baseline and observation window before preparing the pack.",
      };
    }
    return {
      id: "artefact",
      title: "Prepare the decision pack",
      detail:
        "The pack quotes the decision, the other options and how the comparison was produced.",
    };
  }
  if (mission.stage === "artefact") {
    return {
      id: "export",
      title: "Export the pack",
      detail: "The export is stored on the mission. Opening it again does not add a usage record.",
    };
  }
  if (
    mission.exportBody &&
    !mission.prototype &&
    !mission.observation &&
    !mission.reviews.length
  ) {
    return {
      id: "approve_prototype",
      title: "Approve sandboxed HTML prototype",
      detail:
        "Human gate — the UX Prototype Agent drafts a sandboxed HTML artefact only after you approve. Static verify failures stay visible.",
    };
  }
  return learningNext(mission);
}

function learningNext(mission: SupervisedMission): {
  id: string;
  title: string;
  detail: string;
} {
  if (!mission.expectation) {
    return {
      id: "expectation",
      title: "Record what you expect",
      detail:
        "Write the hypothesis, expected metric, baseline and observation window before treating a later result as a review of this decision.",
    };
  }
  if (!mission.observation) {
    return {
      id: "observation",
      title: "Supply the observed result",
      detail: "When you have a genuine result, record it here. DeliverX does not measure it.",
    };
  }
  if (!mission.reviews.length) {
    return {
      id: "review",
      title: "Review expected against observed",
      detail:
        "Keep what you expected beside what you supplied. Saving a review proposes one follow-up and does not start it.",
    };
  }
  if (mission.followUp?.status !== "approved") {
    return {
      id: "approve_follow_up",
      title: "Approve the follow-up mission",
      detail: "The next mission stays a proposal until you approve it.",
    };
  }
  return {
    id: "follow_up_approved",
    title: "Follow-up approved",
    detail:
      "The next mission exists because you approved it. This review history stays on the record.",
  };
}
