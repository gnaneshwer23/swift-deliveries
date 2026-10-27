import { describe, expect, it } from "vitest";
import { productMissionTasks } from "./lifecycle";
import { LIFECYCLE_STAGES } from "./types";
import {
  WHEEL_MAPPING_VERSION,
  WHEEL_SEGMENTS,
  segmentFor,
  segmentState,
  wheelView,
} from "./lifecycle-wheel";

type T = Parameters<typeof wheelView>[0][number];
const task = (key: string, status: T["status"], extra: Partial<T> = {}): T => ({
  id: `id-${key}`,
  key,
  stage: segmentFor({ key, stage: null })?.stage ?? null,
  status,
  gate: key.startsWith("gate_"),
  title: key,
  ...extra,
});

describe("lifecycle wheel mapping", () => {
  it("has twelve segments, each on one stored stage, covering all eight", () => {
    expect(WHEEL_MAPPING_VERSION).toBe("wheel-v1");
    expect(WHEEL_SEGMENTS).toHaveLength(12);
    expect(new Set(WHEEL_SEGMENTS.map((s) => s.id)).size).toBe(12);
    expect(new Set(WHEEL_SEGMENTS.map((s) => s.stage))).toEqual(new Set(LIFECYCLE_STAGES));
  });

  it("puts every planned product-mission task in exactly one segment of its own stage", () => {
    for (const external of [false, true]) {
      for (const planned of productMissionTasks("Build a meal planner", external)) {
        const owners = WHEEL_SEGMENTS.filter((s) => s.taskKeys.includes(planned.key));
        expect(owners, planned.key).toHaveLength(1);
        expect(owners[0]!.stage, planned.key).toBe(planned.stage);
      }
    }
  });

  it("keeps a task with an unknown key on the wheel, under its stored stage", () => {
    expect(segmentFor({ key: "extra_check", stage: "verify" })?.id).toBe("verify");
    expect(segmentFor({ key: "t3", stage: null })).toBeNull();
  });
});

describe("segment state", () => {
  it("reads only from the tasks: no tasks means not started", () => {
    expect(segmentState([])).toBe("idle");
    expect(segmentState([task("prd", "pending")])).toBe("idle");
    expect(segmentState([task("prd", "running")])).toBe("active");
    expect(segmentState([task("prd", "completed"), task("gate_scope", "blocked")])).toBe("gate");
    expect(segmentState([task("prd", "completed"), task("gate_scope", "completed")])).toBe("done");
    expect(segmentState([task("prd", "failed"), task("gate_scope", "blocked")])).toBe("failed");
  });

  it("does not count a blocked non-gate task as waiting on you", () => {
    expect(segmentState([task("publish", "blocked")])).toBe("idle");
  });
});

describe("wheel view", () => {
  it("opens on the decision that is waiting", () => {
    const view = wheelView([
      task("charter", "completed"),
      task("market", "completed"),
      task("prd", "completed"),
      task("gate_scope", "blocked"),
      task("ux", "pending"),
    ]);
    expect(view.focusId).toBe("define");
    expect(view.segments.find((s) => s.segment.id === "define")!.tasks.map((t) => t.key)).toEqual([
      "prd",
      "gate_scope",
    ]);
    expect(view.segments.find((s) => s.segment.id === "build")!.state).toBe("idle");
  });

  it("has nothing to open for a mission with no staged tasks", () => {
    expect(wheelView([task("t0", "running", { stage: null })]).focusId).toBeNull();
  });
});
