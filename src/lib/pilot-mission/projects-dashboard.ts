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
};

export type ProjectRole = { id: string; name: string; department: string };

export type ProjectRow = {
  id: string;
  version: number;
  name: string;
  phase: ProjectPhase;
  next: string;
  updatedAt: string;
  favourite: boolean;
  deleted: boolean;
  roles: ProjectRole[];
};

export type ProjectFilter = "active" | "needs_you" | "building" | "done" | "deleted";

export const PROJECT_FILTERS: Array<{ id: ProjectFilter; label: string }> = [
  { id: "active", label: "All projects" },
  { id: "needs_you", label: "Needs you" },
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

function role(id: string): ProjectRole | null {
  const c = getCapability(id);
  return c ? { id, name: c.name.replace(/\s+agent$/i, ""), department: c.department } : null;
}

export function projectRoles(p: Pick<ProjectSource, "teamIds" | "delivery">): ProjectRole[] {
  const ids = new Set([...p.teamIds, ...(p.delivery ? DELIVERY_ROLE_IDS : [])]);
  return [...ids].map(role).filter((r): r is ProjectRole => r !== null);
}

export function buildProjectsDashboard(projects: ProjectSource[]): ProjectsDashboard {
  const rows: ProjectRow[] = [...projects]
    .sort((a, b) => {
      if (a.favourite !== b.favourite) return a.favourite ? -1 : 1;
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    })
    .map((p) => ({
      id: p.id,
      version: p.version,
      name: p.question.trim() || "Untitled project",
      phase: phaseFor(p),
      next: p.next.title,
      updatedAt: p.updatedAt,
      favourite: p.favourite,
      deleted: p.archived,
      roles: projectRoles(p),
    }));

  const live = rows.filter((r) => !r.deleted);
  const counts: Record<ProjectFilter, number> = {
    active: live.length,
    needs_you: live.filter((r) => r.phase === "needs_you").length,
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
    if (filter === "building" && r.phase !== "building") return false;
    if (filter === "done" && r.phase !== "done") return false;
    return !q || r.name.toLowerCase().includes(q);
  });
}
