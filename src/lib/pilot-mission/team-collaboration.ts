/**
 * Phase 2 — Real team collaboration on the Act A investigation spine.
 * Persisted assignments, handoffs, and graph edges (planned vs actual).
 * No fabricated agent dialogue — structured summaries and event labels only.
 */
import type { PilotSpecialistTask, PilotTeamPlan } from "./specialist-team";
import type { EvidenceItem, SupervisedMission } from "./types";
import type { AgentRecommendation, RecommendationDraft } from "./verdict";
import { AGENT_RECOMMENDATION_LABELS } from "./verdict";

/** Small Wave-1 investigation team — not the full catalogue. */
export const INVESTIGATION_TASK_KEYS = [
  "frame_objective",
  "register_evidence",
  "synthesise_findings",
  "draft_options",
  "challenge_options",
  "structure_recommendation",
] as const;

export type InvestigationTaskKey = (typeof INVESTIGATION_TASK_KEYS)[number];

export type CollaborationEdgeKind =
  | "planned_dependency"
  | "actual_share"
  | "actual_use"
  | "resulting_artefact";

export type SpecialistAssignment = {
  taskKey: string;
  capabilityId: string | null;
  ownerLabel: string;
  why: string;
  inputsExpected: string[];
  outputExpected: string;
  assignedAt: string;
};

export type TeamHandoff = {
  id: string;
  fromTaskKey: string;
  toTaskKey: string;
  fromActor: string;
  toActor: string;
  sourceTaskKey: string;
  findingSummary: string;
  sourceFindingId: string | null;
  request: string;
  evidenceIds: string[];
  uncertainty: string | null;
  expectedDownstream: string;
  actualResult: string | null;
  sharedAt: string;
  consumedAt: string | null;
  productionLabel: "simulated draft" | "model" | "human" | "persisted event";
};

export type CollaborationEdge = {
  id: string;
  kind: CollaborationEdgeKind;
  fromTaskKey: string;
  toTaskKey: string;
  label: string;
  handoffId?: string;
  evidenceIds?: string[];
  artefactRef?: string;
};

export type AgentRecommendationRef = {
  recommendation: AgentRecommendation;
  rationale: string;
  executionLimited: boolean;
  derivedFromHandoffIds: string[];
  sourceFindingIds: string[];
  recordedAt: string;
};

export type TeamCollaborationRecord = {
  version: "team-collaboration-v1";
  assignments: SpecialistAssignment[];
  handoffs: TeamHandoff[];
  edges: CollaborationEdge[];
  recommendation: AgentRecommendationRef | null;
};

export type CollaborationTrace = {
  findingId: string;
  findingStatement: string;
  handoffIds: string[];
  recommendation: AgentRecommendationRef;
};

function taskActor(task: PilotSpecialistTask): string {
  return task.capabilityId ?? task.ownerLabel;
}

function investigationTasks(team: PilotTeamPlan): PilotSpecialistTask[] {
  const keys = new Set<string>(INVESTIGATION_TASK_KEYS);
  return team.tasks.filter((t) => keys.has(t.key));
}

function assignmentWhy(task: PilotSpecialistTask, band: string): string {
  return `${task.title} on the Wave-1 investigation spine (band ${band}). Runnable only after plan approval.`;
}

export function initTeamCollaboration(team: PilotTeamPlan, at: string): TeamCollaborationRecord {
  const assignments: SpecialistAssignment[] = investigationTasks(team).map((task) => ({
    taskKey: task.key,
    capabilityId: task.capabilityId,
    ownerLabel: task.ownerLabel,
    why: assignmentWhy(task, team.staffingBand),
    inputsExpected: [...task.uses],
    outputExpected: task.produces,
    assignedAt: at,
  }));

  const edges: CollaborationEdge[] = [];
  for (const task of investigationTasks(team)) {
    for (const dep of task.dependsOn) {
      if (!INVESTIGATION_TASK_KEYS.includes(dep as InvestigationTaskKey)) continue;
      edges.push({
        id: `edge-planned-${dep}-${task.key}`,
        kind: "planned_dependency",
        fromTaskKey: dep,
        toTaskKey: task.key,
        label: `Planned: ${dep} before ${task.key}`,
      });
    }
  }

  return {
    version: "team-collaboration-v1",
    assignments,
    handoffs: [],
    edges,
    recommendation: null,
  };
}

function upsertHandoff(
  record: TeamCollaborationRecord,
  handoff: TeamHandoff,
  edgeKind: CollaborationEdgeKind,
): TeamCollaborationRecord {
  const handoffs = [...record.handoffs.filter((h) => h.id !== handoff.id), handoff];
  const edge: CollaborationEdge = {
    id: `edge-${edgeKind}-${handoff.id}`,
    kind: edgeKind,
    fromTaskKey: handoff.fromTaskKey,
    toTaskKey: handoff.toTaskKey,
    label: handoff.findingSummary.slice(0, 120),
    handoffId: handoff.id,
    ...(handoff.evidenceIds.length ? { evidenceIds: handoff.evidenceIds } : {}),
  };
  const edges = [...record.edges.filter((e) => e.id !== edge.id), edge];
  return { ...record, handoffs, edges };
}

function taskByKey(team: PilotTeamPlan, key: string): PilotSpecialistTask | undefined {
  return team.tasks.find((t) => t.key === key);
}

function primarySuppliedFindingIds(evidence: EvidenceItem[]): string[] {
  return evidence
    .filter(
      (e) =>
        e.classification === "supplied" &&
        !/Research Synthesis Agent/i.test(e.source) &&
        !/^Research pass/i.test(e.source),
    )
    .map((e) => e.id);
}

export function applyResearchPassCollaboration(input: {
  record: TeamCollaborationRecord;
  team: PilotTeamPlan;
  evidence: EvidenceItem[];
  at: string;
  provider: string | null;
}): TeamCollaborationRecord {
  const from = taskByKey(input.team, "register_evidence");
  const to = taskByKey(input.team, "synthesise_findings");
  if (!from || !to) return input.record;

  const findingIds = primarySuppliedFindingIds(input.evidence);
  const gapCount = input.evidence.filter((e) => e.classification === "gap").length;
  const primaryId = findingIds[0] ?? null;
  const primary = primaryId ? input.evidence.find((e) => e.id === primaryId) : undefined;

  const handoff: TeamHandoff = {
    id: "ho-evidence-to-synthesis",
    fromTaskKey: from.key,
    toTaskKey: to.key,
    fromActor: taskActor(from),
    toActor: taskActor(to),
    sourceTaskKey: from.key,
    findingSummary: primary
      ? `Registered finding ${primary.id}: ${primary.statement.slice(0, 160)}`
      : `Evidence register updated (${findingIds.length} supplied, ${gapCount} gap note(s)).`,
    sourceFindingId: primaryId,
    request: "Group findings, assumptions and gaps for the options step.",
    evidenceIds: findingIds.slice(0, 12),
    uncertainty:
      gapCount > 0
        ? `${gapCount} gap(s) remain on the register; options must not invent retrieval.`
        : null,
    expectedDownstream: "Synthesis memo consumable by draft_options.",
    actualResult: `Synthesis recorded on the evidence register${input.provider ? ` (${input.provider})` : ""}.`,
    sharedAt: input.at,
    consumedAt: input.at,
    productionLabel: "persisted event",
  };

  let next = upsertHandoff(input.record, handoff, "actual_share");
  next = upsertHandoff(next, { ...handoff, id: "ho-evidence-to-synthesis-use" }, "actual_use");
  return next;
}

export function applyOptionsComparedCollaboration(input: {
  record: TeamCollaborationRecord;
  team: PilotTeamPlan;
  evidence: EvidenceItem[];
  generationLabel: string;
  generationRan: boolean;
  at: string;
}): TeamCollaborationRecord {
  const synth = taskByKey(input.team, "synthesise_findings");
  const draft = taskByKey(input.team, "draft_options");
  const challenge = taskByKey(input.team, "challenge_options");
  const structure = taskByKey(input.team, "structure_recommendation");
  if (!synth || !draft || !challenge || !structure) return input.record;

  const findingIds = primarySuppliedFindingIds(input.evidence);
  const productionLabel: TeamHandoff["productionLabel"] = input.generationRan
    ? "model"
    : "simulated draft";

  let record = input.record;

  const toDraft: TeamHandoff = {
    id: "ho-synthesis-to-options",
    fromTaskKey: synth.key,
    toTaskKey: draft.key,
    fromActor: taskActor(synth),
    toActor: taskActor(draft),
    sourceTaskKey: synth.key,
    findingSummary: "Findings and gaps from synthesis feed option drafting.",
    sourceFindingId: findingIds[0] ?? null,
    request: "Draft option set with trade-offs grounded in the register.",
    evidenceIds: findingIds.slice(0, 12),
    uncertainty: null,
    expectedDownstream: "Option set for challenge and recommendation.",
    actualResult: `Options stored (${input.generationLabel}).`,
    sharedAt: input.at,
    consumedAt: input.at,
    productionLabel,
  };
  record = upsertHandoff(record, toDraft, "actual_share");
  record = upsertHandoff(record, { ...toDraft, id: "ho-synthesis-to-options-use" }, "actual_use");

  const toChallenge: TeamHandoff = {
    id: "ho-options-to-challenge",
    fromTaskKey: draft.key,
    toTaskKey: challenge.key,
    fromActor: taskActor(draft),
    toActor: taskActor(challenge),
    sourceTaskKey: draft.key,
    findingSummary: "Draft options require independent challenge before recommendation.",
    sourceFindingId: null,
    request: "Stress-test trade-offs and missing evidence.",
    evidenceIds: findingIds.slice(0, 8),
    uncertainty: "Challenge may surface gaps not resolved in drafting.",
    expectedDownstream: "Challenge notes for structure_recommendation.",
    actualResult: "Challenge pass recorded with comparison output.",
    sharedAt: input.at,
    consumedAt: input.at,
    productionLabel,
  };
  record = upsertHandoff(record, toChallenge, "actual_share");

  const toStructure: TeamHandoff = {
    id: "ho-challenge-to-recommendation",
    fromTaskKey: challenge.key,
    toTaskKey: structure.key,
    fromActor: taskActor(challenge),
    toActor: taskActor(structure),
    sourceTaskKey: challenge.key,
    findingSummary: "Challenged options ready for four-outcome recommendation.",
    sourceFindingId: findingIds[0] ?? null,
    request: "Produce diligence recommendation (test / revise / pause / do not pursue).",
    evidenceIds: findingIds.slice(0, 12),
    uncertainty: null,
    expectedDownstream: "Agent recommendation for human next-path choice.",
    actualResult: "Recommendation draft prepared from evidence register.",
    sharedAt: input.at,
    consumedAt: input.at,
    productionLabel,
  };
  record = upsertHandoff(record, toStructure, "actual_share");

  const artefactEdge: CollaborationEdge = {
    id: "edge-artefact-proposal",
    kind: "resulting_artefact",
    fromTaskKey: structure.key,
    toTaskKey: structure.key,
    label: "Comparison proposal stored on mission record",
    artefactRef: "proposal:compare_options",
    evidenceIds: findingIds.slice(0, 8),
  };
  record = {
    ...record,
    edges: [...record.edges.filter((e) => e.id !== artefactEdge.id), artefactEdge],
  };

  return record;
}

function handoffChainForFinding(
  record: TeamCollaborationRecord,
  findingId: string,
): string[] {
  const orderedKeys: InvestigationTaskKey[] = [
    "register_evidence",
    "synthesise_findings",
    "draft_options",
    "challenge_options",
    "structure_recommendation",
  ];
  const ids: string[] = [];
  for (let i = 0; i < orderedKeys.length - 1; i++) {
    const from = orderedKeys[i]!;
    const to = orderedKeys[i + 1]!;
    const match = record.handoffs.find(
      (h) =>
        h.fromTaskKey === from &&
        h.toTaskKey === to &&
        !h.id.endsWith("-use") &&
        (h.sourceFindingId === findingId || h.evidenceIds.includes(findingId)),
    );
    if (match) ids.push(match.id);
  }
  return ids;
}

export function applyRecommendationCollaboration(input: {
  record: TeamCollaborationRecord;
  evidence: EvidenceItem[];
  draft: RecommendationDraft;
  at: string;
}): TeamCollaborationRecord {
  const findingIds = primarySuppliedFindingIds(input.evidence);
  const primaryId =
    findingIds.find((id) =>
      input.record.handoffs.some(
        (h) => h.sourceFindingId === id || h.evidenceIds.includes(id),
      ),
    ) ?? findingIds[0];

  const derivedFromHandoffIds = primaryId
    ? handoffChainForFinding(input.record, primaryId)
    : [];

  const recommendation: AgentRecommendationRef = {
    recommendation: input.draft.recommendation,
    rationale: input.draft.rationale,
    executionLimited: input.draft.executionLimited,
    derivedFromHandoffIds,
    sourceFindingIds: primaryId ? [primaryId] : findingIds.slice(0, 1),
    recordedAt: input.at,
  };

  const edge: CollaborationEdge = {
    id: "edge-artefact-recommendation",
    kind: "resulting_artefact",
    fromTaskKey: "structure_recommendation",
    toTaskKey: "human_decision",
    label: `Recommendation: ${AGENT_RECOMMENDATION_LABELS[input.draft.recommendation]}`,
    artefactRef: `recommendation:${input.draft.recommendation}`,
    evidenceIds: recommendation.sourceFindingIds,
  };

  return {
    ...input.record,
    recommendation,
    edges: [...input.record.edges.filter((e) => e.id !== edge.id), edge],
  };
}

/** Merge-gate: finding → handoffs → stored recommendation. */
export function traceFindingToRecommendation(
  record: TeamCollaborationRecord,
  findingId: string,
  evidence: EvidenceItem[],
): CollaborationTrace | null {
  if (!record.recommendation?.sourceFindingIds.includes(findingId)) return null;
  const item = evidence.find((e) => e.id === findingId);
  if (!item) return null;
  const handoffIds = handoffChainForFinding(record, findingId);
  if (!handoffIds.length) return null;
  return {
    findingId,
    findingStatement: item.statement,
    handoffIds,
    recommendation: record.recommendation,
  };
}

export function ensureTeamCollaboration(mission: SupervisedMission): TeamCollaborationRecord | null {
  if (mission.teamCollaboration) return mission.teamCollaboration;
  if (!mission.team) return null;
  return initTeamCollaboration(mission.team, mission.updatedAt);
}
