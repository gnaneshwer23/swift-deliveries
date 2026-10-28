import { describe, expect, it } from "vitest";
import { buildProjectRoomOverview, PROJECT_ROOM_SECTIONS } from "./project-room";
import type { SupervisedMission } from "./types";

function baseMission(over: Partial<SupervisedMission> = {}): SupervisedMission {
  return {
    id: "m1",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "draft",
    brief: {
      question: "Should we open weekday breakfasts?",
      audience: "Founders",
      outcome: "A next path",
      constraints: "None",
    },
    evidence: [
      {
        id: "g1",
        statement: "No footfall counts yet",
        source: "",
        classification: "gap",
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
    researchProvider: null,
    team: null,
    continuationPlan: null,
    caseRoom: null,
    activity: [],
    projectId: null,
    updatedAt: new Date().toISOString(),
    ...over,
  };
}

describe("PT-2 project room", () => {
  it("exposes overview through monitoring sections", () => {
    expect(PROJECT_ROOM_SECTIONS.map((s) => s.id)).toEqual([
      "pr-overview",
      "pr-briefings",
      "pr-evidence",
      "pr-team",
      "pr-flow",
      "pr-artefacts",
      "pr-decisions",
      "pr-build",
      "pr-outcomes",
      "pr-monitoring",
    ]);
  });

  it("summarises objective and gaps without inventing interviews", () => {
    const overview = buildProjectRoomOverview(baseMission());
    expect(overview.objective).toMatch(/breakfasts/);
    expect(overview.evidenceGaps[0]).toMatch(/footfall/);
    expect(JSON.stringify(overview).toLowerCase()).not.toContain("interviewing customers");
  });
});
