/**
 * The agents office: the workspace's real missions and tasks laid out by
 * department and specialist. Every count here comes from the rows passed in;
 * nothing is estimated or filled in.
 */
import {
  WORKFORCE_AVAILABLE_IDS,
  WORKFORCE_DEPARTMENTS,
  WORKFORCE_INTENTS,
} from "@/lib/marketing/workforce-summary";
import type { MissionStatus, WfMission, WfMissionTask } from "@/lib/workforce/types";

/** Missions that cannot move until the owner acts. */
export const OWNER_WAITING: readonly MissionStatus[] = [
  "draft",
  "needs_clarification",
  "planned",
  "awaiting_approval",
];
const MISSION_ACTIVE: readonly MissionStatus[] = ["queued", "running", "reviewing"];

/** What a task means for the person reading the office. */
export type OfficeState = "waiting" | "doing" | "next" | "done" | "stopped";

export function taskState(task: WfMissionTask, mission: WfMission | undefined): OfficeState {
  if (task.status === "running") return "doing";
  if (task.status === "completed" || task.status === "skipped") return "done";
  if (task.status === "blocked" || task.status === "failed") return "stopped";
  // pending: it waits on the owner until the plan is approved, then it is next in line
  if (!mission || OWNER_WAITING.includes(mission.status)) return "waiting";
  if (MISSION_ACTIVE.includes(mission.status)) return "next";
  return "stopped";
}

export type OfficeSpecialist = { id: string; name: string; state: OfficeState | "idle" };
export type OfficeDepartment = {
  n: number;
  name: string;
  short: string;
  specialists: OfficeSpecialist[];
  counts: Record<OfficeState, number>;
};
export type OfficeItem = {
  key: string;
  missionId: string;
  title: string;
  mission: string;
  who: string;
  /** Specialist ids on the task; empty when the next step is the owner's. */
  specialists: string[];
  state: OfficeState;
};
export type AgentOffice = {
  departments: OfficeDepartment[];
  inDevelopment: Array<{ n: number; short: string }>;
  totals: Record<OfficeState, number>;
  items: OfficeItem[];
};

const NAMES = new Map(
  Object.values(WORKFORCE_INTENTS)
    .flat()
    .map((c) => [c.id, { name: c.name.replace(/ Agent$/, ""), department: c.department }]),
);
// a desk shows the most pressing thing its specialist is part of
const PRIORITY: Array<OfficeState> = ["doing", "waiting", "stopped", "next", "done"];
const empty = (): Record<OfficeState, number> => ({
  waiting: 0,
  doing: 0,
  next: 0,
  done: 0,
  stopped: 0,
});

export function buildAgentOffice(
  missions: readonly WfMission[],
  tasks: readonly WfMissionTask[],
): AgentOffice {
  const byId = new Map(missions.map((m) => [m.id, m]));
  const deskStates = new Map<string, Set<OfficeState>>();
  const deptCounts = new Map<number, Record<OfficeState, number>>();
  const totals = empty();
  const items: OfficeItem[] = [];

  for (const t of tasks) {
    const mission = byId.get(t.missionId);
    const state = taskState(t, mission);
    totals[state] += 1;
    const departments = new Set<number>();
    for (const id of t.capabilityIds) {
      const known = NAMES.get(id);
      if (!known) continue;
      departments.add(known.department);
      deskStates.set(id, (deskStates.get(id) ?? new Set()).add(state));
    }
    // a task shared by two specialists of one department counts once there
    for (const n of departments) {
      const c = deptCounts.get(n) ?? empty();
      c[state] += 1;
      deptCounts.set(n, c);
    }
    items.push({
      key: t.id,
      missionId: t.missionId,
      title: t.title,
      mission: mission?.title ?? "Mission",
      who:
        t.capabilityIds
          .map((id) => NAMES.get(id)?.name)
          .filter(Boolean)
          .join(" · ") || "Unassigned",
      specialists: t.capabilityIds,
      state,
    });
  }

  // a mission still being shaped has no tasks yet, but it is still waiting on the owner
  const withTasks = new Set(tasks.map((t) => t.missionId));
  for (const m of missions) {
    if (withTasks.has(m.id) || !OWNER_WAITING.includes(m.status)) continue;
    totals.waiting += 1;
    items.push({
      key: m.id,
      missionId: m.id,
      title:
        m.status === "needs_clarification" ? "Answer the planner’s questions" : "Review the plan",
      mission: m.title,
      who: "You",
      specialists: [],
      state: "waiting",
    });
  }

  const order: Record<OfficeState, number> = { waiting: 0, doing: 1, stopped: 2, next: 3, done: 4 };
  items.sort((a, b) => order[a.state] - order[b.state]);

  const available = new Set<string>(WORKFORCE_AVAILABLE_IDS);
  const departments: OfficeDepartment[] = [];
  const inDevelopment: AgentOffice["inDevelopment"] = [];
  for (const d of WORKFORCE_DEPARTMENTS) {
    const specialists = [...available]
      .filter((id) => NAMES.get(id)?.department === d.n)
      .map((id) => {
        const states = deskStates.get(id);
        const state: OfficeSpecialist["state"] = PRIORITY.find((s) => states?.has(s)) ?? "idle";
        return { id, name: NAMES.get(id)!.name, state };
      });
    if (specialists.length === 0) inDevelopment.push({ n: d.n, short: d.short });
    else
      departments.push({
        n: d.n,
        name: d.name,
        short: d.short,
        specialists,
        counts: deptCounts.get(d.n) ?? empty(),
      });
  }
  return { departments, inDevelopment, totals, items };
}
