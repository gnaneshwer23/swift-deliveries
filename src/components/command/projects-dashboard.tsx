/**
 * The signed-in home: your projects, what each needs, and which catalogue roles work on each.
 * Add starts the idea flow; delete stops a project's work and hides it (restorable).
 */
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Plus, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteSupervisedProject, saveSupervisedStudioMeta } from "@/lib/pilot-mission.functions";
import {
  buildProjectsDashboard,
  filterProjects,
  PROJECT_FILTERS,
  PROJECT_LIST_LIMIT,
  PROJECT_PHASE_LABEL,
  type ProjectFilter,
  type ProjectRole,
  type ProjectRow,
  type ProjectSource,
} from "@/lib/pilot-mission/projects-dashboard";
import { FirstRunPanel } from "@/components/command/first-run-panel";
import type { FirstProjectSource } from "@/lib/pilot-mission/first-project";
import "@/styles/projects-dashboard.css";

const updated = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function initials(name: string): string {
  return name
    .split(/[\s&/-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function RoleStack({ roles }: { roles: ProjectRole[] }) {
  if (!roles.length) return <span className="prj-muted">Assigned at plan approval</span>;
  const shown = roles.slice(0, 4);
  return (
    <span className="prj-roles" title={roles.map((r) => r.name).join("\n")}>
      <span className="prj-role-stack" aria-hidden="true">
        {shown.map((r) => (
          <span key={r.id} className="prj-role-chip">
            {initials(r.name)}
          </span>
        ))}
      </span>
      <span>
        {roles.length} role{roles.length === 1 ? "" : "s"}
      </span>
    </span>
  );
}

export function ProjectsDashboard({
  projects,
  usage,
  allowanceLine,
  onNewProject,
}: {
  projects: Array<ProjectSource & FirstProjectSource>;
  usage: { consumed: number; ceiling: number } | null;
  allowanceLine: string | null;
  onNewProject: () => void;
}) {
  const qc = useQueryClient();
  const model = useMemo(() => buildProjectsDashboard(projects), [projects]);
  const [filter, setFilter] = useState<ProjectFilter>("active");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<ProjectRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rows = filterProjects(model.rows, filter, query);
  const needsYou = model.rows.filter((r) => !r.deleted && r.phase === "needs_you");
  const idleDepartments = model.team.byDepartment.filter((d) => !d.onProjects.length);

  const refresh = () => qc.invalidateQueries({ queryKey: ["supervised"] });
  const onError = (e: unknown) => {
    setError(e instanceof Error ? e.message : "That change could not be saved.");
    // Reload so a retry uses each project's current version.
    void refresh();
  };
  const remove = useMutation({
    mutationFn: (r: ProjectRow) =>
      deleteSupervisedProject({ data: { id: r.id, expectedVersion: r.version } }),
    onSuccess: () => {
      setError(null);
      void refresh();
    },
    onError,
  });
  const meta = useMutation({
    mutationFn: (input: { row: ProjectRow; favourite?: boolean; archived?: boolean }) =>
      saveSupervisedStudioMeta({
        data: {
          id: input.row.id,
          expectedVersion: input.row.version,
          ...(input.favourite !== undefined ? { favourite: input.favourite } : {}),
          ...(input.archived !== undefined ? { archived: input.archived } : {}),
        },
      }),
    onSuccess: () => {
      setError(null);
      void refresh();
    },
    onError,
  });
  const busy = remove.isPending || meta.isPending;
  const left = usage ? Math.max(0, usage.ceiling - usage.consumed) : null;

  return (
    <div className="prj">
      <header className="prj-head">
        <div>
          <h1>Projects</h1>
          <p>Every product you are building, what it needs from you, and who is working on it.</p>
        </div>
        <button type="button" className="prj-btn prj-btn-primary" onClick={onNewProject}>
          <Plus size={16} aria-hidden="true" />
          New project
        </button>
      </header>

      <FirstRunPanel projects={projects} />

      <section className="prj-stats" aria-label="Summary">
        <div>
          <span>Live projects</span>
          <b>{model.counts.active}</b>
        </div>
        <div data-tone={model.counts.needs_you ? "waiting" : undefined}>
          <span>Need you</span>
          <b>{model.counts.needs_you}</b>
        </div>
        <div>
          <span>In delivery</span>
          <b>{model.counts.building}</b>
        </div>
        <div>
          <span>Usage left</span>
          <b>{left !== null && usage ? `${left} / ${usage.ceiling}` : "—"}</b>
          {allowanceLine ? <small>{allowanceLine}</small> : null}
        </div>
      </section>

      {needsYou.length ? (
        <section className="prj-panel prj-needs" aria-labelledby="prj-needs-title">
          <h2 id="prj-needs-title">Waiting on you</h2>
          <ul>
            {needsYou.slice(0, 4).map((r) => (
              <li key={r.id}>
                <div>
                  <b>{r.name}</b>
                  <span>{r.next}</span>
                </div>
                <Link
                  to="/command/supervised/$missionId"
                  params={{ missionId: r.id }}
                  className="prj-btn prj-btn-small"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="prj-grid">
        <section className="prj-panel" aria-labelledby="prj-list-title">
          <div className="prj-toolbar">
            <h2 id="prj-list-title" className="prj-sr">
              Project list
            </h2>
            <div className="prj-tabs" role="group" aria-label="Filter projects">
              {PROJECT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  className="prj-tab"
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span>{model.counts[f.id]}</span>
                </button>
              ))}
            </div>
            <label className="prj-search">
              <Search size={15} aria-hidden="true" />
              <span className="prj-sr">Search projects</span>
              <input
                type="search"
                placeholder="Search projects"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          {error ? (
            <p className="prj-error" role="alert">
              {error}
            </p>
          ) : null}

          {projects.length >= PROJECT_LIST_LIMIT ? (
            <p className="prj-muted prj-cap">
              Showing your {PROJECT_LIST_LIMIT} most recently updated projects.
            </p>
          ) : null}

          {rows.length ? (
            <table className="prj-table" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader">
                    Project
                  </th>
                  <th scope="col" role="columnheader">
                    Status
                  </th>
                  <th scope="col" role="columnheader">
                    Team
                  </th>
                  <th scope="col" role="columnheader">
                    Updated
                  </th>
                  <th scope="col" role="columnheader">
                    <span className="prj-sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {rows.map((r) => (
                  <tr role="row" key={r.id} data-deleted={r.deleted ? "true" : undefined}>
                    <td role="cell">
                      {r.deleted ? (
                        <b className="prj-name">{r.name}</b>
                      ) : (
                        <Link
                          to="/command/supervised/$missionId"
                          params={{ missionId: r.id }}
                          className="prj-name"
                        >
                          {r.favourite ? (
                            <Star size={13} className="prj-star" aria-label="Favourite" />
                          ) : null}
                          {r.name}
                        </Link>
                      )}
                      <span className="prj-next">
                        {r.deleted
                          ? r.phase === "stopped"
                            ? "Deleted · work stopped"
                            : r.phase === "done"
                              ? "Deleted · finished"
                              : "Archived · work not stopped"
                          : r.next}
                      </span>
                    </td>
                    <td role="cell" data-label="Status">
                      <span className="prj-phase" data-phase={r.phase}>
                        {PROJECT_PHASE_LABEL[r.phase]}
                      </span>
                    </td>
                    <td role="cell" data-label="Team">
                      <RoleStack roles={r.roles} />
                    </td>
                    <td role="cell" data-label="Updated" className="prj-muted">
                      {updated(r.updatedAt)}
                    </td>
                    <td role="cell" className="prj-actions">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="prj-icon-btn"
                          aria-label={`Actions for ${r.name}`}
                          disabled={busy}
                        >
                          <MoreHorizontal size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {r.deleted ? (
                            <DropdownMenuItem
                              onSelect={() => meta.mutate({ row: r, archived: false })}
                            >
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  to="/command/supervised/$missionId"
                                  params={{ missionId: r.id }}
                                >
                                  Open
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => meta.mutate({ row: r, favourite: !r.favourite })}
                              >
                                {r.favourite ? "Remove favourite" : "Favourite"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="prj-danger-item"
                                onSelect={() => setConfirm(r)}
                              >
                                Delete project
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="prj-empty">
              {filter === "active" && !query ? (
                <>
                  <p>No projects yet.</p>
                  <button type="button" className="prj-btn prj-btn-primary" onClick={onNewProject}>
                    Start your first project
                  </button>
                </>
              ) : (
                <p>Nothing here.</p>
              )}
            </div>
          )}
        </section>

        <aside className="prj-panel prj-team" aria-labelledby="prj-team-title">
          <h2 id="prj-team-title">Your AI team</h2>
          <p className="prj-team-sum">
            <b>{model.team.total}</b> roles across <b>{model.team.departments}</b> departments.{" "}
            <b>{model.team.runnable}</b> can run today; the rest are planned.
          </p>
          <p className="prj-muted">
            Each project gets only the roles it needs. {model.team.onProjects} role
            {model.team.onProjects === 1 ? " is" : "s are"} on your live projects.
          </p>
          <ul className="prj-depts">
            {model.team.byDepartment
              .filter((d) => d.onProjects.length)
              .map((d) => (
                <li key={d.name}>
                  <div className="prj-dept-row">
                    <span>{d.name}</span>
                    <span className="prj-muted">
                      {d.onProjects.length} of {d.total}
                    </span>
                  </div>
                  <span
                    className="prj-bar"
                    role="img"
                    aria-label={`${d.onProjects.length} of ${d.total} roles on your projects`}
                  >
                    <span style={{ width: `${(d.onProjects.length / d.total) * 100}%` }} />
                  </span>
                  <p className="prj-dept-roles">{d.onProjects.map((r) => r.name).join(" · ")}</p>
                </li>
              ))}
          </ul>
          {idleDepartments.length ? (
            <details className="prj-idle">
              <summary>
                {idleDepartments.length} more department{idleDepartments.length === 1 ? "" : "s"}{" "}
                not on your projects yet
              </summary>
              <ul>
                {idleDepartments.map((d) => (
                  <li key={d.name}>
                    <span>{d.name}</span>
                    <span className="prj-muted">
                      {d.total} roles{d.runnable ? ` · ${d.runnable} can run` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <Link to="/command/capabilities" className="prj-link">
            Browse every role
          </Link>
        </aside>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirm?.name}” — any work on it stops now and it leaves your dashboard. Its saved
              records are kept, so you can restore it from Deleted, but stopped work does not
              restart on its own.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep project</AlertDialogCancel>
            <AlertDialogAction
              className="prj-btn-danger"
              onClick={() => {
                if (confirm) remove.mutate(confirm);
                setConfirm(null);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
