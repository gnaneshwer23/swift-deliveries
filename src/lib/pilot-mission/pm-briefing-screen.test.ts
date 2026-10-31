import { describe, expect, it } from "vitest";
import { buildPmBriefingScreen } from "./pm-briefing-screen";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "alternatives",
    brief: {
      question: "Build an app that helps small restaurants reduce food waste.",
      audience: "Small restaurant owners",
      outcome: "Owners cut weekly food waste",
      constraints: "No POS integration in v1",
    },
    evidence: [
      {
        id: "e1",
        statement: "Owners struggle to track surplus ingredients before close.",
        source: "founder",
        classification: "supplied",
      },
      {
        id: "e2",
        statement: "Existing inventory tools are heavy for small kitchens.",
        source: "founder",
        classification: "assumption",
      },
      {
        id: "e3",
        statement: "Integration effort with existing systems is unknown.",
        source: "",
        classification: "gap",
      },
    ],
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "scope",
      options: [
        {
          id: "opt-a",
          title: "Simple web app for surplus tracking",
          tradeoff: "Fastest learning; limited automation",
          basis: "evidence e1",
        },
        {
          id: "opt-b",
          title: "Mobile-first kitchen checklist",
          tradeoff: "Stronger day-of use; more build surface",
          basis: "evidence e1",
        },
        {
          id: "opt-c",
          title: "Pause for POS integration research",
          tradeoff: "Clears a major unknown; delays learning",
          basis: "gap e3",
        },
      ],
      generation: {
        ran: false,
        label: "Simulated draft",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [],
      },
    },
    approval: null,
    invalidatedApprovals: [],
    artefact: null,
    prototype: null,
    exportBody: null,
    exportPdfBase64: null,
    job: {
      status: "idle",
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    usageCeiling: 6,
    usageConsumed: 1,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: "2026-10-31T10:00:00Z",
    researchPassQueuedAt: null,
    researchProvider: null,
    team: {
      ...buildPilotTeamPlan({ band: "M" }),
      approvedAt: "2026-10-31T09:00:00Z",
      approvedBy: "u",
    },
    activity: [],
    teamCollaboration: null,
    projectId: null,
    updatedAt: "2026-10-31T11:00:00Z",
  } as unknown as SupervisedMission;
  return { ...seed, ...overrides };
}

describe("buildPmBriefingScreen", () => {
  it("stays unread until proposal or approval exists", () => {
    const model = buildPmBriefingScreen(
      baseMission({
        proposal: null,
        approval: null,
        researchPassCompletedAt: null,
      }),
    );
    expect(model.ready).toBe(false);
    expect(model.cards).toHaveLength(0);
  });

  it("builds Aria message and structured cards from the case record", () => {
    const model = buildPmBriefingScreen(baseMission());
    expect(model.ready).toBe(true);
    expect(model.headline).toBe("Initial investigation complete");
    expect(model.ariaMessage.toLowerCase()).toContain("food waste");
    expect(model.ariaMessage.toLowerCase()).not.toContain("chatgpt");
    expect(model.cards.map((c) => c.title)).toEqual(
      expect.arrayContaining([
        "Understanding",
        "Likely users",
        "Core problems",
        "Competitors and alternatives",
        "Differentiation",
        "Risks and unknowns",
        "Recommended first version",
        "Indicative timeline and cost",
        "Proposed agent team",
      ]),
    );
  });

  it("marks Option A as Aria’s recommendation from drafted options", () => {
    const model = buildPmBriefingScreen(baseMission());
    expect(model.options).toHaveLength(3);
    expect(model.options[0]?.recommended).toBe(true);
    expect(model.options[0]?.label).toBe("Option A");
    expect(model.recommendedOptionId).toBe("opt-a");
  });
});
