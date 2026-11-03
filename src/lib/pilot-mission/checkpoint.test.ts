import { describe, expect, it } from "vitest";
import { buildCheckpoint } from "./checkpoint";
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
    researchPassQueuedAt: null,
    researchProvider: null,
    team: null,
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [],
    projectId: null,
    updatedAt: "2026-11-01T10:00:00Z",
    ...over,
  };
}

const NOW = Date.parse("2026-11-03T12:00:00Z");
const ask = { id: "decide", title: "Record your next path", detail: "Choose a path." };
const ev = (id: string, at: string, kind: string, summary = "x") =>
  ({ id, at, kind, summary, actor: "system" }) as SupervisedMission["activity"][number];

describe("project checkpoint", () => {
  it("reads status, next step and the latest saved action", () => {
    const c = buildCheckpoint(
      mission({
        activity: [
          ev("a1", "2026-11-01T09:00:00Z", "plan.proposed"),
          ev("a2", "2026-11-02T09:00:00Z", "options.compared"),
          ev("a3", "2026-11-02T10:00:00Z", "studio.meta_saved"),
        ],
      }),
      ask,
      NOW,
    );
    expect(c.status).toBe("waiting_on_you");
    expect(c.next).toEqual({ title: ask.title, detail: ask.detail });
    expect(c.lastAction?.what).toBe("compared the options");
    expect(c.quietDays).toBe(1);
    expect(c.stalled).toBe(false);
  });

  it("says nothing happened rather than inventing a last action", () => {
    const c = buildCheckpoint(mission({ activity: [] }), ask, NOW);
    expect(c.lastAction).toBe(null);
  });

  it("lists only the steps the record shows are done", () => {
    const c = buildCheckpoint(
      mission({
        team: {
          version: "pilot-team-v1",
          capabilityIds: [],
          staffingBand: "small",
          tasks: [],
          approvedAt: "2026-11-01T00:00:00Z",
          approvedBy: "u",
        } as unknown as SupervisedMission["team"],
      }),
      ask,
      NOW,
    );
    expect(c.done).toEqual(["Describe your idea", "Approve the plan"]);
  });

  it("shows the team working while a worker holds the step, and you once the lease ends", () => {
    const leased = (leaseUntil: string) =>
      mission({
        job: {
          status: "leased",
          ownerId: "w1",
          leaseUntil,
          attempts: 1,
          lastError: null,
          idempotencyKey: null,
        },
      });
    const recover = { id: "recover", title: "Comparison in progress", detail: "" };
    expect(buildCheckpoint(leased("2026-11-03T13:00:00Z"), recover, NOW).status).toBe(
      "team_working",
    );
    expect(buildCheckpoint(leased("2026-11-03T11:00:00Z"), recover, NOW).status).toBe(
      "waiting_on_you",
    );
  });

  it("shows paused work as waiting on you, even with research queued", () => {
    const paused = mission({
      studioMeta: { investigationPaused: true } as NonNullable<SupervisedMission["studioMeta"]>,
      researchPassQueuedAt: "2026-11-03T10:00:00Z",
    });
    const queued = { id: "research_queued", title: "Research pass queued", detail: "" };
    expect(buildCheckpoint(paused, queued, NOW).status).toBe("waiting_on_you");
    expect(buildCheckpoint(paused, queued, NOW).checks).toContain("The investigation is paused.");
  });

  it("keeps the finished steps of a stopped project", () => {
    const c = buildCheckpoint(
      mission({
        stage: "cancelled",
        team: {
          version: "pilot-team-v1",
          capabilityIds: [],
          staffingBand: "small",
          tasks: [],
          approvedAt: "2026-11-01T00:00:00Z",
          approvedBy: "u",
        } as unknown as SupervisedMission["team"],
      }),
      { id: "cancelled", title: "Cancelled", detail: "" },
      NOW,
    );
    expect(c.status).toBe("stopped");
    expect(c.done).toEqual(["Describe your idea", "Approve the plan"]);
  });

  it("is done once the package is out, and stopped when cancelled", () => {
    const obs = { id: "observation", title: "Supply the observed result", detail: "" };
    expect(buildCheckpoint(mission({ stage: "exported" }), obs, NOW).status).toBe("done");
    expect(buildCheckpoint(mission({ stage: "cancelled" }), obs, NOW).status).toBe("stopped");
  });

  it("flags what to check before acting", () => {
    const c = buildCheckpoint(
      mission({
        usageConsumed: 4,
        usageCeiling: 4,
        job: {
          status: "failed",
          ownerId: null,
          leaseUntil: null,
          attempts: 1,
          lastError: "Provider timed out",
          idempotencyKey: null,
        },
      }),
      { id: "retry", title: "Retry the comparison", detail: "" },
      NOW,
    );
    expect(c.checks).toEqual([
      "The last comparison failed: Provider timed out",
      "Usage is at 4 of 4. Steps stop at the ceiling.",
    ]);
    expect(buildCheckpoint(mission(), ask, NOW).checks).toEqual([]);
  });

  it("marks an unfinished project quiet for a week as stalled, but never a finished one", () => {
    const old = { activity: [ev("a", "2026-10-20T09:00:00Z", "plan.proposed")] };
    expect(buildCheckpoint(mission(old), ask, NOW).stalled).toBe(true);
    expect(buildCheckpoint(mission({ ...old, stage: "exported" }), ask, NOW).stalled).toBe(false);
  });
});
