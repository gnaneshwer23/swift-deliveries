import { describe, expect, it } from "vitest";
import {
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUSES,
  MAX_FOLLOWUP_DEPTH,
  answerChecksum,
  normaliseClaimStatus,
  normaliseClaimType,
  normaliseQuestionType,
  recurringStrengths,
  shouldOfferFollowUp,
  summarisePracticeHistory,
} from "./interview-practice";

describe("record check statuses", () => {
  it("offers exactly the four spec statuses", () => {
    expect(CLAIM_STATUSES).toEqual(["supported", "partial", "not_in_record", "contradicted"]);
  });

  it("never uses the word fabricated in anything the user sees", () => {
    for (const status of CLAIM_STATUSES) {
      expect(CLAIM_STATUS_LABELS[status].toLowerCase()).not.toContain("fabricat");
      expect(CLAIM_STATUS_HINTS[status].toLowerCase()).not.toContain("fabricat");
    }
  });

  it("labels unsupported claims as not in record, inviting outside work to be labelled", () => {
    expect(CLAIM_STATUS_LABELS.not_in_record).toBe("Not in record");
    expect(CLAIM_STATUS_HINTS.not_in_record).toContain("outside DeliverX");
  });

  it("maps unknown AI output to not_in_record rather than trusting it", () => {
    expect(normaliseClaimStatus("supported")).toBe("supported");
    expect(normaliseClaimStatus("made_up")).toBe("not_in_record");
    expect(normaliseClaimStatus(undefined)).toBe("not_in_record");
  });
});

describe("follow-up depth cap", () => {
  it("offers a follow-up when a dimension scores weak and depth allows", () => {
    expect(shouldOfferFollowUp([4, 2, 5], 0)).toBe(true);
    expect(shouldOfferFollowUp([4, 2, 5], MAX_FOLLOWUP_DEPTH - 1)).toBe(true);
  });

  it("never offers a follow-up at or beyond the depth cap", () => {
    expect(shouldOfferFollowUp([1, 1, 1], MAX_FOLLOWUP_DEPTH)).toBe(false);
    expect(shouldOfferFollowUp([1], MAX_FOLLOWUP_DEPTH + 2)).toBe(false);
  });

  it("offers no follow-up when every dimension lands at or above the threshold", () => {
    expect(shouldOfferFollowUp([3, 4, 5], 0)).toBe(false);
  });
});

describe("answer freezing", () => {
  it("produces a stable SHA-256 checksum for the same answer body", async () => {
    const a = await answerChecksum("I deprioritised the clinician dashboard in Q3.");
    const b = await answerChecksum("I deprioritised the clinician dashboard in Q3.");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes the checksum when the body changes, so edits are detectable", async () => {
    const a = await answerChecksum("I deprioritised the clinician dashboard in Q3.");
    const b = await answerChecksum("I deprioritised the clinician dashboard in Q4.");
    expect(a).not.toBe(b);
  });
});

describe("question and claim type normalisation", () => {
  it("keeps the four spec question types and defaults unknown values to defend", () => {
    expect(normaliseQuestionType("trade-off")).toBe("trade-off");
    expect(normaliseQuestionType("stakeholder")).toBe("stakeholder");
    expect(normaliseQuestionType("metric")).toBe("metric");
    expect(normaliseQuestionType("other")).toBe("defend");
  });

  it("keeps the four spec claim types and defaults unknown values to action", () => {
    expect(normaliseClaimType("metric")).toBe("metric");
    expect(normaliseClaimType("outcome")).toBe("outcome");
    expect(normaliseClaimType("role")).toBe("role");
    expect(normaliseClaimType("other")).toBe("action");
  });
});

describe("practice history", () => {
  const session = (id: string, closedAt: string, feedback: Array<[string, number]>) => ({
    id,
    roleTarget: "PM",
    closedAt,
    feedback: feedback.map(([dimension, score]) => ({ dimension, score })),
  });

  it("averages rubric scores per dimension across closed sessions", () => {
    const history = summarisePracticeHistory([
      session("a", "2026-10-01", [["structure", 3], ["metrics", 5]]),
      session("b", "2026-10-05", [["structure", 5], ["metrics", 3]]),
    ]);
    const structure = history.find((d) => d.dimension === "structure")!;
    expect(structure.average).toBe(4);
    expect(structure.sessions).toBe(2);
    expect(structure.latest).toBe(5);
    expect(structure.trend).toBe("improving");
  });

  it("ignores sessions without feedback", () => {
    const history = summarisePracticeHistory([
      session("open", "2026-10-01", []),
      session("closed", "2026-10-02", [["structure", 4]]),
    ]);
    expect(history).toHaveLength(1);
    expect(history[0].sessions).toBe(1);
  });

  it("marks declining when the latest score drops below the average", () => {
    const history = summarisePracticeHistory([
      session("a", "2026-10-01", [["structure", 5]]),
      session("b", "2026-10-05", [["structure", 2]]),
    ]);
    expect(history[0].trend).toBe("declining");
  });

  it("counts a strength only when it averages 4+ across at least two sessions", () => {
    const history = summarisePracticeHistory([
      session("a", "2026-10-01", [["structure", 5], ["metrics", 5], ["stakeholders", 2]]),
      session("b", "2026-10-05", [["structure", 4], ["stakeholders", 2]]),
    ]);
    const strengths = recurringStrengths(history).map((d) => d.dimension);
    expect(strengths).toEqual(["structure"]);
  });
});
