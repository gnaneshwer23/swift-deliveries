import { describe, expect, it } from "vitest";
import { isAssignable, getCapability } from "@/lib/workforce/registry/load";
import {
  BAND_CATALOGUE_N,
  CATALOGUE_CEILING,
  buildPilotTeamPlan,
  selectCapabilityIdsForBand,
  selectCatalogueRosterForBand,
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

describe("catalogue roster by complexity band", () => {
  it("scales N by band toward the ceiling without staffing all 150 on simple cases", () => {
    const s = selectCatalogueRosterForBand("S");
    const m = selectCatalogueRosterForBand("M");
    const l = selectCatalogueRosterForBand("L");
    const xl = selectCatalogueRosterForBand("XL");
    expect(s.selected).toBe(BAND_CATALOGUE_N.S);
    expect(m.selected).toBe(BAND_CATALOGUE_N.M);
    expect(l.selected).toBe(BAND_CATALOGUE_N.L);
    expect(xl.selected).toBe(BAND_CATALOGUE_N.XL);
    expect(s.selected).toBeLessThan(m.selected);
    expect(m.selected).toBeLessThan(l.selected);
    expect(l.selected).toBeLessThan(xl.selected);
    expect(xl.selected).toBeLessThanOrEqual(CATALOGUE_CEILING);
    expect(xl.selected).toBeGreaterThan(100);
  });

  it("keeps Available runnable and Planned roster-only", () => {
    const xl = selectCatalogueRosterForBand("XL");
    expect(xl.availableCount).toBeGreaterThan(0);
    expect(xl.plannedCount).toBeGreaterThan(0);
    expect(xl.availableCount + xl.plannedCount).toBe(xl.selected);
    for (const id of xl.ids.slice(0, xl.availableCount)) {
      const cap = getCapability(id);
      expect(cap && isAssignable(cap)).toBe(true);
    }
  });

  it("persists catalogue roster ids on the team plan", () => {
    const plan = buildPilotTeamPlan({ band: "XL" });
    expect(plan.catalogueRosterIds?.length).toBe(BAND_CATALOGUE_N.XL);
    expect(plan.capabilityIds.length).toBe(WAVE1_AVAILABLE_CAP);
  });
});
