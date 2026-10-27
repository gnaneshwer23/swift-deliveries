import { describe, expect, it } from "vitest";
import type { WfMissionEvent } from "@/lib/workforce/types";
import { spokenStatus } from "./status";

const event = (id: number, type: string, over: Partial<WfMissionEvent> = {}): WfMissionEvent => ({
  id,
  workspaceId: "w",
  missionId: "m",
  taskId: null,
  type,
  actorKind: "worker",
  actorId: null,
  data: {},
  createdAt: "2026-10-27T10:00:00Z",
  ...over,
});

describe("spoken status", () => {
  it("says only what the event log records", () => {
    const text = spokenStatus(
      { title: "Tutor discovery", status: "running" },
      [
        event(1, "mission.created", { actorKind: "user" }),
        event(2, "task.started", { taskId: "t1" }),
        event(3, "task.completed", { taskId: "t1", data: { generation: "simulated" } }),
      ],
      new Map([["t1", "Mission charter"]]),
    );
    expect(text).toBe(
      "“Tutor discovery” is running. 1 step finished so far. Latest in the event log: Finished “Mission charter” · simulated draft; Started “Mission charter”; Mission created.",
    );
  });

  it("says so when the log is empty", () => {
    expect(spokenStatus({ title: "New", status: "awaiting_approval" }, [])).toBe(
      "“New” is awaiting approval. The event log has no entries for it yet.",
    );
  });

  it("points to the screen when something waits for a decision", () => {
    expect(
      spokenStatus({ title: "X", status: "blocked" }, [event(1, "gate.waiting", { taskId: "t" })]),
    ).toMatch(/is waiting for your decision; it is shown on the mission page/);
  });

  it("stops saying a decision is waiting once it has been made", () => {
    expect(
      spokenStatus({ title: "X", status: "running" }, [
        event(1, "gate.waiting", { taskId: "t" }),
        event(2, "gate.approved", { taskId: "t", actorKind: "user" }),
      ]),
    ).not.toMatch(/Something is waiting for your decision/);
  });

  it("counts finished steps over the whole log when given the total", () => {
    expect(
      spokenStatus({ title: "X", status: "running" }, [event(300, "task.started")], new Map(), 42),
    ).toMatch(/^“X” is running\. 42 steps finished so far\./);
  });
});
