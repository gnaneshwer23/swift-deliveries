import { describe, expect, it } from "vitest";
import { buildPmDiscussionContext, pmDiscussionSampleThread } from "./pm-discussion-screen";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 2,
    stage: "decision",
    brief: {
      question: "Build an app that helps small restaurants reduce food waste.",
      audience: "Restaurant owners",
      outcome: "Cut weekly waste",
      constraints: "",
    },
    evidence: [
      {
        id: "e1",
        statement: "Owners need same-day surplus visibility.",
        source: "https://example.com/note",
        classification: "supplied",
      },
      {
        id: "e2",
        statement: "POS integration can wait for v2.",
        source: "founder",
        classification: "assumption",
      },
      {
        id: "e3",
        statement: "Willingness to pay is unknown.",
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
          title: "Web surplus tracker",
          tradeoff: "Fast",
          basis: "e1",
        },
        {
          id: "opt-b",
          title: "Mobile checklist",
          tradeoff: "More surface area",
          basis: "e1",
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

describe("pm discussion screen data", () => {
  it("exposes a labelled sample thread for layout", () => {
    const sample = pmDiscussionSampleThread();
    expect(sample.user).toContain("Option B");
    expect(sample.aria).toContain("POS");
  });

  it("builds decision context from evidence classifications", () => {
    const context = buildPmDiscussionContext(baseMission());
    expect(context.optionsConsidered).toHaveLength(2);
    expect(context.evidenceUsed[0]?.href).toBe("https://example.com/note");
    expect(context.assumptions[0]).toMatch(/POS/);
    expect(context.openQuestions.some((q) => /Willingness/i.test(q))).toBe(true);
    expect(context.alreadyDecided).toBe(false);
  });
});
