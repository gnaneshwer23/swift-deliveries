import { scopeHash } from "./scope.server";
import { draftOptions, parseModelOptions } from "./generate";
import {
  assertOutcomeReading,
  assertProseUncertainty,
  expectationLines,
  withLearningDefaults,
} from "./learning";
import { buildDecisionPackMarkdown, buildDecisionPackPdf, pdfToBase64 } from "./decision-pack";
import { isResearchMode, planResearchMode, type ResearchMode } from "./research-mode";
import { estimateStaffingBand, expandOneLinerBrief, seedResearchEvidence } from "./pm-brief";
import { RESEARCH_PASS_JOB_KEY, runResearchPass } from "./research-pass";
import { buildMissionPrototype } from "./prototype";
import { activityEvent, buildPilotTeamPlan, syncTeamWithMission } from "./specialist-team";
import {
  applyEvidenceRegisterCollaboration,
  applyOptionsComparedCollaboration,
  applyRecommendationCollaboration,
  applyResearchPassCollaboration,
  clearStaleRecommendation,
  collaborationRecordForUpdate,
  initTeamCollaboration,
} from "./team-collaboration";
import {
  LEASE_MS,
  OWNER_SUPPLIED_OBSERVATION_LABEL,
  nextRequiredAction,
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
import { applyCaseStepGate, buildCaseRoom, type CaseStepGate } from "./case-room";
import { buildContinuationPlan } from "./continuation-plan";
import {
  deriveAgentRecommendation,
  isInconclusivePath,
  normalizeDecisionChoice,
  pathAgreesWithRecommendation,
} from "./verdict";
import { saveStudioMeta, type StudioMeta } from "./studio-meta";
import {
  MEETING_NOTES_MAX_CHARS,
  MEETING_READER_LABEL,
  MEETINGS_MAX,
  readMeetingNotes,
  type MeetingNote,
} from "./meeting-notes";
import { saveWatchtowerConfig, type WatchtowerFrequency } from "./watchtower";

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

function archivePack(mission: SupervisedMission, reason: string, nowMs: number) {
  const history = mission.archivedPacks ?? [];
  return mission.artefact
    ? [
        ...history,
        {
          recordVersion: mission.version,
          pack: mission.artefact,
          archivedAt: new Date(nowMs).toISOString(),
          reason,
        },
      ]
    : history;
}

export function normaliseBrief(input: Brief): Brief {
  const expanded = expandOneLinerBrief(input);
  return {
    question: requireText(expanded.question, "Question", 8, 2000),
    audience: requireText(expanded.audience, "Audience", 2, 400),
    outcome: requireText(expanded.outcome, "Outcome", 8, 2000),
    constraints: expanded.constraints.trim().slice(0, 2000),
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

function clearTeamPlanApprovalAfterBriefChange(
  mission: SupervisedMission,
  nowMs: number,
): SupervisedMission {
  if (!mission.team?.approvedAt) return mission;
  const at = new Date(nowMs).toISOString();
  return {
    ...mission,
    team: { ...mission.team, approvedAt: null, approvedBy: null },
    researchPassQueuedAt: null,
    researchPassCompletedAt: null,
    researchProvider: null,
    workerLink: null,
    job: idleJob(mission.job.attempts),
    activity: pushActivity(
      mission,
      activityEvent({
        at,
        taskKey: "frame_objective",
        kind: "plan.approval_stale",
        summary:
          "The brief changed after plan approval. Review the PM understanding and approve again before research runs.",
        actor: "system",
      }),
    ),
  };
}

function invalidateForScope(
  mission: SupervisedMission,
  hash: string,
  nowMs: number,
): SupervisedMission {
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
    archivedPacks: archivePack(mission, "Brief or evidence scope changed", nowMs),
    artefact: null,
    prototype: null,
    exportBody: null,
    exportPdfBase64: null,
    expectation: null,
    job: idleJob(mission.job.attempts),
    stage: "evidence",
  };
}

function withSyncedTeam(mission: SupervisedMission): SupervisedMission {
  if (!mission.team) return mission;
  return { ...mission, team: syncTeamWithMission(mission.team, mission) };
}

function pushActivity(
  mission: SupervisedMission,
  ...events: Array<ReturnType<typeof activityEvent>>
): PilotActivitySlice {
  return [...(mission.activity ?? []), ...events].slice(-200);
}

type PilotActivitySlice = SupervisedMission["activity"];

function assertPlanApproved(mission: SupervisedMission): void {
  if (mission.team && !mission.team.approvedAt) {
    throw new Error("Approve the specialist plan before this step.");
  }
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
  const humanPath = normalizeDecisionChoice(approval.choice);
  const inconclusive = isInconclusivePath(humanPath);
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
    approval.agentRecommendation
      ? `Agent recommendation: ${approval.agentRecommendation}${approval.recommendationRationale ? ` — ${approval.recommendationRationale}` : ""}`
      : "",
    `Human next path: ${humanPath}${
      approval.disagreesWithRecommendation
        ? " (founder-requested path differs from the recommendation; recommendation remains on the record)"
        : ""
    }`,
    inconclusive
      ? `Inconclusive / hold path relative to option: ${option.title}`
      : `Selected option for the authorised path: ${option.title}`,
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

function exportBodies(mission: SupervisedMission): {
  exportBody: string;
  exportPdfBase64: string;
} {
  const synced = withSyncedTeam(mission);
  const markdown = buildDecisionPackMarkdown(synced);
  return {
    exportBody: markdown,
    exportPdfBase64: pdfToBase64(buildDecisionPackPdf(markdown)),
  };
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
    researchMode?: ResearchMode;
    /** Optional product-memory project for this mission family. */
    projectId?: string | null;
    /** Optional founder paste at intake — stored as supplied evidence (no file upload). */
    intakeEvidenceNote?: string | null;
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
    researchMode?: ResearchMode;
    projectId?: string | null;
    intakeEvidenceNote?: string | null;
  }): SupervisedMission {
    if (!Number.isInteger(input.usageCeiling) || input.usageCeiling < 0) {
      throw new Error("Usage ceiling must be a whole number.");
    }
    const at = new Date(input.nowMs).toISOString();
    const researchMode = input.researchMode ?? "combined";
    if (!isResearchMode(researchMode)) throw new Error("Unknown research mode.");
    const researchPlan = planResearchMode(researchMode);
    const brief = normaliseBrief(input.brief);
    const staffing = estimateStaffingBand(brief.question);
    const team = buildPilotTeamPlan({ band: staffing.band });
    let evidence = seedResearchEvidence(researchMode);
    const intakeNote = input.intakeEvidenceNote?.trim();
    if (intakeNote && intakeNote.length >= 3) {
      const note = intakeNote.slice(0, 2000);
      evidence = [
        ...evidence,
        {
          id: `e-intake-${input.nowMs}`,
          statement: note,
          source: "Founder intake paste (text only — no file upload or OCR)",
          classification: "supplied" as const,
        },
      ];
    }
    const initiating =
      team.tasks.find((t) => t.key === "frame_objective")?.ownerLabel ?? "Problem-Framing Agent";
    const mission: SupervisedMission = {
      id: input.id,
      workspaceId: input.workspaceId,
      ownerUserId: input.ownerUserId,
      version: 1,
      stage: "brief",
      brief,
      evidence,
      proposal: null,
      approval: null,
      invalidatedApprovals: [],
      artefact: null,
      prototype: null,
      exportBody: null,
      exportPdfBase64: null,
      job: idleJob(),
      usageCeiling: input.usageCeiling,
      usageConsumed: 0,
      spendRecords: [],
      expectation: null,
      observation: null,
      reviews: [],
      followUp: null,
      origin: input.origin ?? null,
      researchMode,
      researchGaps: researchPlan.externalGaps,
      researchPassCompletedAt: null,
      researchPassQueuedAt: null,
      researchProvider: null,
      team,
      continuationPlan: null,
      caseRoom: null,
      watchtower: null,
      projectId: input.projectId ?? null,
      teamCollaboration: initTeamCollaboration(team, at),
      activity: [
        activityEvent({
          at,
          taskKey: null,
          kind: "mission.created",
          summary: `One-liner case received. ${initiating} is preparing the PM brief and a bounded specialist plan (${team.capabilityIds.length} Available roles, band ${staffing.band}). Research mode: ${researchPlan.label}.`,
          actor: "human",
        }),
        activityEvent({
          at,
          taskKey: "frame_objective",
          kind: "pm_brief.drafted",
          summary: `${initiating} drafted the PM brief: plan, rough cost, time and team (${team.capabilityIds.length} specialists, band ${staffing.band}) before heavy execution. Research placeholders seeded so specialists are not blocked on a questionnaire.`,
          actor: team.tasks.find((t) => t.key === "frame_objective")?.capabilityId ?? "DX-002",
        }),
        activityEvent({
          at,
          taskKey: null,
          kind: "plan.proposed",
          summary: "Bounded specialist plan awaits approval. No specialist work has started.",
          actor: "system",
        }),
      ],
      updatedAt: at,
    };
    return withSyncedTeam(mission);
  }

  async approvePlan(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    actorId: string;
    nowMs: number;
    /** Test seam — production uses the real search provider resolver. */
    search?: Parameters<typeof runResearchPass>[0]["search"];
    env?: Record<string, string | undefined>;
    /** When true, persist approval + queue only (research pass runs via worker or mission reload). */
    deferResearchPass?: boolean;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertMutable(current);
    this.assertNotPaused(current);
    if (!current.team) throw new Error("This mission has no specialist plan to approve.");
    if (current.team.approvedAt) return current;
    const at = new Date(input.nowMs).toISOString();
    const team = {
      ...current.team,
      approvedAt: at,
      approvedBy: input.actorId,
    };
    const approvedBase: SupervisedMission = {
      ...current,
      version: current.version + 1,
      // Soft-seeded evidence advances to the evidence stage; research pass runs next.
      stage: current.evidence.length
        ? current.stage === "brief"
          ? "evidence"
          : current.stage
        : "brief",
      team,
      researchPassQueuedAt: at,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: "frame_objective",
          kind: "plan.approved",
          summary:
            "You approved the specialist plan. A research / work pass is queued from persisted events.",
          actor: "human",
        }),
        activityEvent({
          at,
          taskKey: "register_evidence",
          kind: "research.pass.queued",
          summary:
            "Research pass queued. It can finish on reload or the scheduled worker — not only while this browser tab stays open.",
          actor: "system",
        }),
      ),
      updatedAt: at,
    };

    const queued = await this.store.save(approvedBase, current.version);
    if (input.deferResearchPass) return queued;
    return this.runQueuedResearchPass({
      workspaceId: input.workspaceId,
      id: input.id,
      workerId: input.actorId,
      nowMs: input.nowMs,
      ...(input.env ? { env: input.env } : {}),
      ...(input.search ? { search: input.search } : {}),
    });
  }

  /** Run a persisted post-approval research pass (lease + idempotent job key). */
  async runQueuedResearchPass(input: {
    workspaceId: string;
    id: string;
    workerId: string;
    nowMs: number;
    search?: Parameters<typeof runResearchPass>[0]["search"];
    env?: Record<string, string | undefined>;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (!current.researchPassQueuedAt || current.researchPassCompletedAt) return current;
    if (!current.team?.approvedAt) return current;

    if (
      current.job.status === "leased" &&
      current.job.idempotencyKey === RESEARCH_PASS_JOB_KEY &&
      current.job.ownerId &&
      current.job.ownerId !== input.workerId &&
      Date.parse(current.job.leaseUntil ?? "") > input.nowMs
    ) {
      return current;
    }

    const at = new Date(input.nowMs).toISOString();
    const leased: SupervisedMission = {
      ...current,
      version: current.version + 1,
      job: {
        status: "leased",
        ownerId: input.workerId,
        leaseUntil: new Date(input.nowMs + LEASE_MS).toISOString(),
        attempts: current.job.attempts + 1,
        lastError: null,
        idempotencyKey: RESEARCH_PASS_JOB_KEY,
      },
      updatedAt: at,
    };
    await this.store.save(leased, current.version);

    try {
      const pass = await runResearchPass({
        mission: leased,
        at,
        ...(input.env ? { env: input.env } : {}),
        ...(input.search ? { search: input.search } : {}),
      });
      const fresh = await this.must(input.workspaceId, input.id);
      if (
        fresh.job.ownerId !== input.workerId ||
        fresh.job.status !== "leased" ||
        fresh.job.idempotencyKey !== RESEARCH_PASS_JOB_KEY
      ) {
        throw new MissionConflictError("Research pass lease recovered by another worker.");
      }
      const collabBase = collaborationRecordForUpdate(fresh, at);
      const collabAfterPass =
        fresh.team && collabBase
          ? applyResearchPassCollaboration({
              record: collabBase,
              team: fresh.team,
              evidence: pass.evidence,
              at,
              provider: pass.provider,
            })
          : fresh.teamCollaboration;
      const next: SupervisedMission = withSyncedTeam({
        ...fresh,
        version: fresh.version + 1,
        evidence: pass.evidence,
        researchGaps: pass.researchGaps,
        researchPassCompletedAt: pass.researchPassCompletedAt,
        researchPassQueuedAt: null,
        researchProvider: pass.provider,
        teamCollaboration: collabAfterPass,
        job: idleJob(fresh.job.attempts),
        activity: pushActivity(fresh, ...pass.activity),
        stage: pass.evidence.length
          ? fresh.stage === "brief"
            ? "evidence"
            : fresh.stage
          : fresh.stage,
        updatedAt: at,
      });
      return this.store.save(next, fresh.version);
    } catch (error) {
      const fresh = await this.store.get(input.workspaceId, input.id);
      if (
        fresh &&
        fresh.job.ownerId === input.workerId &&
        fresh.job.status === "leased" &&
        fresh.job.idempotencyKey === RESEARCH_PASS_JOB_KEY
      ) {
        const failed: SupervisedMission = {
          ...fresh,
          version: fresh.version + 1,
          job: {
            ...fresh.job,
            status: "failed",
            ownerId: null,
            leaseUntil: null,
            lastError: error instanceof Error ? error.message : "Research pass failed.",
          },
          updatedAt: at,
        };
        await this.store.save(failed, fresh.version);
      }
      throw error instanceof Error ? error : new Error("Research pass failed.");
    }
  }

  async setResearchMode(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    mode: ResearchMode;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertMutable(current);
    if (!isResearchMode(input.mode)) throw new Error("Unknown research mode.");
    const plan = planResearchMode(input.mode);
    if (input.mode === "web" && !plan.executable) {
      throw new Error(plan.blockReason ?? "Web research is not available.");
    }
    const at = new Date(input.nowMs).toISOString();
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      researchMode: input.mode,
      researchGaps: plan.externalGaps,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: "register_evidence",
          kind: "research_mode.set",
          summary: `Research mode set to ${plan.label}. Tools: ${plan.tools.map((t) => `${t.label}${t.available ? "" : " (unavailable)"}`).join("; ")}.`,
          actor: "human",
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  async saveEvidence(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    items: Array<{ statement: string; source: string; classification: string }>;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertMutable(current);
    assertPlanApproved(current);
    const evidence = normaliseEvidence(input.items);
    const hashed = invalidateForScope(
      { ...current, evidence },
      scopeHash(current.brief, evidence),
      input.nowMs,
    );
    const at = new Date(input.nowMs).toISOString();
    const collabBase = collaborationRecordForUpdate(hashed, at);
    let collabAfterEvidence =
      hashed.team && collabBase
        ? applyEvidenceRegisterCollaboration({
            record: clearStaleRecommendation(collabBase, evidence),
            team: hashed.team,
            evidence,
            at,
          })
        : hashed.teamCollaboration;
    if (hashed.team && collabAfterEvidence && hashed.researchPassCompletedAt) {
      collabAfterEvidence = applyResearchPassCollaboration({
        record: collabAfterEvidence,
        team: hashed.team,
        evidence,
        at,
        provider: hashed.researchProvider,
      });
    }
    if (collabAfterEvidence) {
      collabAfterEvidence = clearStaleRecommendation(collabAfterEvidence, evidence);
    }
    const next: SupervisedMission = withSyncedTeam({
      ...hashed,
      evidence,
      version: current.version + 1,
      stage: hashed.proposal ? hashed.stage : "evidence",
      exportPdfBase64: hashed.exportBody ? hashed.exportPdfBase64 : null,
      teamCollaboration: collabAfterEvidence,
      activity: pushActivity(
        hashed,
        activityEvent({
          at,
          taskKey: "register_evidence",
          kind: "evidence.saved",
          summary: `Evidence register updated (${evidence.length} items). AI drafts remain distinct from founder-supplied statements.`,
          actor: "human",
        }),
      ),
      updatedAt: at,
    });
    if (!hashed.proposal) next.stage = "evidence";
    return this.store.save(next, current.version);
  }

  async reviseBrief(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    brief: Brief;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertMutable(current);
    const brief = normaliseBrief(input.brief);
    const scopeChanged =
      scopeHash(brief, current.evidence) !== scopeHash(current.brief, current.evidence);
    const afterBriefChange = scopeChanged
      ? clearTeamPlanApprovalAfterBriefChange({ ...current, brief }, input.nowMs)
      : { ...current, brief };
    const hashed = invalidateForScope(
      afterBriefChange,
      scopeHash(brief, current.evidence),
      input.nowMs,
    );
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
    expectedVersion?: number;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
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
    expectedVersion?: number;
    id: string;
    workerId: string;
    expectedScope?: string;
    nowMs: number;
    generator: ComparisonGenerator;
  }): Promise<{ mission: SupervisedMission; chargedUnits: number }> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (
      input.expectedScope !== undefined &&
      input.expectedScope !== scopeHash(current.brief, current.evidence)
    )
      throw new ApprovalMismatchError(
        "The comparison scope changed. Review the current evidence before allowing provider use.",
      );
    if (current.stage === "cancelled" || current.job.status === "cancelled") {
      throw new Error("Mission is cancelled.");
    }
    this.assertNotPaused(current);
    assertPlanApproved(current);
    const research = planResearchMode(current.researchMode ?? "provided");
    if (!research.executable) {
      throw new Error(
        research.blockReason ??
          "This research mode cannot run. Switch to Provided evidence or configure a search provider.",
      );
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
      const at = new Date(input.nowMs).toISOString();
      const researchGaps = [
        ...new Set([
          ...(fresh.researchGaps ?? []),
          ...planResearchMode(fresh.researchMode).externalGaps,
        ]),
      ];
      const collabBase = collaborationRecordForUpdate(fresh, at);
      const collabAfterCompare =
        fresh.team && collabBase
          ? applyOptionsComparedCollaboration({
              record: collabBase,
              team: fresh.team,
              evidence: fresh.evidence,
              options: prepared.options,
              generationLabel: prepared.generation.label,
              generationRan: prepared.generation.ran,
              at,
            })
          : fresh.teamCollaboration;
      const committed: SupervisedMission = withSyncedTeam({
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
        prototype: null,
        exportBody: null,
        exportPdfBase64: null,
        researchGaps,
        teamCollaboration: collabAfterCompare,
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
        activity: pushActivity(
          fresh,
          activityEvent({
            at,
            taskKey: "draft_options",
            kind: "options.compared",
            summary: `Options stored. Generation: ${prepared.generation.label}. Specialist drafts are distinct from your later decision.`,
            actor: prepared.generation.ran ? (prepared.generation.model ?? "model") : "system",
          }),
        ),
        updatedAt: at,
      });
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
    expectedVersion?: number;
    id: string;
    claim: ApprovalClaim;
    choice: DecisionChoice;
    note: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
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
    const draft = deriveAgentRecommendation(current);
    const humanNextPath = normalizeDecisionChoice(input.choice);
    const decidedAt = new Date(input.nowMs).toISOString();
    const approval: ApprovalRecord = {
      action: "compare_options",
      version: input.claim.version,
      scopeHash: input.claim.scopeHash,
      optionId: input.claim.optionId,
      choice: humanNextPath,
      note: input.note.trim().slice(0, 2000),
      actorId: input.actorId,
      decidedAt,
      agentRecommendation: draft.recommendation,
      humanNextPath,
      disagreesWithRecommendation: !pathAgreesWithRecommendation(
        humanNextPath,
        draft.recommendation,
      ),
      executionLimited: draft.executionLimited,
      recommendationRationale: draft.rationale,
    };
    const withApproval: SupervisedMission = {
      ...current,
      version: current.version + 1,
      stage: "decision",
      approval,
      expectation: null,
      artefact: null,
      prototype: null,
      exportBody: null,
      exportPdfBase64: null,
      continuationPlan: null,
      caseRoom: null,
      updatedAt: decidedAt,
    };
    const continuationPlan = buildContinuationPlan({
      mission: withApproval,
      nowMs: input.nowMs,
    });
    const withPlan: SupervisedMission = {
      ...withApproval,
      continuationPlan,
    };
    const caseRoom = buildCaseRoom({
      mission: withPlan,
      plan: continuationPlan,
      nowMs: input.nowMs,
    });
    const collabBase = collaborationRecordForUpdate(withPlan, decidedAt);
    const collabAfterRec =
      withPlan.team && collabBase
        ? applyRecommendationCollaboration({
            record: collabBase,
            team: withPlan.team,
            evidence: withPlan.evidence,
            draft,
            at: decidedAt,
          })
        : withPlan.teamCollaboration;
    const next: SupervisedMission = {
      ...withPlan,
      caseRoom,
      teamCollaboration: collabAfterRec,
      activity: pushActivity(
        withPlan,
        activityEvent({
          at: decidedAt,
          taskKey: "human_decision",
          kind: "continuation.plan.drafted",
          summary: `Act B continuation plan drafted for path “${humanNextPath}” (${continuationPlan.roles.length} continuation roles). Distinct from the Act A research team.`,
          actor: "system",
        }),
        activityEvent({
          at: decidedAt,
          taskKey: null,
          kind: "case_room.opened",
          summary: `Act C case room opened on the same case (${caseRoom.folders.length} agent folders, ${caseRoom.artefacts.length} artefacts, ${caseRoom.flowEdges.length} flow edges).`,
          actor: "system",
        }),
      ),
    };
    return this.store.save(next, current.version);
  }

  async recordCaseStepGate(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    gate: CaseStepGate;
    note: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertOpen(current);
    if (!current.caseRoom) {
      throw new Error("Open the case room after recording a next path first.");
    }
    const at = new Date(input.nowMs).toISOString();
    const caseRoom = applyCaseStepGate(current.caseRoom, input.gate, input.note, input.nowMs);
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      caseRoom,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: "human_decision",
          kind: "case_room.step_gate",
          summary: `Human recorded case step gate “${input.gate}”. Does not start a new mission.`,
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  async saveWatchtower(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    enabled: boolean;
    topics: string[];
    competitors: string[];
    sourcesNote: string;
    frequency: WatchtowerFrequency;
    geography: string;
    budgetCeilingUnits: number;
    notify: "off" | "digest" | "important";
    pauseUntil: string | null;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    this.assertOpen(current);
    const watchtower = saveWatchtowerConfig(
      {
        enabled: input.enabled,
        topics: input.topics,
        competitors: input.competitors,
        sourcesNote: input.sourcesNote,
        frequency: input.frequency,
        geography: input.geography,
        budgetCeilingUnits: input.budgetCeilingUnits,
        notify: input.notify,
        pauseUntil: input.pauseUntil,
      },
      input.nowMs,
    );
    const at = new Date(input.nowMs).toISOString();
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      watchtower,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: null,
          kind: "watchtower.config_saved",
          summary: watchtower.enabled
            ? `Watchtower preferences saved (${watchtower.frequency}). Checks do not run until a scheduled runner exists.`
            : "Watchtower preferences saved as off. No continuous monitoring is claimed.",
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  async prepareArtefact(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (current.artefact && current.stage !== "cancelled") return current;
    this.assertOpen(current);
    this.assertNotPaused(current);
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
    expectedVersion?: number;
    id: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (current.exportBody) return current;
    if (!current.artefact) throw new Error("Prepare the decision pack before export.");
    const at = new Date(input.nowMs).toISOString();
    const bodies = exportBodies(current);
    const next: SupervisedMission = withSyncedTeam({
      ...current,
      version: current.version + 1,
      stage: "exported",
      exportBody: bodies.exportBody,
      exportPdfBase64: bodies.exportPdfBase64,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: "assemble_pack",
          kind: "pack.exported",
          summary:
            "Decision pack exported as Markdown and PDF. Linked sources are referenced, not bundled.",
          actor: "human",
        }),
      ),
      updatedAt: at,
    });
    return this.store.save(next, current.version);
  }

  /**
   * P5 human gate: explicit approve → UX Prototype Agent produces sandboxed HTML
   * and static verify. Agents never auto-pass this gate.
   */
  async approvePrototypeBuild(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (current.prototype) return current;
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    assertPlanApproved(current);
    if (!current.approval) throw new Error("Record a decision before building a prototype.");
    if (!current.exportBody) {
      throw new Error("Export the decision pack before approving the prototype build.");
    }
    const synced = current.team ? syncTeamWithMission(current.team, current) : null;
    const builder = synced?.tasks.find((t) => t.key === "build_prototype");
    const proto = buildMissionPrototype(current, {
      actorId: input.actorId,
      nowMs: input.nowMs,
      ownerCapabilityId: builder?.capabilityId ?? "DX-035",
      ownerLabel: builder?.ownerLabel ?? "UX Prototype Agent",
    });
    const at = new Date(input.nowMs).toISOString();
    const verifySummary = proto.verified
      ? "Static sandbox checks passed."
      : (proto.failureDetail ?? "Static verify reported failures.");
    const next: SupervisedMission = withSyncedTeam({
      ...current,
      version: current.version + 1,
      prototype: proto,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: "approve_prototype",
          kind: "prototype.approved",
          summary: "You approved the sandboxed HTML prototype build. Specialist work may proceed.",
          actor: "human",
        }),
        activityEvent({
          at,
          taskKey: "build_prototype",
          kind: proto.verified ? "prototype.built" : "prototype.verify_failed",
          summary: `${proto.ownerLabel} produced “${proto.title}” (${proto.honesty.label}). ${verifySummary}`,
          actor: proto.ownerCapabilityId,
        }),
      ),
      updatedAt: at,
    });
    return this.store.save(next, current.version);
  }

  async recordExpectation(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    hypothesis: string;
    expectedMetric: string;
    baseline: string;
    observationWindow: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (!current.approval) throw new Error("Record a decision before the measurement plan.");
    if (current.exportBody || current.observation || current.reviews.length > 0) {
      throw new Error(
        "The measurement plan is fixed after export. Create a follow-up for a revised plan.",
      );
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
      archivedPacks: archivePack(current, "Measurement plan changed", input.nowMs),
      artefact: null,
      prototype: null,
      exportBody: null,
      exportPdfBase64: null,
      stage: "decision",
      updatedAt: recordedAt,
    };
    return this.store.save(next, current.version);
  }

  async recordObservation(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    result: string;
    evidence: string;
    source: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    if (current.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (!current.expectation) throw new Error("Record the measurement plan before a result.");
    if (!current.exportBody || !current.artefact || !current.approval) {
      throw new Error("Export the decision pack before recording a result.");
    }
    if (!current.prototype) {
      throw new Error("Approve the sandboxed HTML prototype before recording a result.");
    }
    const suppliedAt = new Date(input.nowMs).toISOString();
    const observation: OutcomeObservation = {
      id: `obs-${current.version + 1}-${input.nowMs}`,
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
    expectedVersion?: number;
    id: string;
    reading: string;
    uncertainty: string;
    followUp: Brief;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
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
    expectedVersion?: number;
    id: string;
    actorId: string;
    followUpMissionId: string;
    usageCeiling: number;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
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
      latest.observationId !== current.observation?.id ||
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
      projectId: current.projectId,
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

  /** Save notes from a meeting the owner held and read proposals from them. Nothing is accepted. */
  async addMeetingNotes(input: {
    workspaceId: string;
    id: string;
    expectedVersion: number;
    title: string;
    heldOn: string | null;
    notes: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This project changed in another session. Your notes were not saved. Refresh and try again.",
      );
    }
    if (current.stage === "cancelled") throw new Error("This project is stopped.");
    // Saved exactly as supplied, so every proposal's line number points at the right line.
    const notes = input.notes;
    const title = input.title.trim() || "Meeting";
    if (notes.trim().length < 10) throw new Error("Paste the notes from your meeting first.");
    if (notes.length > MEETING_NOTES_MAX_CHARS) {
      throw new Error(
        `Notes are limited to ${MEETING_NOTES_MAX_CHARS.toLocaleString("en-GB")} characters.`,
      );
    }
    const existing = current.meetings ?? [];
    if (existing.length >= MEETINGS_MAX) {
      throw new Error(`A project keeps up to ${MEETINGS_MAX} meetings. Remove one first.`);
    }
    const at = new Date(input.nowMs).toISOString();
    const meetingId = `m-${current.version + 1}-${input.nowMs}`;
    const meeting: MeetingNote = {
      id: meetingId,
      title: title.slice(0, 120),
      heldOn: input.heldOn,
      notes,
      addedAt: at,
      addedBy: input.actorId,
      reader: MEETING_READER_LABEL,
      proposals: readMeetingNotes(notes, (i) => `${meetingId}-p${i + 1}`),
    };
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      meetings: [...existing, meeting],
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: null,
          kind: "meeting.notes_added",
          summary: `Meeting notes added (“${meeting.title}”). ${meeting.proposals.length} proposed item${meeting.proposals.length === 1 ? "" : "s"} waiting for your review.`,
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  /** The owner accepts, dismisses or reopens one proposal. Only the owner decides. */
  async decideMeetingProposal(input: {
    workspaceId: string;
    id: string;
    expectedVersion: number;
    meetingId: string;
    proposalId: string;
    decision: "accepted" | "dismissed" | "proposed";
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This project changed in another session. Refresh and try again.",
      );
    }
    if (current.stage === "cancelled") throw new Error("This project is stopped.");
    const meeting = (current.meetings ?? []).find((m) => m.id === input.meetingId);
    const proposal = meeting?.proposals.find((p) => p.id === input.proposalId);
    if (!meeting || !proposal) throw new Error("That proposal is no longer on this project.");
    if (proposal.status === input.decision) return current;
    const at = new Date(input.nowMs).toISOString();
    const reopened = input.decision === "proposed";
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      meetings: (current.meetings ?? []).map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              proposals: m.proposals.map((p) =>
                p.id !== proposal.id
                  ? p
                  : {
                      ...p,
                      status: input.decision,
                      decidedAt: reopened ? null : at,
                      decidedBy: reopened ? null : input.actorId,
                    },
              ),
            },
      ),
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: null,
          kind: `meeting.proposal_${input.decision}`,
          summary: reopened
            ? `Meeting item put back for review (“${meeting.title}”).`
            : `You ${input.decision} a meeting item from “${meeting.title}”.`,
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  /** Remove a meeting's notes and everything read from them. */
  async removeMeetingNotes(input: {
    workspaceId: string;
    id: string;
    expectedVersion: number;
    meetingId: string;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This project changed in another session. Refresh and try again.",
      );
    }
    const meeting = (current.meetings ?? []).find((m) => m.id === input.meetingId);
    if (!meeting) return current;
    const at = new Date(input.nowMs).toISOString();
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      meetings: (current.meetings ?? []).filter((m) => m.id !== meeting.id),
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: null,
          kind: "meeting.notes_removed",
          summary: `Meeting notes removed (“${meeting.title}”), with the items read from them.`,
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  async saveStudioMeta(input: {
    workspaceId: string;
    expectedVersion?: number;
    id: string;
    favourite?: boolean;
    archived?: boolean;
    notifyWhenReady?: boolean;
    investigationPaused?: boolean;
    actorId: string;
    nowMs: number;
  }): Promise<SupervisedMission> {
    const current = await this.must(input.workspaceId, input.id);
    if (input.expectedVersion !== undefined && current.version !== input.expectedVersion) {
      throw new MissionConflictError(
        "This mission changed in another session. Your edits were not saved. Review the latest record before trying again.",
      );
    }
    // A stopped case can still be favourited, deleted from the dashboard or restored.
    if (
      current.stage === "cancelled" &&
      (input.notifyWhenReady !== undefined || input.investigationPaused !== undefined)
    ) {
      throw new Error("Mission is cancelled.");
    }
    const metaPatch: Partial<Omit<StudioMeta, "version" | "honesty" | "updatedAt">> = {};
    if (input.favourite !== undefined) metaPatch.favourite = input.favourite;
    if (input.archived !== undefined) metaPatch.archived = input.archived;
    if (input.notifyWhenReady !== undefined) metaPatch.notifyWhenReady = input.notifyWhenReady;
    if (input.investigationPaused !== undefined) {
      metaPatch.investigationPaused = input.investigationPaused;
    }
    const studioMeta = saveStudioMeta(metaPatch, current.studioMeta, input.nowMs);
    const at = new Date(input.nowMs).toISOString();
    const next: SupervisedMission = {
      ...current,
      version: current.version + 1,
      studioMeta,
      activity: pushActivity(
        current,
        activityEvent({
          at,
          taskKey: null,
          kind: "studio.meta_saved",
          summary:
            input.archived === true
              ? current.stage === "cancelled"
                ? "Project deleted from the dashboard. Its records are kept and it can be restored."
                : "Project archived. Its work was not stopped."
              : input.archived === false
                ? "Project restored to the dashboard."
                : studioMeta.investigationPaused
                  ? "Investigation paused by preference. Resume to continue research steps."
                  : studioMeta.notifyWhenReady
                    ? "Studio preferences saved (notify-when-ready on). Push/email is not active until a notifier exists."
                    : "Studio preferences saved (favourite/archive/notify/pause).",
          actor: input.actorId,
        }),
      ),
      updatedAt: at,
    };
    return this.store.save(next, current.version);
  }

  private assertOpen(mission: SupervisedMission): void {
    if (mission.stage === "cancelled") throw new Error("Mission is cancelled.");
    if (mission.stage === "exported") throw new Error("This mission is already exported.");
  }

  private assertNotPaused(mission: SupervisedMission): void {
    if (mission.studioMeta?.investigationPaused) {
      throw new Error(
        "This investigation is paused. Resume from the Intelligence Canvas controls before further research steps.",
      );
    }
  }

  private assertMutable(mission: SupervisedMission): void {
    this.assertOpen(mission);
    if (mission.observation || mission.reviews.length > 0 || mission.followUp) {
      throw new Error(
        "The outcome record cites this decision, so the brief and evidence stay fixed.",
      );
    }
    if (mission.delivery) {
      throw new Error(
        "Delivery is building this decision, so the brief and evidence stay fixed. Start a follow-up case to change them.",
      );
    }
  }
}

export { nextRequiredAction };
