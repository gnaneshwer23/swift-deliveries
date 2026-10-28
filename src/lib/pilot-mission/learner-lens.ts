/**
 * P-D learner lens — summary of *your* contributions and judgements on this case.
 * Same mission spine; never counts agent activity as learning proof.
 * Reflection prompts never block execution.
 */
import type { CaseStepGate } from "./case-room";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
  type AgentRecommendation,
  type HumanNextPath,
} from "./verdict";

export type LearnerContributionKind =
  | "brief"
  | "plan_approval"
  | "next_path"
  | "decision_note"
  | "case_gate"
  | "expectation"
  | "observation"
  | "outcome_reading"
  | "follow_up";

export type LearnerContribution = {
  kind: LearnerContributionKind;
  title: string;
  detail: string;
  at: string | null;
};

export type LearnerJudgement = {
  id: string;
  title: string;
  stance: string;
  detail: string;
};

export type LearnerPrompt = {
  id: string;
  prompt: string;
  /** Teaching prompts must never gate execution. */
  blocking: false;
};

export type LearnerSummary = {
  version: "learner-v1";
  headline: string;
  contributions: LearnerContribution[];
  judgements: LearnerJudgement[];
  prompts: LearnerPrompt[];
  /** Honesty line — this lens is not specialist throughput. */
  notCounted: string;
};

const GATE_LABELS: Record<CaseStepGate, string> = {
  proceed: "Proceed",
  revise: "Revise",
  pause: "Pause",
  stop: "Stop",
};

const READING_LABELS = {
  consistent: "Consistent with what I expected",
  different: "Different from what I expected",
  uncertain: "Not enough to tell",
} as const;

function prompt(id: string, text: string): LearnerPrompt {
  return { id, prompt: text, blocking: false };
}

function pathLabel(path: HumanNextPath): string {
  return HUMAN_NEXT_PATH_LABELS[path];
}

function recLabel(rec: AgentRecommendation): string {
  return AGENT_RECOMMENDATION_LABELS[rec];
}

/**
 * Derive the learner lens from mission state. Pure — nothing is stored separately.
 */
export function buildLearnerSummary(mission: SupervisedMission): LearnerSummary {
  const contributions: LearnerContribution[] = [];
  const judgements: LearnerJudgement[] = [];
  const prompts: LearnerPrompt[] = [];

  contributions.push({
    kind: "brief",
    title: "Case statement you brought",
    detail: mission.brief.question.trim() || "Empty brief on record.",
    at: null,
  });

  if (mission.team?.approvedAt) {
    contributions.push({
      kind: "plan_approval",
      title: "You approved the specialist plan",
      detail:
        "Nothing ran until you approved. Specialists then worked from the brief and research mode.",
      at: mission.team.approvedAt,
    });
  }

  const approval = mission.approval;
  if (approval) {
    const path = normalizeDecisionChoice(approval.choice);
    const pathAt = approval.decidedAt;
    contributions.push({
      kind: "next_path",
      title: "Next path you authorised",
      detail: pathLabel(path),
      at: pathAt,
    });
    if (approval.note.trim()) {
      contributions.push({
        kind: "decision_note",
        title: "Your decision note",
        detail: approval.note.trim(),
        at: pathAt,
      });
    }

    const recommendation =
      approval.agentRecommendation ??
      null;
    if (recommendation) {
      const disagreed =
        approval.disagreesWithRecommendation === true ||
        path === "founder_requested_continuation";
      judgements.push({
        id: "act-a-path",
        title: "Act A path vs recommendation",
        stance: disagreed
          ? "You chose a different path than the agent recommendation"
          : "You aligned with the agent recommendation",
        detail: disagreed
          ? `Recommendation on record: ${recLabel(recommendation)}. Your path: ${pathLabel(path)}. Disagreement does not erase the recommendation or imply agent endorsement.`
          : `Recommendation and path: ${recLabel(recommendation)} → ${pathLabel(path)}.`,
      });
      if (disagreed) {
        prompts.push(
          prompt(
            "disagree-reflect",
            "What evidence would make you revisit the agent recommendation—or strengthen your different path?",
          ),
        );
      } else if (path === "authorise_bounded_test") {
        prompts.push(
          prompt(
            "test-falsify",
            "What observation would falsify this bounded test, not just confirm it?",
          ),
        );
      } else if (path === "authorise_gather_evidence") {
        prompts.push(
          prompt(
            "evidence-priority",
            "Which single missing fact would most change the next recommendation?",
          ),
        );
      } else if (path === "close_case") {
        prompts.push(
          prompt(
            "close-reopen",
            "What new evidence would justify reopening this case later?",
          ),
        );
      } else if (path === "authorise_revise") {
        prompts.push(
          prompt(
            "revise-narrow",
            "What narrower proposition are you investigating next, and why is it better framed?",
          ),
        );
      }
    }
  }

  const room = mission.caseRoom;
  if (room?.stepGate) {
    contributions.push({
      kind: "case_gate",
      title: "Case-room step gate you recorded",
      detail: `${GATE_LABELS[room.stepGate]}${
        room.stepGateNote ? ` — ${room.stepGateNote}` : ""
      }`,
      at: room.stepGateAt,
    });
    judgements.push({
      id: "case-gate",
      title: "Continuation step gate",
      stance: `You chose: ${GATE_LABELS[room.stepGate]}`,
      detail:
        "This gate is human-only. Agents and the scheduler can block on a gate but never pass one for you.",
    });
  }

  if (mission.expectation) {
    contributions.push({
      kind: "expectation",
      title: "Measurement plan you wrote",
      detail: `Hypothesis: ${mission.expectation.hypothesis}. Metric: ${mission.expectation.expectedMetric}.`,
      at: mission.expectation.recordedAt,
    });
  }

  if (mission.observation) {
    contributions.push({
      kind: "observation",
      title: "Observed result you supplied",
      detail: `${mission.observation.result} (${mission.observation.label})`,
      at: mission.observation.suppliedAt,
    });
  }

  const latestReview = mission.reviews.at(-1);
  if (latestReview) {
    contributions.push({
      kind: "outcome_reading",
      title: "Outcome reading you recorded",
      detail: `${READING_LABELS[latestReview.reading]}. Uncertainty: ${latestReview.uncertainty}`,
      at: latestReview.createdAt,
    });
    judgements.push({
      id: "outcome-reading",
      title: "Expected vs observed",
      stance: READING_LABELS[latestReview.reading],
      detail:
        "DeliverX did not measure the result. Your reading sits beside the owner-supplied observation.",
    });
    prompts.push(
      prompt(
        "outcome-unknown",
        "What remains unknown after this reading—and what would resolve it without inventing data?",
      ),
    );
  }

  if (mission.followUp) {
    contributions.push({
      kind: "follow_up",
      title:
        mission.followUp.status === "approved"
          ? "Follow-up mission you approved"
          : "Follow-up you left as a proposal",
      detail: mission.followUp.brief.question,
      at: mission.followUp.approvedAt ?? mission.followUp.proposedAt,
    });
  }

  if (!approval && !mission.team?.approvedAt) {
    prompts.push(
      prompt(
        "before-approve",
        "Before you approve a plan: what would you need to see for this idea to be worth investigating?",
      ),
    );
  }

  const judgementCount = judgements.length;
  const headline =
    judgementCount === 0
      ? "Your contributions on this case so far"
      : `Your contributions and ${judgementCount} judgement${judgementCount === 1 ? "" : "s"} on this case`;

  return {
    version: "learner-v1",
    headline,
    contributions,
    judgements,
    prompts,
    notCounted:
      "This lens lists what you contributed and how you judged. It does not count specialist task events, agent messages, or activity volume as learning proof.",
  };
}

/** Markdown block for the decision pack export. */
export function buildLearnerLensMarkdown(mission: SupervisedMission): string {
  const summary = buildLearnerSummary(mission);
  const contributionLines =
    summary.contributions.map((c) => `- **${c.title}:** ${c.detail}`).join("\n") ||
    "- None recorded yet.";
  const judgementLines =
    summary.judgements
      .map((j) => `- **${j.title}** — ${j.stance}. ${j.detail}`)
      .join("\n") || "- No judgement moments recorded yet.";
  const promptLines =
    summary.prompts.map((p) => `- ${p.prompt} _(optional; does not block execution)_`).join("\n") ||
    "- No reflection prompts for the current stage.";

  return [
    `## Learner lens (your contributions)`,
    summary.headline,
    ``,
    summary.notCounted,
    ``,
    `### Contributions`,
    contributionLines,
    ``,
    `### Judgements`,
    judgementLines,
    ``,
    `### Reflection prompts`,
    promptLines,
  ].join("\n");
}
