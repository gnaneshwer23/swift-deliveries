import { describe, expect, it } from "vitest";
import { buildPlanReview } from "./plan-review";
import { RESEARCH_REFINE_AUDIENCE } from "./pm-brief";
import { baseMission } from "./test-fixtures";

describe("buildPlanReview", () => {
  it("says the plan in plain words, without internal jargon", () => {
    const plan = buildPlanReview(baseMission());
    const text = JSON.stringify(plan);
    expect(text).not.toMatch(/wave 1|catalogue|roster|\bband\b|Available\b|cast/i);
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps.at(-1)).toMatch(/without your approval/);
    expect(plan.facts.map((f) => f.label)).toEqual(["Time", "Cost", "Team"]);
  });

  it("names the unknowns and is honest about missing web research", () => {
    const plan = buildPlanReview(
      baseMission({
        brief: {
          question: "Food waste app",
          audience: RESEARCH_REFINE_AUDIENCE,
          outcome: "",
          constraints: "",
        },
        researchGaps: ["Web portion unavailable: no search provider configured."],
      }),
    );
    expect(plan.unknowns[0]).toBe("Who your first users are");
    expect(plan.research).toMatch(/isn’t connected/);
  });

  it("blocks approval on a cancelled case", () => {
    expect(buildPlanReview(baseMission({ stage: "cancelled" })).blocked).toMatch(/cancelled/);
  });
});
