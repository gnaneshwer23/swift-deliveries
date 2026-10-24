/** Shared language for public illustrations and the authenticated product record. */
export const PSI_LAYER_LABELS = {
  evidence: "Evidence & memory",
  judgement: "Judgement",
  delivery: "Delivery",
  feedback: "Feedback loop",
} as const;

export const PSI_RECORD_LINKS = {
  evidence: { hash: "mission-evidence", label: "Open evidence" },
  judgement: { hash: "mission-judgement", label: "Inspect options & decision" },
  delivery: { hash: "mission-delivery", label: "Inspect decision pack" },
  feedback: { hash: "mission-feedback", label: "Open outcome review" },
} as const;
