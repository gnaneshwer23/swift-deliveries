/**
 * P-commerce — Investigation vs Continuation consumption rules and disclosure.
 * Enforces honesty before paid availability; does not turn selling on.
 */
import type { SupervisedMission } from "./types";

export type CommerceUnit = "investigation" | "continuation";

export type CommerceEventKind =
  | "plan_approval"
  | "research_pass"
  | "options_comparison"
  | "human_decision"
  | "pack_export"
  | "listen"
  | "learner_lens"
  | "case_gate";

export type CommerceEventRule = {
  kind: CommerceEventKind;
  label: string;
  billable: boolean;
  note: string;
};

export type CommerceRemedy = {
  id: string;
  situation: string;
  treatment: string;
};

export type CommerceSnapshot = {
  version: "commerce-v1";
  unit: CommerceUnit;
  unitLabel: string;
  remainingUnits: number;
  ceiling: number;
  consumed: number;
  hardStopped: boolean;
  hardStopDetail: string | null;
  events: CommerceEventRule[];
  remedies: CommerceRemedy[];
  paidAvailability: false;
  disclosureLines: string[];
};

const UNIT_LABELS: Record<CommerceUnit, string> = {
  investigation: "Investigation mission",
  continuation: "Continuation mission",
};

/** Continuation once the case-room human gate is proceed; otherwise Investigation. */
export function commerceUnitFor(mission: SupervisedMission): CommerceUnit {
  if (mission.caseRoom?.stepGate === "proceed" && mission.continuationPlan) {
    return "continuation";
  }
  return "investigation";
}

export const COMMERCE_EVENT_RULES: CommerceEventRule[] = [
  {
    kind: "plan_approval",
    label: "Approve specialist plan",
    billable: false,
    note: "Human gate. Never consumes allowance.",
  },
  {
    kind: "research_pass",
    label: "Research pass",
    billable: false,
    note: "Findings and honest gaps; not a billable comparison.",
  },
  {
    kind: "options_comparison",
    label: "Options comparison",
    billable: true,
    note: "Consumes units only when a model provider actually ran. Simulated drafts charge 0. Same scope is not charged twice.",
  },
  {
    kind: "human_decision",
    label: "Record next path",
    billable: false,
    note: "Disagreement does not erase the recommendation and does not consume allowance.",
  },
  {
    kind: "pack_export",
    label: "Decision pack export",
    billable: false,
    note: "Re-downloading does not add a usage record.",
  },
  {
    kind: "listen",
    label: "Listen to PM brief",
    billable: false,
    note: "Browser speech on this device — no cloud TTS charge.",
  },
  {
    kind: "learner_lens",
    label: "Learner lens",
    billable: false,
    note: "Derived view of your contributions; not billable.",
  },
  {
    kind: "case_gate",
    label: "Case-room step gate",
    billable: false,
    note: "Human-only gate. Does not start a new paid unit by itself.",
  },
];

export const COMMERCE_REMEDIES: CommerceRemedy[] = [
  {
    id: "execution-failure",
    situation: "Provider outage or empty retrieval when research was required",
    treatment:
      "Treat as execution failure: retry or restore credit / support — not a completed evidence-based pause sold as diligence.",
  },
  {
    id: "evidence-pause",
    situation: "Investigation completed and a material unknown is identified",
    treatment:
      "Evidence-based pause is a completed Investigation deliverable under the disclosed rule — distinct from execution failure.",
  },
  {
    id: "hard-stop",
    situation: "Next billable step would exceed the mission allowance",
    treatment: "Hard stop. The step does not run. No silent overage.",
  },
  {
    id: "simulated-draft",
    situation: "Model provider is not configured",
    treatment: "Options may be simulated drafts; comparison units charged stay 0 until a provider runs.",
  },
];

export function commerceSnapshot(mission: SupervisedMission): CommerceSnapshot {
  const unit = commerceUnitFor(mission);
  const ceiling = mission.usageCeiling;
  const consumed = mission.usageConsumed;
  const remainingUnits = Math.max(0, ceiling - consumed);
  const hardStopped = remainingUnits <= 0;
  const executionLimited = mission.approval?.executionLimited === true;
  const disclosureLines = [
    `Unit on this case: ${UNIT_LABELS[unit]}.`,
    `Allowance on this mission: ${consumed} used / ${ceiling} ceiling (${remainingUnits} remaining).`,
    "Billable today: options comparison when a model provider actually runs (idempotent per scope).",
    "Not billable: plan approval, research pass, decide, pack export, Listen (browser), learner lens, case gate.",
    hardStopped
      ? "Hard stop: no further billable comparison until allowance is available."
      : "Hard stop applies before any billable overage.",
    executionLimited
      ? "Execution limitation is on the record — remedy is retry/restore, not a sold evidence-based pause."
      : "Evidence-based pause (when recommended) is distinct from provider failure.",
    "Paid availability of Investigation/Continuation units is not enabled on this deployment.",
    mission.watchtower?.enabled
      ? `Watchtower preferences on (${mission.watchtower.frequency}); monitoring allowance is a separate commercial model and is not charged until a scheduled runner ships. Budget ceiling preference: ${mission.watchtower.budgetCeilingUnits} units.`
      : "Watchtower / monitoring allowance is separate from Investigation and Continuation — preferences only until a runner ships.",
  ];

  return {
    version: "commerce-v1",
    unit,
    unitLabel: UNIT_LABELS[unit],
    remainingUnits,
    ceiling,
    consumed,
    hardStopped,
    hardStopDetail: hardStopped
      ? `${UNIT_LABELS[unit]} allowance is exhausted (${consumed}/${ceiling}). Billable comparison will not run.`
      : null,
    events: COMMERCE_EVENT_RULES,
    remedies: COMMERCE_REMEDIES,
    paidAvailability: false,
    disclosureLines,
  };
}

/** Short hard-stop copy for Compare / next-action surfaces. */
export function commerceHardStopMessage(mission: SupervisedMission): string | null {
  const snap = commerceSnapshot(mission);
  return snap.hardStopDetail;
}

/** Markdown block for the decision pack. */
export function buildCommerceDisclosureMarkdown(mission: SupervisedMission): string {
  const snap = commerceSnapshot(mission);
  const eventLines = snap.events
    .map((e) => `- **${e.label}** — ${e.billable ? "billable when applicable" : "not billable"}. ${e.note}`)
    .join("\n");
  const remedyLines = snap.remedies
    .map((r) => `- **${r.situation}:** ${r.treatment}`)
    .join("\n");

  return [
    `## Commerce disclosure`,
    `Paid availability: off (rules only).`,
    ``,
    ...snap.disclosureLines.map((line) => `- ${line}`),
    ``,
    `### Events`,
    eventLines,
    ``,
    `### Failure and pause remedies`,
    remedyLines,
  ].join("\n");
}
