/**
 * P-A Investigate entrance: four agent recommendations + human next-path choices.
 * Disagreement is allowed; the recommendation stays on the record.
 */
import type { SupervisedMission } from "./types";

export const AGENT_RECOMMENDATIONS = [
  "proceed_bounded_test",
  "revise_proposition",
  "pause_pending_evidence",
  "do_not_pursue",
] as const;

export type AgentRecommendation = (typeof AGENT_RECOMMENDATIONS)[number];

export const HUMAN_NEXT_PATHS = [
  "authorise_bounded_test",
  "authorise_revise",
  "authorise_gather_evidence",
  "close_case",
  "founder_requested_continuation",
] as const;

export type HumanNextPath = (typeof HUMAN_NEXT_PATHS)[number];

/** Legacy choices still accepted on older missions / clients. */
export type LegacyDecisionChoice = "accept" | "request_more_evidence";

export type DecisionChoice = HumanNextPath | LegacyDecisionChoice;

export const AGENT_RECOMMENDATION_LABELS: Record<AgentRecommendation, string> = {
  proceed_bounded_test: "Proceed to a bounded test",
  revise_proposition: "Revise the proposition",
  pause_pending_evidence: "Pause pending evidence",
  do_not_pursue: "Do not pursue the current proposition",
};

export const HUMAN_NEXT_PATH_LABELS: Record<HumanNextPath, string> = {
  authorise_bounded_test: "Authorise a bounded test",
  authorise_revise: "Authorise a bounded reframing / investigation",
  authorise_gather_evidence: "Authorise evidence collection (execution may stay blocked)",
  close_case: "Close the case",
  founder_requested_continuation:
    "Founder-requested continuation despite the recommendation (unresolved risks labelled)",
};

export type RecommendationDraft = {
  recommendation: AgentRecommendation;
  rationale: string;
  /** True when retrieval/provider failed — must not be sold as evidence-based pause. */
  executionLimited: boolean;
};

const ALIGNED: Record<AgentRecommendation, HumanNextPath> = {
  proceed_bounded_test: "authorise_bounded_test",
  revise_proposition: "authorise_revise",
  pause_pending_evidence: "authorise_gather_evidence",
  do_not_pursue: "close_case",
};

export function normalizeDecisionChoice(choice: DecisionChoice): HumanNextPath {
  if (choice === "accept") return "authorise_bounded_test";
  if (choice === "request_more_evidence") return "authorise_gather_evidence";
  return choice;
}

export function isInconclusivePath(path: HumanNextPath): boolean {
  return path === "authorise_gather_evidence" || path === "close_case";
}

export function pathAgreesWithRecommendation(
  path: HumanNextPath,
  recommendation: AgentRecommendation,
): boolean {
  if (path === "founder_requested_continuation") return false;
  return ALIGNED[recommendation] === path;
}

/**
 * Deterministic recommendation from mission evidence — Stage 1 stub until model keys exist.
 * Empty/failed retrieval → executionLimited; prefer revise/do-not-pursue only with substance.
 */
export function deriveAgentRecommendation(mission: SupervisedMission): RecommendationDraft {
  const gaps = mission.evidence.filter((e) => e.classification === "gap");
  const supplied = mission.evidence.filter((e) => e.classification === "supplied");
  const assumptions = mission.evidence.filter((e) => e.classification === "assumption");
  const researchGaps = mission.researchGaps ?? [];
  const generationGaps = mission.proposal?.generation.gaps ?? [];
  const genCitations = mission.proposal?.generation.citations ?? [];

  const providerGap = [...researchGaps, ...generationGaps].some((g) =>
    /not configured|unavailable|provider|no useful|0 hit|zero hit|could not|failed/i.test(g),
  );
  const noCitationsWhenWebExpected =
    (mission.researchMode === "web" || mission.researchMode === "combined") &&
    genCitations.length === 0 &&
    (mission.researchPassCompletedAt != null || researchGaps.length > 0);

  if (providerGap || (noCitationsWhenWebExpected && supplied.length === 0 && gaps.length === 0)) {
    return {
      recommendation: "pause_pending_evidence",
      rationale:
        "Research could not complete as scoped (provider gap or empty retrieval). This is an execution limitation—not an evidence-based pause on market substance. Retry or restore before treating it as diligence complete.",
      executionLimited: true,
    };
  }

  const stopSignals = [...gaps, ...assumptions].filter((e) =>
    /already (exists|built)|saturated|not scalable|no demand|regulatory|illegal/i.test(
      e.statement,
    ),
  );
  if (stopSignals.length >= 2 && supplied.length === 0) {
    return {
      recommendation: "do_not_pursue",
      rationale:
        "Multiple recorded signals argue against the current proposition under stated assumptions. Treat findings as interpretation inputs—not automatic verdicts by keyword alone.",
      executionLimited: false,
    };
  }

  if (gaps.length >= 2 || (gaps.length >= 1 && supplied.length === 0)) {
    return {
      recommendation: "pause_pending_evidence",
      rationale:
        "Material unknowns remain on the evidence register. A defensible recommendation needs the missing evidence before a build commitment.",
      executionLimited: false,
    };
  }

  if (assumptions.length >= 2 && supplied.length <= 1) {
    return {
      recommendation: "revise_proposition",
      rationale:
        "The case rests heavily on assumptions. A narrower or reframed proposition is more defensible than proceeding as stated.",
      executionLimited: false,
    };
  }

  if (supplied.length >= 1 || genCitations.length >= 1) {
    return {
      recommendation: "proceed_bounded_test",
      rationale:
        "Enough support exists to justify a specific bounded next test—not a prediction of business success.",
      executionLimited: false,
    };
  }

  return {
    recommendation: "pause_pending_evidence",
    rationale:
      "Evidence is too thin for a proceed or stop call. Gather material evidence before committing.",
    executionLimited: false,
  };
}

export function researchTeamLines(mission: SupervisedMission): string[] {
  const fromTeam =
    mission.team?.tasks
      .filter((t) => t.actor !== "human")
      .map(
        (t) =>
          `${t.ownerLabel}${t.capabilityId ? ` (${t.capabilityId})` : ""} — ${t.title} [${t.status}]`,
      ) ?? [];
  if (fromTeam.length) return fromTeam;
  return (mission.activity ?? [])
    .filter((e) => /research|evidence|synthes/i.test(e.kind))
    .slice(-12)
    .map((e) => `${e.actor} — ${e.kind}: ${e.summary}`);
}
