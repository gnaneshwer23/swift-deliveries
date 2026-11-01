/**
 * The AI team page: every catalogue role, whether it can run today, and which of the
 * owner's live projects it is working on. Read from the role registry and saved projects
 * only — a planned role is never shown as working, and no role is put on a project it was
 * not staffed for.
 */
import { listCapabilities, listDepartments } from "@/lib/workforce/registry";
import type { LifecycleStatus } from "@/lib/workforce/registry";
import { buildProjectsDashboard, type ProjectSource } from "./projects-dashboard";

export type RoleAvailability = "can_run" | "planned" | "unavailable";

export const ROLE_AVAILABILITY_LABEL: Record<RoleAvailability, string> = {
  can_run: "Can run today",
  planned: "Planned",
  unavailable: "Not available",
};

function availability(status: LifecycleStatus): RoleAvailability {
  if (status === "available") return "can_run";
  if (status === "suspended" || status === "retired") return "unavailable";
  return "planned";
}

export type TeamRole = {
  id: string;
  name: string;
  department: string;
  description: string;
  availability: RoleAvailability;
  limitations: string[];
  projects: Array<{ id: string; name: string }>;
};

export type TeamDirectory = {
  summary: { total: number; departments: number; canRun: number; onProjects: number };
  departments: Array<{ name: string; roles: TeamRole[] }>;
};

export type TeamFilter = {
  query: string;
  department: string;
  show: "all" | "can_run" | "on_projects";
};

export function buildTeamDirectory(projects: ProjectSource[]): TeamDirectory {
  // Live projects only: deleted and stopped projects have no one working on them.
  const live = buildProjectsDashboard(projects).rows.filter(
    (r) => !r.deleted && r.phase !== "stopped",
  );
  const onRole = new Map<string, Array<{ id: string; name: string }>>();
  for (const p of live) {
    for (const role of p.roles) {
      onRole.set(role.id, [...(onRole.get(role.id) ?? []), { id: p.id, name: p.name }]);
    }
  }

  const roles: TeamRole[] = listCapabilities().map((c) => ({
    id: c.capability_id,
    name: c.name.replace(/\s+agent$/i, ""),
    department: c.department,
    description: c.description,
    availability: availability(c.lifecycle_status),
    limitations: c.known_limitations,
    projects: onRole.get(c.capability_id) ?? [],
  }));

  const order = (r: TeamRole) =>
    (r.projects.length ? 0 : 2) + (r.availability === "can_run" ? 0 : 1);
  const departments = listDepartments()
    .map((d) => ({
      name: d.name,
      roles: roles
        .filter((r) => r.department === d.name)
        .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name)),
    }))
    .filter((d) => d.roles.length > 0);

  return {
    summary: {
      total: roles.length,
      departments: departments.length,
      canRun: roles.filter((r) => r.availability === "can_run").length,
      onProjects: roles.filter((r) => r.projects.length > 0).length,
    },
    departments,
  };
}

export function filterTeam(dir: TeamDirectory, f: TeamFilter): TeamDirectory["departments"] {
  const q = f.query.trim().toLowerCase();
  return dir.departments
    .filter((d) => !f.department || d.name === f.department)
    .map((d) => ({
      name: d.name,
      roles: d.roles.filter(
        (r) =>
          (f.show === "all" ||
            (f.show === "can_run" && r.availability === "can_run") ||
            (f.show === "on_projects" && r.projects.length > 0)) &&
          (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
      ),
    }))
    .filter((d) => d.roles.length > 0);
}
