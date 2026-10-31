import { describe, it, expect } from "vitest";
import {
  buildStartBriefFromIntake,
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
  it("parses clarifying answers on the session draft", () => {
    const parsed = parseMissionIntake(
      JSON.stringify({
        question: "Food waste app",
        audience: "",
        outcome: "",
        constraints: "",
        clarifyWho: "Chefs",
        clarifyDayOne: "Log spoilage",
        clarifyProductType: "Business product",
        clarifySuccess: "Less waste weekly",
      }),
    );
    expect(parsed?.clarifyWho).toBe("Chefs");
    expect(parsed?.clarifyProductType).toBe("Business product");
  });
  it("merges clarifying answers and marks unanswered as assumptions", () => {
    const brief = buildStartBriefFromIntake(
      {
        question: "Build a food waste app",
        audience: "",
        outcome: "",
        constraints: "",
        clarifyWho: "Restaurant managers",
        clarifyDayOne: "",
        clarifyProductType: "Business product",
        clarifySuccess: "",
      },
      { skippedClarifying: false },
    );
    expect(brief.audience).toBe("Restaurant managers");
    expect(brief.constraints).toContain("Product type (founder-supplied): Business product");
    expect(brief.constraints).toContain("Unanswered clarifying details");
    expect(brief.constraints).toContain("day-one capability");
  });
  it("records a full skip as assumptions for Aria", () => {
    const brief = buildStartBriefFromIntake(
      {
        question: "Build a food waste app",
        audience: "",
        outcome: "",
        constraints: "",
      },
      { skippedClarifying: true },
    );
    expect(brief.constraints).toContain("Clarifying questions skipped");
  });
});
