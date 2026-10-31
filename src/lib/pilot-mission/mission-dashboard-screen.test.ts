import { describe, expect, it } from "vitest";
import { buildMissionDashboard, MISSION_DASH_NAV } from "./mission-dashboard-screen";
import { baseMission } from "./test-fixtures";

describe("mission dashboard screen", () => {
  it("exposes the Screen 10 navigation set", () => {
    expect(MISSION_DASH_NAV.map((n) => n.label)).toEqual([
      "Overview",
      "PM Chat",
      "Team",
      "Research",
      "Product Plan",
      "Design",
      "Engineering",
      "QA & Quality",
      "Data & Metrics",
      "Marketing",
      "Decisions",
      "Evidence",
      "Timeline",
      "Downloads",
    ]);
  });

  it("builds overview cards from recorded mission state only", () => {
    const model = buildMissionDashboard(baseMission());
    expect(model.projectName).toBe("Food waste app");
    expect(model.rail.map((r) => r.label)).toEqual([
      "Discovery",
      "Research",
      "Product plan",
      "Design",
      "Engineering",
      "QA",
      "Handover",
    ]);
    expect(model.rail.find((r) => r.id === "research")?.state).not.toBe("upcoming");
    expect(model.activeAgents.some((a) => /Market/i.test(a.label))).toBe(true);
    expect(model.completedOutputs).toHaveLength(0);
    // Exporting the pack is the owner's own step, so it is waiting on them.
    expect(model.waitingOnYou).toEqual([expect.stringMatching(/^Export the pack — /)]);
    expect(model.risks.some((r) => /Waiting on founder/i.test(r.text))).toBe(true);
    expect(model.latestPmUpdate.summary).toMatch(/Framed the first-phase/i);
    expect(model.usage.consumed).toBe(2);
    expect(model.usage.remaining).toBe(4);
    expect(model.downloadAvailable).toBe(false);
    expect(JSON.stringify(model).toLowerCase()).not.toMatch(/confidence:\s*\d/);
    expect(model.designLines[0]).toMatch(/no design/i);
  });

  it("marks download available when an export exists", () => {
    const model = buildMissionDashboard(
      baseMission({
        exportBody: "# Pack\n",
        artefact: { title: "Pack", decisionBrief: "d", experimentBrief: "e", provenance: "p" },
      }),
    );
    expect(model.downloadAvailable).toBe(true);
    expect(model.rail.find((r) => r.id === "handover")?.state).toBe("done");
  });

  it("never marks a stage done without its own record, even after handover", () => {
    const exported = buildMissionDashboard(
      baseMission({
        stage: "exported",
        exportBody: "# Pack\n",
        artefact: { title: "Pack", decisionBrief: "d", experimentBrief: "e", provenance: "p" },
        prototype: null,
        reviews: [],
        observation: null,
      }),
    );
    expect(Object.fromEntries(exported.rail.map((r) => [r.id, r.state]))).toEqual({
      discovery: "done",
      research: "done",
      plan: "done",
      // A prototype can still follow the export, so Design is next, not skipped.
      design: "current",
      engineering: "upcoming",
      qa: "upcoming",
      handover: "done",
    });
    expect(exported.stageLabel).toBe("Approve sandboxed HTML prototype");
  });

  it("does not count research tasks whose words merely contain 'api' or 'service'", () => {
    const team = baseMission().team!;
    const model = buildMissionDashboard(
      baseMission({
        team: {
          ...team,
          tasks: [
            ...team.tasks,
            { ...team.tasks[0]!, key: "x1", title: "Rapid market scan", status: "completed" },
            { ...team.tasks[0]!, key: "x2", title: "Therapist interviews", status: "completed" },
          ],
        },
      }),
    );
    expect(model.rail.find((r) => r.id === "engineering")?.state).not.toBe("done");
  });

  it("makes the first stage without a record current and leaves later ones not started", () => {
    const model = buildMissionDashboard(
      baseMission({ evidence: [], researchPassCompletedAt: null }),
    );
    const states = Object.fromEntries(model.rail.map((r) => [r.id, r.state]));
    expect(states["research"]).toBe("current");
    // The plan exists on the record, so it shows as done even though research is still open.
    expect(states["plan"]).toBe("done");
    expect(states["design"]).toBe("upcoming");
    expect(model.rail.filter((r) => r.state === "current")).toHaveLength(1);
  });

  it("lists approval gates and the owner's own steps as waiting on them", () => {
    const deciding = buildMissionDashboard(baseMission({ stage: "alternatives" }));
    expect(deciding.waitingOnYou).toEqual([expect.stringMatching(/^Record your next path — /)]);
    const done = buildMissionDashboard(
      baseMission({
        stage: "exported",
        exportBody: "# Pack\n",
        expectation: {
          hypothesis: "h",
          expectedMetric: "m",
          baseline: "b",
          observationWindow: "w",
          recordedAt: "2026-10-31T12:00:00Z",
        },
        observation: { result: "r", recordedAt: "2026-10-31T12:00:00Z" },
        reviews: [{ reading: "as_expected", uncertainty: "", observedResult: "r" }],
        followUp: { status: "approved" },
      } as never),
    );
    const expecting = buildMissionDashboard(baseMission({ stage: "decision" }));
    expect(expecting.waitingOnYou).toEqual([expect.stringMatching(/^Record what you expect — /)]);
    expect(done.stageLabel).toBe("Follow-up approved");
    expect(done.waitingOnYou).toEqual([]);
  });
});
