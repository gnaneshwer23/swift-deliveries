import { describe, expect, it } from "vitest";
import {
  deriveAgentRecommendation,
  normalizeDecisionChoice,
  pathAgreesWithRecommendation,
} from "./verdict";
import type { SupervisedMission } from "./types";

function baseMission(over: Partial<SupervisedMission> = {}): SupervisedMission {
  return {
    id: "m1",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "alternatives",
    brief: {
      question: "Should we build X?",
      audience: "Founders",
      outcome: "A next path",
      constraints: "None",
    },
    evidence: [],
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "scope".padEnd(16, "0"),
      options: [
        { id: "o1", title: "Test", tradeoff: "t", basis: "b" },
      ],
      generation: {
        ran: false,
        label: "simulated",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [],
      },
    },
    approval: null,
    invalidatedApprovals: [],
    artefact: null,
    prototype: null,
    exportBody: null,
    exportPdfBase64: null,
    job: {
      status: "completed",
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    usageCeiling: 4,
    usageConsumed: 1,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: null,
    researchProvider: null,
    team: null,
    continuationPlan: null,
    caseRoom: null,
    activity: [],
    projectId: null,
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("P-A verdict model", () => {
  it("normalizes legacy choices", () => {
    expect(normalizeDecisionChoice("accept")).toBe("authorise_bounded_test");
    expect(normalizeDecisionChoice("request_more_evidence")).toBe("authorise_gather_evidence");
  });

  it("marks provider failure as execution-limited pause", () => {
    const draft = deriveAgentRecommendation(
      baseMission({
        researchGaps: ["Web research provider not configured"],
        researchPassCompletedAt: new Date().toISOString(),
      }),
    );
    expect(draft.recommendation).toBe("pause_pending_evidence");
    expect(draft.executionLimited).toBe(true);
  });

  it("recommends bounded test when supplied evidence exists", () => {
    const draft = deriveAgentRecommendation(
      baseMission({
        evidence: [
          {
            id: "e1",
            statement: "Users abandon setup at the goal step.",
            source: "Founder note",
            classification: "supplied",
          },
        ],
      }),
    );
    expect(draft.recommendation).toBe("proceed_bounded_test");
    expect(draft.executionLimited).toBe(false);
  });

  it("does not treat missing option-model as a research execution failure", () => {
    const draft = deriveAgentRecommendation(
      baseMission({
        researchMode: "combined",
        researchPassCompletedAt: new Date().toISOString(),
        researchProvider: "tavily",
        evidence: [
          {
            id: "e3",
            statement: "[Cited · tavily] Meal-prep subscriptions suit scheduled office deliveries.",
            source: "https://example.com/meal-prep",
            classification: "supplied",
          },
          {
            id: "e2",
            statement: "Specialists should research before asking the founder.",
            source: "Research-first default",
            classification: "gap",
          },
        ],
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "scope".padEnd(16, "0"),
          options: [{ id: "o1", title: "Test", tradeoff: "t", basis: "e3" }],
          generation: {
            ran: false,
            label: "not run — provider not configured",
            provider: null,
            model: null,
            output: "",
            citations: [],
            gaps: ["Model provider is not configured."],
          },
        },
      }),
    );
    expect(draft.recommendation).toBe("proceed_bounded_test");
    expect(draft.executionLimited).toBe(false);
    expect(draft.rationale).toMatch(/simulated|model provider/i);
  });

  it("detects disagreement without erasing alignment helper", () => {
    expect(pathAgreesWithRecommendation("close_case", "do_not_pursue")).toBe(true);
    expect(
      pathAgreesWithRecommendation("founder_requested_continuation", "do_not_pursue"),
    ).toBe(false);
  });
});
