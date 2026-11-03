import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoomDecisionTrail } from "./room-decision-trail";
import { buildRoomDecisionTrail } from "@/lib/pilot-mission/room-decision-trail";
import { baseMission } from "@/lib/pilot-mission/test-fixtures";

describe("buildRoomDecisionTrail", () => {
  it("shows saved approvals and says handoffs are absent until they are persisted", () => {
    const trail = buildRoomDecisionTrail(baseMission());
    expect(trail.intro).toMatch(/No specialist handoff is saved yet/);
    expect(trail.rows.some((row) => row.kind === "handoff")).toBe(false);
    expect(trail.rows.find((row) => row.id === "decision-plan")).toMatchObject({
      badge: "Human approval",
    });
    expect(trail.rows.find((row) => row.kind === "evidence")?.detail).toMatch(/source-backed/);
    expect(trail.rows.find((row) => row.kind === "evidence")?.detail).toMatch(/unverified/);
  });

  it("lists a persisted handoff with its production label", () => {
    const trail = buildRoomDecisionTrail(
      baseMission({
        teamCollaboration: {
          version: "team-collaboration-v1",
          assignments: [],
          handoffs: [
            {
              id: "h1",
              fromTaskKey: "a",
              toTaskKey: "b",
              fromActor: "Scout",
              toActor: "Atlas",
              sourceTaskKey: "a",
              findingSummary: "Market note shared for framing",
              sourceFindingId: "e1",
              request: "Use in problem framing",
              evidenceIds: ["e1"],
              uncertainty: null,
              expectedDownstream: "Sharper problem statement",
              actualResult: null,
              sharedAt: "2026-10-31T12:10:00Z",
              consumedAt: null,
              productionLabel: "persisted event",
            },
          ],
          edges: [],
          recommendation: null,
        },
      }),
    );
    expect(trail.rows.find((row) => row.kind === "handoff")).toMatchObject({
      title: "Scout → Atlas",
      detail: "Market note shared for framing",
      badge: "persisted event",
    });
  });
});

describe("RoomDecisionTrail", () => {
  it("renders the trail and a link into the full record", () => {
    const html = renderToString(<RoomDecisionTrail mission={baseMission()} />);
    expect(html).toContain("How the team decided");
    expect(html).toContain('href="#mission-team-activity"');
    expect(html).toContain("Investigation plan approved");
  });
});
