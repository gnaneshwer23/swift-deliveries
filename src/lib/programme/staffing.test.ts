import { describe, expect, it } from "vitest";
import { CATALOGUE_CEILING } from "@/lib/pilot-mission/specialist-team";
import { programmeStaffingFor } from "./staffing";

describe("programmeStaffingFor", () => {
  it("keeps a simple case well below the catalogue ceiling", () => {
    const s = programmeStaffingFor({
      idea: "Should we tweak one onboarding field label?",
      problem: "Copy is unclear",
      goals: "Clearer wording",
    });
    expect(s.band).toBe("S");
    expect(s.catalogueSelected).toBeLessThan(40);
    expect(s.catalogueSelected).toBeLessThan(s.catalogueCeiling);
    expect(s.catalogueCeiling).toBe(CATALOGUE_CEILING);
  });

  it("scales toward the ceiling for programme-scale cases without forcing 150 on every run", () => {
    const s = programmeStaffingFor({
      idea:
        "Enterprise multi-geo rollout programme across EMEA and APAC with regulatory compliance, partner integrations, and a long evidence base for buyer committees that need a full programme-scale plan.",
      problem: "Fragmented regional launches and unclear ownership",
      goals: "Coordinated enterprise rollout with measurable adoption",
    });
    expect(["L", "XL"]).toContain(s.band);
    expect(s.catalogueSelected).toBeGreaterThan(50);
    expect(s.catalogueSelected).toBeLessThanOrEqual(CATALOGUE_CEILING);
  });
});
