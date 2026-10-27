/**
 * The mission plan as its dependency graph: tasks grouped into waves that can
 * run side by side, each with what it waits on and what it unblocks. Built on
 * the scheduler's own rules (`graph.ts`), so the view can never say a task is
 * ready when the worker would not run it.
 */
import { executionWaves, runnableTasks, unreachableTasks, validateTaskGraph } from "./graph";
import type { WfMissionTask } from "./types";

export type NodeState =
  | "done"
  | "running"
  | "ready"
  | "waiting_upstream"
  | "waiting_you"
  | "blocked"
  | "failed"
  | "cannot_run";

export const NODE_STATE_TEXT: Record<NodeState, string> = {
  done: "Done",
  running: "Running",
  ready: "Ready to run",
  waiting_upstream: "Waiting on earlier work",
  waiting_you: "Waiting on your decision",
  blocked: "Blocked",
  failed: "Failed",
  cannot_run: "Can't run: earlier work failed",
};

type TaskLike = Pick<
  WfMissionTask,
  | "id"
  | "key"
  | "title"
  | "status"
  | "gate"
  | "dependsOn"
  | "sortOrder"
  | "isExternal"
  | "permissionRequired"
>;

export type DependencyNode = {
  id: string;
  key: string;
  title: string;
  state: NodeState;
  /** Titles of the tasks this one waits on. */
  after: string[];
  /** Titles of the tasks waiting on this one. */
  unblocks: string[];
};

export type DependencyView =
  { ok: true; waves: DependencyNode[][]; edges: number } | { ok: false; problem: string };

/**
 * `externalActionsApproved` is the mission's: a blocked outside action waits on
 * the owner until they approve acting externally, exactly as the inbox says.
 */
export function dependencyView(
  tasks: readonly TaskLike[],
  externalActionsApproved = false,
): DependencyView {
  const nodes = tasks.map((t) => ({ ...t, dependsOn: t.dependsOn ?? [] }));
  const check = validateTaskGraph(nodes);
  if (!check.ok)
    return {
      ok: false,
      problem:
        check.reason === "cycle"
          ? `The plan has a loop (${check.detail}), so it can't run until it is revised.`
          : check.reason === "unknown_dependency"
            ? `A task depends on one that isn't in the plan (${check.detail}).`
            : `Two tasks share a key (${check.detail}).`,
    };
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const ready = new Set(runnableTasks(nodes).map((n) => n.key));
  const dead = new Set(unreachableTasks(nodes).map((n) => n.key));
  const dependants = new Map<string, string[]>();
  for (const n of nodes)
    for (const d of n.dependsOn) dependants.set(d, [...(dependants.get(d) ?? []), n.key]);

  const state = (n: (typeof nodes)[number]): NodeState => {
    if (n.status === "completed" || n.status === "skipped") return "done";
    if (n.status === "running") return "running";
    if (n.status === "failed") return "failed";
    if (n.status === "blocked") {
      const outside = n.isExternal || n.permissionRequired === "act_externally";
      return n.gate || (outside && !externalActionsApproved) ? "waiting_you" : "blocked";
    }
    if (dead.has(n.key)) return "cannot_run";
    return ready.has(n.key) ? "ready" : "waiting_upstream";
  };
  const title = (key: string) => byKey.get(key)?.title ?? key;

  const waves = executionWaves(nodes).map((wave) =>
    wave.map((key) => {
      const n = byKey.get(key)!;
      return {
        id: n.id,
        key,
        title: n.title,
        state: state(n),
        after: n.dependsOn.map(title),
        unblocks: (dependants.get(key) ?? []).map(title),
      };
    }),
  );
  return { ok: true, waves, edges: nodes.reduce((sum, n) => sum + n.dependsOn.length, 0) };
}
