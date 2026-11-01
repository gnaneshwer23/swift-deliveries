/**
 * AI team — every catalogue role, what it does, whether it can run today and which of your
 * projects it works on. Planned roles are listed honestly and never shown as working.
 */
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProjectSource } from "@/lib/pilot-mission/projects-dashboard";
import {
  buildTeamDirectory,
  filterTeam,
  ROLE_AVAILABILITY_LABEL,
  type TeamFilter,
} from "@/lib/pilot-mission/team-directory";
import "@/styles/projects-dashboard.css";

const SHOW: Array<{ id: TeamFilter["show"]; label: string }> = [
  { id: "all", label: "All roles" },
  { id: "on_projects", label: "On your projects" },
  { id: "can_run", label: "Can run today" },
];

export function TeamDirectory({ projects }: { projects: ProjectSource[] }) {
  const dir = useMemo(() => buildTeamDirectory(projects), [projects]);
  const [filter, setFilter] = useState<TeamFilter>({
    query: "",
    department: "",
    show: dir.summary.onProjects ? "on_projects" : "all",
  });
  const groups = filterTeam(dir, filter);
  const shown = groups.reduce((n, g) => n + g.roles.length, 0);

  return (
    <div className="sx">
      <div className="prj">
        <header className="prj-head">
          <div>
            <h1>AI team</h1>
            <p>
              The roles that can work on your projects. Each project gets only the roles it needs.
            </p>
          </div>
          <Link to="/command" hash="new-project" className="prj-btn prj-btn-primary">
            New project
          </Link>
        </header>

        <section className="prj-stats" aria-label="Team summary">
          <div>
            <span>Roles</span>
            <b>{dir.summary.total}</b>
            <small>{dir.summary.departments} departments</small>
          </div>
          <div>
            <span>Can run today</span>
            <b>{dir.summary.canRun}</b>
            <small>The rest are planned</small>
          </div>
          <div>
            <span>On your projects</span>
            <b>{dir.summary.onProjects}</b>
            <small>Live projects only</small>
          </div>
          <div>
            <span>Who decides</span>
            <b>You</b>
            <small>Roles draft; you approve</small>
          </div>
        </section>

        <section className="prj-panel" aria-labelledby="team-list-title">
          <h2 id="team-list-title" className="prj-sr">
            Roles
          </h2>
          <div className="prj-toolbar">
            <div className="prj-tabs" role="group" aria-label="Show">
              {SHOW.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={filter.show === s.id}
                  className="prj-tab"
                  onClick={() => setFilter((f) => ({ ...f, show: s.id }))}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="team-filters">
              <label className="prj-search">
                <span className="prj-sr">Department</span>
                <select
                  value={filter.department}
                  onChange={(e) => setFilter((f) => ({ ...f, department: e.target.value }))}
                >
                  <option value="">All departments</option>
                  {dir.departments.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="prj-search">
                <Search size={15} aria-hidden="true" />
                <span className="prj-sr">Search roles</span>
                <input
                  type="search"
                  placeholder="Search roles"
                  value={filter.query}
                  onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
                />
              </label>
            </div>
          </div>

          <p className="prj-muted prj-cap" role="status">
            {shown} role{shown === 1 ? "" : "s"}
          </p>

          {groups.length ? (
            groups.map((g) => (
              <section key={g.name} className="team-dept" aria-label={g.name}>
                <h3>{g.name}</h3>
                <ul className="team-grid">
                  {g.roles.map((r) => (
                    <li key={r.id} className="team-card" data-availability={r.availability}>
                      <div className="team-card-top">
                        <b>{r.name}</b>
                        <span className="team-badge" data-availability={r.availability}>
                          {ROLE_AVAILABILITY_LABEL[r.availability]}
                        </span>
                      </div>
                      <p>{r.description}</p>
                      {r.projects.length ? (
                        <p className="team-on">
                          On:{" "}
                          {r.projects.map((p, i) => (
                            <span key={p.id}>
                              {i ? ", " : ""}
                              <Link
                                to="/command/supervised/$missionId"
                                params={{ missionId: p.id }}
                              >
                                {p.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <div className="prj-empty">
              <p>
                {filter.show === "on_projects"
                  ? "No roles are on a live project yet. Start a project and the team is picked for it."
                  : "No roles match."}
              </p>
            </div>
          )}
        </section>
        <p className="prj-muted prj-cap">
          Planned roles are listed so you can see what’s coming; they never run on a project. Until
          model mode is switched on, roles that can run produce clearly labelled simulated drafts.
        </p>
      </div>
    </div>
  );
}
