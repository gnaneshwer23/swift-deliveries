import { describe, expect, it } from "vitest";
import { deriveInvestigationStagePhase } from "./investigation-stage-phase";
import type { SupervisedMission } from "./types";

const brief = {
  question: "Test",
  audience: "Founders",
  outcome: "Pack",
  constraints: "",
};

function mission(overrides: Partial<SupervisedMission>): SupervisedMission {
  return {
    id: "m",
    stage: "evidence",
    brief,
    team: { tasks: [], approvedAt: "2026-01-01", approvedBy: "u" },
    proposal: null,
    approval: null,
    evidence: [],
    exportBody: null,
    artefact: null,
    continuationPlan: null,
    researchPassCompletedAt: null,
    job: {
      status: "idle",
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    ...overrides,
  } as SupervisedMission;
}

describe("deriveInvestigationStagePhase", () => {
  it("returns scope before plan approval", () => {
    expect(
      deriveInvestigationStagePhase(
        mission({ team: { tasks: [], approvedAt: null, approvedBy: null } }),
      ),
    ).toBe("scope");
  });

  it("returns converge when compare is the next gate on record", () => {
    expect(deriveInvestigationStagePhase(mission({ stage: "evidence" }))).toBe("converge");
  });

  it("returns canvas while a worker lease is active", () => {
    expect(
      deriveInvestigationStagePhase(
        mission({
          job: {
            status: "leased",
            ownerId: "w",
            leaseUntil: new Date(Date.now() + 60_000).toISOString(),
            attempts: 1,
            lastError: null,
            idempotencyKey: "k",
          },
        }),
      ),
    ).toBe("canvas");
  });

  it("returns converge on alternatives stage", () => {
    expect(deriveInvestigationStagePhase(mission({ stage: "alternatives" }))).toBe("converge");
  });
});
