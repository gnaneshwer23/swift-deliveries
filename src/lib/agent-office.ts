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

/**
 * What a task means for the person reading the office. `waiting` is any step
 * that needs the owner (a plan to approve, questions, a gate or an outside
 * action); `later` is runnable only after its upstream tasks finish.
 */
export type OfficeState = "waiting" | "doing" | "next" | "later" | "done" | "stopped";

const finished = (t: Pick<WfMissionTask, "status">) =>
  t.status === "completed" || t.status === "skipped";

/** A blocked task the owner can release: a human gate, or an outside action to approve. */
function waitsOnOwner(task: WfMissionTask, mission: WfMission | undefined) {
  if (task.gate) return true;
  const outside = task.isExternal || task.permissionRequired === "act_externally";
  return outside && !mission?.externalActionsApproved;
}

export function taskState(
  task: WfMissionTask,
  mission: WfMission | undefined,
  siblings: readonly WfMissionTask[] = [],
): OfficeState {
  if (mission?.status === "cancelled") return finished(task) ? "done" : "stopped";
  if (task.status === "running") return "doing";
  if (finished(task)) return "done";
  if (task.status === "failed") return "stopped";
  if (task.status === "blocked") return waitsOnOwner(task, mission) ? "waiting" : "stopped";
  // pending: before approval the whole plan waits on the owner
  if (!mission || OWNER_WAITING.includes(mission.status)) return "waiting";
  if (!MISSION_ACTIVE.includes(mission.status) && mission.status !== "blocked") return "stopped";
  // a task never runs on unfinished upstream work (lib/workforce/graph.ts)
  const upstream = siblings.filter((s) => (task.dependsOn ?? []).includes(s.key));
  return upstream.every(finished) ? "next" : "later";
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
  /** Specialist ids on the task; empty for a mission-level step that is the owner's own. */
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
const PRIORITY: Array<OfficeState> = ["doing", "waiting", "stopped", "next", "later", "done"];
const empty = (): Record<OfficeState, number> => ({
  waiting: 0,
  doing: 0,
  next: 0,
  later: 0,
  done: 0,
  stopped: 0,
});

export function buildAgentOffice(
  missions: readonly WfMission[],
  tasks: readonly WfMissionTask[],
): AgentOffice {
  const byId = new Map(missions.map((m) => [m.id, m]));
  const byMission = new Map<string, WfMissionTask[]>();
  for (const t of tasks) byMission.set(t.missionId, [...(byMission.get(t.missionId) ?? []), t]);
  const deskStates = new Map<string, Set<OfficeState>>();
  const deptCounts = new Map<number, Record<OfficeState, number>>();
  const totals = empty();
  const items: OfficeItem[] = [];

  for (const t of tasks) {
    const mission = byId.get(t.missionId);
    const state = taskState(t, mission, byMission.get(t.missionId));
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

  // A mission still being shaped has no tasks yet but waits on the owner. A plan
  // with no tasks is not ready for review: it is shown as stopped, to open.
  for (const m of missions) {
    if (byMission.has(m.id) || !OWNER_WAITING.includes(m.status)) continue;
    const shaping = m.status === "draft" || m.status === "needs_clarification";
    const state: OfficeState = shaping ? "waiting" : "stopped";
    totals[state] += 1;
    items.push({
      key: m.id,
      missionId: m.id,
      title:
        m.status === "draft"
          ? "Finish the mission request"
          : m.status === "needs_clarification"
            ? "Answer the planner’s questions"
            : "The plan has no tasks: open the mission",
      mission: m.title,
      who: "You",
      specialists: [],
      state,
    });
  }

  const order: Record<OfficeState, number> = {
    waiting: 0,
    doing: 1,
    stopped: 2,
    next: 3,
    later: 4,
    done: 5,
  };
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
