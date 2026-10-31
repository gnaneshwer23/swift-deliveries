import { describe, expect, it } from "vitest";
import { buildAgentWorkspace } from "./agent-workspace-screen";
import { buildTeamFormationCards } from "./team-formation-screen";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(): SupervisedMission {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 3,
    stage: "artefact",
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
        classification: "supplied",
      },
    ],
    proposal: null,
    approval: {
      action: "compare_options",
      version: 1,
      scopeHash: "s",
      optionId: "o1",
      choice: "authorise_bounded_test",
      note: "Go",
      actorId: "u",
      decidedAt: "2026-10-31T12:00:00Z",
    },
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
    usageConsumed: 2,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: null,
    researchPassQueuedAt: null,
    researchProvider: null,
    team: {
      ...buildPilotTeamPlan({ band: "M" }),
      approvedAt: "2026-10-31T09:00:00Z",
      approvedBy: "u",
    },
    activity: [],
    teamCollaboration: {
      version: "team-collaboration-v1",
      assignments: [],
      handoffs: [
        {
          id: "h1",
          fromTaskKey: "a",
          toTaskKey: "b",
          fromActor: "DX-021",
          toActor: "DX-002",
          sourceTaskKey: "a",
          findingSummary: "Market note shared for framing",
          sourceFindingId: "e1",
          request: "Use in problem framing",
          evidenceIds: ["e1"],
          uncertainty: null,
          expectedDownstream: "Sharper problem statement",
          actualResult: null,
          sharedAt: "2026-10-31T12:10:00Z",
          consumedAt: null,
          productionLabel: "persisted event",
        },
      ],
      edges: [],
      recommendation: null,
    },
    continuationPlan: {
      version: "continuation-v1",
      kind: "bounded_test",
      title: "Bounded test plan",
      summary: "Staff a first experiment.",
      derivedFrom: {
        agentRecommendation: "proceed_bounded_test",
        humanNextPath: "authorise_bounded_test",
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
          blocked: false,
          blockedReason: null,
        },
      ],
      plannedArtefacts: [],
      unresolvedRisks: [],
      notIncluded: [],
      executionBlocked: false,
      executionBlockedReason: null,
      createdAt: "2026-10-31T12:05:00Z",
    },
    projectId: null,
    updatedAt: "2026-10-31T12:05:00Z",
  } as unknown as SupervisedMission;
}

describe("agent workspace screen", () => {
  it("builds tasks, outputs, evidence, and handoffs for an assigned specialist", () => {
    const mission = baseMission();
    const card = buildTeamFormationCards(mission).find((c) => c.role === "Market Researcher");
    expect(card?.assigned).toBe(true);
    expect(card?.capabilityId).toBe("DX-021");
    const workspace = buildAgentWorkspace(mission, card!);
    expect(workspace.tasks.some((t) => /Scan alternatives/i.test(t.title))).toBe(true);
    expect(workspace.outputs.some((o) => /Market note/i.test(o.title))).toBe(true);
    expect(workspace.evidence[0]?.id).toBe("e1");
    expect(workspace.handoffs.some((h) => /Market note/i.test(h.summary))).toBe(true);
    expect(JSON.stringify(workspace).toLowerCase()).not.toMatch(/confidence:\s*0\./);
  });

  it("keeps catalogue-only roles empty of invented work", () => {
    const mission = baseMission();
    const card = buildTeamFormationCards(mission).find((c) => c.role === "Frontend Engineer");
    expect(card?.catalogueOnly).toBe(true);
    const workspace = buildAgentWorkspace(mission, card!);
    expect(workspace.tasks).toHaveLength(0);
    expect(workspace.outputs).toHaveLength(0);
    expect(workspace.handoffs).toHaveLength(0);
    expect(workspace.evidence).toHaveLength(0);
    expect(workspace.currentAssignment).toMatch(/not assigned|catalogue/i);
  });
});
