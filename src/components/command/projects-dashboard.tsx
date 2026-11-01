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
  PROJECT_PHASE_LABEL,
  type ProjectFilter,
  type ProjectRole,
  type ProjectRow,
  type ProjectSource,
} from "@/lib/pilot-mission/projects-dashboard";
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
  if (!roles.length) return <span className="pd-muted">Assigned at plan approval</span>;
  const shown = roles.slice(0, 4);
  return (
    <span className="pd-roles" title={roles.map((r) => r.name).join("\n")}>
      <span className="pd-role-stack" aria-hidden="true">
        {shown.map((r) => (
          <span key={r.id} className="pd-role-chip">
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
  projects: ProjectSource[];
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
  const onError = (e: unknown) =>
    setError(e instanceof Error ? e.message : "That change could not be saved.");
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
    <div className="pd">
      <header className="pd-head">
        <div>
          <h1>Projects</h1>
          <p>Every product you are building, what it needs from you, and who is working on it.</p>
        </div>
        <button type="button" className="pd-btn pd-btn-primary" onClick={onNewProject}>
          <Plus size={16} aria-hidden="true" />
          New project
        </button>
      </header>

      <section className="pd-stats" aria-label="Summary">
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
        <section className="pd-panel pd-needs" aria-labelledby="pd-needs-title">
          <h2 id="pd-needs-title">Waiting on you</h2>
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
                  className="pd-btn pd-btn-small"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="pd-grid">
        <section className="pd-panel" aria-labelledby="pd-list-title">
          <div className="pd-toolbar">
            <h2 id="pd-list-title" className="pd-sr">
              Project list
            </h2>
            <div className="pd-tabs" role="group" aria-label="Filter projects">
              {PROJECT_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  className="pd-tab"
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                  <span>{model.counts[f.id]}</span>
                </button>
              ))}
            </div>
            <label className="pd-search">
              <Search size={15} aria-hidden="true" />
              <span className="pd-sr">Search projects</span>
              <input
                type="search"
                placeholder="Search projects"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          {error ? (
            <p className="pd-error" role="alert">
              {error}
            </p>
          ) : null}

          {rows.length ? (
            <table className="pd-table">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Status</th>
                  <th scope="col">Team</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="pd-sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} data-deleted={r.deleted ? "true" : undefined}>
                    <td>
                      {r.deleted ? (
                        <b className="pd-name">{r.name}</b>
                      ) : (
                        <Link
                          to="/command/supervised/$missionId"
                          params={{ missionId: r.id }}
                          className="pd-name"
                        >
                          {r.favourite ? (
                            <Star size={13} className="pd-star" aria-label="Favourite" />
                          ) : null}
                          {r.name}
                        </Link>
                      )}
                      <span className="pd-next">
                        {r.deleted ? "Deleted · work stopped" : r.next}
                      </span>
                    </td>
                    <td>
                      <span className="pd-phase" data-phase={r.phase}>
                        {PROJECT_PHASE_LABEL[r.phase]}
                      </span>
                    </td>
                    <td>
                      <RoleStack roles={r.roles} />
                    </td>
                    <td className="pd-muted">{updated(r.updatedAt)}</td>
                    <td className="pd-actions">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="pd-icon-btn"
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
                                className="pd-danger-item"
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
            <div className="pd-empty">
              {filter === "active" && !query ? (
                <>
                  <p>No projects yet.</p>
                  <button type="button" className="pd-btn pd-btn-primary" onClick={onNewProject}>
                    Start your first project
                  </button>
                </>
              ) : (
                <p>Nothing here.</p>
              )}
            </div>
          )}
        </section>

        <aside className="pd-panel pd-team" aria-labelledby="pd-team-title">
          <h2 id="pd-team-title">Your AI team</h2>
          <p className="pd-team-sum">
            <b>{model.team.total}</b> roles across <b>{model.team.departments}</b> departments.{" "}
            <b>{model.team.runnable}</b> can run today; the rest are planned.
          </p>
          <p className="pd-muted">
            Each project gets only the roles it needs. {model.team.onProjects} role
            {model.team.onProjects === 1 ? " is" : "s are"} on your live projects.
          </p>
          <ul className="pd-depts">
            {model.team.byDepartment
              .filter((d) => d.onProjects.length)
              .map((d) => (
                <li key={d.name}>
                  <div className="pd-dept-row">
                    <span>{d.name}</span>
                    <span className="pd-muted">
                      {d.onProjects.length} of {d.total}
                    </span>
                  </div>
                  <span
                    className="pd-bar"
                    role="img"
                    aria-label={`${d.onProjects.length} of ${d.total} roles on your projects`}
                  >
                    <span style={{ width: `${(d.onProjects.length / d.total) * 100}%` }} />
                  </span>
                  <p className="pd-dept-roles">{d.onProjects.map((r) => r.name).join(" · ")}</p>
                </li>
              ))}
          </ul>
          {idleDepartments.length ? (
            <details className="pd-idle">
              <summary>
                {idleDepartments.length} more department{idleDepartments.length === 1 ? "" : "s"}{" "}
                not on your projects yet
              </summary>
              <ul>
                {idleDepartments.map((d) => (
                  <li key={d.name}>
                    <span>{d.name}</span>
                    <span className="pd-muted">
                      {d.total} roles{d.runnable ? ` · ${d.runnable} can run` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <Link to="/command/capabilities" className="pd-link">
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
              className="pd-btn-danger"
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
