/**
 * Delivery hand-off: a decided Studio case starts a workforce build mission.
 *
 * Pure rules only. The owner's "Begin delivery" click is the approval: it binds the
 * workforce plan version that will run. Lifecycle gates (scope, design, release) stay
 * human-only on the delivery mission; nothing here passes them.
 */
import { productMissionTasks, wantsExternal } from "@/lib/workforce/lifecycle";
import { activityEvent } from "./specialist-team";
import type { SupervisedDelivery, SupervisedMission } from "./types";
import { normalizeDecisionChoice } from "./verdict";

export type DeliveryEligibility = { ok: true } | { ok: false; reason: string };

export function deliveryEligibility(mission: SupervisedMission): DeliveryEligibility {
  if (mission.delivery) return { ok: false, reason: "Delivery has already started for this case." };
  if (mission.stage === "cancelled") return { ok: false, reason: "This case is cancelled." };
  if (mission.studioMeta?.investigationPaused) {
    return { ok: false, reason: "This case is paused. Resume it before starting delivery." };
  }
  const approval = mission.approval;
  if (!approval) {
    return {
      ok: false,
      reason: "Record your decision first. Delivery builds an approved direction.",
    };
  }
  if (normalizeDecisionChoice(approval.choice) !== "authorise_bounded_test") {
    return {
      ok: false,
      reason:
        "Your recorded decision is not to build yet (more evidence, a revision or closing the case). Record an approved direction to begin delivery.",
    };
  }
  const proposal = mission.proposal;
  // The decision must be bound to the options on the case now, not an earlier draft.
  if (
    !proposal ||
    approval.version !== proposal.version ||
    approval.scopeHash !== proposal.scopeHash ||
    !proposal.options.some((o) => o.id === approval.optionId)
  ) {
    return {
      ok: false,
      reason: "The option your decision names is no longer on the case. Record the decision again.",
    };
  }
  return { ok: true };
}

const MAX_REQUEST = 4000;
const MAX_EVIDENCE = 8;

/**
 * What the delivery mission is asked to build, from the case record only: the idea, the
 * chosen option, the owner's note, the brief, and the case's evidence register with sources.
 */
export function deliveryRequest(mission: SupervisedMission): {
  requestText: string;
  clarificationAnswers: Record<string, string>;
} {
  const approval = mission.approval!;
  const option = mission.proposal!.options.find((o) => o.id === approval.optionId)!;
  const question = mission.brief.question.trim();
  const requestText = [
    `Build the first version of: ${question}`,
    `Chosen direction: ${option.title}${option.tradeoff ? ` — ${option.tradeoff}` : ""}`,
    approval.note.trim() ? `Owner note: ${approval.note.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_REQUEST);

  const evidence = mission.evidence
    .slice(0, MAX_EVIDENCE)
    .map(
      (e) =>
        `[${e.classification}] ${e.statement.trim()}${e.source ? ` (source: ${e.source})` : ""}`,
    )
    .join("\n");

  // Keys the workforce planner asks for (`users`, `success`, `constraints`).
  const answers: Record<string, string> = {
    users: mission.brief.audience.trim(),
    success: mission.brief.outcome.trim(),
    constraints: mission.brief.constraints.trim(),
    chosen_direction: option.title,
    studio_evidence: evidence.slice(0, 2000),
  };
  return {
    requestText,
    clarificationAnswers: Object.fromEntries(Object.entries(answers).filter(([, v]) => v)),
  };
}

/**
 * The stages the delivery mission will run and their estimated usage, from the same lifecycle
 * and outside-action rule the planner uses, so the approval screen shows the plan approved.
 */
export function deliveryPlanPreview(mission: SupervisedMission): {
  stages: Array<{ key: string; title: string; gate: boolean; outside: boolean }>;
  estimatedUsage: number;
} {
  const { requestText, clarificationAnswers } = deliveryRequest(mission);
  const tasks = productMissionTasks(requestText, wantsExternal(requestText, clarificationAnswers));
  return {
    stages: tasks.map((t) => ({
      key: t.key,
      title: t.title,
      gate: Boolean(t.gate),
      outside: t.isExternal,
    })),
    estimatedUsage: tasks.reduce((sum, t) => sum + t.estimatedUsage, 0),
  };
}

/** The case after delivery starts: the link, a new version and one activity event. */
export function withDelivery(
  mission: SupervisedMission,
  delivery: SupervisedDelivery,
): SupervisedMission {
  return {
    ...mission,
    delivery,
    version: mission.version + 1,
    updatedAt: delivery.approvedAt,
    activity: [
      ...(mission.activity ?? []),
      activityEvent({
        at: delivery.approvedAt,
        taskKey: null,
        kind: "delivery.approved",
        summary:
          "You approved delivery. The build mission starts with the charter; scope, design and release still wait on your approval.",
        actor: "human",
      }),
    ],
  };
}
