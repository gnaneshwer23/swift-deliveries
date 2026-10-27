import { describe, expect, it } from "vitest";
import { dependencyView } from "./dependency-view";
import { productMissionTasks } from "./lifecycle";

type T = Parameters<typeof dependencyView>[0][number];
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

describe("dependency view", () => {
  it("groups tasks into waves and names what each waits on and unblocks", () => {
    const view = dependencyView([
      t("a", "completed"),
      t("b", "running", ["a"]),
      t("c", "pending", ["a"]),
      t("d", "pending", ["b", "c"]),
    ]);
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

  it("says when earlier work failed, so a task can never run, and when a gate waits on you", () => {
    const view = dependencyView([
      t("a", "failed"),
      t("b", "pending", ["a"]),
      t("c", "pending", ["b"]),
      t("g", "blocked", [], { gate: true }),
      t("x", "blocked"),
    ]);
    if (!view.ok) throw new Error(view.problem);
    const states = Object.fromEntries(view.waves.flat().map((n) => [n.key, n.state]));
    expect(states).toEqual({
      a: "failed",
      b: "cannot_run",
      c: "cannot_run",
      g: "waiting_you",
      x: "blocked",
    });
  });

  it("shows an unapproved outside action as waiting on you, and an approved one as blocked", () => {
    const tasks = [t("p", "blocked", [], { isExternal: true })];
    const waiting = dependencyView(tasks);
    const approved = dependencyView(tasks, true);
    if (!waiting.ok || !approved.ok) throw new Error("invalid");
    expect(waiting.waves[0]![0]!.state).toBe("waiting_you");
    expect(approved.waves[0]![0]!.state).toBe("blocked");
  });

  it("explains a plan the scheduler would refuse instead of drawing it", () => {
    const view = dependencyView([t("a", "pending", ["b"]), t("b", "pending", ["a"])]);
    expect(view.ok).toBe(false);
    if (!view.ok) expect(view.problem).toMatch(/loop/);
    const missing = dependencyView([t("a", "pending", ["zz"])]);
    expect(missing.ok).toBe(false);
  });

  it("lays out the full product-mission plan, with parallel discovery in one wave", () => {
    const planned = productMissionTasks("Build a meal planner", false).map((p, i) =>
      t(p.key, "pending", p.dependsOn ?? [], { sortOrder: i, gate: Boolean(p.gate) }),
    );
    const view = dependencyView(planned);
    if (!view.ok) throw new Error(view.problem);
    expect(view.waves[0]!.map((n) => n.key)).toEqual(["charter"]);
    expect(view.waves[1]!.map((n) => n.key).sort()).toEqual(["foresight", "market", "research"]);
    expect(view.waves[0]![0]!.state).toBe("ready");
  });
});
