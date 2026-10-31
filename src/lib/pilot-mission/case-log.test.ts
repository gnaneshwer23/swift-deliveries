import { describe, expect, it } from "vitest";
import { decisionLog, evidenceLabel, evidenceRegister } from "./case-log";
import { caseMilestones } from "./case-timeline";
import { baseMission } from "./test-fixtures";
import type { SupervisedMission } from "./types";

const proposal: SupervisedMission["proposal"] = {
  action: "compare_options",
  version: 1,
  scopeHash: "s",
  options: [
    { id: "o1", title: "Waste log", tradeoff: "Manual entry first", basis: "e1" },
    { id: "o2", title: "POS sync", tradeoff: "Integration risk", basis: "e2" },
  ],
  generation: {
    ran: false,
    label: "not run",
    provider: null,
    model: null,
    output: "",
    citations: [],
    gaps: [],
  },
};

describe("evidence labels", () => {
  it("names each register item precisely, from its classification and source", () => {
    expect(
      evidenceLabel({
        id: "a",
        statement: "x",
        source: "https://e.com",
        classification: "supplied",
      }),
    ).toBe("Source-backed");
    expect(
      evidenceLabel({
        id: "b",
        statement: "x",
        source: "Founder call",
        classification: "supplied",
      }),
    ).toBe("User-provided");
    expect(
      evidenceLabel({ id: "c", statement: "x", source: "", classification: "assumption" }),
    ).toBe("Assumption");
    expect(evidenceLabel({ id: "d", statement: "x", source: "", classification: "gap" })).toBe(
      "Unverified",
    );
    expect(evidenceRegister(baseMission()).map((e) => [e.id, e.label, e.source])).toEqual([
      ["e1", "Source-backed", "https://example.com/e1"],
      ["e2", "Unverified", null],
    ]);
  });
});

describe("decision log", () => {
  it("records each decision with who proposed it, what you chose, the alternatives and the basis", () => {
    const log = decisionLog(
      baseMission({
        proposal,
        approval: { ...baseMission().approval!, agentRecommendation: "proceed_bounded_test" },
      }),
    );
    expect(log.map((d) => d.id)).toEqual(["plan", "decision"]);
    const decision = log[1]!;
    expect(decision.title).toBe("Direction: Waste log");
    expect(decision.approved).toMatch(/— "Ship a thin slice"$/);
    expect(decision.alternatives).toEqual(["POS sync — Integration risk"]);
    expect(decision.basis[0]).toBe("1 source-backed, 0 user-provided");
    expect(decision.superseded).toBeNull();
  });

  it("keeps replaced decisions, says why they no longer apply, and orders by time", () => {
    const old = { ...baseMission().approval!, decidedAt: "2026-10-31T10:00:00Z" };
    const log = decisionLog(
      baseMission({
        proposal,
        invalidatedApprovals: [{ ...old, reason: "Brief changed after the decision." }],
        delivery: {
          wfMissionId: "wf",
          planVersion: 1,
          planHash: "h",
          optionId: "o1",
          approvedAt: "2026-10-31T13:00:00Z",
          approvedBy: "u",
        },
      }),
    );
    expect(log.map((d) => d.id)).toEqual(["plan", "invalidated-0", "decision", "delivery"]);
    expect(log[1]!.superseded).toBe("Brief changed after the decision.");
    expect(log[3]!.approved).toMatch(/Outside actions were not approved/);
    // Once delivery runs, the decision no longer says delivery "can start".
    expect(log[2]!.changed).toBe(
      "The team was matched to this direction, and you approved its delivery.",
    );
  });

  it("says nothing is recorded instead of inventing a recommendation", () => {
    const log = decisionLog(baseMission({ proposal }));
    expect(log.find((d) => d.id === "decision")!.proposedBy).toBe(
      "No recommendation was recorded with this decision.",
    );
  });
});

describe("case timeline", () => {
  it("marks recorded milestones done and the first open one as next or waiting on you", () => {
    const states = (m: SupervisedMission) =>
      Object.fromEntries(caseMilestones(m).map((s) => [s.id, s.state]));
    // Decided, no delivery: the owner's delivery approval is what waits.
    expect(states(baseMission({ proposal }))).toMatchObject({
      plan: "done",
      research: "done",
      options: "done",
      decision: "done",
      delivery: "waiting",
      expectation: "upcoming",
    });
    // Research still running: specialists act next, nothing waits on the owner.
    expect(
      states(baseMission({ researchPassCompletedAt: null, approval: null, proposal: null })),
    ).toMatchObject({ plan: "done", research: "next", options: "upcoming", decision: "upcoming" });
    // Research done, no options yet: starting the comparison is the owner's step.
    expect(states(baseMission({ approval: null, proposal: null }))).toMatchObject({
      research: "done",
      options: "waiting",
    });
    // A cancelled case has no next step.
    expect(
      Object.values(states(baseMission({ stage: "cancelled", proposal }))).includes("waiting"),
    ).toBe(false);
  });

  it("shows the recorded time and how options were produced", () => {
    const milestones = caseMilestones(baseMission({ proposal }));
    expect(milestones.find((m) => m.id === "decision")!.at).toBe("2026-10-31T12:00:00Z");
    expect(milestones.find((m) => m.id === "options")!.detail).toBe(
      "Simulated drafts: no model ran.",
    );
  });
});
