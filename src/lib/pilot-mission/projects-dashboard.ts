/**
 * The signed-in home: every project the owner has, what each needs, and which roles from
 * the catalogue are working on it. Read only from saved case rows and the role registry —
 * no project is given a role it was not staffed with, and planned roles are never counted
 * as working.
 */
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { getCapability, listCapabilities, listDepartments } from "@/lib/workforce/registry";
import type { MissionStage } from "./types";
import { missionNeedsAttention } from "./portfolio";

export type ProjectPhase = "needs_you" | "researching" | "building" | "done" | "stopped";

/** A live project with no saved activity for this many days is shown as stalled. */
export const STALL_DAYS = 7;
const DAY_MS = 86_400_000;

export const PROJECT_PHASE_LABEL: Record<ProjectPhase, string> = {
  needs_you: "Needs you",
  researching: "In research",
  building: "In delivery",
  done: "Done",
  stopped: "Stopped",
};

/** What the home query returns per case (a subset of `getSupervisedMissionHome` rows). */
export type ProjectSource = {
  id: string;
  version: number;
  question: string;
  stage: MissionStage | string;
  next: { id: string; title: string; detail: string };
  updatedAt: string;
  favourite: boolean;
  archived: boolean;
  teamIds: string[];
  delivery: boolean;
  /** Saved activity, used to tell how long the project has been quiet. */
  recentActivity?: { at: string }[];
};

export type ProjectRole = { id: string; name: string; department: string };

/** The saved-case list returns the most recently updated cases, up to this many. */
export const PROJECT_LIST_LIMIT = 20;

export type ProjectRow = {
  id: string;
  version: number;
  name: string;
  phase: ProjectPhase;
  next: string;
  updatedAt: string;
  /** Last saved activity (or the last update when no activity is saved). */
  lastActivityAt: string;
  /** Whole days since then. */
  quietDays: number;
  /** Live, not finished, and quiet for STALL_DAYS or more. */
  stalled: boolean;
  favourite: boolean;
  deleted: boolean;
  roles: ProjectRole[];
};

export type ProjectFilter = "active" | "needs_you" | "stalled" | "building" | "done" | "deleted";

export const PROJECT_FILTERS: Array<{ id: ProjectFilter; label: string }> = [
  { id: "active", label: "All projects" },
  { id: "needs_you", label: "Needs you" },
  { id: "stalled", label: "Stalled" },
  { id: "building", label: "In delivery" },
  { id: "done", label: "Done" },
  { id: "deleted", label: "Deleted" },
];

export type TeamDepartment = {
  name: string;
  total: number;
  runnable: number;
  /** Roles from this department staffed on at least one live project. */
  onProjects: ProjectRole[];
};

export type ProjectsDashboard = {
  rows: ProjectRow[];
  counts: Record<ProjectFilter, number>;
  team: {
    total: number;
    departments: number;
    runnable: number;
    onProjects: number;
    byDepartment: TeamDepartment[];
  };
};

/** Roles the delivery build staffs (charter → release pack), from the lifecycle plan itself. */
const DELIVERY_ROLE_IDS = [
  ...new Set(productMissionTasks("project", false).flatMap((t) => t.capabilityIds)),
];

function phaseFor(p: ProjectSource): ProjectPhase {
  if (p.stage === "cancelled") return "stopped";
  if (missionNeedsAttention(p.next.id)) return "needs_you";
  if (p.stage === "exported" || p.next.id === "follow_up_approved") return "done";
  if (p.delivery) return "building";
  return "researching";
}

/** Only roles that can run today count as working on a project; planned roles never do. */
function role(id: string): ProjectRole | null {
  const c = getCapability(id);
  if (!c || c.lifecycle_status !== "available") return null;
  return { id, name: c.name.replace(/\s+agent$/i, ""), department: c.department };
}

export function projectRoles(p: Pick<ProjectSource, "teamIds" | "delivery">): ProjectRole[] {
  const ids = new Set([...p.teamIds, ...(p.delivery ? DELIVERY_ROLE_IDS : [])]);
  return [...ids].map(role).filter((r): r is ProjectRole => r !== null);
}

/**
 * The newest saved activity, or the last update only when no activity is saved. Housekeeping
 * saves (a favourite, a rename) touch the update time but are not work, so they never reset
 * how long a project has been quiet.
 */
export function lastActivityAt(p: Pick<ProjectSource, "updatedAt" | "recentActivity">): string {
  let best = -Infinity;
  let iso: string | null = null;
  for (const e of p.recentActivity ?? []) {
    const t = Date.parse(e.at);
    if (Number.isFinite(t) && t > best) {
      best = t;
      iso = e.at;
    }
  }
  return iso ?? p.updatedAt;
}

/** Whole days between `iso` and `now`, never negative. */
export function quietDaysSince(iso: string, now: number): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / DAY_MS)) : 0;
}

/** What needs you comes first; stalled projects have their own tab and badge. */
const ATTENTION = (r: ProjectRow) => (r.phase === "needs_you" ? 0 : 1);

export function buildProjectsDashboard(
  projects: ProjectSource[],
  now: number = Date.now(),
): ProjectsDashboard {
  const rows: ProjectRow[] = projects
    .map((p) => {
      const phase = phaseFor(p);
      const last = lastActivityAt(p);
      const quietDays = quietDaysSince(last, now);
      return {
        id: p.id,
        version: p.version,
        name: p.question.trim() || "Untitled project",
        phase,
        next: p.next.title,
        updatedAt: p.updatedAt,
        lastActivityAt: last,
        quietDays,
        stalled: !p.archived && phase !== "done" && phase !== "stopped" && quietDays >= STALL_DAYS,
        favourite: p.favourite,
        deleted: p.archived,
        roles: projectRoles(p),
      };
    })
    .sort((a, b) => {
      if (a.favourite !== b.favourite) return a.favourite ? -1 : 1;
      if (ATTENTION(a) !== ATTENTION(b)) return ATTENTION(a) - ATTENTION(b);
      return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
    });

  const live = rows.filter((r) => !r.deleted);
  const counts: Record<ProjectFilter, number> = {
    active: live.length,
    needs_you: live.filter((r) => r.phase === "needs_you").length,
    stalled: live.filter((r) => r.stalled).length,
    building: live.filter((r) => r.phase === "building").length,
    done: live.filter((r) => r.phase === "done").length,
    deleted: rows.length - live.length,
  };

  const staffed = new Map<string, ProjectRole>();
  for (const r of live) {
    if (r.phase === "stopped") continue;
    for (const role of r.roles) staffed.set(role.id, role);
  }

  const capabilities = listCapabilities();
  const runnable = (status: string) => status === "available";
  const byDepartment: TeamDepartment[] = listDepartments()
    .map((d) => {
      const inDept = capabilities.filter((c) => c.department === d.name);
      return {
        name: d.name,
        total: inDept.length,
        runnable: inDept.filter((c) => runnable(c.lifecycle_status)).length,
        onProjects: [...staffed.values()].filter((r) => r.department === d.name),
      };
    })
    .filter((d) => d.total > 0);

  return {
    rows,
    counts,
    team: {
      total: capabilities.length,
      departments: byDepartment.length,
      runnable: capabilities.filter((c) => runnable(c.lifecycle_status)).length,
      onProjects: staffed.size,
      byDepartment,
    },
  };
}

export function filterProjects(
  rows: ProjectRow[],
  filter: ProjectFilter,
  query = "",
): ProjectRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter === "deleted" ? !r.deleted : r.deleted) return false;
    if (filter === "needs_you" && r.phase !== "needs_you") return false;
    if (filter === "stalled" && !r.stalled) return false;
    if (filter === "building" && r.phase !== "building") return false;
    if (filter === "done" && r.phase !== "done") return false;
    return !q || r.name.toLowerCase().includes(q);
  });
}
