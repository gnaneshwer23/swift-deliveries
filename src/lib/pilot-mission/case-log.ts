/**
 * Evidence and decision log for one case (Studio Screen 12), read from the saved record only.
 *
 * Decisions: what was decided, who proposed it, what the owner chose, the alternatives, the
 * evidence behind it and what it changed. Evidence: every register item with a precise label.
 * Nothing is inferred beyond the record; missing fields are said to be missing.
 */
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
} from "./verdict";
import type { EvidenceItem, SupervisedMission } from "./types";

export type DecisionEntry = {
  id: string;
  at: string;
  title: string;
  /** Who proposed what the owner approved. */
  proposedBy: string;
  /** What the owner did. */
  approved: string;
  alternatives: string[];
  basis: string[];
  changed: string;
  /** Set when the decision no longer applies. */
  superseded: string | null;
};

/** Evidence labels from the brief; "Sample" never appears on a case's own register. */
export type EvidenceLabel = "Source-backed" | "User-provided" | "Assumption" | "Unverified";

export type EvidenceEntry = {
  id: string;
  statement: string;
  source: string | null;
  label: EvidenceLabel;
};

const optionTitle = (mission: SupervisedMission, optionId: string) =>
  mission.proposal?.options.find((o) => o.id === optionId)?.title ?? `option ${optionId}`;

export function evidenceLabel(item: EvidenceItem): EvidenceLabel {
  if (item.classification === "assumption") return "Assumption";
  if (item.classification === "gap") return "Unverified";
  return /^https?:\/\//i.test(item.source.trim()) ? "Source-backed" : "User-provided";
}

export function evidenceRegister(mission: SupervisedMission): EvidenceEntry[] {
  return mission.evidence.map((item) => ({
    id: item.id,
    statement: item.statement,
    source: item.source.trim() || null,
    label: evidenceLabel(item),
  }));
}

export function decisionLog(mission: SupervisedMission): DecisionEntry[] {
  const entries: DecisionEntry[] = [];
  const evidenceBasis = () => {
    const register = evidenceRegister(mission);
    const count = (label: EvidenceLabel) => register.filter((e) => e.label === label).length;
    return [
      `${count("Source-backed")} source-backed, ${count("User-provided")} user-provided`,
      `${count("Assumption")} assumptions and ${count("Unverified")} unverified points open`,
    ];
  };

  if (mission.team?.approvedAt) {
    entries.push({
      id: "plan",
      at: mission.team.approvedAt,
      title: "Investigation plan approved",
      proposedBy: "Aria (PM) with the specialist plan",
      approved: "You approved the brief and specialist plan; research could start.",
      alternatives: [],
      basis: [`Brief: ${mission.brief.question}`],
      changed: "Research pass queued against the approved brief.",
      superseded: null,
    });
  }

  const decision = (
    approval: NonNullable<SupervisedMission["approval"]>,
    superseded: string | null,
    id: string,
  ): DecisionEntry => {
    const path = HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(approval.choice)];
    const recommendation = approval.agentRecommendation
      ? AGENT_RECOMMENDATION_LABELS[approval.agentRecommendation]
      : null;
    return {
      id,
      at: approval.decidedAt,
      title: `Direction: ${optionTitle(mission, approval.optionId)}`,
      proposedBy: recommendation
        ? `Aria's draft recommendation: ${recommendation}${
            approval.disagreesWithRecommendation ? " (you chose differently)" : ""
          }`
        : "No recommendation was recorded with this decision.",
      approved: `${path}${approval.note ? ` — "${approval.note}"` : ""}`,
      alternatives: (mission.proposal?.options ?? [])
        .filter((o) => o.id !== approval.optionId)
        .map((o) => `${o.title} — ${o.tradeoff}`),
      basis: evidenceBasis(),
      changed:
        normalizeDecisionChoice(approval.choice) !== "authorise_bounded_test"
          ? "No build was authorised; the case stays in investigation."
          : mission.delivery && !superseded
            ? "The team was matched to this direction, and you approved its delivery."
            : "The team was matched to this direction; delivery can start from the team.",
      superseded,
    };
  };

  for (const [index, old] of mission.invalidatedApprovals.entries()) {
    entries.push(decision(old, old.reason, `invalidated-${index}`));
  }
  if (mission.approval) entries.push(decision(mission.approval, null, "decision"));

  if (mission.delivery) {
    entries.push({
      id: "delivery",
      at: mission.delivery.approvedAt,
      title: "Delivery approved",
      proposedBy: "Aria (PM): the staged build plan for the chosen direction",
      approved: `You approved delivery plan version ${mission.delivery.planVersion}. Outside actions were not approved.`,
      alternatives: [],
      basis: [`Builds ${optionTitle(mission, mission.delivery.optionId)}`],
      changed: "A build mission started; the brief and evidence are now fixed.",
      superseded: mission.stage === "cancelled" ? "The case was cancelled." : null,
    });
  }

  if (mission.expectation) {
    entries.push({
      id: "expectation",
      at: mission.expectation.recordedAt,
      title: "Expected result recorded",
      proposedBy: "You",
      approved: `${mission.expectation.hypothesis} — metric: ${mission.expectation.expectedMetric}`,
      alternatives: [],
      basis: [`Baseline: ${mission.expectation.baseline}`],
      changed: `Observation window: ${mission.expectation.observationWindow}`,
      superseded: null,
    });
  }

  if (mission.prototype) {
    entries.push({
      id: "prototype",
      at: mission.prototype.approvedAt,
      title: "Prototype approved",
      proposedBy: mission.prototype.ownerLabel,
      approved: "You approved the sandboxed HTML prototype.",
      alternatives: [],
      basis: [mission.prototype.honesty.label],
      changed: mission.prototype.verified
        ? "Static checks passed."
        : (mission.prototype.failureDetail ?? "Static checks reported failures."),
      superseded: null,
    });
  }

  for (const [index, review] of mission.reviews.entries()) {
    entries.push({
      id: `review-${index}`,
      at: review.createdAt,
      title: "Result reviewed",
      proposedBy: "You",
      approved: `Reading: ${review.reading}${review.uncertainty ? ` — ${review.uncertainty}` : ""}`,
      alternatives: [],
      basis: [`Observed (owner-supplied): ${review.observedResult}`],
      changed: "A follow-up case was proposed.",
      superseded: null,
    });
  }

  if (mission.followUp?.status === "approved" && mission.followUp.approvedAt) {
    entries.push({
      id: "follow-up",
      at: mission.followUp.approvedAt,
      title: "Follow-up case approved",
      proposedBy: "Aria (PM), from your review",
      approved: `You approved: ${mission.followUp.brief.question}`,
      alternatives: [],
      basis: [],
      changed: "A new case was opened for the follow-up.",
      superseded: null,
    });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}
