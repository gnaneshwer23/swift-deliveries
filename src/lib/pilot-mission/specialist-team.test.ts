import { describe, expect, it } from "vitest";
import {
  buildPilotTeamPlan,
  selectCapabilityIdsForBand,
  STAFFING_CORE_IDS,
  WAVE1_AVAILABLE_CAP,
} from "./specialist-team";

describe("scaled staffing from Available Wave 1", () => {
  it("selects deterministic subsets by band and never exceeds the Available cap", () => {
    expect(selectCapabilityIdsForBand("S")).toEqual([...STAFFING_CORE_IDS]);
    expect(selectCapabilityIdsForBand("M")).toHaveLength(6);
    expect(selectCapabilityIdsForBand("L")).toHaveLength(WAVE1_AVAILABLE_CAP);
    expect(selectCapabilityIdsForBand("XL")).toHaveLength(WAVE1_AVAILABLE_CAP);
    expect(selectCapabilityIdsForBand("XL").every((id) => id.startsWith("DX-"))).toBe(true);
  });

  it("builds Band S with core owners only (options/delivery reassigned)", () => {
    const plan = buildPilotTeamPlan({ band: "S" });
    expect(plan.staffingBand).toBe("S");
    expect(plan.capabilityIds).toEqual([...STAFFING_CORE_IDS]);
    expect(plan.capabilityIds).not.toContain("DX-021");
    expect(plan.capabilityIds).not.toContain("DX-023");
    const draft = plan.tasks.find((t) => t.key === "draft_options");
    expect(draft?.capabilityId).toBe("DX-001");
  });

  it("builds Band L with the full Available Wave 1 set", () => {
    const plan = buildPilotTeamPlan({ band: "L" });
    expect(plan.capabilityIds).toEqual([
      "DX-002",
      "DX-018",
      "DX-020",
      "DX-001",
      "DX-021",
      "DX-071",
      "DX-023",
      "DX-035",
    ]);
    expect(plan.tasks.find((t) => t.key === "draft_options")?.capabilityId).toBe("DX-021");
    expect(plan.tasks.find((t) => t.key === "assemble_pack")?.capabilityId).toBe("DX-035");
  });
});
