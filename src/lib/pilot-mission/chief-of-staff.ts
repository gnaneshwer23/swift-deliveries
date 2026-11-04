/**
 * Chief of Staff (DX-001) answers about one supervised case.
 *
 * Deterministic: the reply is read from the saved record. Naming a specialist
 * looks up that role's tasks, handoffs and artefacts on the case. It does not
 * call another model. Nothing here changes the case — continue, stop and
 * document actions are cards until a person clicks.
 */
import { getCapability } from "@/lib/workforce/registry/load";
import { answerCaseQuestion } from "./case-questions";
import { nextGateLabel } from "./next-gate";
import { projectEnding } from "./project-ending";
import type { CaseArtefact, CaseHandoff } from "./case-room";
import type { TeamHandoff } from "./team-collaboration";
import type { PilotSpecialistTask } from "./specialist-team";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";
import { AGENT_RECOMMENDATION_LABELS, type AgentRecommendation } from "./verdict";

export const CHIEF_OF_STAFF_ID = "DX-001";

export function chiefOfStaffName(): string {
  return getCapability(CHIEF_OF_STAFF_ID)?.name ?? "Chief of Staff Agent";
}

export type CosDeliveryState =
  "running" | "waiting_on_you" | "paused" | "done" | "failed" | "cancelled" | null;

export type CosContext = {
  deliveryState?: CosDeliveryState;
  hasDelivery?: boolean;
};

export type CosActionKind =
  | "cancel_case"
  | "pause_investigation"
  | "resume_investigation"
  | "pause_delivery"
  | "resume_delivery"
  | "download_package";

export type CosAction = { kind: CosActionKind };

export type CosConsultation = {
  capabilityId: string;
  label: string;
  /** What the case actually holds for this role. */
  note: string;
};

export type CosReply = {
  text: string;
  basis: string;
  consulted: CosConsultation[];
  /** Always says whether a specialist lookup called another model. */
  lookupNote: string;
  action: CosAction | null;
};

const LOOKUP_NOTE =
  "Specialist notes are a structured lookup of that role's tasks, handoffs and artefacts on this case. No separate model was called.";

const NO_ROLE_NOTE =
  "No specialist was named, so this is read from the case record by Chief of Staff (DX-001) only. No separate model was called.";

const MISSING = "Not produced on this case.";

const ROLE_ROUTES: Array<{ id: string; pattern: RegExp }> = [
  { id: "DX-021", pattern: /\b(markets?|competitors?|segments?)\b/i },
  { id: "DX-020", pattern: /\b(research|findings?|synthesis)\b/i },
  { id: "DX-018", pattern: /\b(evidence|sources?|integrity)\b/i },
  { id: "DX-002", pattern: /\b(problem|framing|objectives?)\b/i },
  { id: "DX-023", pattern: /\b(prds?|requirements?|product manager|aria)\b/i },
  { id: "DX-035", pattern: /\b(prototypes?|ux|designs?)\b/i },
  { id: "DX-071", pattern: /\b(qas?|quality|tests?|reliab\w*)\b/i },
  { id: "DX-001", pattern: /\b(chief of staff|programme|program|handoffs?)\b/i },
];

function straight(text: string): string {
  return text.trim().replace(/[\u2018\u2019]/g, "'");
}

function roleLabel(id: string): string {
  return getCapability(id)?.name ?? id;
}

export function usageBudgetLines(mission: SupervisedMission): string[] {
  const lines: string[] = [];
  if (mission.usageCeiling > 0) {
    const remaining = Math.max(0, mission.usageCeiling - mission.usageConsumed);
    lines.push(`Usage ceiling on this case: ${mission.usageCeiling} units.`);
    lines.push(`Usage consumed: ${mission.usageConsumed} units.`);
    lines.push(
      remaining === 0
        ? "Nothing remains before the hard stop. Further billable steps are stopped."
        : `${remaining} units remain before the hard stop.`,
    );
  } else {
    lines.push("No usage ceiling is recorded on this case, so the usage budget is unknown.");
  }
  if (mission.spendRecords.length) {
    lines.push("Itemised spend on the record:");
    for (const spend of mission.spendRecords) {
      lines.push(`• ${spend.units} units — ${spend.reason}`);
    }
  } else {
    lines.push("No itemised spend records are stored.");
  }
  lines.push(
    "No currency amount is recorded on this case. The continuation plan does not store a money estimate. This answer does not invent one.",
  );
  return lines;
}

function reply(input: {
  text: string;
  basis: string;
  consulted?: CosConsultation[];
  action?: CosAction | null;
  namedRole?: boolean;
}): CosReply {
  const consulted = input.consulted ?? [];
  return {
    text: input.text,
    basis: input.basis,
    consulted,
    lookupNote: input.namedRole || consulted.length ? LOOKUP_NOTE : NO_ROLE_NOTE,
    action: input.action ?? null,
  };
}

function tasksFor(mission: SupervisedMission, id: string, label: string): PilotSpecialistTask[] {
  return (mission.team?.tasks ?? []).filter(
    (task) => task.capabilityId === id || task.ownerLabel === label,
  );
}

function handoffLines(mission: SupervisedMission, id: string, label: string): string[] {
  const team = (mission.teamCollaboration?.handoffs ?? []).filter(
    (handoff: TeamHandoff) =>
      handoff.fromActor === id ||
      handoff.toActor === id ||
      handoff.fromActor === label ||
      handoff.toActor === label,
  );
  const room = (mission.caseRoom?.handoffs ?? []).filter(
    (handoff: CaseHandoff) =>
      handoff.fromOwnerKey === id ||
      handoff.toOwnerKey === id ||
      handoff.fromLabel === label ||
      handoff.toLabel === label,
  );
  return [
    ...team.map((handoff) => `Handoff: ${handoff.findingSummary}`),
    ...room.map((handoff) => `Handoff: ${handoff.finding}`),
  ];
}

function artefactsFor(mission: SupervisedMission, id: string, label: string): CaseArtefact[] {
  return (mission.caseRoom?.artefacts ?? []).filter(
    (artefact) => artefact.ownerKey === id || artefact.ownerLabel === label,
  );
}

function consultRole(mission: SupervisedMission, id: string): CosConsultation {
  const registryName = roleLabel(id);
  const tasks = tasksFor(mission, id, registryName);
  const recordedLabel =
    tasks.find((task) => task.capabilityId === id)?.ownerLabel ??
    (mission.continuationPlan?.roles ?? []).find((role) => role.capabilityId === id)?.label ??
    registryName;
  const handoffs = handoffLines(mission, id, recordedLabel);
  const artefacts = artefactsFor(mission, id, recordedLabel);
  const continuation = (mission.continuationPlan?.roles ?? []).filter(
    (role) => role.capabilityId === id || role.label === recordedLabel,
  );
  const heading =
    recordedLabel === registryName
      ? `${recordedLabel} (${id})`
      : `${recordedLabel} (${id}). Registry name: ${registryName}.`;
  if (!tasks.length && !handoffs.length && !artefacts.length && !continuation.length) {
    return {
      capabilityId: id,
      label: recordedLabel,
      note: `${heading} has no tasks, handoffs or artefacts on this case. ${MISSING}`,
    };
  }
  const lines: string[] = [];
  for (const task of tasks) {
    lines.push(
      `Task: ${task.title} · ${task.status}${task.blockedReason ? ` · ${task.blockedReason}` : ""}. Produces: ${task.produces}`,
    );
  }
  for (const role of continuation) {
    lines.push(`Continuation role (${role.label}): ${role.responsibility}. ${role.why}`);
  }
  lines.push(...handoffs);
  for (const artefact of artefacts) {
    lines.push(`Artefact: ${artefact.title} · ${artefact.status}`);
  }
  return { capabilityId: id, label: recordedLabel, note: `${heading}\n${lines.join("\n")}` };
}

function matchedRoles(question: string): string[] {
  const ids: string[] = [];
  for (const route of ROLE_ROUTES) {
    if (route.pattern.test(question) && !ids.includes(route.id)) ids.push(route.id);
  }
  return ids;
}

function consultationText(consulted: CosConsultation[]): string {
  if (!consulted.length) return "";
  return consulted
    .map((item) => `${item.label} (${item.capabilityId}):\n${item.note}`)
    .join("\n\n");
}

function withConsultation(
  mission: SupervisedMission,
  question: string,
  body: string,
  basis: string,
  action: CosAction | null = null,
): CosReply {
  const consulted = matchedRoles(question).map((id) => consultRole(mission, id));
  const extra = consultationText(consulted);
  const aria = /\baria\b|product manager/i.test(question)
    ? "\n\nAria is the product-manager path: plan, options and the next product step. Chief of Staff answers programme and operations questions and prepares the package. This does not replace Aria."
    : "";
  return reply({
    text: extra ? `${body}${aria}\n\n${extra}` : `${body}${aria}`,
    basis,
    consulted,
    namedRole: consulted.length > 0,
    action,
  });
}

function gateLine(mission: SupervisedMission): string {
  const ending = projectEnding(mission);
  const next = nextRequiredAction(mission);
  const label = ending.nextHumanGate ?? nextGateLabel(next);
  return `Next human gate: ${label}. ${next.detail}`;
}

function controlRefusal(text: string): CosReply | null {
  if (
    /\b(?:don't|do not|never)\s+(?:please\s+)?(?:cancel|stop|pause|resume|continue|hold)\b/i.test(
      text,
    )
  ) {
    return reply({
      text: "Understood. I will not cancel, pause, resume or continue anything. Nothing has changed.",
      basis: "The request was a refusal, so no control is offered",
    });
  }
  return null;
}

function prepareReply(mission: SupervisedMission, question: string): CosReply {
  const ready = Boolean(mission.artefact || mission.exportBody || mission.delivery);
  return withConsultation(
    mission,
    question,
    ready
      ? "I can prepare the project package from this case: the saved Markdown archive, plus editable DOCX files and a slide deck rendered from the record. Sections without saved data are labelled “Not produced on this case.” Nothing is downloaded until you click."
      : "I can prepare editable DOCX files and a slide deck from what this case has saved so far. The fuller Markdown archive is not ready yet. Nothing is downloaded until you click.",
    "Package render from the saved case",
    { kind: "download_package" },
  );
}

function cancelReply(mission: SupervisedMission): CosReply {
  if (mission.stage === "cancelled") {
    return reply({
      text: "This case is already cancelled. Nothing further runs, and there is nothing new to confirm.",
      basis: "Case stage on the record",
    });
  }
  return reply({
    text: "Stopping mid-project cancels this case and any delivery it started. Billable steps stop. I have not cancelled anything. Confirm below if that is what you want.",
    basis: "Cancel control — waits for a click",
    action: { kind: "cancel_case" },
  });
}

function pauseReply(mission: SupervisedMission, text: string, context: CosContext): CosReply {
  const aboutDelivery = /\b(build|delivery)\b/i.test(text);
  if (aboutDelivery && context.hasDelivery) {
    if (context.deliveryState === "paused") {
      return reply({
        text: "The delivery build is already paused. Say continue the build if you want a resume button. Nothing has changed.",
        basis: "Delivery state on the record",
      });
    }
    if (
      context.deliveryState === "done" ||
      context.deliveryState === "cancelled" ||
      context.deliveryState === "failed"
    ) {
      return reply({
        text: `The delivery build is ${context.deliveryState}, so pause does not apply. Nothing has changed.`,
        basis: "Delivery state on the record",
      });
    }
    return reply({
      text: "Pausing the build stops further delivery steps until you resume it. Work already in flight can finish. I have not paused it.",
      basis: "Pause delivery — waits for a click",
      action: { kind: "pause_delivery" },
    });
  }
  if (mission.studioMeta?.investigationPaused) {
    return reply({
      text: "The investigation is already paused. Research steps stay blocked until you resume. Nothing has changed.",
      basis: "Studio pause flag on the record",
    });
  }
  return reply({
    text: "Pausing the investigation blocks further research steps. It does not by itself cancel the case or pass a gate. I have not paused it.",
    basis: "Pause investigation — waits for a click",
    action: { kind: "pause_investigation" },
  });
}

function continueReply(mission: SupervisedMission, text: string, context: CosContext): CosReply {
  if (mission.stage === "cancelled") {
    return reply({
      text: "This case is cancelled, so it cannot be continued from chat. Nothing has changed.",
      basis: "Case stage on the record",
    });
  }
  const aboutDelivery = /\b(build|delivery)\b/i.test(text);
  const investigationPaused = Boolean(mission.studioMeta?.investigationPaused);
  const deliveryPaused = context.deliveryState === "paused" && Boolean(context.hasDelivery);
  if (aboutDelivery && deliveryPaused) {
    return reply({
      text: "The delivery build is paused. Confirming resumes that build under the approval already on the record. It does not pass a human gate or approve new external work. Nothing resumes until you click.",
      basis: "Resume delivery — waits for a click",
      action: { kind: "resume_delivery" },
    });
  }
  if (investigationPaused && !aboutDelivery) {
    const also = deliveryPaused
      ? " The delivery build is also paused; say continue the build if you want that resume button."
      : "";
    return reply({
      text: `The investigation is paused. Confirming allows research steps to run again. It does not approve a plan or pass a gate.${also} Nothing resumes until you click.`,
      basis: "Resume investigation — waits for a click",
      action: { kind: "resume_investigation" },
    });
  }
  if (deliveryPaused) {
    return reply({
      text: "The delivery build is paused. Confirming resumes it under the approval already on the record. It does not pass a human gate. Nothing resumes until you click.",
      basis: "Resume delivery — waits for a click",
      action: { kind: "resume_delivery" },
    });
  }
  return reply({
    text: `Nothing is paused, so there is no continue button to press. ${gateLine(mission)} Continuing billable work still needs that control on the page. I have not approved a plan, passed a gate, or started a step.`,
    basis: "Next human gate on the case record",
  });
}

function budgetReply(mission: SupervisedMission, question: string): CosReply {
  return withConsultation(
    mission,
    question,
    usageBudgetLines(mission).join("\n"),
    "Usage ceiling, usage consumed and spend records on the case",
  );
}

function recommendationReply(mission: SupervisedMission, question: string): CosReply {
  const recorded =
    mission.approval?.agentRecommendation ??
    mission.continuationPlan?.derivedFrom.agentRecommendation;
  const label =
    recorded && recorded in AGENT_RECOMMENDATION_LABELS
      ? AGENT_RECOMMENDATION_LABELS[recorded as AgentRecommendation]
      : null;
  const body = label
    ? `The recommendation stored on the case is: ${label}. It stays a draft until you record the decision yourself. I am not issuing a new one.`
    : "No recommendation is stored on this case yet. I will not draft one from outside the record.";
  return withConsultation(mission, question, body, "Recommendation fields on the case record");
}

export function consultChiefOfStaff(
  mission: SupervisedMission,
  question: string,
  context: CosContext = {},
): CosReply {
  const text = straight(question);
  if (!text) {
    return reply({
      text: "Ask about this case — budget, evidence, the team, the next gate — or ask me to prepare documents, continue, or stop.",
      basis: "No question was entered",
    });
  }

  const refused = controlRefusal(text);
  if (refused) return refused;

  if (/^(?:please\s+)?(?:stop|stop talking|be quiet|silence)[.!]?$/i.test(text)) {
    return reply({
      text: "Stopping this chat does not cancel or pause the case. Say cancel the case, or pause the investigation, if you want a confirm button for that.",
      basis: "Chat silence is not a case control",
    });
  }

  if (
    /\b(?:prepare|draft|generate|update|make|export|download)\b[\s\S]{0,80}\b(?:documents?|docx|pptx|slides?|deck|package|charter|brief|charts?)\b/i.test(
      text,
    ) ||
    /\b(?:decision charts?|project package|slide deck|prepare documents)\b/i.test(text)
  ) {
    return prepareReply(mission, text);
  }

  if (
    /\b(?:cancel(?:\s+the)?\s+(?:case|mission|project)|cancel it|stop(?:\s+the)?\s+(?:case|project|mission)|stop mid-?project|end the project)\b/i.test(
      text,
    ) ||
    /^(?:please\s+)?cancel\b/i.test(text)
  ) {
    return cancelReply(mission);
  }

  if (
    /\b(?:pause|put (?:this|it) on hold|hold the (?:case|investigation|build|delivery))\b/i.test(
      text,
    )
  ) {
    return pauseReply(mission, text, context);
  }

  if (/\b(?:resume|continue|carry on|keep going|unpause)\b/i.test(text)) {
    return continueReply(mission, text, context);
  }

  if (/\b(?:budget|cost|spend|ceiling|units?)\b/i.test(text)) {
    return budgetReply(mission, text);
  }

  if (/\b(?:recommend\w*)\b/i.test(text)) {
    return recommendationReply(mission, text);
  }

  const fromRecord = answerCaseQuestion(mission, text);
  const namedRole = matchedRoles(text).length > 0;
  const body =
    fromRecord.topic === "change_request"
      ? "I can't approve a plan, pass a gate, or change scope from chat. Those stay on the controls on this page. Nothing has changed."
      : fromRecord.topic === "unknown" && namedRole
        ? "Here is what this case holds for the role you named. I am not adding a finding beyond that."
        : fromRecord.topic === "unknown"
          ? `${gateLine(mission)}\n\nI answer from this case's saved record: budget, evidence, risks, the team, options, your decision, or the next gate. Ask me to prepare documents, continue, or stop if you want a confirm button.`
          : fromRecord.text;
  return withConsultation(mission, text, body, fromRecord.basis);
}

export function cosActionLabel(kind: CosActionKind): string {
  switch (kind) {
    case "cancel_case":
      return "Confirm cancel";
    case "pause_investigation":
      return "Confirm pause";
    case "resume_investigation":
      return "Confirm resume";
    case "pause_delivery":
      return "Confirm pause build";
    case "resume_delivery":
      return "Confirm resume build";
    case "download_package":
      return "Download project package";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
