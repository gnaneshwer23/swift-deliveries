import { describe, expect, it } from "vitest";
import { deriveQuietStatus } from "./quiet-status";
import type { SupervisedMission } from "./types";

function base(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "brief",
    brief: { question: "Q?", audience: "A", outcome: "O", constraints: "" },
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
    researchProvider: null,
    team: { tasks: [], approvedAt: null, approvedBy: null },
    activity: [],
    projectId: null,
    updatedAt: "2026-10-27T00:00:00Z",
  } as SupervisedMission;
  return { ...seed, ...overrides };
}

describe("deriveQuietStatus", () => {
  it("marks leased jobs as investigating", () => {
    const s = deriveQuietStatus(
      base({
        job: { ...base().job, status: "leased" },
        team: { tasks: [], approvedAt: "2026-01-01", approvedBy: "u" },
        stage: "evidence",
      }),
    );
    expect(s.presence).toBe("investigating");
    expect(s.label).toBe("Investigating…");
  });

  it("marks approve_plan as needs your decision", () => {
    const s = deriveQuietStatus(
      base({
        team: { tasks: [{ id: "t" } as never], approvedAt: null, approvedBy: null },
      }),
    );
    expect(s.presence).toBe("needs_you");
    expect(s.nextId).toBe("approve_plan");
  });

  it("marks cancelled missions idle", () => {
    const s = deriveQuietStatus(base({ stage: "cancelled" }));
    expect(s.presence).toBe("idle");
    expect(s.label).toBe("Closed");
  });
});
