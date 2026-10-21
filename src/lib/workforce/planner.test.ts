import { describe, expect, it } from "vitest";
import { generateMissionPlan, deriveMissionTitle } from "./planner";

describe("generateMissionPlan", () => {
  it("asks for clarification when the request is too thin", () => {
    const plan = generateMissionPlan({
      intent: "investigate",
      requestText: "help",
    });
    expect(plan.tasks).toHaveLength(0);
    expect(plan.clarificationQuestions.some((q) => q.required)).toBe(true);
    expect(plan.estimatedUsage).toBe(0);
  });

  it("plans an investigate mission with acceptance criteria and usage", () => {
    const plan = generateMissionPlan({
      intent: "investigate",
      requestText:
        "Investigate whether we should add a sponsor dashboard for healthcare delivery leads, for the COO audience",
      clarificationAnswers: { success: "COO can decide go/no-go in one sitting" },
    });
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
    expect(plan.estimatedUsage).toBeGreaterThan(0);
    expect(plan.acceptanceCriteria.length).toBeGreaterThan(0);
    expect(plan.includesExternalActions).toBe(false);
    expect(plan.requiredPermission).not.toBe("act_externally");
  });

  it("flags external actions when the request asks to email or deploy", () => {
    const plan = generateMissionPlan({
      intent: "prototype",
      requestText:
        "Prototype a settings page for notification prefs and deploy a preview URL for stakeholders",
      clarificationAnswers: {
        surface: "Settings / notifications",
        success: "Stakeholders can click through the flow",
      },
    });
    expect(plan.includesExternalActions).toBe(true);
    expect(plan.tasks.some((t) => t.isExternal)).toBe(true);
    expect(plan.requiredPermission).toBe("act_externally");
  });

  it("builds improve tasks when baseline is provided", () => {
    const plan = generateMissionPlan({
      intent: "improve",
      requestText: "Improve the current checkout abandonment on mobile",
      clarificationAnswers: {
        baseline: "36% drop between cart and pay on iOS Safari",
        success: "Reduce drop by clarifying the pay CTA",
      },
    });
    expect(plan.tasks.some((t) => /diagnos|friction/i.test(t.title))).toBe(true);
    expect(deriveMissionTitle("improve", plan.tasks[0]?.title ?? "x")).toMatch(/Improve/);
  });
});
