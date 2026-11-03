import { describe, expect, it } from "vitest";
import { buildRoomModel, roomFindings, roomInvestigationLine } from "./room-story";
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
    expect(briefing).toMatchObject({
      ready: true,
      kicker: "Recommendation on record",
      nextLabel: "Download the decision pack",
    });
  });

  it("keeps the compare gate when research is saved and no recommendation is on record", () => {
    const model = buildRoomModel(
      baseMission({
        stage: "evidence",
        approval: null,
        continuationPlan: null,
        proposal: null,
        researchPassQueuedAt: "2026-11-03T21:00:00Z",
        researchPassCompletedAt: "2026-11-03T21:54:00Z",
        researchProvider: "tavily",
        researchGaps: [],
      }),
    );
    const briefing = model.beats.find((b) => b.kind === "briefing");
    expect(model.next).toMatchObject({
      id: "compare",
      label: "Let the team compare options",
      waitingOnYou: true,
      panel: "work",
    });
    expect(model.status.line).toBe("Aria needs you: let the team compare options.");
    expect(briefing).toMatchObject({
      ready: false,
      headline: "Research is on the record",
      kicker: "Next step",
      nextLabel: "Let the team compare options",
      verdict: "Let the team compare options",
      options: [],
    });
    expect(briefing && "summary" in briefing ? briefing.summary : "").toContain(
      "Research pass is on the record",
    );
    expect(JSON.stringify(briefing)).not.toMatch(/briefing not ready|proceed to a bounded test/i);
    const investigation = model.beats.find((b) => b.kind === "investigation");
    expect(investigation && "findings" in investigation ? investigation : null).toMatchObject({
      findings: 1,
      assumptions: 0,
      gaps: 1,
      provider: "tavily",
    });
    expect(
      investigation && "findings" in investigation
        ? roomInvestigationLine(investigation, model.next)
        : "",
    ).toBe(
      "The team recorded 1 finding and 1 unverified with tavily web research. Next: Let the team compare options.",
    );
  });

  it("says the case is complete once the pack is exported", () => {
    const model = buildRoomModel(
      baseMission({
        proposal,
        stage: "exported",
        exportBody: "# Pack\n",
      }),
    );
    expect(model.next).toMatchObject({
      id: "completed",
      waitingOnYou: false,
      panel: "none",
    });
    expect(model.status.line).toBe("Completed. Your documents are saved and ready to download.");
    expect(model.status.working).toBe(false);
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
    expect(gap).toMatchObject({
      kind: "gap",
      stream: "risks",
      badge: "Unverified",
      source: null,
      recordHref: "#mission-evidence",
    });
    const cited = findings.find((f) => f.id === "e:e1");
    expect(cited).toMatchObject({
      badge: "Source-backed",
      source: "https://example.com/e1",
      statement: "Surplus tracking is the first pain.",
    });
  });
});
