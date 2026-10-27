import type { LearningLink, OutcomeReading, OutcomeReview, SupervisedMission } from "./types";

const READINGS = new Set<OutcomeReading>(["consistent", "different", "uncertain"]);

export function assertProseUncertainty(value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (/^\d+(\.\d+)?%?$/.test(text) || /^(confidence|score|probability)\b[^.]{0,48}$/i.test(text)) {
    throw new Error("Uncertainty stays in words. A confidence score is not stored.");
  }
  if (text.length < 20 || text.length > 2000) {
    throw new Error("Uncertainty must be between 20 and 2000 characters.");
  }
  return text;
}

export function assertOutcomeReading(value: string): OutcomeReading {
  if (!READINGS.has(value as OutcomeReading)) {
    throw new Error("The comparison reading must be consistent, different or uncertain.");
  }
  return value as OutcomeReading;
}

export function withLearningDefaults(mission: SupervisedMission): SupervisedMission {
  return {
    ...mission,
    expectation: mission.expectation ?? null,
    observation: mission.observation ?? null,
    reviews: Array.isArray(mission.reviews) ? mission.reviews : [],
    followUp: mission.followUp ?? null,
    origin: mission.origin ?? null,
    exportPdfBase64: mission.exportPdfBase64 ?? null,
    researchMode: mission.researchMode ?? "provided",
    researchGaps: Array.isArray(mission.researchGaps) ? mission.researchGaps : [],
    researchPassCompletedAt: mission.researchPassCompletedAt ?? null,
    team: mission.team
      ? {
          ...mission.team,
          staffingBand: mission.team.staffingBand ?? "M",
          capabilityIds: Array.isArray(mission.team.capabilityIds)
            ? mission.team.capabilityIds
            : [],
        }
      : null,
    activity: Array.isArray(mission.activity) ? mission.activity : [],
  };
}

export function learningLinks(mission: SupervisedMission): LearningLink[] {
  const latest: OutcomeReview | undefined = mission.reviews.at(-1);
  const followUp = mission.followUp;
  const decisionDetail =
    mission.approval && mission.artefact
      ? `${mission.artefact.title} · option ${mission.approval.optionId}`
      : mission.approval
        ? `Decision recorded for option ${mission.approval.optionId}. Prepare the pack before a review.`
        : "Record a decision before reviewing an outcome.";
  return [
    {
      step: "decision",
      title: "Decision",
      state: mission.approval ? "recorded" : "waiting",
      detail: decisionDetail,
    },
    {
      step: "observation",
      title: "Observation",
      state: mission.observation ? "recorded" : "waiting",
      detail: mission.observation
        ? mission.observation.label
        : "No result is stored. DeliverX does not measure this.",
    },
    {
      step: "review",
      title: "Review",
      state: latest ? "recorded" : "waiting",
      detail: latest
        ? `Version ${latest.version}. Expected “${latest.expectedMetric}” beside the owner-supplied result. ${latest.uncertainty}`
        : "Expected and observed stay separate until you write a review. No confidence score is stored.",
    },
    {
      step: "follow_up",
      title: "Proposed next mission",
      state: followUp?.status === "approved" ? "approved" : followUp ? "proposed" : "waiting",
      detail:
        followUp?.status === "approved"
          ? "You approved this follow-up. It is a new mission and does not approve any later step."
          : followUp
            ? "Proposed only. It is not an active mission until you approve it."
            : "A review can propose one follow-up. Nothing starts automatically.",
    },
  ];
}

export function expectationLines(mission: SupervisedMission, fallbackHypothesis: string): string[] {
  const expectation = mission.expectation;
  if (!expectation) {
    return [
      `Hypothesis: ${fallbackHypothesis}`,
      `What would be measured: ${mission.brief.outcome}`,
      "Baseline requirement: no baseline has been observed in this mission.",
      "Observation window: not started.",
    ];
  }
  return [
    `Hypothesis: ${expectation.hypothesis}`,
    `What would be measured: ${expectation.expectedMetric}`,
    `Baseline supplied by the owner, not measured by DeliverX: ${expectation.baseline}`,
    `Observation window: ${expectation.observationWindow}`,
  ];
}
