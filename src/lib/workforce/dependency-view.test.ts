import { describe, expect, it } from "vitest";
import { dependencyView } from "./dependency-view";
import { productMissionTasks } from "./lifecycle";

type T = Parameters<typeof dependencyView>[0][number];
type M = Parameters<typeof dependencyView>[1];
const running: M = { status: "running", externalActionsApproved: false };
const t = (
  key: string,
  status: T["status"],
  dependsOn: string[] = [],
  over: Partial<T> = {},
): T => ({
  id: `id-${key}`,
  key,
  title: `Task ${key}`,
  status,
  gate: false,
  dependsOn,
  sortOrder: 0,
  isExternal: false,
  permissionRequired: "create",
  ...over,
});
const states = (view: ReturnType<typeof dependencyView>) => {
  if (!view.ok) throw new Error(view.problem);
  return Object.fromEntries(view.waves.flat().map((n) => [n.key, n.state]));
};

describe("dependency view", () => {
  it("groups tasks into waves and names what each waits on and unblocks", () => {
    const view = dependencyView(
      [
        t("a", "completed"),
        t("b", "running", ["a"]),
        t("c", "pending", ["a"]),
        t("d", "pending", ["b", "c"]),
      ],
      running,
    );
    if (!view.ok) throw new Error(view.problem);
    expect(view.waves.map((w) => w.map((n) => [n.key, n.state]))).toEqual([
      [["a", "done"]],
      [
        ["b", "running"],
        ["c", "ready"],
      ],
      [["d", "waiting_upstream"]],
    ]);
    expect(view.waves[0]![0]!.unblocks).toEqual(["Task b", "Task c"]);
    expect(view.waves[2]![0]!.after).toEqual(["Task b", "Task c"]);
    expect(view.edges).toBe(4);
  });

  it("says when earlier work failed, whether the stranded task is stored pending or blocked", () => {
    expect(
      states(
        dependencyView(
          [
            t("a", "failed"),
            t("b", "blocked", ["a"]),
            t("c", "pending", ["b"]),
            t("g", "blocked", [], { gate: true }),
            t("x", "blocked"),
          ],
          running,
        ),
      ),
    ).toEqual({ a: "failed", b: "cannot_run", c: "cannot_run", g: "waiting_you", x: "blocked" });
  });

  it("marks runnable work that needs you: a gate, or an outside action not yet approved", () => {
    expect(
      states(
        dependencyView(
          [
            t("g", "pending", [], { gate: true }),
            t("p", "pending", [], { permissionRequired: "act_externally" }),
            t("q", "pending"),
          ],
          running,
        ),
      ),
    ).toEqual({ g: "waiting_you", p: "waiting_you", q: "ready" });
  });

  it("follows the worker for outside actions: blocked until approved, then runnable again", () => {
    const tasks = [t("p", "blocked", [], { isExternal: true })];
    expect(states(dependencyView(tasks, running))).toEqual({ p: "waiting_you" });
    expect(states(dependencyView(tasks, { ...running, externalActionsApproved: true }))).toEqual({
      p: "ready",
    });
  });

  it("shows nothing as ready while paused, before the plan is approved, or after the end", () => {
    const tasks = [t("a", "pending"), t("g", "blocked", [], { gate: true }), t("f", "completed")];
    expect(states(dependencyView(tasks, { ...running, status: "paused" }))).toEqual({
      a: "paused",
      g: "paused",
      f: "done",
    });
    expect(states(dependencyView(tasks, { ...running, status: "awaiting_approval" }))).toEqual({
      a: "waiting_plan",
      g: "waiting_plan",
      f: "done",
    });
    expect(states(dependencyView(tasks, { ...running, status: "cancelled" }))).toEqual({
      a: "not_run",
      g: "not_run",
      f: "done",
    });
  });

  it("explains each kind of plan the scheduler would refuse instead of drawing it", () => {
    const loop = dependencyView([t("a", "pending", ["b"]), t("b", "pending", ["a"])], running);
    const missing = dependencyView([t("a", "pending", ["zz"])], running);
    const twice = dependencyView([t("a", "pending"), t("a", "pending")], running);
    expect([loop, missing, twice].map((v) => (v.ok ? "drawn" : v.problem))).toEqual([
      expect.stringMatching(/has a loop/),
      "A task depends on one that isn't in the plan (a → zz).",
      "Two tasks share a key (a).",
    ]);
  });

  it("lays out the full product-mission plan, with parallel discovery in one wave", () => {
    const planned = productMissionTasks("Build a meal planner", false).map((p, i) =>
      t(p.key, "pending", p.dependsOn ?? [], { sortOrder: i, gate: Boolean(p.gate) }),
    );
    const view = dependencyView(planned, running);
    if (!view.ok) throw new Error(view.problem);
    expect(view.waves[0]!.map((n) => n.key)).toEqual(["charter"]);
    expect(view.waves[1]!.map((n) => n.key).sort()).toEqual(["foresight", "market", "research"]);
    expect(view.waves[0]![0]!.state).toBe("ready");
  });
});
