/**
 * Phase 2 — Real team collaboration on the Act A investigation spine.
 * Persisted assignments, handoffs, and graph edges (planned vs actual).
 * No fabricated agent dialogue — structured summaries and event labels only.
 */
import type { PilotSpecialistTask, PilotTeamPlan } from "./specialist-team";
import type { EvidenceItem, OptionDraft, SupervisedMission } from "./types";
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
  "planned_dependency" | "actual_share" | "actual_use" | "resulting_artefact";

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
  /** How the recommendation was produced — never implied as model output unless true. */
  productionLabel: "deterministic rules" | "model" | "human";
  modelId: string | null;
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

const WAVE1_TRACE_TRANSITIONS: ReadonlyArray<[InvestigationTaskKey, InvestigationTaskKey]> = [
  ["register_evidence", "synthesise_findings"],
  ["synthesise_findings", "draft_options"],
  ["draft_options", "structure_recommendation"],
];

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
  let next: TeamCollaborationRecord = { ...record, handoffs, edges };
  if (handoff.consumedAt) {
    const useHandoff: TeamHandoff = { ...handoff, id: `${handoff.id}-use` };
    next = upsertHandoffUseEdge(next, useHandoff);
  }
  return next;
}

function upsertHandoffUseEdge(
  record: TeamCollaborationRecord,
  handoff: TeamHandoff,
): TeamCollaborationRecord {
  const edge: CollaborationEdge = {
    id: `edge-actual_use-${handoff.id}`,
    kind: "actual_use",
    fromTaskKey: handoff.fromTaskKey,
    toTaskKey: handoff.toTaskKey,
    label: handoff.findingSummary.slice(0, 120),
    handoffId: handoff.id,
    ...(handoff.evidenceIds.length ? { evidenceIds: handoff.evidenceIds } : {}),
  };
  const edges = [...record.edges.filter((e) => e.id !== edge.id), edge];
  return { ...record, edges };
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

/** Findings cited in option drafts or generation — not every row on the register. */
export function evidenceIdsUsedInComparison(
  evidence: EvidenceItem[],
  options?: OptionDraft[],
): string[] {
  const valid = new Set(evidence.map((e) => e.id));
  const used = new Set<string>();
  for (const opt of options ?? []) {
    const basis = opt.basis?.trim();
    if (basis && valid.has(basis)) used.add(basis);
    for (const item of evidence) {
      if (opt.tradeoff.includes(item.id) || opt.title.includes(item.id)) used.add(item.id);
    }
  }
  if (used.size) return [...used];
  const primary = primarySuppliedFindingIds(evidence);
  return primary[0] ? [primary[0]] : [];
}

/** Persisted collaboration on the mission, initializing when the team exists but the field is null. */
export function collaborationRecordForUpdate(
  mission: SupervisedMission,
  at: string,
): TeamCollaborationRecord | null {
  if (!mission.team) return null;
  return mission.teamCollaboration ?? initTeamCollaboration(mission.team, at);
}

export function clearStaleRecommendation(
  record: TeamCollaborationRecord,
  evidence: EvidenceItem[],
): TeamCollaborationRecord {
  if (!record.recommendation) return record;
  const supplied = new Set(primarySuppliedFindingIds(evidence));
  const stale = record.recommendation.sourceFindingIds.some((id) => !supplied.has(id));
  if (!stale) return record;
  return {
    ...record,
    recommendation: null,
    edges: record.edges.filter((e) => e.id !== "edge-artefact-recommendation"),
  };
}

/** Evidence register edits — does not claim synthesis or specialist consumption. */
export function applyEvidenceRegisterCollaboration(input: {
  record: TeamCollaborationRecord;
  team: PilotTeamPlan;
  evidence: EvidenceItem[];
  at: string;
}): TeamCollaborationRecord {
  const from = taskByKey(input.team, "register_evidence");
  const to = taskByKey(input.team, "synthesise_findings");
  if (!from || !to) return input.record;

  const findingIds = primarySuppliedFindingIds(input.evidence);
  const gapCount = input.evidence.filter((e) => e.classification === "gap").length;
  const primaryId = findingIds[0] ?? null;
  const primary = primaryId ? input.evidence.find((e) => e.id === primaryId) : undefined;

  const handoff: TeamHandoff = {
    id: "ho-evidence-register-update",
    fromTaskKey: from.key,
    toTaskKey: to.key,
    fromActor: taskActor(from),
    toActor: taskActor(to),
    sourceTaskKey: from.key,
    findingSummary: primary
      ? `Registered finding ${primary.id}: ${primary.statement.slice(0, 160)}`
      : `Evidence register updated (${findingIds.length} supplied, ${gapCount} gap note(s)).`,
    sourceFindingId: primaryId,
    request: "Findings await synthesis when a research pass completes.",
    evidenceIds: primaryId ? [primaryId] : findingIds.slice(0, 12),
    uncertainty:
      gapCount > 0
        ? `${gapCount} gap(s) remain on the register; options must not invent retrieval.`
        : null,
    expectedDownstream: "Synthesis memo for draft_options (not recorded until a pass runs).",
    actualResult: "Evidence register saved — synthesis handoff not consumed.",
    sharedAt: input.at,
    consumedAt: null,
    productionLabel: "persisted event",
  };

  return upsertHandoff(input.record, handoff, "actual_share");
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
    evidenceIds: primaryId ? [primaryId] : findingIds.slice(0, 12),
    uncertainty:
      gapCount > 0
        ? `${gapCount} gap(s) remain on the register; options must not invent retrieval.`
        : null,
    expectedDownstream: "Synthesis memo consumable by draft_options.",
    actualResult: `Research pass synthesis recorded on the evidence register${input.provider ? ` (${input.provider})` : ""}.`,
    sharedAt: input.at,
    consumedAt: input.at,
    productionLabel: "persisted event",
  };

  return upsertHandoff(input.record, handoff, "actual_share");
}

export function applyOptionsComparedCollaboration(input: {
  record: TeamCollaborationRecord;
  team: PilotTeamPlan;
  evidence: EvidenceItem[];
  options?: OptionDraft[];
  generationLabel: string;
  generationRan: boolean;
  at: string;
}): TeamCollaborationRecord {
  const synth = taskByKey(input.team, "synthesise_findings");
  const draft = taskByKey(input.team, "draft_options");
  if (!synth || !draft) return input.record;

  const findingIds = evidenceIdsUsedInComparison(input.evidence, input.options);
  const optionsProductionLabel: TeamHandoff["productionLabel"] = input.generationRan
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
    findingSummary:
      "Comparison output stored for draft_options (challenge and recommendation steps not run).",
    sourceFindingId: findingIds[0] ?? null,
    request: "Option set stored from comparison — independent challenge not recorded here.",
    evidenceIds: findingIds,
    uncertainty: null,
    expectedDownstream: "Human decision on stored options.",
    actualResult: `Options stored (${input.generationLabel}). Specialist challenge/recommendation handoffs are not recorded until those steps run.`,
    sharedAt: input.at,
    consumedAt: null,
    productionLabel: optionsProductionLabel,
  };
  record = upsertHandoff(record, toDraft, "actual_share");

  const artefactEdge: CollaborationEdge = {
    id: "edge-artefact-proposal",
    kind: "resulting_artefact",
    fromTaskKey: draft.key,
    toTaskKey: "human_decision",
    label: "Comparison proposal stored on mission record",
    artefactRef: "proposal:compare_options",
    evidenceIds: findingIds,
  };
  record = {
    ...record,
    edges: [...record.edges.filter((e) => e.id !== artefactEdge.id), artefactEdge],
  };

  return record;
}

function handoffForTransition(
  record: TeamCollaborationRecord,
  findingId: string,
  from: string,
  to: string,
): TeamHandoff | undefined {
  const matches = record.handoffs.filter(
    (h) =>
      h.fromTaskKey === from &&
      h.toTaskKey === to &&
      !h.id.endsWith("-use") &&
      h.id !== "ho-evidence-register-update" &&
      (h.sourceFindingId === findingId || h.evidenceIds.includes(findingId)),
  );
  if (from === "register_evidence" && to === "synthesise_findings") {
    return (
      matches.find((h) => h.id === "ho-evidence-to-synthesis") ??
      matches.find((h) => h.consumedAt !== null)
    );
  }
  return matches[0];
}

function handoffChainForFinding(
  record: TeamCollaborationRecord,
  findingId: string,
  transitions: ReadonlyArray<
    [InvestigationTaskKey, InvestigationTaskKey]
  > = WAVE1_TRACE_TRANSITIONS,
): string[] {
  const ids: string[] = [];
  for (const [from, to] of transitions) {
    const match = handoffForTransition(record, findingId, from, to);
    if (!match) return [];
    ids.push(match.id);
  }
  return ids;
}

export function applyRecommendationCollaboration(input: {
  record: TeamCollaborationRecord;
  team: PilotTeamPlan;
  evidence: EvidenceItem[];
  draft: RecommendationDraft;
  at: string;
}): TeamCollaborationRecord {
  const findingIds = evidenceIdsUsedInComparison(input.evidence);
  const primaryId =
    findingIds.find((id) =>
      input.record.handoffs.some((h) => h.sourceFindingId === id || h.evidenceIds.includes(id)),
    ) ?? findingIds[0];

  const preDecisionTransitions = WAVE1_TRACE_TRANSITIONS.slice(0, 2);
  const preChain = primaryId
    ? handoffChainForFinding(input.record, primaryId, preDecisionTransitions)
    : [];
  if (primaryId && preChain.length !== preDecisionTransitions.length) {
    return { ...input.record, recommendation: null };
  }

  const draftTask = taskByKey(input.team, "draft_options");
  const structure = taskByKey(input.team, "structure_recommendation");
  let record = input.record;

  if (draftTask && structure && primaryId) {
    const toStructure: TeamHandoff = {
      id: "ho-options-to-recommendation",
      fromTaskKey: draftTask.key,
      toTaskKey: structure.key,
      fromActor: taskActor(draftTask),
      toActor: taskActor(structure),
      sourceTaskKey: draftTask.key,
      findingSummary:
        "Deterministic recommendation recorded from evidence register (not model-produced).",
      sourceFindingId: primaryId,
      request: "Map register state to diligence recommendation.",
      evidenceIds: [primaryId],
      uncertainty: input.draft.executionLimited
        ? "Execution-limited retrieval on the register."
        : null,
      expectedDownstream: "Human next-path choice.",
      actualResult: `Recommendation: ${AGENT_RECOMMENDATION_LABELS[input.draft.recommendation]}.`,
      sharedAt: input.at,
      consumedAt: input.at,
      productionLabel: "persisted event",
    };
    record = upsertHandoff(record, toStructure, "actual_share");
  }

  const chainIds = primaryId ? handoffChainForFinding(record, primaryId) : [];

  const recommendation: AgentRecommendationRef = {
    recommendation: input.draft.recommendation,
    rationale: input.draft.rationale,
    executionLimited: input.draft.executionLimited,
    derivedFromHandoffIds: chainIds,
    sourceFindingIds: primaryId ? [primaryId] : findingIds.slice(0, 1),
    recordedAt: input.at,
    productionLabel: "deterministic rules",
    modelId: null,
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
    ...record,
    recommendation,
    edges: [...record.edges.filter((e) => e.id !== edge.id), edge],
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
  if (handoffIds.length !== WAVE1_TRACE_TRANSITIONS.length) return null;
  if (
    record.recommendation.derivedFromHandoffIds.length !== WAVE1_TRACE_TRANSITIONS.length ||
    !handoffIds.every((id, i) => record.recommendation!.derivedFromHandoffIds[i] === id)
  ) {
    return null;
  }
  return {
    findingId,
    findingStatement: item.statement,
    handoffIds,
    recommendation: record.recommendation,
  };
}

export function ensureTeamCollaboration(
  mission: SupervisedMission,
): TeamCollaborationRecord | null {
  if (mission.teamCollaboration) return mission.teamCollaboration;
  if (!mission.team) return null;
  return initTeamCollaboration(mission.team, mission.updatedAt);
}

const EDGE_EXPORT_LABELS: Record<CollaborationEdgeKind, string> = {
  planned_dependency: "Planned dependency",
  actual_share: "Information shared",
  actual_use: "Downstream use",
  resulting_artefact: "Resulting artefact",
};

/** Download-facing collaboration record — structured summaries only, no fabricated dialogue. */
export function buildTeamCollaborationMarkdown(mission: SupervisedMission): string | null {
  const record = ensureTeamCollaboration(mission);
  if (!record) return null;

  const lines: string[] = [
    `## Recorded team collaboration`,
    ``,
    `Structured assignments and handoffs from persisted events. Simulated drafts are labelled.`,
    ``,
    `## Assignments`,
    ...record.assignments.map(
      (a) =>
        `- **${a.ownerLabel}** (${a.taskKey}${a.capabilityId ? ` · ${a.capabilityId}` : ""}): ${a.why}`,
    ),
    ``,
  ];

  if (record.handoffs.length) {
    lines.push(`## Handoffs`, ``);
    for (const h of record.handoffs.filter((x) => !x.id.endsWith("-use"))) {
      lines.push(
        `### ${h.fromTaskKey} → ${h.toTaskKey}`,
        `- Production: ${h.productionLabel}`,
        `- Finding: ${h.findingSummary}`,
        `- Request: ${h.request}`,
        h.evidenceIds.length ? `- Evidence ids: ${h.evidenceIds.join(", ")}` : "",
        h.uncertainty ? `- Uncertainty: ${h.uncertainty}` : "",
        h.actualResult ? `- Result: ${h.actualResult}` : "",
        ``,
      );
    }
  } else {
    lines.push(`## Handoffs`, `- None recorded yet.`, ``);
  }

  lines.push(
    `## Information flow`,
    ...record.edges.map(
      (e) =>
        `- ${EDGE_EXPORT_LABELS[e.kind]}: ${e.fromTaskKey} → ${e.toTaskKey} — ${e.label}${
          e.evidenceIds?.length ? ` (evidence: ${e.evidenceIds.join(", ")})` : ""
        }`,
    ),
    ``,
  );

  if (record.recommendation) {
    const primaryId = record.recommendation.sourceFindingIds[0];
    const trace =
      primaryId && mission.evidence.length
        ? traceFindingToRecommendation(record, primaryId, mission.evidence)
        : null;
    lines.push(
      `## Agent recommendation (collaboration record)`,
      `- ${AGENT_RECOMMENDATION_LABELS[record.recommendation.recommendation]}`,
      `- Production: ${record.recommendation.productionLabel}${record.recommendation.modelId ? ` (${record.recommendation.modelId})` : ""}`,
      `- Rationale: ${record.recommendation.rationale}`,
      record.recommendation.executionLimited ? `- Execution-limited: yes` : "",
      trace
        ? `- Evidence trace: finding \`${trace.findingId}\` via handoffs ${trace.handoffIds.join(" → ")}.`
        : `- Evidence trace: incomplete — not every specialist step is on the record.`,
      ``,
    );
  }

  return lines.filter((line) => line !== "").join("\n");
}
