import { describe, expect, it } from "vitest";
import { findSimilarIdeas } from "./similar-ideas";

describe("PT-5 similar-idea assist", () => {
  it("returns empty when the draft is too thin", () => {
    expect(
      findSimilarIdeas("build app", [{ id: "1", question: "build an app for tutors" }]),
    ).toEqual([]);
  });

  it("suggests overlapping cases with a basis and never invents ids", () => {
    const prior = [
      {
        id: "a",
        question: "Should we help parents inform tutors about school updates?",
      },
      {
        id: "b",
        question: "Should a cafe try weekday grab-and-go breakfasts first?",
      },
    ];
    const hits = findSimilarIdeas(
      "How should parents inform tutors about school schedule updates?",
      prior,
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.missionId === "a" || h.missionId === "b")).toBe(true);
    expect(hits[0]!.basis.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.missionId === "a")).toBe(true);
  });
});
