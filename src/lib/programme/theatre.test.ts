import { describe, expect, it } from "vitest";
import { programmeActState, programmeTheatreState } from "./theatre";
import type { ProgrammeState } from "./types";

function baseState(overrides: Partial<ProgrammeState> = {}): ProgrammeState {
  return {
    id: "p1",
    title: "Test programme",
    businessCase: {
      name: "Test",
      idea: "Build a supervised product investigation tool",
      targetUsers: "Founders",
      problem: "Ops dashboards hide the briefing",
      goals: "Ship Acts language",
      constraints: "Human gates",
      timelineWeeks: 8,
      budgetCredits: 40,
    },
    roadmap: {
      phases: [
        {
          key: "discovery",
          name: "Discovery",
          goal: "Validate",
          startWeek: 1,
          endWeek: 2,
        },
      ],
      milestones: [],
      items: [
        {
          key: "gate_discovery",
          kind: "gate",
          phase: "discovery",
          title: "Discovery gate",
          description: "Approve discovery",
          week: 2,
          dependsOn: [],
          owner: "DX-001",
          team: [],
          status: "pending",
          estimatedCredits: 0,
          actualCredits: 0,
        },
      ],
    },
    status: "awaiting_human",
    budget: { ceiling: 40, consumed: 2 },
    version: 1,
    createdAt: "2026-10-27T00:00:00Z",
    updatedAt: "2026-10-27T00:00:00Z",
    ...overrides,
  };
}

describe("programme theatre Acts", () => {
  it("maps a human gate to Approve act with same labels as supervised", () => {
    const theatre = programmeTheatreState(baseState());
    expect(theatre.current).toBe("approve");
    expect(theatre.awaitingHuman).toBe(true);
    expect(theatre.nextGateTitle).toBe("Discovery gate");
    expect(programmeActState(theatre, "approve")).toBe("current");
    expect(programmeActState(theatre, "briefing")).toBe("done");
  });

  it("marks completed programmes as finished work", () => {
    const theatre = programmeTheatreState(baseState({ status: "completed" }));
    expect(theatre.completed).toBe(true);
    expect(programmeActState(theatre, "work")).toBe("done");
  });
});
