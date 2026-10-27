import { describe, it, expect } from "vitest";
import {
  parseMissionIntake,
  preparedMissionIntake,
  restoreMissionIntake,
} from "./mission-intake-draft";
import { BRIEF_PRESETS } from "./marketing/brief-presets";
describe("first mission intake", () => {
  it("carries audience, objective and constraints from a matching prepared question", () => {
    const brief = BRIEF_PRESETS.team.brief;
    expect(restoreMissionIntake(null, brief.problem, brief)).toEqual(preparedMissionIntake(brief));
  });
  it("keeps a newer edited onboarding question separate from unrelated brief details", () => {
    const result = restoreMissionIntake(null, "A different question", BRIEF_PRESETS.team.brief);
    expect(result.question).toBe("A different question");
    expect(result.audience).toMatch(/Primary customers/i);
    expect(result.constraints).toMatch(/Research first/i);
  });
  it("preserves a deliberately blank intake instead of refilling it on reload", () => {
    const local = { question: "", audience: "", outcome: "", constraints: "" };
    expect(restoreMissionIntake(local, "Old question", BRIEF_PRESETS.team.brief)).toEqual(local);
  });
  it("rejects corrupted drafts instead of partially merging them", () => {
    expect(parseMissionIntake('{"question":"test"}')).toBeNull();
    expect(parseMissionIntake("null")).toBeNull();
  });
});
