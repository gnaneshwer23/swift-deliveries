/**
 * Deterministic task-graph scheduler (infrastructure service — not an agent).
 *
 * Mission tasks form a DAG via `dependsOn`. A task is runnable only when every
 * dependency has completed. A failed or blocked dependency never lets a
 * downstream task run on unverified input — the most common multi-agent
 * failure mode is an early bad handoff cascading through later stages.
 */
import type { TaskStatus } from "./types";

export type GraphNode = {
  key: string;
  dependsOn: string[];
  status: TaskStatus;
  sortOrder: number;
};

export type GraphValidation =
  | { ok: true; order: string[] }
  | { ok: false; reason: "duplicate_key" | "unknown_dependency" | "cycle"; detail: string };

/** Validates keys/edges and returns a stable topological order (Kahn, ties by sortOrder). */
export function validateTaskGraph(nodes: GraphNode[]): GraphValidation {
  const byKey = new Map<string, GraphNode>();
  for (const n of nodes) {
    if (byKey.has(n.key)) return { ok: false, reason: "duplicate_key", detail: n.key };
    byKey.set(n.key, n);
  }
  for (const n of nodes) {
    for (const dep of n.dependsOn) {
      if (!byKey.has(dep)) {
        return { ok: false, reason: "unknown_dependency", detail: `${n.key} → ${dep}` };
      }
      if (dep === n.key) return { ok: false, reason: "cycle", detail: n.key };
    }
  }

  const indegree = new Map<string, number>(nodes.map((n) => [n.key, n.dependsOn.length]));
  const dependants = new Map<string, string[]>();
  for (const n of nodes) {
    for (const dep of n.dependsOn) dependants.set(dep, [...(dependants.get(dep) ?? []), n.key]);
  }
  const bySort = (a: string, b: string) => byKey.get(a)!.sortOrder - byKey.get(b)!.sortOrder;
  const ready = nodes.filter((n) => n.dependsOn.length === 0).map((n) => n.key);
  ready.sort(bySort);
  const order: string[] = [];
  while (ready.length) {
    const key = ready.shift()!;
    order.push(key);
    for (const next of dependants.get(key) ?? []) {
      const left = indegree.get(next)! - 1;
      indegree.set(next, left);
      if (left === 0) {
        ready.push(next);
        ready.sort(bySort);
      }
    }
  }
  if (order.length !== nodes.length) {
    const stuck = nodes.filter((n) => !order.includes(n.key)).map((n) => n.key);
    return { ok: false, reason: "cycle", detail: stuck.join(", ") };
  }
  return { ok: true, order };
}

const SATISFIED: ReadonlySet<TaskStatus> = new Set(["completed", "skipped"]);

/** True when a dependency in this status lets downstream work (or a gate) proceed. */
export function isSatisfied(status: string | undefined): boolean {
  return SATISFIED.has(status as TaskStatus);
}
const DEAD: ReadonlySet<TaskStatus> = new Set(["failed"]);

/** Pending tasks whose dependencies are all satisfied, in sortOrder. */
export function runnableTasks<T extends GraphNode>(nodes: T[]): T[] {
  const status = new Map(nodes.map((n) => [n.key, n.status]));
  return nodes
    .filter(
      (n) => n.status === "pending" && n.dependsOn.every((d) => SATISFIED.has(status.get(d)!)),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Pending tasks that can never run because an upstream dependency failed
 * (transitively). These are reported, never silently dropped.
 */
export function unreachableTasks<T extends GraphNode>(nodes: T[]): T[] {
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const memo = new Map<string, boolean>();
  const dead = (key: string, seen: Set<string>): boolean => {
    if (memo.has(key)) return memo.get(key)!;
    if (seen.has(key)) return false;
    seen.add(key);
    const node = byKey.get(key);
    const result = !!node && (DEAD.has(node.status) || node.dependsOn.some((d) => dead(d, seen)));
    memo.set(key, result);
    return result;
  };
  return nodes.filter((n) => n.status === "pending" && n.dependsOn.some((d) => dead(d, new Set())));
}

/** Groups keys into parallelisable waves: every task in wave N depends only on waves < N. */
export function executionWaves(nodes: GraphNode[]): string[][] {
  const v = validateTaskGraph(nodes);
  if (!v.ok) return [];
  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const depth = new Map<string, number>();
  for (const key of v.order) {
    const deps = byKey.get(key)!.dependsOn;
    depth.set(key, deps.length ? Math.max(...deps.map((d) => depth.get(d)!)) + 1 : 0);
  }
  const waves: string[][] = [];
  for (const key of v.order) {
    const d = depth.get(key)!;
    (waves[d] ??= []).push(key);
  }
  return waves;
}
