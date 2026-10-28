/**
 * Phase 4 — On-demand inspection snapshot from persisted mission fields only.
 */
import { ensureTeamCollaboration, type TeamHandoff } from "./team-collaboration";
import { nextRequiredAction, type SupervisedMission } from "./types";

export type InspectionOutput = {
  id: string;
  label: string;
  detail: string | null;
  productionLabel: string | null;
};

export type UnresolvedQuestion = {
  id: string;
  handoffId: string;
  fromTaskKey: string;
  toTaskKey: string;
  uncertainty: string;
};

export type MissionInspection = {
  decisionAttention: ReturnType<typeof nextRequiredAction> | null;
  unresolvedQuestions: UnresolvedQuestion[];
  outputs: InspectionOutput[];
  evidenceOnRecord: { id: string; classification: string; statement: string }[];
  hasTeamRecord: boolean;
};

const TERMINAL_NEXT = new Set(["cancelled", "follow_up_approved"]);

function handoffQuestions(handoffs: TeamHandoff[]): UnresolvedQuestion[] {
  return handoffs
    .filter((h) => h.uncertainty?.trim())
    .map((h) => ({
      id: `uq-${h.id}`,
      handoffId: h.id,
      fromTaskKey: h.fromTaskKey,
      toTaskKey: h.toTaskKey,
      uncertainty: h.uncertainty!.trim(),
    }));
}

export function countUnresolvedQuestions(mission: SupervisedMission): number {
  const record = ensureTeamCollaboration(mission);
  if (!record) return 0;
  return handoffQuestions(record.handoffs).length;
}

function collectOutputs(mission: SupervisedMission): InspectionOutput[] {
  const outputs: InspectionOutput[] = [];
  if (mission.proposal) {
    outputs.push({
      id: "comparison",
      label: "Options comparison",
      detail: mission.proposal.generation.label,
      productionLabel: mission.proposal.generation.label,
    });
  }
  if (mission.artefact) {
    outputs.push({
      id: "artefact",
      label: mission.artefact.title,
      detail: mission.artefact.decisionBrief?.slice(0, 160) ?? null,
      productionLabel: mission.artefact.provenance ?? null,
    });
  }
  if (mission.exportBody) {
    outputs.push({
      id: "export",
      label: "Decision pack export",
      detail: "Stored on the mission record.",
      productionLabel: null,
    });
  }
  if (mission.prototype) {
    outputs.push({
      id: "prototype",
      label: mission.prototype.title,
      detail: mission.prototype.approvedAt ? "Approved on record." : "Draft awaiting approval.",
      productionLabel: mission.prototype.honesty.label ?? null,
    });
  }
  const record = ensureTeamCollaboration(mission);
  if (record?.recommendation) {
    outputs.push({
      id: "agent-recommendation",
      label: "Agent recommendation",
      detail: record.recommendation.rationale.slice(0, 160),
      productionLabel: record.recommendation.executionLimited ? "execution-limited" : "on record",
    });
  }
  return outputs;
}

/** Derive a founder-readable inspection view — no fabricated dialogue. */
export function buildMissionInspection(mission: SupervisedMission): MissionInspection {
  const record = ensureTeamCollaboration(mission);
  const next = nextRequiredAction(mission);
  const decisionAttention = TERMINAL_NEXT.has(next.id) ? null : next;

  return {
    decisionAttention,
    unresolvedQuestions: record ? handoffQuestions(record.handoffs) : [],
    outputs: collectOutputs(mission),
    evidenceOnRecord: mission.evidence.map((e) => ({
      id: e.id,
      classification: e.classification,
      statement: e.statement,
    })),
    hasTeamRecord: Boolean(record),
  };
}
