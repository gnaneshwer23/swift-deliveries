import { describe, expect, it } from "vitest";
import { filterPortfolio, portfolioSummary, type PortfolioMissionRow } from "./portfolio";

const rows: PortfolioMissionRow[] = [
  {
    id: "1",
    question: "Should we charge for analytics?",
    stage: "alternatives",
    nextTitle: "Record a decision",
    nextId: "decide",
    decisionRecorded: false,
    observationRecorded: false,
    updatedAt: "2026-10-28T12:00:00Z",
  },
  {
    id: "2",
    question: "Weekday breakfasts in Bath",
    stage: "exported",
    nextTitle: "Mission complete",
    nextId: "done",
    decisionRecorded: true,
    observationRecorded: true,
    updatedAt: "2026-10-27T12:00:00Z",
  },
  {
    id: "3",
    question: "Observe analytics pilot",
    stage: "observation",
    nextTitle: "Record observation",
    nextId: "observation",
    decisionRecorded: true,
    observationRecorded: false,
    updatedAt: "2026-10-28T10:00:00Z",
  },
];

describe("PT-4 portfolio helpers", () => {
  it("filters by attention and search without inventing cases", () => {
    const attention = filterPortfolio(rows, { query: "", stage: "", attentionOnly: true });
    expect(attention.map((r) => r.id)).toEqual(["1", "3"]);
    const search = filterPortfolio(rows, {
      query: "breakfasts",
      stage: "",
      attentionOnly: false,
    });
    expect(search).toHaveLength(1);
    expect(search[0]!.id).toBe("2");
  });

  it("summarises decisions and outcomes due", () => {
    expect(portfolioSummary(rows)).toEqual({
      total: 3,
      awaitingDecision: 1,
      outcomeDue: 1,
    });
  });
});
