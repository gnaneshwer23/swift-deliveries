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
  it("prefers the prepared dx-psi-brief one-liner over a stale profile firstIdea", () => {
    const result = restoreMissionIntake(null, "A different question", BRIEF_PRESETS.team.brief);
    expect(result).toEqual(preparedMissionIntake(BRIEF_PRESETS.team.brief));
  });
  it("keeps an edited session draft ahead of the prepared brief", () => {
    const local = {
      question: "Should we change pricing this quarter?",
      audience: "Founders",
      outcome: "A pricing decision.",
      constraints: "No ads.",
    };
    expect(restoreMissionIntake(local, "Old question", BRIEF_PRESETS.team.brief)).toEqual(local);
  });
  it("uses the prepared brief when the session draft question is blank", () => {
    const local = { question: "", audience: "", outcome: "", constraints: "" };
    expect(restoreMissionIntake(local, "Old question", BRIEF_PRESETS.team.brief)).toEqual(
      preparedMissionIntake(BRIEF_PRESETS.team.brief),
    );
  });
  it("rejects corrupted drafts instead of partially merging them", () => {
    expect(parseMissionIntake('{"question":"test"}')).toBeNull();
    expect(parseMissionIntake("null")).toBeNull();
  });
});
