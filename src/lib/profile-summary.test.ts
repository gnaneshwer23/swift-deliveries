import { describe, expect, it } from "vitest";
import { initialsOf, profileProgress } from "./profile-summary";
import type { FirstProjectSource } from "@/lib/pilot-mission/first-project";

const p = (over: Partial<FirstProjectSource>): FirstProjectSource => ({
  id: "p",
  question: "Idea",
  stage: "decision",
  archived: false,
  updatedAt: "2026-11-01T10:00:00Z",
  planApproved: false,
  decisionRecorded: false,
  delivery: false,
  observationRecorded: false,
  ...over,
});

describe("profileProgress", () => {
  it("counts only live projects and steps the record shows", () => {
    const r = profileProgress([
      p({ id: "a", planApproved: true }),
      p({ id: "b", archived: true, planApproved: true, decisionRecorded: true }),
      p({ id: "c", stage: "cancelled", delivery: true }),
    ]);
    expect(r.liveProjects).toBe(1);
    // Idea and plan on the live project; the archived and stopped ones add nothing.
    expect(r.stepsReached).toBe(2);
    expect(r.stepsTotal).toBe(6);
    expect(r.lessonsForSteps).toBeGreaterThan(0);
    expect(r.lessonsForSteps).toBeLessThanOrEqual(r.lessonsTotal);
  });

  it("is all zeros with no projects", () => {
    expect(profileProgress([])).toMatchObject({
      liveProjects: 0,
      stepsReached: 0,
      lessonsForSteps: 0,
    });
  });
});

describe("initialsOf", () => {
  it("uses up to two initials from a name or an email", () => {
    expect(initialsOf("Gnaneshwer Jadav")).toBe("GJ");
    expect(initialsOf("ana")).toBe("A");
    expect(initialsOf("sam.patel@example.com")).toBe("SP");
    expect(initialsOf("  ")).toBe("DX");
  });
});
