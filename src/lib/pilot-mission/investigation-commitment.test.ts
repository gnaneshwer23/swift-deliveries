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
      allowanceLoad: {
        status: "active",
        snapshot: { remaining: 2, missionAllowance: 4, missionsConsumed: 2 },
      },
      canStart: true,
      blockedReason: null,
    });
    expect(c.version).toBe("commitment-v1");
    expect(c.sources.some((s) => /never invented/i.test(s))).toBe(true);
    expect(c.allowanceLine).toMatch(/2 Investigation/);
    expect(c.attachmentsNote.toLowerCase()).toMatch(/not supported/);
  });

  it("shows demo ceiling copy when no pilot activation exists", () => {
    const c = buildInvestigationCommitment({
      question: "Should we launch in Q2?",
      researchMode: "provided",
      researchProviderConfigured: false,
      researchProviderLabel: "Simulated drafts",
      allowanceLoad: { status: "demo" },
      workspaceUsage: { ceiling: 100, consumed: 12 },
      canStart: true,
      blockedReason: null,
    });
    expect(c.allowanceLine).toMatch(/No paid pilot plan/i);
    expect(c.allowanceLine).toMatch(/88 of 100/);
    expect(c.allowanceLine).not.toMatch(/could not be loaded/i);
  });

  it("surfaces a specific reason when allowance storage fails", () => {
    const c = buildInvestigationCommitment({
      question: "Should we?",
      researchMode: "combined",
      researchProviderConfigured: false,
      researchProviderLabel: "Simulated drafts",
      allowanceLoad: { status: "failed", reason: "Pilot activation storage is not available." },
      canStart: false,
      blockedReason: null,
    });
    expect(c.allowanceLine).toBe("Pilot activation storage is not available.");
  });
});
