/**
 * The lifecycle wheel: twelve display segments over the eight stored
 * lifecycle stages. Stored data is never changed by this view. A segment's
 * state comes only from the tasks mapped to it, so a segment with no tasks
 * reads "Not started" and nothing is shown as moving that is not.
 *
 * The mapping is versioned. Changing which task lands in which segment means
 * a new version, so a screenshot or a link that names a segment can always be
 * read against the mapping that produced it.
 */
import type { LifecycleStage, WfMissionTask } from "./types";

export const WHEEL_MAPPING_VERSION = "wheel-v1";

export type WheelSegment = {
  id: string;
  label: string;
  /** One line on what happens here. */
  summary: string;
  /** The stored stage this segment belongs to. Each segment has exactly one. */
  stage: LifecycleStage;
  /** Task keys from the product mission plan that land in this segment. */
  taskKeys: readonly string[];
};

export const WHEEL_SEGMENTS: readonly WheelSegment[] = [
  {
    id: "capture",
    label: "Capture",
    summary: "Turn the objective into a charter.",
    stage: "capture",
    taskKeys: ["charter"],
  },
  {
    id: "market",
    label: "Market",
    summary: "Landscape, segments and competitors.",
    stage: "discover",
    taskKeys: ["market"],
  },
  {
    id: "research",
    label: "Research",
    summary: "Questions, findings and evidence quality.",
    stage: "discover",
    taskKeys: ["research"],
  },
  {
    id: "foresight",
    label: "Foresight",
    summary: "Technology radar and maturity.",
    stage: "discover",
    taskKeys: ["foresight"],
  },
  {
    id: "define",
    label: "Define",
    summary: "PRD, then your scope decision.",
    stage: "define",
    taskKeys: ["prd", "gate_scope"],
  },
  {
    id: "experience",
    label: "Experience",
    summary: "Journeys, screens and accessibility.",
    stage: "design",
    taskKeys: ["ux"],
  },
  {
    id: "architecture",
    label: "Architecture",
    summary: "System design, then your design decision.",
    stage: "design",
    taskKeys: ["architecture", "gate_design"],
  },
  {
    id: "build",
    label: "Build",
    summary: "Sandboxed prototype.",
    stage: "build",
    taskKeys: ["prototype"],
  },
  {
    id: "verify",
    label: "Verify",
    summary: "Checks against the acceptance criteria.",
    stage: "verify",
    taskKeys: ["verify"],
  },
  {
    id: "release",
    label: "Release",
    summary: "Release pack, then your release decision.",
    stage: "release",
    taskKeys: ["release_pack", "gate_release"],
  },
  {
    id: "publish",
    label: "Publish",
    summary: "Act externally, only with your approval.",
    stage: "release",
    taskKeys: ["publish"],
  },
  {
    id: "evolve",
    label: "Learn",
    summary: "Metrics, feedback and next experiments.",
    stage: "evolve",
    taskKeys: ["evolution"],
  },
];

export type SegmentState = "idle" | "active" | "gate" | "done" | "failed";

export const SEGMENT_STATE_TEXT: Record<SegmentState, string> = {
  idle: "Not started",
  active: "In progress",
  gate: "Awaiting your decision",
  done: "Complete",
  failed: "Stopped",
};

/**
 * The segment a task belongs to. Known keys map exactly; a task with an
 * unknown key falls to the first segment of its stored stage, so nothing is
 * ever left off the wheel. A task with no stage has no segment.
 */
export function segmentFor(task: Pick<WfMissionTask, "key" | "stage">): WheelSegment | null {
  const exact = WHEEL_SEGMENTS.find((s) => s.taskKeys.includes(task.key));
  if (exact) return exact;
  if (!task.stage) return null;
  return WHEEL_SEGMENTS.find((s) => s.stage === task.stage) ?? null;
}

type TaskLike = Pick<WfMissionTask, "id" | "key" | "stage" | "status" | "gate" | "title">;

export function segmentState(tasks: readonly TaskLike[]): SegmentState {
  if (!tasks.length) return "idle";
  if (tasks.some((t) => t.status === "failed")) return "failed";
  if (tasks.some((t) => t.gate && t.status === "blocked")) return "gate";
  if (tasks.every((t) => t.status === "completed" || t.status === "skipped")) return "done";
  if (tasks.some((t) => t.status === "running" || t.status === "completed")) return "active";
  return "idle";
}

export type WheelView<T extends TaskLike = TaskLike> = {
  version: typeof WHEEL_MAPPING_VERSION;
  segments: Array<{ segment: WheelSegment; state: SegmentState; tasks: T[] }>;
  /** The segment to open first: a decision waiting, else work in progress, else the first not done. */
  focusId: string | null;
};

export function wheelView<T extends TaskLike>(tasks: readonly T[]): WheelView<T> {
  const bySegment = new Map<string, T[]>();
  for (const task of tasks) {
    const segment = segmentFor(task);
    if (!segment) continue;
    bySegment.set(segment.id, [...(bySegment.get(segment.id) ?? []), task]);
  }
  const segments = WHEEL_SEGMENTS.map((segment) => {
    const mapped = bySegment.get(segment.id) ?? [];
    return { segment, state: segmentState(mapped), tasks: mapped };
  });
  const first = (state: SegmentState) => segments.find((s) => s.state === state)?.segment.id;
  const focusId =
    first("gate") ??
    first("failed") ??
    first("active") ??
    segments.find((s) => s.tasks.length && s.state !== "done")?.segment.id ??
    null;
  return { version: WHEEL_MAPPING_VERSION, segments, focusId };
}
