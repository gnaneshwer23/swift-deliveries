import { describe, expect, it } from "vitest";
import { buildProductIntelligenceMap } from "./product-intelligence-map";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "brief",
    brief: {
      question: "Build an app that helps small restaurants reduce food waste.",
      audience: "Restaurant managers",
      outcome: "Less waste in the first month",
      constraints: "",
    },
    evidence: [],
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
    usageCeiling: 6,
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
    researchPassQueuedAt: null,
    researchProvider: null,
    team: { tasks: [], approvedAt: null, approvedBy: null },
    activity: [],
    teamCollaboration: null,
    projectId: null,
    updatedAt: "2026-10-31T00:00:00Z",
  } as unknown as SupervisedMission;
  return { ...seed, ...overrides };
}

describe("buildProductIntelligenceMap", () => {
  it("keeps workstreams idle and progress at 0 before plan approval", () => {
    const map = buildProductIntelligenceMap(baseMission());
    expect(map.stageLabel).toBe("Investigation");
    expect(map.progressPercent).toBe(0);
    expect(map.planApproved).toBe(false);
    expect(map.workstreams.every((w) => w.state === "not_started")).toBe(true);
    expect(map.pmStatus.toLowerCase()).toContain("approve");
  });

  it("derives project name from the idea and lists six workstreams", () => {
    const map = buildProductIntelligenceMap(baseMission());
    expect(map.workstreams).toHaveLength(6);
    expect(map.projectName.toLowerCase()).toContain("restaurants");
    expect(map.ideaLabel.toLowerCase()).toContain("food waste");
  });

  it("surfaces recorded activity as working notes", () => {
    const map = buildProductIntelligenceMap(
      baseMission({
        team: {
          ...buildPilotTeamPlan({ band: "M" }),
          approvedAt: "2026-10-31T09:00:00Z",
          approvedBy: "u",
        },
        activity: [
          {
            id: "evt-1",
            at: "2026-10-31T10:00:00.000Z",
            taskKey: "research.market",
            kind: "research.pass.started",
            summary: "Started market pass",
            actor: "DX-021",
          },
        ],
      }),
    );
    expect(map.planApproved).toBe(true);
    expect(map.notes[0]?.action).toBe("Started market pass");
    expect(map.notes[0]?.sourceType).toBe("research.pass.started");
  });
});
