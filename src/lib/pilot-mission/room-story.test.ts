import { describe, expect, it } from "vitest";
import { buildRoomModel, roomFindings } from "./room-story";
import { baseMission } from "./test-fixtures";

const proposal = {
  action: "compare_options" as const,
  version: 1,
  scopeHash: "s",
  options: [
    { id: "o1", title: "Waste log", tradeoff: "Manual entry first", basis: "e1" },
    { id: "o2", title: "POS sync", tradeoff: "Integration risk", basis: "e2" },
  ],
  generation: {
    ran: false,
    label: "",
    provider: null,
    model: null,
    output: "",
    citations: [],
    gaps: [],
  },
};

describe("buildRoomModel", () => {
  it("asks for plan approval before anything runs", () => {
    const base = baseMission();
    const model = buildRoomModel(
      baseMission({
        stage: "brief",
        approval: null,
        continuationPlan: null,
        researchPassCompletedAt: null,
        team: { ...base.team!, approvedAt: null, approvedBy: null },
      }),
    );
    expect(model.beats.map((b) => b.kind)).toEqual(["idea", "plan"]);
    expect(model.next).toMatchObject({ id: "approve_plan", panel: "plan", waitingOnYou: true });
    expect(model.status.working).toBe(false);
  });

  it("shows the team working, with no briefing, while research is queued", () => {
    const model = buildRoomModel(
      baseMission({
        stage: "evidence",
        approval: null,
        continuationPlan: null,
        researchPassQueuedAt: "2026-10-31T10:00:00Z",
        researchPassCompletedAt: null,
      }),
    );
    const investigation = model.beats.find((b) => b.kind === "investigation");
    expect(investigation).toMatchObject({ live: true });
    expect(model.beats.some((b) => b.kind === "briefing")).toBe(false);
    expect(model.status.working).toBe(true);
    expect(model.next.waitingOnYou).toBe(false);
  });

  it("tells the story through the decision and the team once decided", () => {
    const model = buildRoomModel(baseMission({ proposal }));
    const kinds = model.beats.map((b) => b.kind);
    expect(kinds).toEqual(["idea", "plan", "investigation", "briefing", "decision", "team"]);
    const decision = model.beats.find((b) => b.kind === "decision");
    expect(decision).toMatchObject({ option: "Waste log", note: "Ship a thin slice" });
    const briefing = model.beats.find((b) => b.kind === "briefing");
    expect(briefing && "options" in briefing ? briefing.options.map((o) => o.title) : []).toEqual([
      "Waste log",
      "POS sync",
    ]);
  });

  it("offers Begin delivery only before delivery has started", () => {
    expect(buildRoomModel(baseMission({ proposal })).deliveryAvailable).toBe(true);
    const started = baseMission({
      proposal,
      delivery: {
        wfMissionId: "wf",
        planVersion: 1,
        planHash: "h",
        optionId: "o1",
        approvedAt: "2026-10-31T13:00:00Z",
        approvedBy: "u",
      },
    });
    const model = buildRoomModel(started);
    expect(model.deliveryAvailable).toBe(false);
    expect(model.beats.some((b) => b.kind === "delivery")).toBe(true);
  });
});

describe("roomFindings", () => {
  it("only shows recorded events: every finding traces to evidence or specialist activity", () => {
    const mission = baseMission({
      activity: [
        ...baseMission().activity,
        {
          id: "h1",
          at: "2026-10-31T12:40:00Z",
          taskKey: null,
          kind: "note",
          summary: "x",
          actor: "human",
        },
      ],
    });
    const findings = roomFindings(mission);
    const specialistEvents = mission.activity.filter((a) => a.actor !== "human").length;
    expect(findings).toHaveLength(mission.evidence.length + specialistEvents);
    expect(findings.every((f) => f.id.startsWith("e:") || f.id.startsWith("a:"))).toBe(true);
  });

  it("puts open questions under risks and keeps only real links as sources", () => {
    const findings = roomFindings(baseMission());
    const gap = findings.find((f) => f.id === "e:e2");
    expect(gap).toMatchObject({ kind: "gap", stream: "risks", source: null });
    expect(findings.find((f) => f.id === "e:e1")?.source).toBe("https://example.com/e1");
  });
});
