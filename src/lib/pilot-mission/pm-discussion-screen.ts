/**
 * Screen 7 — Discussion with PM decision-context view-model.
 * Evidence / assumptions / open questions come only from the mission record.
 */
import { buildPmBriefingPack } from "./pm-briefing-pack";
import {
  AGENT_RECOMMENDATION_LABELS,
  deriveAgentRecommendation,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
} from "./verdict";
import type { SupervisedMission } from "./types";

export type PmDiscussionEvidenceChip = {
  id: string;
  label: string;
  href: string | null;
  kind: "supplied" | "assumption" | "gap";
};

export type PmDiscussionContext = {
  decisionRequested: string;
  optionsConsidered: Array<{ id: string; title: string; tradeoff: string; recommended: boolean }>;
  evidenceUsed: PmDiscussionEvidenceChip[];
  assumptions: string[];
  openQuestions: string[];
  alreadyDecided: boolean;
  decisionSummary: string | null;
  recommendationLabel: string;
  recommendationRationale: string;
};

const SAMPLE_THREAD = {
  user: "Why did you choose Option B?",
  aria: "Option B focuses on the highest-value first use case: daily waste tracking and recommendations. It avoids POS integration in version one, reducing complexity and launch time. The research and competitor workstreams both flagged integration as an early risk.",
} as const;

export function pmDiscussionSampleThread() {
  return SAMPLE_THREAD;
}

export function buildPmDiscussionContext(mission: SupervisedMission): PmDiscussionContext {
  const draft = deriveAgentRecommendation(mission);
  const pack = buildPmBriefingPack(mission);
  const options = (mission.proposal?.options ?? []).map((option, index) => ({
    id: option.id,
    title: option.title,
    tradeoff: option.tradeoff,
    recommended: index === 0,
  }));

  const evidenceUsed: PmDiscussionEvidenceChip[] = mission.evidence
    .filter((item) => item.classification === "supplied")
    .slice(0, 8)
    .map((item) => {
      const href =
        item.source && /^https?:\/\//i.test(item.source.trim()) ? item.source.trim() : null;
      return {
        id: item.id,
        label: item.statement.slice(0, 120),
        href,
        kind: "supplied" as const,
      };
    });

  const assumptions = mission.evidence
    .filter((item) => item.classification === "assumption")
    .slice(0, 6)
    .map((item) => item.statement);

  const openQuestions = [
    ...mission.evidence
      .filter((item) => item.classification === "gap")
      .map((item) => item.statement),
    ...pack.unknowns.map((line) => line.replace(/^\[[^\]]+\]\s*/, "")),
  ].slice(0, 8);

  const alreadyDecided = Boolean(mission.approval);
  const decisionSummary = mission.approval
    ? `${HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]}${
        mission.approval.note?.trim() ? ` — ${mission.approval.note.trim()}` : ""
      }`
    : null;

  return {
    decisionRequested: alreadyDecided
      ? "Decision already recorded on this case."
      : `Confirm a direction for: ${mission.brief.question.trim() || "this idea"}`,
    optionsConsidered: options,
    evidenceUsed,
    assumptions,
    openQuestions,
    alreadyDecided,
    decisionSummary,
    recommendationLabel: AGENT_RECOMMENDATION_LABELS[draft.recommendation],
    recommendationRationale: draft.rationale,
  };
}
