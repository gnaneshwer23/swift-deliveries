import { describe, expect, it } from "vitest";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";
import {
  SUPERVISED_RESEARCH_TASK_KEY,
  supervisedResearchWorkerPlan,
  supervisedTeamScopeHash,
} from "./workforce-adapter.server";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const team = buildPilotTeamPlan({ band: "M" });
  team.approvedAt = "2026-10-30T12:00:00.000Z";
  team.approvedBy = "owner";
  return {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "22222222-2222-4222-8222-222222222222",
    ownerUserId: "owner",
    version: 3,
    stage: "evidence",
    brief: {
      question: "Should we launch breakfasts?",
      audience: "Operators",
      outcome: "Go or revise",
      constraints: "",
    },
    evidence: [],
    proposal: null,
    approval: null,
    invalidatedApprovals: [],
    archivedPacks: [],
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
    usageCeiling: 10,
    usageConsumed: 0,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: null,
    researchPassQueuedAt: "2026-10-30T12:01:00.000Z",
    researchProvider: null,
    team,
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [],
    projectId: null,
    updatedAt: "2026-10-30T12:01:00.000Z",
    ...overrides,
  };
}

describe("studio workforce adapter (unit)", () => {
  it("builds a zero-usage wf plan with the studio research task key", () => {
    const plan = supervisedResearchWorkerPlan("Launch breakfasts?");
    expect(plan.estimatedUsage).toBe(0);
    expect(plan.tasks[0]?.key).toBe(SUPERVISED_RESEARCH_TASK_KEY);
    expect(plan.tasks[0]?.estimatedUsage).toBe(0);
  });

  it("changes team scope hash when the brief changes after approval", () => {
    const a = baseMission();
    const b = baseMission({
      brief: { ...a.brief, question: "Should we launch lunches instead?" },
    });
    expect(supervisedTeamScopeHash(a)).not.toBe(supervisedTeamScopeHash(b));
  });
});
