import { draftOptions, parseModelOptions } from "./generate";
import {
  assertOutcomeReading,
  assertProseUncertainty,
  expectationLines,
  withLearningDefaults,
} from "./learning";
import {
  LEASE_MS,
  OWNER_SUPPLIED_OBSERVATION_LABEL,
  nextRequiredAction,
  scopeHash,
  spendKey,
  type ApprovalClaim,
  type ApprovalRecord,
  type ArtefactPack,
  type Brief,
  type DecisionBinding,
  type DecisionChoice,
  type EvidenceClassification,
  type EvidenceItem,
  type FollowUpProposal,
  type GenerationResult,
  type JobState,
  type MissionOrigin,
  type OptionDraft,
  type OutcomeExpectation,
  type OutcomeObservation,
  type OutcomeReview,
  type SupervisedMission,
} from "./types";

export class MissionNotFoundError extends Error {
  constructor(message = "Mission not found.") {
    super(message);
    this.name = "MissionNotFoundError";
  }
}

export class MissionConflictError extends Error {
  constructor(message = "The mission changed. Reload and try again.") {
    super(message);
    this.name = "MissionConflictError";
  }
}

export class MissionBusyError extends Error {
  constructor(message = "This comparison is already running.") {
    super(message);
    this.name = "MissionBusyError";
  }
}

export class UsageLimitError extends Error {
  constructor(message = "Usage ceiling reached. This step was not run.") {
    super(message);
    this.name = "UsageLimitError";
  }
}

export class ApprovalMismatchError extends Error {
  constructor(message = "Approval does not match the current proposal action, version and scope.") {
    super(message);
    this.name = "ApprovalMismatchError";
  }
}

export class MissionStoreUnavailableError extends Error {
  constructor(
    message = "Supervised mission storage is not available. Migration drizzle/migrations/0020_psi_supervised_missions.sql is committed and has not been applied to this database.",
  ) {
    super(message);
    this.name = "MissionStoreUnavailableError";
  }
}

export type MissionStore = {
  get(workspaceId: string, id: string): Promise<SupervisedMission | null>;
  list(workspaceId: string): Promise<SupervisedMission[]>;
  save(mission: SupervisedMission, expectedVersion: number): Promise<SupervisedMission>;
  saveFollowUp(
    parent: SupervisedMission,
    expectedVersion: number,
    child: SupervisedMission,
  ): Promise<SupervisedMission>;
};

export type ComparisonGenerator = {
  cost: 0 | 1;
  run: (mission: SupervisedMission) => Promise<GenerationResult>;
};

const CLASSIFICATIONS = new Set<EvidenceClassification>(["supplied", "assumption", "gap"]);

function idleJob(attempts = 0): JobState {
  return {
    status: "idle",
    ownerId: null,
    leaseUntil: null,
    attempts,
    lastError: null,
    idempotencyKey: null,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requireText(value: string, label: string, min: number, max: number): string {
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new Error(`${label} must be between ${min} and ${max} characters.`);
  }
  return text;
}

export function normaliseBrief(input: Brief): Brief {
  return {
    question: requireText(input.question, "Question", 8, 2000),
    audience: requireText(input.audience, "Audience", 2, 400),
    outcome: requireText(input.outcome, "Outcome", 8, 2000),
    constraints: input.constraints.trim().slice(0, 2000),
  };
}

export function normaliseEvidence(
  items: Array<{ statement: string; source: string; classification: string }>,
): EvidenceItem[] {
  if (items.length < 1 || items.length > 20) {
    throw new Error("Add between 1 and 20 evidence items.");
  }
  return items.map((item, index) => {
    if (!CLASSIFICATIONS.has(item.classification as EvidenceClassification)) {
      throw new Error("Evidence classification must be supplied, assumption or gap.");
    }
    const classification = item.classification as EvidenceClassification;
    const statement = requireText(item.statement, "Evidence statement", 3, 2000);
    const source = item.source.trim().slice(0, 500);
    if (classification === "supplied" && source.length < 2) {
      throw new Error("Supplied evidence needs a source.");
    }
    return { id: `e${index + 1}`, statement, source, classification };
  });
}

export function assertApprovalBinding(
  proposal: SupervisedMission["proposal"],
  claim: ApprovalClaim,
): void {
  if (!proposal) throw new ApprovalMismatchError("There is no current proposal to approve.");
  if (
    claim.action !== proposal.action ||
    claim.version !== proposal.version ||
    claim.scopeHash !== proposal.scopeHash
  ) {
    throw new ApprovalMismatchError(
      "Approval does not match the current proposal action, version and scope.",
    );
  }
  if (!proposal.options.some((option) => option.id === claim.optionId)) {
    throw new ApprovalMismatchError("That option is not in the current proposal.");
  }
}

function invalidateForScope(mission: SupervisedMission, hash: string): SupervisedMission {
  if (!mission.proposal || mission.proposal.scopeHash === hash) return mission;
  const invalidated = mission.approval
    ? [
        ...mission.invalidatedApprovals,
        {
          ...mission.approval,
          reason: "The brief or evidence changed, so this approval no longer matches the proposal.",
        },
      ]
    : mission.invalidatedApprovals;
  return {
    ...mission,
    proposal: null,
    approval: null,
    invalidatedApprovals: invalidated,
    artefact: null,
    exportBody: null,
    expectation: null,
    job: idleJob(mission.job.attempts),
    stage: "evidence",
  };
}

function decisionBinding(approval: ApprovalRecord): DecisionBinding {
  return {
    action: approval.action,
    version: approval.version,
    scopeHash: approval.scopeHash,
    optionId: approval.optionId,
    decidedAt: approval.decidedAt,
  };
}

function chosenOption(mission: SupervisedMission): OptionDraft {
  const option = mission.proposal?.options.find((item) => item.id === mission.approval?.optionId);
  if (!mission.proposal || !mission.approval || !option) {
    throw new ApprovalMismatchError("The recorded decision does not match the current proposal.");
  }
  assertApprovalBinding(mission.proposal, mission.approval);
  return option;
}

function buildPack(mission: SupervisedMission): ArtefactPack {
  const option = chosenOption(mission);
  const proposal = mission.proposal;
  const approval = mission.approval;
  if (!proposal || !approval) throw new ApprovalMismatchError("A decision is required first.");
  const others = proposal.options.filter((item) => item.id !== option.id);
  const evidenceLines = mission.evidence
    .map(
      (item) =>
        `- ${item.id} (${item.classification}): ${item.statement}${item.source ? ` Source: ${item.source}` : ""}`,
    )
    .join("\n");
  const alternativeLines = others.map((item) => `- ${item.title} — ${item.tradeoff}`).join("\n");
  const inconclusive = approval.choice === "request_more_evidence";
  const provenance = [
    `Generation: ${proposal.generation.label}`,
    proposal.generation.provider ? `Provider: ${proposal.generation.provider}` : "",
    proposal.generation.model ? `Model: ${proposal.generation.model}` : "",
    proposal.generation.citations.length
      ? `Citations: ${proposal.generation.citations.join(", ")}`
      : "Citations: none recorded",
    proposal.generation.gaps.length
      ? `Gaps: ${proposal.generation.gaps.join(" | ")}`
      : "Gaps: none recorded",
    `Proposal action ${proposal.action}, version ${proposal.version}, scope ${proposal.scopeHash}.`,
    "Human decision recorded by the workspace owner. This pack is not externally attested.",
    "No observed product result is claimed in this pack.",
  ]
    .filter(Boolean)
    .join("\n");
  const decisionBrief = [
    `# Decision brief`,
    ``,
    `Question: ${mission.brief.question}`,
    `Audience: ${mission.brief.audience}`,
    `Intended outcome: ${mission.brief.outcome}`,
    `Constraints: ${mission.brief.constraints || "None recorded."}`,
    ``,
    `## Evidence`,
    evidenceLines,
    ``,
    `## Decision`,
    inconclusive
      ? `The owner requested more evidence before a product change. Selected hold: ${option.title}`
      : `The owner accepted: ${option.title}`,
    approval.note ? `Note: ${approval.note}` : "",
    ``,
    `## Alternatives that remain on the record`,
    alternativeLines || "- No other option was recorded.",
    ``,
    `## Provenance`,
    provenance,
  ]
    .filter((line) => line !== "")
    .join("\n");
  const experimentBrief = [
    `# Experiment brief`,
    ``,
    inconclusive
      ? `Proposed change: do not change the product until the missing evidence is supplied.`
      : `Proposed change: ${option.title}`,
    ...expectationLines(mission, option.tradeoff),
    `Review question: ${mission.brief.question}`,
    `This expected result is a hypothesis. It is not an observed outcome.`,
  ].join("\n");
  return {
    title: inconclusive ? "Evidence hold and research brief" : "Decision and experiment brief",
    decisionBrief,
    experimentBrief,
    provenance,
  };
}

function exportBody(mission: SupervisedMission, pack: ArtefactPack): string {
  return [
    pack.decisionBrief,
    "",
    pack.experimentBrief,
    "",
    "## Export note",
    "This file is the stored mission export. Reloading it does not create another usage record.",
    pack.provenance,
  ].join("\n");
}

export class MemoryStore implements MissionStore {
  private readonly rows = new Map<string, SupervisedMission>();

  async get(workspaceId: string, id: string): Promise<SupervisedMission | null> {
    const row = this.rows.get(id);
    if (!row || row.workspaceId !== workspaceId) return null;
    return clone(withLearningDefaults(row));
  }

  async list(workspaceId: string): Promise<SupervisedMission[]> {
    return [...this.rows.values()]
      .filter((row) => row.workspaceId === workspaceId)
      .map((row) => clone(withLearningDefaults(row)));
  }

  async saveFollowUp(
    parent: SupervisedMission,
    expectedVersion: number,
    child: SupervisedMission,
  ): Promise<SupervisedMission> {
    const current = this.rows.get(parent.id);
    if (
      !current ||
      current.workspaceId !== parent.workspaceId ||
      current.version !== expectedVersion ||
      this.rows.has(child.id) ||
      child.workspaceId !== parent.workspaceId
    )
      throw new MissionConflictError();
    // No await between validation and the two writes: memory-test equivalent of one transaction.
    this.rows.set(child.id, clone(child));
    this.rows.set(parent.id, clone(parent));
    return clone(parent);
  }

  async save(mission: SupervisedMission, expectedVersion: number): Promise<SupervisedMission> {
    const existing = this.rows.get(mission.id);
    if (existing && existing.workspaceId !== mission.workspaceId) {
      throw new MissionNotFoundError();
    }
    if (existing && existing.version !== expectedVersion) throw new MissionConflictError();
    if (!existing && expectedVersion !== 0) throw new MissionConflictError();
    const stored = clone(withLearningDefaults(mission));
    this.rows.set(stored.id, stored);
    return clone(stored);
  }
}

export function missionFromRow(
  row: Record<string, unknown> | null,
  workspaceId: string,
): SupervisedMission | null {
  if (!row) return null;
  if (String(row["workspace_id"] ?? "") !== workspaceId) return null;
  const raw = row["document"];
  const document =
    typeof raw === "string" ? (JSON.parse(raw) as SupervisedMission) : (raw as SupervisedMission);
  if (!document || typeof document !== "object") return null;
  return withLearningDefaults({
    ...document,
    id: String(row["id"]),
    workspaceId,
    version: Number(row["version"]),
    usageCeiling: Number(row["usage_ceiling"]),
    usageConsumed: Number(row["usage_consumed"]),
  });
}

export class SupervisedMissionService {
  constructor(private readonly store: MissionStore) {}

  async get(workspaceId: string, id: string): Promise<SupervisedMission | null> {
    return this.store.get(workspaceId, id);
  }

  async list(workspaceId: string): Promise<SupervisedMission[]> {
    return this.store.list(workspaceId);
  }

  async create(input: {
    id: string;
    workspaceId: string;
    ownerUserId: string;
    brief: Brief;
    usageCeiling: number;
    nowMs: number;
    origin?: MissionOrigin | null;
  }): Promise<SupervisedMission> {
    return this.store.save(this.initialMission(input), 0);
  }

  private initialMission(input: {
    id: string;
    workspaceId: string;
    ownerUserId: string;
    brief: Brief;
    usageCeiling: number;
    nowMs: number;
    origin?: MissionOrigin | null;
  }): SupervisedMission {
    if (!Number.isInteger(input.usageCeiling) || input.usageCeiling < 0) {
      throw new Error("Usage ceiling must be a whole number.");
    }
    const mission: SupervisedMission = {
      id: input.id,
      workspaceId: input.workspaceId,
      ownerUserId: input.ownerUserId,
      version: 1,
      stage: "brief",
      brief: normaliseBrief(input.brief),
      evidence: [],
      proposal: null,
      approval: null,
      invalidatedApprovals: [],
      artefact: null,
      exportBody: null,
      job: idleJob(),
      usageCeiling: input.usageCeiling,
      usageConsumed: 0,
      spendRecords: [],
      expectation: null,
      observation: null,
      reviews: [],
      followUp: null,
      origin: input.origin ?? null,
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    return mission;
  }

  async saveEvidence(input: {
    workspaceId: string;
    id: string;
    items: Array<{ statement: string; source: string; classification: string }>;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    this.assertMutable(current);
    const evidence = normaliseEvidence(input.items);
    const hashed = invalidateForScope({ ...current, evidence }, scopeHash(current.brief, evidence));
    const next: SupervisedMission = {
      ...hashed,
      evidence,
      version: current.version + 1,
      stage: hashed.proposal ? hashed.stage : "evidence",
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    if (!hashed.proposal) next.stage = "evidence";
    return this.store.save(next, current.version);
  }

  async reviseBrief(input: {
    workspaceId: string;
    id: string;
    brief: Brief;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    this.assertMutable(current);
    const brief = normaliseBrief(input.brief);
    const hashed = invalidateForScope({ ...current, brief }, scopeHash(brief, current.evidence));
    const next: SupervisedMission = {
      ...hashed,
      brief,
      version: current.version + 1,
      stage:
        current.evidence.length && hashed.proposal
          ? hashed.stage
          : current.evidence.length
            ? "evidence"
            : "brief",
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    return this.store.save(next, current.version);
  }

  async cancel(input: {
    workspaceId: string;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") return current;
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      stage: "cancelled",
      job: {
        ...current.job,
        status: "cancelled",
        ownerId: null,
        leaseUntil: null,
      },
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    return this.store.save(next, current.version);
  }

  async runAlternatives(input: {
    workspaceId: string;
    id: string;
    workerId: string;
    nowMs: number;
    generator: ComparisonGenerator;
  }): Promise<{ mission: SupervisedMission; chargedUnits: number }> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled" || current.job.status === "cancelled") {
      throw new Error("Mission is cancelled.");
    }
    if (!current.evidence.length)
      throw new Error("Add supplied evidence before comparing options.");
    const hash = scopeHash(current.brief, current.evidence);
    const key = spendKey(hash);
    if (
      current.proposal?.scopeHash === hash &&
      current.spendRecords.some((row) => row.key === key)
    ) {
      return { mission: current, chargedUnits: 0 };
    }
    if (
      current.job.status === "leased" &&
      current.job.ownerId &&
      current.job.ownerId !== input.workerId &&
      Date.parse(current.job.leaseUntil ?? "") > input.nowMs
    ) {
      throw new MissionBusyError(
        "This comparison is already running. Reload to see the result. A second run does not add another usage record.",
      );
    }
    const units = input.generator.cost;
    if (current.usageConsumed + units > current.usageCeiling) {
      throw new UsageLimitError();
    }

    const leased: SupervisedMission = {
      ...current,
      version: current.version + 1,
      job: {
        status: "leased",
        ownerId: input.workerId,
        leaseUntil: new Date(input.nowMs + LEASE_MS).toISOString(),
        attempts: current.job.attempts + 1,
        lastError: null,
        idempotencyKey: key,
      },
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    await this.store.save(leased, current.version);

    try {
      const generation = await input.generator.run(leased);
      const fresh = await this.must(input.workspaceId, input.id);
      if (fresh.stage === "cancelled") throw new Error("Mission was cancelled.");
      if (scopeHash(fresh.brief, fresh.evidence) !== hash)
        throw new MissionConflictError(
          "The brief or evidence changed during generation. The result cannot approve the new scope.",
        );
      if (fresh.job.ownerId !== input.workerId || fresh.job.status !== "leased") {
        throw new MissionConflictError("Lease recovered by another worker.");
      }
      if (fresh.proposal?.scopeHash === hash && fresh.spendRecords.some((row) => row.key === key)) {
        return { mission: fresh, chargedUnits: 0 };
      }
      const prepared = this.prepareComparison(fresh, generation);
      const charged = prepared.generation.ran ? units : 0;
      if (fresh.usageConsumed + charged > fresh.usageCeiling) throw new UsageLimitError();
      const committed: SupervisedMission = {
        ...fresh,
        version: fresh.version + 1,
        stage: "alternatives",
        proposal: {
          action: "compare_options",
          version: fresh.version + 1,
          scopeHash: hash,
          options: prepared.options,
          generation: prepared.generation,
        },
        approval: null,
        artefact: null,
        exportBody: null,
        job: {
          status: "completed",
          ownerId: input.workerId,
          leaseUntil: null,
          attempts: fresh.job.attempts,
          lastError: null,
          idempotencyKey: key,
        },
        usageConsumed: fresh.usageConsumed + charged,
        spendRecords: [
          ...fresh.spendRecords,
          {
            key,
            units: charged,
            reason: prepared.generation.ran
              ? "One comparison generation"
              : prepared.generation.label,
          },
        ],
        updatedAt: new Date(input.nowMs).toISOString(),
      };
      const saved = await this.store.save(committed, fresh.version);
      return { mission: saved, chargedUnits: charged };
    } catch (error) {
      const fresh = await this.store.get(input.workspaceId, input.id);
      if (fresh && fresh.job.ownerId === input.workerId && fresh.job.status === "leased") {
        const failed: SupervisedMission = {
          ...fresh,
          version: fresh.version + 1,
          job: {
            ...fresh.job,
            status: "failed",
            ownerId: null,
            leaseUntil: null,
            lastError: error instanceof Error ? error.message : "Comparison failed.",
          },
          updatedAt: new Date(input.nowMs).toISOString(),
        };
        await this.store.save(failed, fresh.version);
      }
      throw error instanceof Error ? error : new Error("Comparison failed.");
    }
  }

  async decide(input: {
    workspaceId: string;
    id: string;
    claim: ApprovalClaim;
    choice: DecisionChoice;
    note: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    this.assertOpen(current);
    assertApprovalBinding(current.proposal, input.claim);
    if (current.artefact)
      throw new Error("Prepare a new comparison before changing this decision.");
    if (
      current.approval &&
      current.approval.optionId === input.claim.optionId &&
      current.approval.choice === input.choice &&
      current.approval.scopeHash === input.claim.scopeHash &&
      current.approval.version === input.claim.version
    ) {
      return current;
    }
    const approval: ApprovalRecord = {
      action: "compare_options",
      version: input.claim.version,
      scopeHash: input.claim.scopeHash,
      optionId: input.claim.optionId,
      choice: input.choice,
      note: input.note.trim().slice(0, 2000),
      actorId: input.actorId,
      decidedAt: new Date(input.nowMs).toISOString(),
    };
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      stage: "decision",
      approval,
      expectation: null,
      artefact: null,
      exportBody: null,
      updatedAt: approval.decidedAt,
    };
    return this.store.save(next, current.version);
  }

  async prepareArtefact(input: {
    workspaceId: string;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.artefact && current.stage !== "cancelled") return current;
    this.assertOpen(current);
    const pack = buildPack(current);
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      stage: "artefact",
      artefact: pack,
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    return this.store.save(next, current.version);
  }

  async exportMission(input: {
    workspaceId: string;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (current.exportBody) return current;
    if (!current.artefact) throw new Error("Prepare the decision pack before export.");
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      stage: "exported",
      exportBody: exportBody(current, current.artefact),
      updatedAt: new Date(input.nowMs).toISOString(),
    };
    return this.store.save(next, current.version);
  }

  async recordExpectation(input: {
    workspaceId: string;
    id: string;
    hypothesis: string;
    expectedMetric: string;
    baseline: string;
    observationWindow: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (!current.approval) throw new Error("Record a decision before the measurement plan.");
    if (current.observation || current.reviews.length > 0) {
      throw new Error("The measurement plan stays as it was when the result was supplied.");
    }
    const recordedAt = new Date(input.nowMs).toISOString();
    const expectation: OutcomeExpectation = {
      hypothesis: requireText(input.hypothesis, "Hypothesis", 8, 2000),
      expectedMetric: requireText(input.expectedMetric, "Expected metric", 3, 500),
      baseline: requireText(input.baseline, "Baseline", 3, 500),
      observationWindow: requireText(input.observationWindow, "Observation window", 3, 500),
      recordedAt,
      actorId: input.actorId,
      decision: decisionBinding(current.approval),
    };
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      expectation,
      updatedAt: recordedAt,
    };
    return this.store.save(next, current.version);
  }

  async recordObservation(input: {
    workspaceId: string;
    id: string;
    result: string;
    evidence: string;
    source: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (!current.expectation) throw new Error("Record the measurement plan before a result.");
    if (!current.exportBody || !current.artefact || !current.approval) {
      throw new Error("Export the decision pack before recording a result.");
    }
    const suppliedAt = new Date(input.nowMs).toISOString();
    const observation: OutcomeObservation = {
      id: `obs-${input.nowMs}`,
      result: requireText(input.result, "Observed result", 3, 2000),
      evidence: requireText(input.evidence, "Observation evidence", 3, 2000),
      source: requireText(input.source, "Observation source", 2, 500),
      provenance: "owner-supplied",
      label: OWNER_SUPPLIED_OBSERVATION_LABEL,
      suppliedAt,
      actorId: input.actorId,
    };
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      observation,
      updatedAt: suppliedAt,
    };
    return this.store.save(next, current.version);
  }

  async recordReview(input: {
    workspaceId: string;
    id: string;
    reading: string;
    uncertainty: string;
    followUp: Brief;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (!current.expectation || !current.observation || !current.approval || !current.artefact) {
      throw new Error("A review needs the decision, the pack and an owner-supplied result.");
    }
    const reading = assertOutcomeReading(input.reading);
    const uncertainty = assertProseUncertainty(input.uncertainty);
    const proposedFollowUp = normaliseBrief(input.followUp);
    const createdAt = new Date(input.nowMs).toISOString();
    const review: OutcomeReview = {
      version: (current.reviews.at(-1)?.version ?? 0) + 1,
      observationId: current.observation.id,
      decision: decisionBinding(current.approval),
      artefactTitle: current.artefact.title,
      hypothesis: current.expectation.hypothesis,
      expectedMetric: current.expectation.expectedMetric,
      baseline: current.expectation.baseline,
      observationWindow: current.expectation.observationWindow,
      observedResult: current.observation.result,
      observationLabel: current.observation.label,
      reading,
      uncertainty,
      proposedFollowUp,
      createdAt,
      actorId: input.actorId,
    };
    const followUp: FollowUpProposal =
      current.followUp?.status === "approved"
        ? current.followUp
        : {
            reviewVersion: review.version,
            brief: proposedFollowUp,
            status: "proposed",
            missionId: null,
            proposedAt: createdAt,
            approvedAt: null,
            approvedBy: null,
          };
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      reviews: [...current.reviews, review],
      followUp,
      updatedAt: createdAt,
    };
    return this.store.save(next, current.version);
  }

  async approveFollowUp(input: {
    workspaceId: string;
    id: string;
    actorId: string;
    followUpMissionId: string;
    usageCeiling: number;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (current.followUp?.status === "approved" && current.followUp.missionId) {
      const existing = await this.store.get(input.workspaceId, current.followUp.missionId);
      if (!existing) throw new MissionNotFoundError();
      return current;
    }
    if (!current.followUp || current.followUp.status !== "proposed" || current.followUp.missionId) {
      throw new Error("Record a review before approving a follow-up mission.");
    }
    const latest = current.reviews.at(-1);
    if (
      !latest ||
      latest.version !== current.followUp.reviewVersion ||
      !current.approval ||
      !current.artefact
    ) {
      throw new Error("The follow-up proposal does not match the latest review.");
    }
    const child = this.initialMission({
      id: input.followUpMissionId,
      workspaceId: input.workspaceId,
      ownerUserId: input.actorId,
      brief: current.followUp.brief,
      usageCeiling: input.usageCeiling,
      nowMs: input.nowMs,
      origin: {
        parentMissionId: current.id,
        reviewVersion: latest.version,
        decision: decisionBinding(current.approval),
        artefactTitle: current.artefact.title,
      },
    });
    const approvedAt = new Date(input.nowMs).toISOString();
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      followUp: {
        ...current.followUp,
        status: "approved",
        missionId: child.id,
        approvedAt,
        approvedBy: input.actorId,
      },
      updatedAt: approvedAt,
    };
    return this.store.saveFollowUp(next, current.version, child);
  }

  private prepareComparison(
    mission: SupervisedMission,
    generation: GenerationResult,
  ): { options: OptionDraft[]; generation: GenerationResult } {
    if (!generation.ran) {
      return {
        options: draftOptions({ question: mission.brief.question, evidence: mission.evidence }),
        generation,
      };
    }
    const parsed = parseModelOptions(generation.output, mission.evidence);
    return {
      options: parsed.options,
      generation: {
        ...generation,
        citations: parsed.citations,
        gaps: parsed.gaps,
        output: JSON.stringify(parsed),
      },
    };
  }

  private async must(workspaceId: string, id: string): Promise<SupervisedMission> {
    const row = await this.store.get(workspaceId, id);
    if (!row) throw new MissionNotFoundError();
    return row;
  }

  private assertOpen(mission: SupervisedMission): void {
    if (mission.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (mission.stage === "exported") throw new Error("This mission is already exported.");
  }

  private assertMutable(mission: SupervisedMission): void {
    this.assertOpen(mission);
    if (mission.observation || mission.reviews.length > 0 || mission.followUp) {
      throw new Error(
        "The outcome record cites this decision, so the brief and evidence stay fixed.",
      );
    }
  }
}

export { nextRequiredAction };
