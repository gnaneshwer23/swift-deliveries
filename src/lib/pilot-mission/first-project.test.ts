import { describe, expect, it } from "vitest";
import { buildFirstProject, explainByDefault, type FirstProjectSource } from "./first-project";

const p = (over: Partial<FirstProjectSource>): FirstProjectSource => ({
  id: "a",
  question: "Food waste app",
  stage: "evidence",
  archived: false,
  updatedAt: "2026-10-30T10:00:00Z",
  planApproved: false,
  decisionRecorded: false,
  delivery: false,
  observationRecorded: false,
  ...over,
});

describe("buildFirstProject", () => {
  it("is empty with no live project", () => {
    expect(buildFirstProject([])).toBeNull();
    expect(
      buildFirstProject([p({ archived: true }), p({ id: "b", stage: "cancelled" })]),
    ).toBeNull();
  });

  it("ticks only what the record shows, and names the next step", () => {
    const f = buildFirstProject([p({ planApproved: true })])!;
    expect(f.steps.map((s) => [s.id, s.done])).toEqual([
      ["idea", true],
      ["plan", true],
      ["decision", false],
      ["delivery", false],
      ["package", false],
      ["outcome", false],
    ]);
    expect(f.doneCount).toBe(2);
    expect(f.next?.id).toBe("decision");
  });

  it("follows the most recently updated live project", () => {
    const f = buildFirstProject([
      p({ id: "old", updatedAt: "2026-10-01T00:00:00Z" }),
      p({ id: "new", updatedAt: "2026-10-31T00:00:00Z", question: "Dog walkers" }),
      p({ id: "gone", updatedAt: "2026-11-01T00:00:00Z", archived: true }),
    ])!;
    expect(f.projectId).toBe("new");
    expect(f.projectName).toBe("Dog walkers");
  });

  it("has no next step when everything is done", () => {
    const f = buildFirstProject([
      p({
        planApproved: true,
        decisionRecorded: true,
        delivery: true,
        stage: "exported",
        observationRecorded: true,
      }),
    ])!;
    expect(f.next).toBeNull();
    expect(f.doneCount).toBe(6);
  });
});

describe("explainByDefault", () => {
  it("turns explanations on for learners only", () => {
    expect(explainByDefault("Learn by building a product")).toBe(true);
    expect(explainByDefault("Build an MVP", "Student or new builder")).toBe(true);
    expect(explainByDefault("Build an MVP", "Founder")).toBe(false);
    expect(explainByDefault(null)).toBe(false);
  });
});
