import { describe, expect, it } from "vitest";
import { WORKFORCE_AVAILABLE_IDS } from "@/lib/marketing/workforce-summary";
import type { MissionStatus, TaskStatus, WfMission, WfMissionTask } from "@/lib/workforce/types";
import { buildAgentOffice, taskState } from "./agent-office";

const mission = (id: string, status: MissionStatus): WfMission =>
  ({ id, status, title: `Mission ${id}` }) as WfMission;
const task = (id: string, missionId: string, status: TaskStatus, ids: string[]): WfMissionTask =>
  ({ id, missionId, status, title: `Task ${id}`, capabilityIds: ids }) as WfMissionTask;

describe("agent office", () => {
  it("reads a pending task by where its mission is", () => {
    const t = task("t", "m", "pending", []);
    expect(taskState(t, mission("m", "awaiting_approval"))).toBe("waiting");
    expect(taskState(t, mission("m", "running"))).toBe("next");
    expect(taskState(t, mission("m", "cancelled"))).toBe("stopped");
    expect(taskState(task("t", "m", "running", []), mission("m", "running"))).toBe("doing");
    expect(taskState(task("t", "m", "skipped", []), mission("m", "running"))).toBe("done");
    expect(taskState(task("t", "m", "failed", []), mission("m", "running"))).toBe("stopped");
  });

  it("puts every available specialist at a desk and the rest in development", () => {
    const office = buildAgentOffice([], []);
    const desks = office.departments.flatMap((d) => d.specialists.map((s) => s.id));
    expect(desks.sort()).toEqual([...WORKFORCE_AVAILABLE_IDS].sort());
    expect(office.departments.length + office.inDevelopment.length).toBe(15);
    expect(office.departments.every((d) => d.specialists.every((s) => s.state === "idle"))).toBe(
      true,
    );
    expect(office.items).toEqual([]);
  });

  it("counts only the rows it is given, once per department", () => {
    const office = buildAgentOffice(
      [mission("a", "running"), mission("b", "awaiting_approval"), mission("c", "draft")],
      [
        task("1", "a", "running", ["DX-011", "DX-012"]),
        task("2", "a", "completed", ["DX-001"]),
        task("3", "a", "pending", ["DX-020"]),
        task("4", "b", "pending", ["DX-041"]),
      ],
    );
    expect(office.totals).toEqual({ waiting: 2, doing: 1, next: 1, done: 1, stopped: 0 });
    const research = office.departments.find((d) => d.n === 2)!;
    expect(research.counts).toMatchObject({ doing: 1, next: 1 });
    expect(research.specialists.find((s) => s.id === "DX-011")!.state).toBe("doing");
    expect(office.departments.find((d) => d.n === 5)!.specialists[0]!.state).toBe("waiting");
    // waiting items lead, and the draft mission with no tasks is waiting on you
    expect(office.items[0]!.state).toBe("waiting");
    expect(office.items.some((i) => i.missionId === "c" && i.who === "You")).toBe(true);
  });
});
