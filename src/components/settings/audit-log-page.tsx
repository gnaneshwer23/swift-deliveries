/**
 * Settings → Audit log. What needs you comes first (waiting on you, then stalled), then every
 * saved event across your projects, newest first, with filters and a CSV download. Every row
 * is read from a project's own record; anything the record no longer holds is said plainly.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ACTIVITY_KEPT,
  AUDIT_CATEGORY_LABEL,
  auditCsv,
  buildAuditLog,
  filterAudit,
  NO_FILTERS,
  type AuditCategory,
  type AuditFilters,
} from "@/lib/audit/audit-log";
import { getMyAuditLog } from "@/lib/pilot-mission.functions";
import { HIDDEN_KINDS } from "@/lib/pilot-mission/activity-feed";
import {
  buildProjectsDashboard,
  PROJECT_LIST_LIMIT,
  STALL_DAYS,
} from "@/lib/pilot-mission/projects-dashboard";
import "@/styles/audit-log.css";

const PAGE = 100;

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function download(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deliverx-audit-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AuditLogPage() {
  const q = useQuery({ queryKey: ["audit", "mine"], queryFn: () => getMyAuditLog() });
  const [filters, setFilters] = useState<AuditFilters>(NO_FILTERS);
  const [shown, setShown] = useState(PAGE);

  const projects = useMemo(() => (q.data?.ready ? q.data.projects : []), [q.data]);
  const log = useMemo(() => buildAuditLog(projects), [projects]);
  const attention = useMemo(() => {
    const rows = buildProjectsDashboard(
      // Housekeeping saves are not work, so they never make a project look active.
      projects.map((p) => ({
        ...p,
        recentActivity: p.activity.filter((e) => !HIDDEN_KINDS.has(e.kind)),
      })),
    ).rows.filter((r) => !r.deleted);
    return {
      waiting: rows.filter((r) => r.phase === "needs_you"),
      stalled: rows.filter((r) => r.stalled && r.phase !== "needs_you"),
    };
  }, [projects]);
  const visible = useMemo(() => filterAudit(log.entries, filters), [log, filters]);
  const set = <K extends keyof AuditFilters>(k: K, v: AuditFilters[K]) => {
    setShown(PAGE);
    setFilters((f) => ({ ...f, [k]: v }));
  };
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  return (
    <div className="pf-body">
      <header className="st-head">
        <h1>Audit log</h1>
        <p>Everything saved on your projects, newest first. What needs you comes first.</p>
      </header>

      {q.isLoading ? (
        <div className="st-skeleton" aria-hidden="true">
          <span />
          <span />
        </div>
      ) : q.isError || !q.data || !q.data.ready ? (
        <section className="pf-card" role="alert">
          <h2>The audit log couldn’t be loaded</h2>
          <p className="pf-muted">
            {q.data && !q.data.ready && q.data.reason ? q.data.reason : "Try again in a moment."}
          </p>
          <div className="pf-actions st-actions-left">
            <button type="button" className="pf-btn" onClick={() => void q.refetch()}>
              <RefreshCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="pf-card al-attention" aria-labelledby="al-attention">
            <h2 id="al-attention">Needs attention</h2>
            {attention.waiting.length || attention.stalled.length ? (
              <div className="al-attention-grid">
                <div>
                  <h3>Waiting on you · {attention.waiting.length}</h3>
                  {attention.waiting.length ? (
                    <ul>
                      {attention.waiting.map((r) => (
                        <li key={r.id}>
                          <Link
                            to="/command/supervised/$missionId"
                            params={{ missionId: r.id }}
                            className="pf-link"
                          >
                            {r.name}
                          </Link>
                          <span>{r.next}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-muted">Nothing.</p>
                  )}
                </div>
                <div>
                  <h3>Stalled · {attention.stalled.length}</h3>
                  {attention.stalled.length ? (
                    <ul>
                      {attention.stalled.map((r) => (
                        <li key={r.id}>
                          <Link
                            to="/command/supervised/$missionId"
                            params={{ missionId: r.id }}
                            className="pf-link"
                          >
                            {r.name}
                          </Link>
                          <span>Quiet for {r.quietDays} days</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-muted">Nothing quiet for {STALL_DAYS} days or more.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="pf-muted">Nothing is waiting on you and nothing has stalled.</p>
            )}
          </section>

          <section className="pf-card" aria-labelledby="al-events">
            <div className="al-events-head">
              <h2 id="al-events">
                Events <span className="al-count">{visible.length}</span>
              </h2>
              <button
                type="button"
                className="pf-btn"
                disabled={!visible.length}
                onClick={() => download(auditCsv(visible))}
              >
                <Download size={14} aria-hidden="true" />
                Download CSV{filtered ? " (filtered)" : ""}
              </button>
            </div>

            <div className="al-filters" role="group" aria-label="Filter events">
              <label className="al-search">
                <Search size={14} aria-hidden="true" />
                <span className="prj-sr">Search events</span>
                <input
                  type="search"
                  placeholder="Search"
                  value={filters.query}
                  onChange={(e) => set("query", e.target.value)}
                />
              </label>
              <label>
                <span className="prj-sr">Project</span>
                <select
                  value={filters.projectId ?? ""}
                  onChange={(e) => set("projectId", e.target.value || null)}
                >
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.length > 48 ? `${p.name.slice(0, 47)}…` : p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="prj-sr">Who</span>
                <select
                  value={filters.by ?? ""}
                  onChange={(e) => set("by", (e.target.value || null) as AuditFilters["by"])}
                >
                  <option value="">Everyone</option>
                  <option value="you">You</option>
                  <option value="team">The team</option>
                </select>
              </label>
              <label>
                <span className="prj-sr">Category</span>
                <select
                  value={filters.category ?? ""}
                  onChange={(e) =>
                    set("category", (e.target.value || null) as AuditCategory | null)
                  }
                >
                  <option value="">All categories</option>
                  {(Object.keys(AUDIT_CATEGORY_LABEL) as AuditCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {AUDIT_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="al-date">
                <span>From</span>
                <input
                  type="date"
                  value={filters.from ?? ""}
                  onChange={(e) => set("from", e.target.value || null)}
                />
              </label>
              <label className="al-date">
                <span>To</span>
                <input
                  type="date"
                  value={filters.to ?? ""}
                  onChange={(e) => set("to", e.target.value || null)}
                />
              </label>
              {filtered ? (
                <button
                  type="button"
                  className="pf-link-btn"
                  onClick={() => {
                    setShown(PAGE);
                    setFilters(NO_FILTERS);
                  }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {log.truncatedProjects.length || projects.length >= PROJECT_LIST_LIMIT ? (
              <ul className="al-notes">
                {projects.length >= PROJECT_LIST_LIMIT ? (
                  <li>Covers your {PROJECT_LIST_LIMIT} most recently updated projects.</li>
                ) : null}
                {log.truncatedProjects.length ? (
                  <li>
                    Each project keeps its latest {ACTIVITY_KEPT} events, so older events are no
                    longer stored for: {log.truncatedProjects.join(", ")}.
                  </li>
                ) : null}
              </ul>
            ) : null}

            {visible.length ? (
              <>
                <div className="st-table-wrap">
                  <table className="st-table al-table">
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">Project</th>
                        <th scope="col">Who</th>
                        <th scope="col">What happened</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.slice(0, shown).map((e) => (
                        <tr key={e.key}>
                          <td>
                            <time dateTime={e.at}>{when(e.at)}</time>
                          </td>
                          <td className="al-project">
                            <Link
                              to="/command/supervised/$missionId"
                              params={{ missionId: e.projectId }}
                              className="pf-link"
                            >
                              {e.projectName}
                            </Link>
                          </td>
                          <td>
                            <span className="st-pill" data-tone={e.by === "you" ? "ok" : "muted"}>
                              {e.who}
                            </span>
                          </td>
                          <td className="al-what">
                            {e.what}
                            <span className="al-cat">{AUDIT_CATEGORY_LABEL[e.category]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {visible.length > shown ? (
                  <div className="pf-actions st-actions-left">
                    <button
                      type="button"
                      className="pf-btn"
                      onClick={() => setShown((n) => n + PAGE)}
                    >
                      Show {Math.min(PAGE, visible.length - shown)} more
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="pf-muted">
                {log.entries.length
                  ? "No events match these filters."
                  : "Nothing has been saved on your projects yet."}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
