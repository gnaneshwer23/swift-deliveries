import { describe, expect, it } from "vitest";
import { EMPTY_SETUP, parseSetupDraft, restoreSetup, safeSetupStep } from "./onboarding-draft";
import { BRIEF_PRESETS } from "./marketing/brief-presets";
const fields = {
  fullName: "Test Builder",
  role: "Founder",
  teamSize: "Just me",
  goal: "Validate a new idea",
  firstIdea: "Edited question",
};
describe("setup continuity", () => {
  it("rejects corrupt storage and invalid role choices", () => {
    expect(parseSetupDraft("{broken")).toBeNull();
    expect(parseSetupDraft('["role"]')).toBeNull();
    expect(parseSetupDraft('{"role":"admin","teamSize":"huge","step":900}')?.role).toBe("");
    expect(safeSetupStep(2, EMPTY_SETUP)).toBe(0);
  });
  it("keeps a newer browser snapshot, including a deliberately cleared question", () => {
    const result = restoreSetup({
      local: { ...fields, firstIdea: "", savedAt: "2026-10-25T10:00:00Z", step: 2 },
      server: { ...fields, updatedAt: "2026-10-25T09:00:00Z" },
      brief: BRIEF_PRESETS.founder.brief,
    });
    expect(result.source).toBe("browser");
    expect(result.fields.firstIdea).toBe("");
    expect(result.step).toBe(2);
  });
  it("uses a newer server snapshot rather than merging stale fields into it", () => {
    const result = restoreSetup({
      local: { ...fields, savedAt: "2026-10-25T09:00:00Z" },
      server: { ...fields, firstIdea: "New account draft", updatedAt: "2026-10-25T10:00:00Z" },
    });
    expect(result.source).toBe("account");
    expect(result.fields.firstIdea).toBe("New account draft");
  });
  it("uses the prepared brief only when there is no setup snapshot", () => {
    expect(restoreSetup({ brief: BRIEF_PRESETS.student.brief }).fields.firstIdea).toBe(
      BRIEF_PRESETS.student.brief.problem,
    );
    expect(
      restoreSetup({ local: { ...fields, firstIdea: "" }, brief: BRIEF_PRESETS.student.brief })
        .fields.firstIdea,
    ).toBe("");
  });
  it("never overrides a completed profile with another draft", () => {
    const result = restoreSetup({
      existing: { ...fields, completedAt: "2026-10-25" },
      local: { ...fields, firstIdea: "Old browser question" },
    });
    expect(result.source).toBe("profile");
    expect(result.fields.firstIdea).toBe("Edited question");
  });
  it("returns to an incomplete step and accepts legacy browser names", () => {
    expect(parseSetupDraft('{"name":"Legacy User"}')?.fullName).toBe("Legacy User");
    expect(safeSetupStep(2, { ...fields, goal: "" })).toBe(1);
    expect(safeSetupStep(2, { ...fields, role: "" })).toBe(0);
  });
});
