import { describe, expect, it } from "vitest";
import { consultChiefOfStaff, usageBudgetLines } from "./chief-of-staff";
import { emptyStudioMeta } from "./studio-meta";
import { baseMission } from "./test-fixtures";

describe("Chief of Staff case answers", () => {
  it("answers budget from usage only and does not invent currency", () => {
    const mission = baseMission();
    const reply = consultChiefOfStaff(mission, "What's the budget for this project?");
    expect(reply.action).toBeNull();
    expect(reply.text).toContain(`Usage ceiling on this case: ${mission.usageCeiling} units.`);
    expect(reply.text).toContain(`Usage consumed: ${mission.usageConsumed} units.`);
    expect(reply.text).toContain("No currency amount is recorded");
    expect(reply.text).not.toMatch(/[$£€]|\bUSD\b|\bGBP\b/);
    expect(reply.lookupNote).toContain("No separate model");
    expect(usageBudgetLines(mission).join("\n")).not.toMatch(/\b\d{4,}\b/);
  });

  it("looks up Market on the record instead of inventing a finding", () => {
    const reply = consultChiefOfStaff(baseMission(), "What did Market record about this case?");
    expect(reply.consulted.some((item) => item.capabilityId === "DX-021")).toBe(true);
    expect(reply.text).toContain("Market Intelligence Agent");
    expect(reply.text).toContain("DX-021");
    expect(reply.text).toContain("Draft options");
    expect(reply.lookupNote).toContain("structured lookup");
    expect(reply.lookupNote).toContain("No separate model was called");
    expect(reply.text).not.toMatch(/interviewed|customers said/i);
    expect(reply.action).toBeNull();
  });

  it("offers cancel, pause and resume as confirmations and does not approve a gate", () => {
    const mission = baseMission();
    const stop = consultChiefOfStaff(mission, "Stop mid-project");
    expect(stop.action).toEqual({ kind: "cancel_case" });
    expect(stop.text).toContain("I have not cancelled");

    expect(consultChiefOfStaff(mission, "Don't cancel the case").action).toBeNull();
    expect(consultChiefOfStaff(mission, "stop").action).toBeNull();

    const pause = consultChiefOfStaff(mission, "Pause the investigation");
    expect(pause.action).toEqual({ kind: "pause_investigation" });

    const resumed = consultChiefOfStaff(
      baseMission({
        studioMeta: { ...emptyStudioMeta("2026-10-31T12:00:00Z"), investigationPaused: true },
      }),
      "Continue",
    );
    expect(resumed.action).toEqual({ kind: "resume_investigation" });
    expect(resumed.text).toContain("does not approve a plan");

    const open = consultChiefOfStaff(mission, "Continue the project");
    expect(open.action).toBeNull();
    expect(open.text).toContain("I have not approved");
  });

  it("prepares documents only as a download confirmation", () => {
    const reply = consultChiefOfStaff(baseMission(), "Prepare the project documents");
    expect(reply.action).toEqual({ kind: "download_package" });
    expect(reply.text).toContain("Nothing is downloaded until you click");
  });

  it("says a currency budget is unknown when no ceiling is stored", () => {
    const reply = consultChiefOfStaff(
      baseMission({ usageCeiling: 0, usageConsumed: 0 }),
      "What is the budget?",
    );
    expect(reply.text).toContain("usage budget is unknown");
    expect(reply.text).not.toMatch(/[$£€]/);
  });
});
