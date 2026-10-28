import { describe, expect, it } from "vitest";
import { pathArtefactGuide } from "./path-artefacts";
import { HUMAN_NEXT_PATHS } from "./verdict";

describe("R4 path artefacts", () => {
  it("covers every human next path without implying automatic build", () => {
    for (const path of HUMAN_NEXT_PATHS) {
      const guide = pathArtefactGuide(path);
      expect(guide.expectedArtefacts.length).toBeGreaterThan(0);
      expect(guide.notAutomatic.toLowerCase()).toMatch(/not|without|does not/);
    }
  });

  it("keeps interview guides as planning until authorised", () => {
    const guide = pathArtefactGuide("authorise_gather_evidence");
    expect(guide.expectedArtefacts.some((a) => /interview/i.test(a.type))).toBe(true);
    expect(guide.expectedArtefacts.some((a) => /planning/i.test(a.note))).toBe(true);
  });
});
