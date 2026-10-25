/**
 * A sample product decision for the homepage, with the result the real
 * deliberation engine (`src/lib/programme/deliberation.ts`) produces for it.
 * The snapshot keeps the homepage bundle free of the capability registry;
 * `sample-deliberation.test.ts` re-runs the engine and fails if they drift.
 */
import type { DecisionSpec } from "@/lib/programme/types";

export const SAMPLE_DECISION_SEED = "home-sample";

export const SAMPLE_DECISION_SPEC: DecisionSpec = {
  key: "onboarding-first-test",
  question: "Which onboarding change should we test first?",
  owner: "DX-021",
  panel: ["DX-031", "DX-041", "DX-061", "DX-071", "DX-121", "DX-131", "DX-022", "DX-032"],
  domainDepartments: [3, 4],
  impact: "high",
  options: [
    {
      id: "guided",
      label: "Guided first project",
      summary: "Walk new users through building one small product.",
      scores: {
        customer_value: 0.82,
        business_value: 0.72,
        cost: 0.5,
        risk: 0.72,
        time_to_market: 0.5,
        evidence: 0.55,
        feasibility: 0.7,
      },
    },
    {
      id: "shorter",
      label: "Shorter sign-up",
      summary: "Ask for less before the first useful screen.",
      scores: {
        customer_value: 0.62,
        business_value: 0.6,
        cost: 0.82,
        risk: 0.82,
        time_to_market: 0.9,
        evidence: 0.6,
        feasibility: 0.9,
      },
    },
    {
      id: "import",
      label: "Import existing work",
      summary: "Pull files and accounts from the tools teams already use.",
      scores: {
        customer_value: 0.88,
        business_value: 0.82,
        cost: 0.32,
        risk: 0.2,
        time_to_market: 0.4,
        evidence: 0.4,
        feasibility: 0.5,
      },
    },
  ],
};

export type SampleVote = {
  role: string;
  id: string;
  optionId: string;
  weight: number;
  persuadedBy?: string;
  revisedFrom?: string;
};

/** What `deliberate(SAMPLE_DECISION_SPEC, SAMPLE_DECISION_SEED)` returns, reduced for display. */
export const SAMPLE_DECISION_RESULT = {
  supermajority: 0.6,
  outcome: "adopted" as const,
  chosenOptionId: "shorter",
  needsHumanRatification: true,
  tally: [
    { optionId: "shorter", share: 0.84, vetoed: false },
    { optionId: "guided", share: 0.16, vetoed: false },
    { optionId: "import", share: 0, vetoed: true },
  ],
  vetoes: [
    {
      id: "DX-061",
      role: "Security Architecture",
      optionId: "import",
      reason: "unacceptable security or privacy risk without mitigation",
    },
  ],
  votes: [
    { role: "Product Discovery", id: "DX-021", optionId: "shorter", weight: 1.5 },
    { role: "UX Research", id: "DX-031", optionId: "guided", weight: 2 },
    { role: "Software Architect", id: "DX-041", optionId: "shorter", weight: 1 },
    { role: "Security Architecture", id: "DX-061", optionId: "shorter", weight: 1 },
    { role: "Test Strategy", id: "DX-071", optionId: "shorter", weight: 1 },
    {
      role: "Product Analytics Engineer",
      id: "DX-121",
      optionId: "shorter",
      weight: 1,
      persuadedBy: "DX-041",
      revisedFrom: "guided",
    },
    { role: "Financial Modelling", id: "DX-131", optionId: "shorter", weight: 1 },
    {
      role: "Product Strategy",
      id: "DX-022",
      optionId: "shorter",
      weight: 2,
      persuadedBy: "DX-041",
      revisedFrom: "guided",
    },
    { role: "User Journey", id: "DX-032", optionId: "shorter", weight: 2 },
  ] satisfies SampleVote[],
  dissent: { role: "UX Research", id: "DX-031", optionId: "guided" },
};
