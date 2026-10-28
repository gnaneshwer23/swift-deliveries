/**
 * P-C Act C — case room exposing the persistent case record.
 * Agent folders, role artefacts, handoffs, and information-flow edges.
 */
import type { ContinuationPlan } from "./continuation-plan";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
} from "./verdict";

export type CaseArtefactStatus =
  | "planned"
  | "draft"
  | "ready_for_review"
  | "accepted"
  | "blocked";

export type CaseArtefact = {
  id: string;
  type: string;
  title: string;
  body: string;
  ownerKey: string;
  ownerLabel: string;
  status: CaseArtefactStatus;
  consumesArtefactIds: string[];
  evidenceIds: string[];
  createdAt: string;
  origin: "human" | "AI" | "mixed";
  evidenceBasis: "retrieved_source" | "supplied_evidence" | "inference" | "synthetic";
};

export type CaseHandoff = {
  id: string;
  fromOwnerKey: string;
  toOwnerKey: string;
  fromLabel: string;
  toLabel: string;
  finding: string;
  evidenceRefs: string[];
  request: string;
  result: string | null;
  artefactId: string | null;
  at: string;
};

export type CaseAgentFolder = {
  ownerKey: string;
  label: string;
  capabilityId: string | null;
  responsibility: string;
  why: string;
  artefactIds: string[];
  inboundHandoffIds: string[];
  outboundHandoffIds: string[];
};

export type CaseFlowEdge = {
  id: string;
  fromOwnerKey: string;
  toOwnerKey: string;
  label: string;
  handoffId: string;
};

export type CaseStepGate = "proceed" | "revise" | "pause" | "stop";

export type CaseRoom = {
  version: "case-room-v1";
  /** Same as mission id — one persistent case. */
  caseId: string;
  openedAt: string;
  folders: CaseAgentFolder[];
  artefacts: CaseArtefact[];
  handoffs: CaseHandoff[];
  flowEdges: CaseFlowEdge[];
  openAsks: string[];
  stepGate: CaseStepGate | null;
  stepGateNote: string;
  stepGateAt: string | null;
  linkedDecision: {
    agentRecommendation: string | null;
    humanNextPath: string;
    optionId: string;
  };
};

function ownerKey(capabilityId: string | null, label: string): string {
  return capabilityId ?? `human:${label}`;
}

function evidenceLines(mission: SupervisedMission): string {
  return (
    mission.evidence
      .map((e) => `- [${e.classification}] ${e.id}: ${e.statement}`)
      .join("\n") || "- None recorded."
  );
}

function draftBody(
  type: string,
  mission: SupervisedMission,
  plan: ContinuationPlan,
  blocked: boolean,
): string {
  const path = plan.derivedFrom.humanNextPath;
  const rec = plan.derivedFrom.agentRecommendation
    ? AGENT_RECOMMENDATION_LABELS[plan.derivedFrom.agentRecommendation]
    : "not recorded";
  const header = [
    `# ${type}`,
    ``,
    `Case: ${mission.brief.question}`,
    `Authorised path: ${HUMAN_NEXT_PATH_LABELS[path]}`,
    `Act A recommendation (on record): ${rec}`,
    blocked ? `Status: BLOCKED — ${plan.executionBlockedReason}` : `Status: draft`,
    ``,
  ];
  if (type === "close-summary") {
    return [
      ...header,
      `## Close`,
      `This case is closed for the current proposition under the recorded human path.`,
      `Act A decision pack remains the diligence record.`,
      ``,
      `## Evidence carried forward`,
      evidenceLines(mission),
    ].join("\n");
  }
  if (type === "research-memo") {
    return [
      ...header,
      `## Findings`,
      evidenceLines(mission),
      ``,
      `## Counterevidence / gaps`,
      mission.evidence
        .filter((e) => e.classification === "gap" || e.classification === "assumption")
        .map((e) => `- ${e.statement}`)
        .join("\n") || "- None labelled.",
      ``,
      `## Consumed from Act A`,
      `This memo must not invent customers or interviews. Synthetic content stays labelled.`,
    ].join("\n");
  }
  if (type === "chosen-path-brief") {
    return [
      ...header,
      `## Chosen path`,
      HUMAN_NEXT_PATH_LABELS[path],
      ``,
      `## Bounds`,
      mission.brief.constraints || "None recorded.",
      ``,
      `## Not in this step`,
      plan.notIncluded.map((n) => `- ${n}`).join("\n"),
    ].join("\n");
  }
  if (type === "evidence-collection-plan" || type === "test-evidence-plan") {
    return [
      ...header,
      `## What to gather or test`,
      mission.evidence
        .filter((e) => e.classification === "gap")
        .map((e) => `- ${e.statement}`)
        .join("\n") || "- No gaps labelled — confirm scope before proceeding.",
      ``,
      `## Falsifiers`,
      `- Evidence that would change or reverse the Act A recommendation.`,
      ``,
      `## Completion criteria`,
      blocked
        ? "Blocked until declared inputs arrive."
        : "Record owner-supplied observation before treating the test as reviewed.",
    ].join("\n");
  }
  if (type === "unresolved-risk-register") {
    return [
      ...header,
      `## Unresolved risks`,
      plan.unresolvedRisks.map((r) => `- ${r}`).join("\n") || "- None recorded.",
      ``,
      `## Note`,
      `Founder-requested continuation does not imply agent endorsement.`,
    ].join("\n");
  }
  if (type === "prd-lite") {
    return [
      ...header,
      `## Intent`,
      `Minimal change description only if the bounded test includes a product change.`,
      ``,
      `## Out of scope`,
      `- Full product build`,
      `- Features not required for the authorised test`,
    ].join("\n");
  }
  return [
    ...header,
    `## Notes`,
    `Draft artefact for type “${type}”. Consume upstream case artefacts before expanding.`,
    ``,
    `## Evidence`,
    evidenceLines(mission),
  ].join("\n");
}

/** Seed case room from continuation plan + Act A mission state. */
export function buildCaseRoom(input: {
  mission: SupervisedMission;
  plan: ContinuationPlan;
  nowMs: number;
}): CaseRoom {
  const { mission, plan } = input;
  const at = new Date(input.nowMs).toISOString();
  const blocked = plan.executionBlocked;
  const evidenceIds = mission.evidence.map((e) => e.id);

  const artefacts: CaseArtefact[] = [];
  const handoffs: CaseHandoff[] = [];
  const byType = new Map<string, CaseArtefact>();

  const roleByLabel = new Map(
    plan.roles.map((r) => [r.label, r] as const),
  );

  for (const planned of plan.plannedArtefacts) {
    const role = roleByLabel.get(planned.ownerLabel);
    const key = ownerKey(role?.capabilityId ?? null, planned.ownerLabel);
    const id = `art-${planned.type}`;
    const status: CaseArtefactStatus = blocked
      ? planned.type === "evidence-collection-plan" || planned.type === "chosen-path-brief"
        ? "draft"
        : "blocked"
      : plan.kind === "close"
        ? "draft"
        : "draft";
    const art: CaseArtefact = {
      id,
      type: planned.type,
      title: planned.type.replaceAll("-", " "),
      body: draftBody(planned.type, mission, plan, blocked && status === "blocked"),
      ownerKey: key,
      ownerLabel: planned.ownerLabel,
      status,
      consumesArtefactIds: [],
      evidenceIds: evidenceIds.slice(0, 8),
      createdAt: at,
      origin: planned.ownerLabel.includes("Founder") ? "human" : "AI",
      evidenceBasis: evidenceIds.length ? "supplied_evidence" : "inference",
    };
    artefacts.push(art);
    byType.set(planned.type, art);
  }

  // Wire collaboration: later artefacts consume earlier ones when present.
  const chain: Array<[string, string, string, string]> = [
    // fromType, toType, finding, request
    [
      "research-memo",
      "chosen-path-brief",
      "Act A findings and gaps summarised for the authorised path.",
      "Bound the next step and exclusions from the memo.",
    ],
    [
      "chosen-path-brief",
      "test-evidence-plan",
      "Path bounds and exclusions stated.",
      "Define falsifiers and observation criteria for this path.",
    ],
    [
      "chosen-path-brief",
      "evidence-collection-plan",
      "Missing inputs listed for the pause path.",
      "Publish collection plan; keep build steps blocked.",
    ],
    [
      "research-memo",
      "reframing-plan",
      "Evidence argues the proposition as stated is weak.",
      "Propose a narrower investigation — not a PRD.",
    ],
    [
      "test-evidence-plan",
      "prd-lite",
      "Test criteria ready for a product-change experiment.",
      "Draft PRD-lite only if a change is in scope.",
    ],
    [
      "chosen-path-brief",
      "unresolved-risk-register",
      "Continuation proceeds despite recommendation.",
      "Keep risks visible on every downstream artefact.",
    ],
  ];

  for (const [fromType, toType, finding, request] of chain) {
    const from = byType.get(fromType);
    const to = byType.get(toType);
    if (!from || !to) continue;
    to.consumesArtefactIds = [...new Set([...to.consumesArtefactIds, from.id])];
    const hid = `ho-${fromType}-to-${toType}`;
    handoffs.push({
      id: hid,
      fromOwnerKey: from.ownerKey,
      toOwnerKey: to.ownerKey,
      fromLabel: from.ownerLabel,
      toLabel: to.ownerLabel,
      finding,
      evidenceRefs: from.evidenceIds.slice(0, 4),
      request,
      result: to.status === "blocked" ? null : `Draft “${to.type}” produced from “${from.type}”.`,
      artefactId: to.id,
      at,
    });
  }

  const folders: CaseAgentFolder[] = plan.roles.map((r) => {
    const key = ownerKey(r.capabilityId, r.label);
    const artefactIds = artefacts.filter((a) => a.ownerKey === key).map((a) => a.id);
    const inboundHandoffIds = handoffs.filter((h) => h.toOwnerKey === key).map((h) => h.id);
    const outboundHandoffIds = handoffs.filter((h) => h.fromOwnerKey === key).map((h) => h.id);
    return {
      ownerKey: key,
      label: r.label,
      capabilityId: r.capabilityId,
      responsibility: r.responsibility,
      why: r.why,
      artefactIds,
      inboundHandoffIds,
      outboundHandoffIds,
    };
  });

  const flowEdges: CaseFlowEdge[] = handoffs.map((h) => ({
    id: `edge-${h.id}`,
    fromOwnerKey: h.fromOwnerKey,
    toOwnerKey: h.toOwnerKey,
    label: h.finding.slice(0, 80),
    handoffId: h.id,
  }));

  const openAsks: string[] = [];
  if (blocked) {
    openAsks.push(
      plan.executionBlockedReason ??
        "Provide missing evidence before unblocking downstream continuation steps.",
    );
  }
  for (const gap of mission.evidence.filter((e) => e.classification === "gap").slice(0, 5)) {
    openAsks.push(`Evidence gap: ${gap.statement}`);
  }

  const approval = mission.approval!;
  const humanNextPath = approval.humanNextPath ?? normalizeDecisionChoice(approval.choice);

  return {
    version: "case-room-v1",
    caseId: mission.id,
    openedAt: at,
    folders,
    artefacts,
    handoffs,
    flowEdges,
    openAsks,
    stepGate: null,
    stepGateNote: "",
    stepGateAt: null,
    linkedDecision: {
      agentRecommendation: approval.agentRecommendation
        ? AGENT_RECOMMENDATION_LABELS[approval.agentRecommendation]
        : null,
      humanNextPath: HUMAN_NEXT_PATH_LABELS[humanNextPath],
      optionId: approval.optionId,
    },
  };
}

export function applyCaseStepGate(
  room: CaseRoom,
  gate: CaseStepGate,
  note: string,
  nowMs: number,
): CaseRoom {
  return {
    ...room,
    stepGate: gate,
    stepGateNote: note.trim().slice(0, 2000),
    stepGateAt: new Date(nowMs).toISOString(),
  };
}

export function caseRoomTraceLines(artefact: CaseArtefact, room: CaseRoom): string[] {
  const lines: string[] = [
    `Origin: ${artefact.origin}`,
    `Evidence basis: ${artefact.evidenceBasis}`,
    `Status: ${artefact.status}`,
  ];
  for (const id of artefact.consumesArtefactIds) {
    const up = room.artefacts.find((a) => a.id === id);
    lines.push(`Consumes: ${up ? `${up.title} (${up.ownerLabel})` : id}`);
  }
  if (artefact.evidenceIds.length) {
    lines.push(`Act A evidence ids: ${artefact.evidenceIds.join(", ")}`);
  }
  lines.push(
    `Decision: ${room.linkedDecision.humanNextPath}` +
      (room.linkedDecision.agentRecommendation
        ? ` · Act A rec: ${room.linkedDecision.agentRecommendation}`
        : ""),
  );
  return lines;
}
