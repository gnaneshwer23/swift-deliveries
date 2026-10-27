import { describe, expect, it } from "vitest";
import { ownerInbox } from "./owner-inbox";

type M = Parameters<typeof ownerInbox>[0][number];
type T = Parameters<typeof ownerInbox>[1][number];

const mission = (id: string, status: M["status"], over: Partial<M> = {}): M => ({
  id,
  title: `Mission ${id}`,
  status,
  updatedAt: "2026-10-27T10:00:00Z",
  externalActionsApproved: false,
  ...over,
});
const task = (id: string, missionId: string, over: Partial<T> = {}): T => ({
  id,
  missionId,
  title: `Task ${id}`,
  status: "pending",
  gate: false,
  isExternal: false,
  permissionRequired: "create",
  sortOrder: 0,
  updatedAt: "2026-10-27T10:00:00Z",
  ...over,
});

describe("owner inbox", () => {
  it("lists only what a mission or task row says is waiting on the owner", () => {
    const items = ownerInbox(
      [
        mission("a", "needs_clarification"),
        mission("b", "awaiting_approval"),
        mission("c", "running"),
        mission("d", "completed"),
        mission("e", "paused"),
        mission("f", "draft"),
      ],
      [
        task("g1", "c", { status: "blocked", gate: true, title: "Scope decision" }),
        task("x1", "c", { status: "blocked", isExternal: true, sortOrder: 2 }),
        task("r1", "c", { status: "running" }),
        task("d1", "d", { status: "blocked", gate: true }),
      ],
    );
    expect(items.map((i) => [i.kind, i.missionId, i.hash])).toEqual([
      ["decide_gate", "c", "task-g1"],
      ["approve_external", "c", "task-x1"],
      ["approve_plan", "b", "mission-plan"],
      ["answer_questions", "a", "mission-clarify"],
      ["finish_request", "f", ""],
      ["resume", "e", "mission-tasks"],
    ]);
    expect(items[0]!.action).toBe("Decide: Scope decision");
  });

  it("does not ask for outside approval twice, or for a blocked task the owner can't release", () => {
    const items = ownerInbox(
      [mission("c", "blocked", { externalActionsApproved: true })],
      [
        task("x1", "c", { status: "blocked", permissionRequired: "act_externally" }),
        task("b1", "c", { status: "blocked" }),
      ],
    );
    expect(items).toEqual([]);
  });

  it("asks a paused mission to be resumed, not for its gates", () => {
    const items = ownerInbox(
      [mission("p", "paused")],
      [task("g", "p", { status: "blocked", gate: true })],
    );
    expect(items.map((i) => i.kind)).toEqual(["resume"]);
  });

  it("dates a task's wait from the task, so gates in one mission order by their own wait", () => {
    const items = ownerInbox(
      [mission("c", "running", { updatedAt: "2026-10-27T12:00:00Z" })],
      [
        task("late", "c", { status: "blocked", gate: true, updatedAt: "2026-10-27T11:00:00Z" }),
        task("early", "c", {
          status: "blocked",
          gate: true,
          sortOrder: 5,
          updatedAt: "2026-10-27T09:00:00Z",
        }),
      ],
    );
    expect(items.map((i) => [i.taskId, i.since])).toEqual([
      ["early", "2026-10-27T09:00:00Z"],
      ["late", "2026-10-27T11:00:00Z"],
    ]);
  });

  it("puts the longest wait first within a kind", () => {
    const items = ownerInbox(
      [
        mission("new", "awaiting_approval", { updatedAt: "2026-10-27T12:00:00Z" }),
        mission("old", "awaiting_approval", { updatedAt: "2026-10-26T12:00:00Z" }),
      ],
      [],
    );
    expect(items.map((i) => i.missionId)).toEqual(["old", "new"]);
  });
});
