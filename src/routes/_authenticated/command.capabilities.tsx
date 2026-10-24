import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Bot, ChevronRight, ShieldCheck } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import { WorkforceMap } from "@/components/command/workforce-map";
import { WorkforceInvolvement } from "@/components/command/workforce-involvement";
import {
  listCapabilities,
  listDepartments,
  listInfrastructureServices,
} from "@/lib/workforce/registry";

export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Agents & capabilities — DeliverX" },
      {
        name: "description",
        content:
          "Explore specialist contributions, capability availability and recorded mission involvement.",
      },
    ],
  }),
  component: CapabilitiesBrowser,
});
function CapabilitiesBrowser() {
  const capabilities = listCapabilities();
  const departments = listDepartments();
  const infra = listInfrastructureServices();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");
  const [group, setGroup] = useState<number[] | null>(null);
  const [selected, setSelected] = useState(capabilities[0]!.capability_id);
  const directory = useRef<HTMLElement>(null);
  const detail = useRef<HTMLElement>(null);
  const filtered = useMemo(
    () =>
      capabilities.filter(
        (c) =>
          (status === "all" || c.lifecycle_status === status) &&
          (dept === "all" || c.department_number === Number(dept)) &&
          (!group || group.includes(c.department_number)) &&
          `${c.capability_id} ${c.name} ${c.department} ${c.description}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [capabilities, status, dept, group, query],
  );
  const role = filtered.find((c) => c.capability_id === selected) ?? filtered[0];
  const available = capabilities.filter((c) => c.lifecycle_status === "available").length;
  return (
    <CommandShell
      title="Agents & capabilities"
      subtitle="See how specialists contribute, what is available, and where work stands."
    >
      <section className="ps-stat-row" aria-label="Capability registry summary">
        <div className="ps-stat">
          <span>Specialist roles</span>
          <strong>{capabilities.length}</strong>
          <small>A lifecycle-wide catalogue</small>
        </div>
        <div className="ps-stat">
          <span>Available for planning</span>
          <strong>{available}</strong>
          <small>Execution mode is configured per environment</small>
        </div>
        <div className="ps-stat">
          <span>Planned roles</span>
          <strong>{capabilities.filter((c) => c.lifecycle_status === "planned").length}</strong>
          <small>Cannot be assigned to missions</small>
        </div>
        <div className="ps-stat">
          <span>Departments</span>
          <strong>{departments.length}</strong>
          <small>Connected by shared product context</small>
        </div>
      </section>
      <WorkforceMap
        onSelectRole={(id) => {
          setSelected(id);
          setGroup(null);
          setDept("all");
          setQuery(id);
          setStatus("all");
          directory.current?.scrollIntoView({ behavior: "instant", block: "start" });
        }}
        onExplore={(numbers) => {
          setGroup(numbers);
          setDept("all");
          setQuery("");
          setStatus("all");
          directory.current?.scrollIntoView({ behavior: "instant", block: "start" });
        }}
      />
      <WorkforceInvolvement />
      <section ref={directory} id="role-directory" style={{ scrollMarginTop: 20 }}>
        <div className="ps-section-heading">
          <div>
            <h2>Specialist directory</h2>
            <p>Select a role to inspect its purpose, limits and permissions.</p>
          </div>
          <span className="ps-pill">
            {filtered.length} of {capabilities.length} roles
          </span>
        </div>
        <div className="ps-filterbar">
          <div style={{ flex: 2 }}>
            <label htmlFor="cap-q">Search specialists</label>
            <input
              id="cap-q"
              placeholder="Search role, department or DX identifier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cap-status">Capability status</label>
            <select id="cap-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {[
                "all",
                "available",
                "planned",
                "testing",
                "draft",
                "implementing",
                "suspended",
                "retired",
              ].map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s[0]!.toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cap-dept">Department</label>
            <select
              id="cap-dept"
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setGroup(null);
              }}
            >
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d.number} value={d.number}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(group || query || status !== "all" || dept !== "all") && (
          <button
            className="cc-btn cc-btn-secondary"
            style={{ marginBottom: 15 }}
            onClick={() => {
              setGroup(null);
              setQuery("");
              setStatus("all");
              setDept("all");
            }}
          >
            Reset filters{group ? " · contribution group selected" : ""}
          </button>
        )}
        <div className="ps-directory-layout">
          <div className="ps-role-list">
            {filtered.length === 0 ? (
              <div className="ps-empty">
                No roles match these filters. Try another term or reset the filters.
              </div>
            ) : (
              filtered.slice(0, visibleCount).map((c) => (
                <button
                  key={c.capability_id}
                  className="ps-role-row"
                  aria-pressed={role?.capability_id === c.capability_id}
                  onClick={() => {
                    setSelected(c.capability_id);
                    if (window.innerWidth < 961)
                      detail.current?.scrollIntoView({ behavior: "instant", block: "start" });
                  }}
                >
                  <span className="ps-role-avatar">
                    <Bot size={17} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.capability_id} · {c.department}
                    </small>
                  </div>
                  <span className="ps-pill" data-state={c.lifecycle_status}>
                    {c.lifecycle_status}
                  </span>
                  <ChevronRight size={13} />
                </button>
              ))
            )}
            {filtered.length > visibleCount && (
              <button className="ps-load-more" onClick={() => setVisibleCount((n) => n + 24)}>
                Show more roles ({filtered.length - visibleCount} remaining)
              </button>
            )}
          </div>
          {role && (
            <aside
              ref={detail}
              className="ps-role-detail"
              aria-label="Selected specialist details"
              style={{ scrollMarginTop: 20 }}
            >
              <span className="ps-role-avatar">
                <Bot size={22} />
              </span>
              <h3>{role.name}</h3>
              <span className="ps-pill" data-state={role.lifecycle_status}>
                {role.lifecycle_status === "available"
                  ? "Available for planning"
                  : role.lifecycle_status}
              </span>
              <p style={{ marginTop: 15 }}>{role.description}</p>
              <dl>
                <div>
                  <dt>Identifier</dt>
                  <dd>{role.capability_id}</dd>
                </div>
                <div>
                  <dt>Permission ceiling</dt>
                  <dd>{role.permission_profile.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Implementation</dt>
                  <dd>{role.implementation_type.replaceAll("_", " ")}</dd>
                </div>
                <div>
                  <dt>Maximum runtime</dt>
                  <dd>{role.limits.max_runtime_seconds}s</dd>
                </div>
                <div>
                  <dt>Maximum usage</dt>
                  <dd>{role.limits.max_usage_credits} units</dd>
                </div>
              </dl>
              <h4>Known limitations</h4>
              <ul>
                {role.known_limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h4>Evaluation notes</h4>
              <p>{role.evaluation_notes}</p>
              <p style={{ marginTop: 18 }}>
                {role.lifecycle_status === "available"
                  ? "Availability permits planning. It does not confirm a live model or current activity."
                  : "Catalogue entry only. This role cannot be assigned until it is available."}
              </p>
            </aside>
          )}
        </div>
      </section>
      <details className="ps-legacy">
        <summary>
          <ShieldCheck size={14} style={{ display: "inline", marginRight: 8 }} />
          Permission, budget and audit services
        </summary>
        <section className="cc-panel">
          <p className="ps-subtle">
            These deterministic services enforce controls. They are not specialist agents.
          </p>
          <div className="ps-service-grid">
            {infra.map((s) => (
              <div key={s.service_id}>
                <h3>{s.name}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      </details>
    </CommandShell>
  );
}
