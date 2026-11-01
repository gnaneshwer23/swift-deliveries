/**
 * The signed-in home: your projects, what each needs, and which catalogue roles work on each.
 * Add starts the idea flow; delete stops a project's work and hides it (restorable).
 */
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Star,
} from "lucide-react";
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
import { DashboardHello, FirstProjectCard } from "@/components/command/first-run-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildFirstProject,
  FIRST_PROJECT_SHORT_LABELS,
  type FirstProjectSource,
} from "@/lib/pilot-mission/first-project";
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

function Meter({
  label,
  value,
  total,
  pct,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  pct: (n: number, d: number) => number;
  tone?: "waiting" | "ink";
}) {
  return (
    <li data-tone={tone}>
      <span>{label}</span>
      <b>
        {value} / {total}
      </b>
      <span className="prj-bar" role="img" aria-label={`${label}: ${value} of ${total}`}>
        <span style={{ width: `${pct(value, total)}%` }} />
      </span>
    </li>
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
  const [view, setView] = useState<"cards" | "table">("cards");

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

  const first = needsYou[0] ?? null;
  const firstPath = first ? buildFirstProject(projects.filter((p) => p.id === first.id)) : null;
  const status = needsYou.length
    ? `${needsYou.length} ${needsYou.length === 1 ? "thing needs" : "things need"} you. Everything else is moving.`
    : model.counts.active
      ? "Nothing needs you right now."
      : "Start with one or two lines about your product.";
  const pct = (n: number, d: number) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);
  const showStart = filter === "active" && !query.trim();

  const menu = (r: ProjectRow) => (
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
          <DropdownMenuItem onSelect={() => meta.mutate({ row: r, archived: false })}>
            Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link to="/command/supervised/$missionId" params={{ missionId: r.id }}>
                Open
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => meta.mutate({ row: r, favourite: !r.favourite })}>
              {r.favourite ? "Remove favourite" : "Favourite"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="prj-danger-item" onSelect={() => setConfirm(r)}>
              Delete project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const deletedNote = (r: ProjectRow) =>
    r.phase === "stopped"
      ? "Deleted · work stopped"
      : r.phase === "done"
        ? "Deleted · finished"
        : "Archived · work not stopped";

  return (
    <div className="prj">
      <DashboardHello
        status={status}
        actions={
          <button type="button" className="prj-btn prj-btn-primary" onClick={onNewProject}>
            <Plus size={16} aria-hidden="true" />
            New project
          </button>
        }
      />

      <section className="prj-bento" aria-label="At a glance">
        <section className="prj-card prj-now" aria-labelledby="prj-now-title">
          <p className="prj-eyebrow">{first ? "Needs you now" : "All clear"}</p>
          {first ? (
            <>
              <h2 id="prj-now-title" title={first.name}>
                {first.name}
              </h2>
              <p>{first.next}</p>
              {firstPath ? (
                <ol className="prj-now-path" aria-label="Project path">
                  {firstPath.steps.map((st) => (
                    <li
                      key={st.id}
                      data-state={st.done ? "done" : firstPath.next?.id === st.id ? "next" : "todo"}
                    >
                      {st.done ? <Check size={12} aria-hidden="true" /> : null}
                      {st.short}
                      <span className="prj-sr">{st.done ? " (done)" : ""}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="prj-now-actions">
                <Link
                  to="/command/supervised/$missionId"
                  params={{ missionId: first.id }}
                  className="prj-btn prj-btn-light"
                >
                  Open project
                </Link>
                {needsYou.length > 1 ? (
                  <button
                    type="button"
                    className="prj-now-more"
                    onClick={() => {
                      setFilter("needs_you");
                      setView("cards");
                    }}
                  >
                    {needsYou.length - 1} more waiting <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <h2 id="prj-now-title">Nothing waits on you</h2>
              <p>
                {model.counts.active
                  ? "The team stops and asks when a plan, decision or gate needs you."
                  : "Describe a product and the team proposes a plan for you to approve."}
              </p>
              {model.counts.active ? null : (
                <>
                  <ol className="prj-now-path" aria-label="How a project runs">
                    {FIRST_PROJECT_SHORT_LABELS.map((label, i) => (
                      <li key={label} data-state={i === 0 ? "next" : "todo"}>
                        {label}
                      </li>
                    ))}
                  </ol>
                  <div className="prj-now-actions">
                    <button type="button" className="prj-btn prj-btn-light" onClick={onNewProject}>
                      Start a project
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        <section className="prj-card" aria-labelledby="prj-usage-title">
          <p className="prj-eyebrow">Usage</p>
          <h2 id="prj-usage-title">{left !== null && usage ? `${left} units left` : "Usage"}</h2>
          {allowanceLine ? <p className="prj-card-sub">{allowanceLine}</p> : null}
          <ul className="prj-meters">
            {usage ? (
              <Meter label="Usage used" value={usage.consumed} total={usage.ceiling} pct={pct} />
            ) : null}
            <Meter
              label="Projects needing you"
              value={model.counts.needs_you}
              total={model.counts.active}
              pct={pct}
              tone="waiting"
            />
            <Meter
              label="Projects in delivery"
              value={model.counts.building}
              total={model.counts.active}
              pct={pct}
              tone="ink"
            />
          </ul>
        </section>

        <FirstProjectCard projects={projects} />
      </section>

      {error ? (
        <p className="prj-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="prj-grid">
        <section aria-labelledby="prj-list-title">
          <div className="prj-toolbar">
            <h2 id="prj-list-title">Projects</h2>
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
            <div className="prj-toolbar-end">
              <label className="prj-search">
                <Search size={15} aria-hidden="true" />
                <span className="prj-sr">Search projects</span>
                <input
                  type="search"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="prj-view" role="group" aria-label="Layout">
                <button
                  type="button"
                  aria-pressed={view === "cards"}
                  aria-label="Cards"
                  title="Cards"
                  onClick={() => setView("cards")}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  aria-pressed={view === "table"}
                  aria-label="Table"
                  title="Table"
                  onClick={() => setView("table")}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {projects.length >= PROJECT_LIST_LIMIT ? (
            <p className="prj-muted prj-cap">
              Showing your {PROJECT_LIST_LIMIT} most recently updated projects.
            </p>
          ) : null}

          {view === "cards" ? (
            rows.length || showStart ? (
              <ul className="prj-cards">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="prj-pcard"
                    data-deleted={r.deleted ? "true" : undefined}
                  >
                    <div className="prj-pcard-top">
                      <span className="prj-avatar" aria-hidden="true">
                        {initials(r.name) || "P"}
                      </span>
                      <span className="prj-phase" data-phase={r.phase}>
                        {PROJECT_PHASE_LABEL[r.phase]}
                      </span>
                      {menu(r)}
                    </div>
                    {r.deleted ? (
                      <b className="prj-pcard-name">{r.name}</b>
                    ) : (
                      <Link
                        to="/command/supervised/$missionId"
                        params={{ missionId: r.id }}
                        className="prj-pcard-name"
                      >
                        {r.favourite ? (
                          <Star size={13} className="prj-star" aria-label="Favourite" />
                        ) : null}
                        {r.name}
                      </Link>
                    )}
                    <p className="prj-pcard-next">{r.deleted ? deletedNote(r) : r.next}</p>
                    <div className="prj-pcard-foot">
                      <RoleStack roles={r.roles} />
                      <span className="prj-muted">Updated {updated(r.updatedAt)}</span>
                    </div>
                  </li>
                ))}
                {showStart ? (
                  <li className="prj-pcard prj-pcard-new">
                    <button type="button" onClick={onNewProject}>
                      <span className="prj-avatar" aria-hidden="true">
                        <Plus size={16} />
                      </span>
                      <b>Start a project</b>
                      <span className="prj-muted">One or two lines is enough</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : (
              <p className="prj-empty">Nothing here.</p>
            )
          ) : rows.length ? (
            <div className="prj-panel">
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
                        <span className="prj-next">{r.deleted ? deletedNote(r) : r.next}</span>
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
                        {menu(r)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="prj-empty">
              {showStart ? (
                <button type="button" className="prj-btn prj-btn-primary" onClick={onNewProject}>
                  Start your first project
                </button>
              ) : (
                <p>Nothing here.</p>
              )}
            </div>
          )}
        </section>

        <aside className="prj-card prj-team" aria-labelledby="prj-team-title">
          <p className="prj-eyebrow">Your AI team</p>
          <h2 id="prj-team-title">
            {model.team.onProjects} role{model.team.onProjects === 1 ? "" : "s"} on your projects
          </h2>
          <p className="prj-card-sub">
            {model.team.runnable} of {model.team.total} roles can run today.
          </p>
          <ul className="prj-meters">
            {model.team.byDepartment
              .filter((d) => d.onProjects.length)
              .slice(0, 5)
              .map((d) => (
                <li key={d.name}>
                  <span>{d.name}</span>
                  <b>
                    {d.onProjects.length} / {d.total}
                  </b>
                  <span
                    className="prj-bar"
                    role="img"
                    aria-label={`${d.onProjects.length} of ${d.total} roles on your projects`}
                  >
                    <span style={{ width: `${pct(d.onProjects.length, d.total)}%` }} />
                  </span>
                </li>
              ))}
          </ul>
          <div className="prj-team-links">
            <Dialog>
              <DialogTrigger className="prj-card-link">
                See all {model.team.departments} departments{" "}
                <ArrowRight size={14} aria-hidden="true" />
              </DialogTrigger>
              <DialogContent className="prj-dialog">
                <DialogHeader>
                  <DialogTitle>Your AI team</DialogTitle>
                  <DialogDescription>
                    Each project gets only the roles it needs. Planned roles never count as working.
                  </DialogDescription>
                </DialogHeader>
                <ul className="prj-depts">
                  {model.team.byDepartment.map((d) => (
                    <li key={d.name}>
                      <div className="prj-dept-row">
                        <span>{d.name}</span>
                        <span className="prj-muted">
                          {d.onProjects.length} on projects · {d.runnable} can run · {d.total} roles
                        </span>
                      </div>
                      {d.onProjects.length ? (
                        <p className="prj-dept-roles">
                          {d.onProjects.map((r) => r.name).join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <Link to="/command/capabilities" className="prj-link">
                  Browse every role
                </Link>
              </DialogContent>
            </Dialog>
          </div>
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
