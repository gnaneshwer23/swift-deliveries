/**
 * PT-1 — PM briefing pack: separates feasibility / demand / proposition / next investment,
 * plus actionable SWOT (basis + implication + next question).
 */
import {
  AGENT_RECOMMENDATION_LABELS,
  deriveAgentRecommendation,
  type AgentRecommendation,
} from "./verdict";
import type { SupervisedMission } from "./types";

export type AssessmentDimension =
  | "feasibility"
  | "demand"
  | "proposition"
  | "next_investment";

export type AssessmentReading = "supported" | "weak" | "unknown" | "not_assessed";

export type BriefingAssessment = {
  dimension: AssessmentDimension;
  title: string;
  reading: AssessmentReading;
  summary: string;
  basisIds: string[];
};

export type SwotKind = "strength" | "weakness" | "opportunity" | "threat";

export type ActionableSwotItem = {
  kind: SwotKind;
  statement: string;
  basis: string;
  implication: string;
  nextQuestion: string;
};

export type PmBriefingPack = {
  version: "pm-briefing-v1";
  ready: boolean;
  understoodIdea: string;
  recommendation: AgentRecommendation | null;
  recommendationLabel: string | null;
  recommendationRationale: string;
  assessments: BriefingAssessment[];
  supporting: string[];
  counterevidence: string[];
  unknowns: string[];
  swot: ActionableSwotItem[];
  smallestNextStep: string;
  honesty: string;
};

function supplied(mission: SupervisedMission) {
  return mission.evidence.filter((e) => e.classification === "supplied");
}
function gaps(mission: SupervisedMission) {
  return mission.evidence.filter((e) => e.classification === "gap");
}
function assumptions(mission: SupervisedMission) {
  return mission.evidence.filter((e) => e.classification === "assumption");
}

function readingFromCount(supported: number, weak: number): AssessmentReading {
  if (supported > 0 && weak === 0) return "supported";
  if (supported === 0 && weak === 0) return "unknown";
  if (supported === 0 && weak > 0) return "weak";
  return "weak";
}

export function buildPmBriefingPack(mission: SupervisedMission): PmBriefingPack {
  const ready = Boolean(mission.proposal) || Boolean(mission.approval);
  const draft = deriveAgentRecommendation(mission);
  const recommendation = ready || mission.researchPassCompletedAt ? draft.recommendation : null;
  const s = supplied(mission);
  const g = gaps(mission);
  const a = assumptions(mission);

  const techSupport = s.filter((e) =>
    /implement|build|technical|platform|api|html|prototype/i.test(e.statement),
  );
  const demandSupport = s.filter((e) =>
    /customer|demand|need|parent|commuter|breakfast|user|audience/i.test(e.statement),
  );
  const altSignals = s.filter((e) =>
    /competitor|alternative|already|existing|franchise/i.test(e.statement),
  );
  const demandGaps = g.filter((e) => /customer|demand|need|interview/i.test(e.statement));

  const assessments: BriefingAssessment[] = [
    {
      dimension: "feasibility",
      title: "Technically feasible?",
      reading:
        techSupport.length > 0
          ? "supported"
          : ready
            ? "unknown"
            : "not_assessed",
      summary:
        techSupport.length > 0
          ? "Record includes signals that the proposed functionality is plausible to implement — not a delivery commitment."
          : "No dedicated delivery/feasibility evidence yet. Buildability is unproven, not disproven.",
      basisIds: techSupport.slice(0, 3).map((e) => e.id),
    },
    {
      dimension: "demand",
      title: "Evidence of a customer problem?",
      reading: readingFromCount(demandSupport.length, demandGaps.length),
      summary:
        demandSupport.length > 0
          ? "Supplied or cited findings speak to a customer need or use context."
          : demandGaps.length > 0
            ? "Need evidence is thin or marked as a gap — web hits alone are not interviews."
            : "Customer-problem evidence is not yet on the register.",
      basisIds: [...demandSupport, ...demandGaps].slice(0, 3).map((e) => e.id),
    },
    {
      dimension: "proposition",
      title: "Defensible proposition vs alternatives?",
      reading:
        altSignals.length > 0 && a.length >= 2
          ? "weak"
          : altSignals.length > 0
            ? "supported"
            : ready
              ? "unknown"
              : "not_assessed",
      summary:
        altSignals.length > 0
          ? "Alternatives appear on the register. Differentiation must be specific — common features alone are not a moat."
          : "Competitor/alternative analysis is incomplete on this case.",
      basisIds: altSignals.slice(0, 3).map((e) => e.id),
    },
    {
      dimension: "next_investment",
      title: "Worth the next investment?",
      reading: recommendation
        ? recommendation === "proceed_bounded_test"
          ? "supported"
          : recommendation === "do_not_pursue"
            ? "weak"
            : recommendation === "revise_proposition"
              ? "weak"
              : "unknown"
        : "not_assessed",
      summary: recommendation
        ? draft.rationale
        : "Recommendation appears after research/options are on the record.",
      basisIds: s.slice(0, 2).map((e) => e.id),
    },
  ];

  const supporting = s.slice(0, 4).map((e) => `[${e.id}] ${e.statement}`);
  const counterevidence = [
    ...g.map((e) => `[${e.id} · gap] ${e.statement}`),
    ...a
      .filter((e) => /already|saturated|no demand|risk/i.test(e.statement))
      .map((e) => `[${e.id} · assumption] ${e.statement}`),
  ].slice(0, 4);
  const unknowns = g.slice(0, 4).map((e) => `[${e.id}] ${e.statement}`);

  const swot: ActionableSwotItem[] = [];
  if (demandSupport[0]) {
    swot.push({
      kind: "strength",
      statement: "Context signals support a real use situation.",
      basis: `${demandSupport[0].id}: ${demandSupport[0].statement.slice(0, 160)}`,
      implication: "Frame the next step around that use situation — not a generic product vision.",
      nextQuestion: "Which segment feels the pain most acutely under your constraints?",
    });
  }
  if (a[0]) {
    swot.push({
      kind: "weakness",
      statement: "The case still leans on unverified assumptions.",
      basis: `${a[0].id}: ${a[0].statement.slice(0, 160)}`,
      implication: "Do not treat assumptions as evidence in the recommendation narrative.",
      nextQuestion: "Which single assumption would most change the recommendation if false?",
    });
  }
  if (s.length > 0 && recommendation === "proceed_bounded_test") {
    swot.push({
      kind: "opportunity",
      statement: "A bounded test can learn before a large build.",
      basis: `Recommendation: ${AGENT_RECOMMENDATION_LABELS.proceed_bounded_test}`,
      implication: "Invest in a specific experiment, not an open-ended product programme.",
      nextQuestion: "What observation would falsify the test within your window?",
    });
  }
  if (altSignals[0]) {
    swot.push({
      kind: "threat",
      statement: "Established alternatives may already cover part of the proposed offer.",
      basis: `${altSignals[0].id}: ${altSignals[0].statement.slice(0, 160)}`,
      implication:
        "Do not position a common feature alone as differentiation without segment-specific evidence.",
      nextQuestion:
        "Is there a workflow those alternatives serve poorly for your target customer?",
    });
  }
  if (swot.length === 0 && ready) {
    swot.push({
      kind: "weakness",
      statement: "Evidence is too thin for a rich SWOT.",
      basis: "Evidence register length and classifications on this mission.",
      implication: "Prefer gather-evidence or revise over a confident commercial story.",
      nextQuestion: "What founder-only fact would unlock a sharper investigation?",
    });
  }

  const smallestNextStep =
    recommendation === "proceed_bounded_test"
      ? "Authorise a bounded test with a measurement plan — not a full build."
      : recommendation === "revise_proposition"
        ? "Authorise a reframing investigation; preserve this proposition on the record."
        : recommendation === "pause_pending_evidence"
          ? "Authorise evidence collection for the named gaps before a proceed/stop call."
          : recommendation === "do_not_pursue"
            ? "Close or archive this proposition; keep findings for later reuse with dates."
            : "Complete research and options so a recommendation can land.";

  return {
    version: "pm-briefing-v1",
    ready,
    understoodIdea: mission.brief.question.trim(),
    recommendation,
    recommendationLabel: recommendation ? AGENT_RECOMMENDATION_LABELS[recommendation] : null,
    recommendationRationale: draft.rationale,
    assessments,
    supporting,
    counterevidence,
    unknowns,
    swot,
    smallestNextStep,
    honesty: draft.executionLimited
      ? "Execution limitation on the record — not an evidence-based market pause."
      : mission.proposal?.generation.ran
        ? "Options used a configured model; assessments still cite the evidence register."
        : "Option drafts may be simulated; assessments do not invent interviews or customers.",
  };
}
