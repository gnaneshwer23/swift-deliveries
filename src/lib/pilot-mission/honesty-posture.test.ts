import { describe, expect, it } from "vitest";
import { buildHonestyPosture } from "./honesty-posture";
import type { SupervisedMission } from "./types";

function mission(over: Partial<SupervisedMission> = {}): SupervisedMission {
  return {
    id: "m1",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "alternatives",
    brief: {
      question: "Should we build X?",
      audience: "Founders",
      outcome: "A next path",
      constraints: "None",
    },
    evidence: [
      {
        id: "e1",
        statement: "Draft interview guide for parents (planning)",
        source: "Founder",
        classification: "supplied",
      },
      {
        id: "e2",
        statement: "Cited market note from 2024",
        source: "https://example.com",
        classification: "supplied",
      },
    ],
    proposal: null,
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
    usageCeiling: 4,
    usageConsumed: 1,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: null,
    researchProvider: null,
    team: null,
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [],
    projectId: null,
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("R9 honesty posture", () => {
  it("labels interview planning and separates cost ceilings", () => {
    const posture = buildHonestyPosture(mission());
    expect(posture.interviewLabels.some((r) => r.label === "planning")).toBe(true);
    expect(posture.costSplit.some((l) => /investigation/i.test(l))).toBe(true);
    expect(posture.buildabilityVsDesirability.toLowerCase()).toMatch(/feasibility/);
  });
});
