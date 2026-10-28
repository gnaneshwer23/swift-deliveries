import { describe, expect, it } from "vitest";
import { buildInvestigationCommitment, interpretOneLiner } from "./investigation-commitment";

describe("R1 investigation commitment", () => {
  it("interprets a should-question without inventing interviews", () => {
    const line = interpretOneLiner("Should we charge for analytics before launch?");
    expect(line.toLowerCase()).toMatch(/decision|go \/ revise/);
    expect(line.toLowerCase()).not.toContain("interview");
  });

  it("exposes scope, sources, limits and allowance before start", () => {
    const c = buildInvestigationCommitment({
      question: "Should we open weekday breakfasts?",
      researchMode: "combined",
      researchProviderConfigured: false,
      researchProviderLabel: "Simulated drafts",
      investigationRemaining: 2,
      canStart: true,
      blockedReason: null,
    });
    expect(c.version).toBe("commitment-v1");
    expect(c.sources.some((s) => /never invented/i.test(s))).toBe(true);
    expect(c.allowanceLine).toMatch(/2 Investigation/);
    expect(c.attachmentsNote.toLowerCase()).toMatch(/not supported/);
  });
});
