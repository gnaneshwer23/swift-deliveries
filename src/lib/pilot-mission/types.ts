import { createHash } from "node:crypto";

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
  exportBody: string | null;
  job: JobState;
  usageCeiling: number;
  usageConsumed: number;
  spendRecords: SpendRecord[];
  updatedAt: string;
};

export type ApprovalClaim = {
  action: string;
  version: number;
  scopeHash: string;
  optionId: string;
};

export const PROGRESS_STEPS = [
  { id: "brief", label: "Brief" },
  { id: "evidence", label: "Evidence" },
  { id: "alternatives", label: "Alternatives" },
  { id: "decision", label: "Decision" },
  { id: "artefact", label: "Artefact" },
  { id: "export", label: "Export" },
] as const;

export function spendKey(scope: string): string {
  return `alternatives:${scope}`;
}

export function scopeHash(brief: Brief, evidence: EvidenceItem[]): string {
  const payload = JSON.stringify({
    question: brief.question,
    audience: brief.audience,
    outcome: brief.outcome,
    constraints: brief.constraints,
    evidence: evidence.map((item) => ({
      id: item.id,
      statement: item.statement,
      source: item.source,
      classification: item.classification,
    })),
  });
  return createHash("sha256").update(payload).digest("hex");
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
  if (mission.stage === "brief") {
    return {
      id: "evidence",
      title: "Add supplied evidence",
      detail: "Add the observations, assumptions and gaps this decision is allowed to use.",
    };
  }
  if (mission.stage === "evidence") {
    return {
      id: "compare",
      title: "Compare options",
      detail: "One comparison is prepared from the saved brief and evidence.",
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
  return {
    id: "done",
    title: "Exported",
    detail: "Reload keeps this export. No further usage is recorded for it.",
  };
}
