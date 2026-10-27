import { describe, expect, it, vi } from "vitest";
import { expandOneLinerBrief, seedResearchEvidence } from "./pm-brief";
import { runResearchPass } from "./research-pass";
import { buildPilotTeamPlan } from "./specialist-team";

describe("research pass honesty", () => {
  it("marks external gaps when combined mode has no search provider", async () => {
    const team = buildPilotTeamPlan({ band: "M" });
    const brief = expandOneLinerBrief({
      question: "Should we charge for onboarding analytics before launch?",
    });
    const result = await runResearchPass({
      mission: {
        brief,
        evidence: seedResearchEvidence("combined"),
        researchMode: "combined",
        researchGaps: [],
        activity: [],
        team,
      },
      at: new Date(1_000).toISOString(),
      env: {},
      search: vi.fn(async () => ({
        provider: null,
        results: [],
        error: "no search provider configured",
      })),
    });
    expect(result.findingsCount).toBe(0);
    expect(result.researchGaps.some((g) => /Web portion unavailable|no search provider/i.test(g))).toBe(
      true,
    );
    expect(result.evidence.some((e) => e.classification === "gap")).toBe(true);
    expect(result.activity.some((e) => e.kind === "research.pass.started")).toBe(true);
    expect(result.activity.some((e) => e.kind === "research.pass.completed")).toBe(true);
    expect(result.activity.some((e) => e.kind === "research.external_gap")).toBe(true);
    expect(result.provider).toBeNull();
  });

  it("writes cited findings when a provider returns results", async () => {
    const team = buildPilotTeamPlan({ band: "M" });
    const brief = expandOneLinerBrief({
      question: "Should we charge for onboarding analytics before launch?",
    });
    const search = vi.fn(async () => ({
      provider: "exa",
      results: [
        {
          url: "https://example.com/analytics-pricing",
          title: "Analytics pricing patterns",
          snippet: "Teams often gate advanced analytics behind a paid plan.",
          publishedAt: null,
        },
      ],
    }));
    const result = await runResearchPass({
      mission: {
        brief,
        evidence: seedResearchEvidence("combined"),
        researchMode: "combined",
        researchGaps: [],
        activity: [],
        team,
      },
      at: new Date(2_000).toISOString(),
      env: { EXA_API_KEY: "test-key" },
      search,
    });
    expect(search).toHaveBeenCalled();
    expect(result.findingsCount).toBeGreaterThan(0);
    expect(result.provider).toBe("exa");
    expect(
      result.evidence.some(
        (e) =>
          e.classification === "supplied" &&
          e.source.includes("example.com") &&
          e.statement.includes("[Cited · exa]"),
      ),
    ).toBe(true);
    expect(result.activity.some((e) => e.kind === "research.cited")).toBe(true);
  });

  it("writes cited findings via tavily without inventing when results are empty", async () => {
    const search = vi.fn(async () => ({
      provider: "tavily",
      results: [],
    }));
    const result = await runResearchPass({
      mission: {
        brief: expandOneLinerBrief({ question: "Should we charge for analytics?" }),
        evidence: seedResearchEvidence("combined"),
        researchMode: "combined",
        researchGaps: [],
        activity: [],
        team: buildPilotTeamPlan({ band: "M" }),
      },
      at: new Date(2_500).toISOString(),
      env: { TAVILY_API_KEY: "test-key" },
      search,
    });
    expect(search).toHaveBeenCalled();
    expect(result.findingsCount).toBe(0);
    expect(result.provider).toBe("tavily");
    expect(result.researchGaps.some((g) => /no usable citations/i.test(g))).toBe(true);
    expect(result.activity.some((e) => e.kind === "research.cited")).toBe(false);
  });

  it("does not invent web hits in provided mode", async () => {
    const search = vi.fn(async () => ({
      provider: "exa",
      results: [
        {
          url: "https://example.com/x",
          title: "Should not appear",
          snippet: "Nope",
          publishedAt: null,
        },
      ],
    }));
    const result = await runResearchPass({
      mission: {
        brief: expandOneLinerBrief({ question: "Should we keep the free tier?" }),
        evidence: seedResearchEvidence("provided"),
        researchMode: "provided",
        researchGaps: [],
        activity: [],
        team: buildPilotTeamPlan({ band: "S" }),
      },
      at: new Date(3_000).toISOString(),
      env: { EXA_API_KEY: "test-key" },
      search,
    });
    expect(search).not.toHaveBeenCalled();
    expect(result.findingsCount).toBe(0);
    expect(result.activity.some((e) => e.kind === "research.provided_only")).toBe(true);
  });
});
