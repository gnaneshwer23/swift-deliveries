import { describe, expect, it } from "vitest";
import { actState, honestyBadges, theatreState, type TheatreState } from "./theatre";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    workspaceId: "ws",
    ownerUserId: "u",
    version: 1,
    stage: "brief",
    brief: {
      question: "Should we charge for analytics?",
      audience: "Founders",
      outcome: "A decision pack",
      constraints: "Research first",
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
    usageCeiling: 5,
    usageConsumed: 0,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: ["Web search not configured"],
    researchPassCompletedAt: null,
    researchPassQueuedAt: null,
    researchProvider: null,
    team: {
      version: "pilot-team-v1",
      capabilityIds: ["DX-002", "DX-018"],
      staffingBand: "M",
      approvedAt: null,
      approvedBy: null,
      tasks: [
        {
          key: "frame_objective",
          title: "Frame",
          loopStep: "objective",
          capabilityId: "DX-002",
          ownerLabel: "Problem-Framing Agent",
          dependsOn: [],
          status: "awaiting_approval",
          uses: [],
          produces: "brief",
          blockedReason: null,
          actor: "specialist",
        },
      ],
    },
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [],
    updatedAt: new Date().toISOString(),
    projectId: null,
    ...overrides,
  };
}

describe("theatreState", () => {
  it("opens on briefing before plan approval when next is not approve_plan without a team", () => {
    const mission = baseMission({ team: null });
    const state = theatreState(mission);
    expect(state.planApproved).toBe(false);
    expect(state.current).toBe("briefing");
  });

  it("focuses approve when a proposed team awaits approval", () => {
    const state = theatreState(baseMission());
    expect(state.current).toBe("approve");
    expect(state.done).toEqual(["briefing", "roadmap", "cast"]);
    expect(actState(state, "approve")).toBe("current");
    expect(actState(state, "work")).toBe("upcoming");
  });

  it("moves to living work after plan approval", () => {
    const state = theatreState(
      baseMission({
        stage: "evidence",
        team: {
          version: "pilot-team-v1",
          capabilityIds: ["DX-002"],
          staffingBand: "S",
          approvedAt: "2026-10-27T12:00:00.000Z",
          approvedBy: "u",
          tasks: [],
        },
      }),
    );
    expect(state.planApproved).toBe(true);
    expect(state.current).toBe("work");
    expect(actState(state, "briefing")).toBe("done");
    expect(actState(state, "work")).toBe("current");
  });

  it("keeps cancelled missions on briefing without inventing progress", () => {
    const state = theatreState(baseMission({ stage: "cancelled" }));
    expect(state.cancelled).toBe(true);
    expect(state.current).toBe("briefing");
  });
});

describe("honestyBadges", () => {
  it("returns compact badges not essay walls", () => {
    const badges = honestyBadges(baseMission());
    expect(badges.some((b) => b.label === "Simulated draft")).toBe(true);
    expect(badges.some((b) => b.label === "Research gaps labelled")).toBe(true);
    expect(badges.some((b) => b.label === "Cast band M")).toBe(true);
    expect(badges.every((b) => b.label.length < 80)).toBe(true);
  });

  it("swaps Simulated for Model on the same badge slot when generation ran", () => {
    const badges = honestyBadges(
      baseMission({
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "x",
          options: [],
          generation: {
            ran: true,
            label: "model",
            provider: "openai",
            model: "gpt-demo",
            output: "",
            citations: [],
            gaps: [],
          },
        },
      }),
    );
    expect(badges.some((b) => b.label === "Model · gpt-demo")).toBe(true);
    expect(badges.some((b) => b.label === "Simulated draft")).toBe(false);
  });
});

describe("actState", () => {
  it("marks only the current act as current", () => {
    const theatre: TheatreState = {
      current: "cast",
      done: ["briefing", "roadmap"],
      planApproved: false,
      cancelled: false,
    };
    expect(actState(theatre, "briefing")).toBe("done");
    expect(actState(theatre, "cast")).toBe("current");
    expect(actState(theatre, "approve")).toBe("upcoming");
  });
});
