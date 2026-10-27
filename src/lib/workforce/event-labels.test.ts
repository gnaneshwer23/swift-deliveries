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

  it("says when a mission came from a brief confirmed in conversation", () => {
    expect(describeEvent(ev("mission.created", { via: "conversation" }, "user")).text).toBe(
      "Mission created from a brief you confirmed in conversation",
    );
    expect(describeEvent(ev("mission.created", { via: "form" }, "user")).text).toBe(
      "Mission created",
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

  it("describes evidence as added, unreadable, withheld or removed", () => {
    expect(
      describeEvent(ev("evidence.added", { title: "Call notes", status: "readable" }, "user")),
    ).toEqual({ text: "You added evidence “Call notes”", tone: "control" });
    expect(
      describeEvent(
        ev(
          "evidence.added",
          { title: "Scan", status: "unreadable", reason: "PDF files can't be read yet." },
          "user",
        ),
      ),
    ).toEqual({ text: "“Scan” could not be read: PDF files can't be read yet.", tone: "problem" });
    expect(
      describeEvent(
        ev(
          "evidence.added",
          { title: "List", status: "readable", withheldFromModel: true },
          "user",
        ),
      ).text,
    ).toMatch(/not sent to a model/);
    expect(describeEvent(ev("evidence.removed", { title: "Call notes" }, "user"))).toEqual({
      text: "You removed evidence “Call notes”",
      tone: "control",
    });
  });

  it("describes gate decisions and sign-offs", () => {
    expect(
      describeEvent(ev("gate.approved", { gate: "gate_scope" }, "user"), "Scope gate").text,
    ).toBe("You approved “Scope gate”");
    expect(describeEvent(ev("gate.rejected", {}, "user"), "Scope gate").text).toBe(
      "You rejected “Scope gate”",
    );
    expect(describeEvent(ev("artefact.reviewed", { title: "PRD" }, "user")).text).toBe(
      "You signed off “PRD” as human-reviewed",
    );
  });

  it("shows unknown event types by name rather than guessing", () => {
    expect(describeEvent(ev("something.new")).text).toBe("something.new");
  });
});
