import { describe, expect, it } from "vitest";
import { practisedSteps, type FirstProjectSource } from "@/lib/pilot-mission/first-project";
import { LESSONS, lessonById, practisedLessons } from "./lessons";

const p = (over: Partial<FirstProjectSource>): FirstProjectSource => ({
  id: "a",
  question: "q",
  stage: "evidence",
  archived: false,
  updatedAt: "2026-10-30T10:00:00Z",
  planApproved: false,
  decisionRecorded: false,
  delivery: false,
  observationRecorded: false,
  ...over,
});

describe("lessons", () => {
  it("are numbered in order with unique ids and complete content", () => {
    expect(LESSONS.map((l) => l.n)).toEqual(LESSONS.map((_, i) => i + 1));
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      expect(l.what && l.why && l.mistake && l.tryIt).toBeTruthy();
      expect(l.how.length).toBeGreaterThan(0);
      expect(lessonById(l.id)).toBe(l);
    }
  });

  it("marks a lesson practised only when its step is done in a live project", () => {
    expect(practisedLessons(practisedSteps([]))).toEqual(new Set());
    const steps = practisedSteps([
      p({ planApproved: true }),
      p({ id: "gone", archived: true, decisionRecorded: true }),
    ]);
    expect([...practisedLessons(steps)].sort()).toEqual(
      ["approve-a-plan", "evidence-vs-assumptions", "frame-the-question"].sort(),
    );
  });
});
