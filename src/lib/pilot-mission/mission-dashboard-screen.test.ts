import { describe, expect, it } from "vitest";
import { buildMissionDashboard, MISSION_DASH_NAV } from "./mission-dashboard-screen";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 3,
    stage: "artefact" as const,
    brief: {
      question: "Food waste app",
      audience: "Owners",
      outcome: "Less waste",
      constraints: "",
    },
    evidence: [
      {
        id: "e1",
        statement: "Surplus tracking is the first pain.",
        source: "https://example.com/e1",
        classification: "supplied" as const,
      },
      {
        id: "e2",
        statement: "Buyer interviews not yet done.",
        source: "",
        classification: "gap" as const,
      },
    ],
    proposal: null,
    approval: {
      action: "compare_options" as const,
      version: 1,
      scopeHash: "s",
      optionId: "o1",
      choice: "authorise_bounded_test" as const,
      note: "Ship a thin slice",
      actorId: "u",
      decidedAt: "2026-10-31T12:00:00Z",
    },
    invalidatedApprovals: [],
    artefact: null,
    prototype: null,
    exportBody: null,
    exportPdfBase64: null,
    job: {
      status: "idle" as const,
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    usageCeiling: 6,
    usageConsumed: 2,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined" as const,
    researchGaps: ["Web research provider not configured"],
    researchPassCompletedAt: "2026-10-31T11:00:00Z",
    researchPassQueuedAt: null,
    researchProvider: null,
    team: {
      ...buildPilotTeamPlan({ band: "M" }),
      approvedAt: "2026-10-31T09:00:00Z",
      approvedBy: "u",
    },
    activity: [
      {
        id: "a1",
        at: "2026-10-31T12:30:00Z",
        taskKey: null,
        kind: "brief_update",
        summary: "Framed the first-phase experiment",
        actor: "DX-001",
      },
    ],
    teamCollaboration: null,
    continuationPlan: {
      version: "continuation-v1" as const,
      kind: "bounded_test" as const,
      title: "Bounded test plan",
      summary: "Staff a first experiment.",
      derivedFrom: {
        agentRecommendation: "proceed_bounded_test" as const,
        humanNextPath: "authorise_bounded_test" as const,
        disagreesWithRecommendation: false,
        executionLimited: false,
      },
      roles: [
        {
          capabilityId: "DX-021",
          label: "Market Intelligence Agent",
          responsibility: "Map market context",
          why: "Need market signal",
          plannedArtefacts: ["Market note"],
        },
      ],
      roadmap: [
        {
          id: "step-1",
          title: "Scan alternatives",
          ownerLabel: "Market Intelligence Agent",
          detail: "Compare existing tools",
          blocked: true,
          blockedReason: "Waiting on founder note",
        },
      ],
      plannedArtefacts: [],
      unresolvedRisks: ["Scope may expand without a written stop"],
      notIncluded: ["Paid acquisition"],
      executionBlocked: false,
      executionBlockedReason: null,
      createdAt: "2026-10-31T12:05:00Z",
    },
    projectId: null,
    updatedAt: "2026-10-31T12:30:00Z",
  };
  return { ...seed, ...overrides } as SupervisedMission;
}

describe("mission dashboard screen", () => {
  it("exposes the Screen 10 navigation set", () => {
    expect(MISSION_DASH_NAV.map((n) => n.label)).toEqual([
      "Overview",
      "PM Chat",
      "Team",
      "Research",
      "Product Plan",
      "Design",
      "Engineering",
      "QA & Quality",
      "Data & Metrics",
      "Marketing",
      "Decisions",
      "Evidence",
      "Timeline",
      "Downloads",
    ]);
  });

  it("builds overview cards from recorded mission state only", () => {
    const model = buildMissionDashboard(baseMission());
    expect(model.projectName).toBe("Food waste app");
    expect(model.rail.map((r) => r.label)).toEqual([
      "Discovery",
      "Research",
      "Product plan",
      "Design",
      "Engineering",
      "QA",
      "Handover",
    ]);
    expect(model.rail.find((r) => r.id === "research")?.state).not.toBe("upcoming");
    expect(model.activeAgents.some((a) => /Market/i.test(a.label))).toBe(true);
    expect(model.completedOutputs).toHaveLength(0);
    expect(model.pendingApprovals.length).toBeGreaterThan(0);
    expect(model.risks.some((r) => /Waiting on founder/i.test(r.text))).toBe(true);
    expect(model.latestPmUpdate.summary).toMatch(/Framed the first-phase/i);
    expect(model.usage.consumed).toBe(2);
    expect(model.usage.remaining).toBe(4);
    expect(model.downloadAvailable).toBe(false);
    expect(JSON.stringify(model).toLowerCase()).not.toMatch(/confidence:\s*\d/);
    expect(model.designLines[0]).toMatch(/no design/i);
  });

  it("marks download available when an export exists", () => {
    const model = buildMissionDashboard(
      baseMission({
        exportBody: "# Pack\n",
        artefact: { title: "Pack", decisionBrief: "d", experimentBrief: "e", provenance: "p" },
      }),
    );
    expect(model.downloadAvailable).toBe(true);
    expect(model.rail.find((r) => r.id === "handover")?.state).toBe("current");
  });
});
