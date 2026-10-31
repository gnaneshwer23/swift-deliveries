import { describe, expect, it } from "vitest";
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { buildEstimate, suggestTechnology } from "./build-estimate";

const brief = (question: string, constraints = "") => ({
  question,
  audience: "",
  outcome: "",
  constraints,
});

describe("buildEstimate", () => {
  it("budgets AI work from the delivery plan's own tasks", () => {
    const question = "An app that helps small restaurants reduce food waste";
    const plan = productMissionTasks(question, false);
    const estimate = buildEstimate(brief(question));
    expect(estimate.aiWork.usageUnits).toBe(plan.reduce((n, t) => n + t.estimatedUsage, 0));
    expect(estimate.aiWork.stages + estimate.aiWork.reviews).toBe(plan.length);
    expect(estimate.aiWork.reviews).toBe(plan.filter((t) => t.gate).length);
  });

  it("states its basis and never presents a quote or a money figure", () => {
    const estimate = buildEstimate(brief("A budgeting tool for students"));
    expect(estimate.firstVersion.basis).toMatch(/rule-of-thumb/i);
    expect(estimate.firstVersion.basis).toMatch(/not a quote/i);
    const all = JSON.stringify(estimate);
    expect(all).not.toMatch(/[£$€]\s?\d/);
  });

  it("widens the time range for broader cases", () => {
    const narrow = buildEstimate(brief("Change the onboarding button label"));
    const broad = buildEstimate(
      brief("A marketplace with competitor pricing and a go-to-market plan for enterprise launch"),
    );
    expect(narrow.band).toBe("S");
    expect(broad.band).toBe("L");
    expect(narrow.firstVersion.range).not.toBe(broad.firstVersion.range);
  });
});

describe("suggestTechnology", () => {
  it("suggests only what the brief's words call for, each with a reason", () => {
    const plain = suggestTechnology("A tool to plan weekly meals");
    expect(plain.map((t) => t.part)).toEqual(["App", "Data"]);
    const rich = suggestTechnology(
      "A mobile app with an AI assistant, subscriptions and live chat near your location",
    );
    expect(rich.map((t) => t.part)).toEqual([
      "App",
      "Data",
      "AI",
      "Payments",
      "Live updates",
      "Location",
    ]);
    expect(rich[0]?.choice).toMatch(/mobile-first/i);
    expect(rich.every((t) => t.why.length > 10)).toBe(true);
  });
});
