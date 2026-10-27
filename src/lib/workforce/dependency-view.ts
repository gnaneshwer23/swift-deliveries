/**
 * The mission plan as its dependency graph: tasks grouped into waves that can
 * run side by side, each with what it waits on and what it unblocks. Built on
 * the scheduler's own rules (`graph.ts`), so the view can never say a task is
 * ready when the worker would not run it.
 */
import { executionWaves, runnableTasks, validateTaskGraph } from "./graph";
import {
  TERMINAL_MISSION_STATUSES,
  type MissionStatus,
  type WfMission,
  type WfMissionTask,
} from "./types";

export type NodeState =
  | "done"
  | "running"
  | "ready"
  | "waiting_upstream"
  | "waiting_you"
  | "waiting_plan"
  | "paused"
  | "blocked"
  | "failed"
  | "cannot_run"
  | "not_run";

export const NODE_STATE_TEXT: Record<NodeState, string> = {
  done: "Done",
  running: "Running",
  ready: "Ready to run",
  waiting_upstream: "Waiting on earlier work",
  waiting_you: "Waiting on your decision",
  waiting_plan: "Starts once you approve the plan",
  paused: "Paused: resume the mission to continue",
  blocked: "Blocked",
  failed: "Failed",
  cannot_run: "Can't run: earlier work failed",
  not_run: "Not run",
};

/** Mission statuses the worker advances (worker.server.ts). */
const WORKER_ACTIVE: readonly MissionStatus[] = ["queued", "running", "blocked"];
const BEFORE_APPROVAL: readonly MissionStatus[] = [
  "draft",
  "needs_clarification",
  "planned",
  "awaiting_approval",
];

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
 * Each state follows the worker and executor: an approved outside task that
 * is blocked re-enters the schedule; a runnable gate, or an outside action not
 * yet approved, waits on the owner; work downstream of a failure (stored as
 * blocked) can never run; and nothing runs while the mission is paused, before
 * its plan is approved, or once it has ended.
 */
export function dependencyView(
  tasks: readonly TaskLike[],
  mission: Pick<WfMission, "status" | "externalActionsApproved">,
): DependencyView {
  const approved = mission.externalActionsApproved;
  // The worker's own remap: an approved outside task that was blocked runs again.
  const nodes = tasks.map((t) => ({
    ...t,
    dependsOn: t.dependsOn ?? [],
    status: t.status === "blocked" && t.isExternal && approved ? ("pending" as const) : t.status,
  }));
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
  const dependants = new Map<string, string[]>();
  for (const n of nodes)
    for (const d of n.dependsOn) dependants.set(d, [...(dependants.get(d) ?? []), n.key]);

  // Any failure upstream, however far: such work is stored as blocked, or still pending.
  const stranded = new Map<string, boolean>();
  const failedUpstream = (key: string): boolean => {
    const known = stranded.get(key);
    if (known !== undefined) return known;
    stranded.set(key, false);
    const result = byKey
      .get(key)!
      .dependsOn.some((d) => byKey.get(d)!.status === "failed" || failedUpstream(d));
    stranded.set(key, result);
    return result;
  };
  const needsApproval = (n: (typeof nodes)[number]) =>
    (n.isExternal || n.permissionRequired === "act_externally") && !approved;

  const state = (n: (typeof nodes)[number]): NodeState => {
    if (n.status === "completed" || n.status === "skipped") return "done";
    if (n.status === "running") return "running";
    if (n.status === "failed") return "failed";
    if (failedUpstream(n.key)) return "cannot_run";
    if (TERMINAL_MISSION_STATUSES.includes(mission.status)) return "not_run";
    if (mission.status === "paused") return "paused";
    if (BEFORE_APPROVAL.includes(mission.status)) return "waiting_plan";
    if (n.status === "blocked") return n.gate || needsApproval(n) ? "waiting_you" : "blocked";
    if (!ready.has(n.key)) return "waiting_upstream";
    if (n.gate || needsApproval(n)) return "waiting_you";
    return WORKER_ACTIVE.includes(mission.status) ? "ready" : "waiting_upstream";
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
