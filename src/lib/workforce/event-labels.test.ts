import { describe, expect, it } from "vitest";
import { describeEvent } from "./event-labels";
import type { WfMissionEvent } from "./types";

const ev = (
  type: string,
  data: WfMissionEvent["data"] = {},
  actorKind: WfMissionEvent["actorKind"] = "worker",
): WfMissionEvent => ({
  id: 1,
  workspaceId: "w",
  missionId: "m",
  taskId: "t",
  type,
  actorKind,
  actorId: null,
  data,
  createdAt: "2026-10-27T06:00:00.000Z",
});

describe("describeEvent", () => {
  it("names the task and the attempt when a task is retried", () => {
    expect(describeEvent(ev("task.started", { attempt: 2 }), "Frame the problem")).toEqual({
      text: "Started “Frame the problem” (attempt 2)",
      tone: "progress",
    });
    expect(describeEvent(ev("task.started", { attempt: 1 }), "Frame").text).toBe("Started “Frame”");
  });

  it("discloses simulated drafts", () => {
    expect(describeEvent(ev("task.completed", { generation: "simulated" }), "Brief").text).toBe(
      "Finished “Brief” · simulated draft",
    );
    expect(describeEvent(ev("task.completed", { generation: "model" }), "Brief").text).toBe(
      "Finished “Brief”",
    );
  });

  it("says who acted on controls", () => {
    expect(describeEvent(ev("mission.paused", {}, "user")).text).toBe("You paused the mission");
    expect(describeEvent(ev("workspace.stopped", {}, "user")).text).toBe(
      "You stopped all work in the workspace",
    );
  });

  it("marks only a completed mission as done", () => {
    expect(describeEvent(ev("mission.finished", { status: "completed" })).tone).toBe("done");
    expect(describeEvent(ev("mission.finished", { status: "partially_completed" }))).toEqual({
      text: "Mission ended: partially completed",
      tone: "problem",
    });
  });

  it("shows unknown event types by name rather than guessing", () => {
    expect(describeEvent(ev("something.new")).text).toBe("something.new");
  });
});
