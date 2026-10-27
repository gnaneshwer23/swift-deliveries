import { describe, expect, it } from "vitest";
import {
  buildPmBrief,
  estimateStaffingBand,
  expandOneLinerBrief,
  RESEARCH_FIRST_CONSTRAINT,
  RESEARCH_REFINE_AUDIENCE,
  seedResearchEvidence,
} from "./pm-brief";
import { buildPilotTeamPlan } from "./specialist-team";

describe("pm brief — one-liner expansion", () => {
  it("fills audience and outcome without a questionnaire", () => {
    const brief = expandOneLinerBrief({
      question: "Should we keep the free tier for students?",
    });
    expect(brief.question).toMatch(/free tier/i);
    expect(brief.audience).toBe(RESEARCH_REFINE_AUDIENCE);
    expect(brief.outcome.length).toBeGreaterThan(7);
    expect(brief.constraints).toBe(RESEARCH_FIRST_CONSTRAINT);
  });

  it("keeps explicit overrides", () => {
    const brief = expandOneLinerBrief({
      question: "Should we keep the free tier for students?",
      audience: "University buyers",
      outcome: "A pricing decision pack.",
      constraints: "No paid ads.",
    });
    expect(brief.audience).toBe("University buyers");
    expect(brief.outcome).toBe("A pricing decision pack.");
    expect(brief.constraints).toBe("No paid ads.");
  });
});

describe("pm brief — staffing bands", () => {
  it("keeps focused cases near the small band without enabling the full catalogue", () => {
    const band = estimateStaffingBand("Should we change one onboarding field label?");
    expect(band.band).toBe("focused");
    expect(band.activeSpecialists).toBe(8);
    expect(band.catalogueTargetMax).toBeLessThanOrEqual(24);
  });

  it("marks market/competitor cases as expanded without staffing all 150", () => {
    const band = estimateStaffingBand(
      "Map competitors and go-to-market pricing for an international launch across three segments.",
    );
    expect(band.band).toBe("expanded");
    expect(band.activeSpecialists).toBe(8);
    expect(band.catalogueTargetMax).toBeLessThanOrEqual(100);
  });
});

describe("pm brief — research seed and artefact", () => {
  it("seeds honest gaps for combined mode without inventing web results", () => {
    const items = seedResearchEvidence("combined");
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some((i) => i.classification === "gap")).toBe(true);
  });

  it("builds a PM brief with plan, cost, time and team", () => {
    const team = buildPilotTeamPlan();
    const brief = buildPmBrief({
      brief: expandOneLinerBrief({
        question: "Should we charge for onboarding analytics before launch?",
      }),
      team,
      researchMode: "combined",
      researchGaps: [],
      usageCeiling: 6,
    });
    expect(brief.version).toBe("pm-brief-v1");
    expect(brief.whatWillHappen.length).toBeGreaterThanOrEqual(3);
    expect(brief.roughCost.comparisonUnitsReserved).toBe(1);
    expect(brief.team.initiatingAgent.length).toBeGreaterThan(0);
    expect(brief.team.staffing.activeSpecialists).toBe(8);
    expect(brief.askFounderOnlyWhen).toMatch(/decision/i);
  });
});
