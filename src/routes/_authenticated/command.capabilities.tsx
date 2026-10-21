import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import {
  isOperational,
  listCapabilities,
  listDepartments,
  listInfrastructureServices,
  WAVE1_AVAILABLE_IDS,
} from "@/lib/workforce/registry";
import type { LifecycleStatus } from "@/lib/workforce/registry";

export const Route = createFileRoute("/_authenticated/command/capabilities")({
  head: () => ({
    meta: [
      { title: "Capability registry — Command Centre — DeliverX" },
      {
        name: "description",
        content:
          "Browse the 150-role DeliverX workforce catalogue across 15 departments. Only Available Wave 1 capabilities are operational.",
      },
    ],
  }),
  component: CapabilitiesBrowser,
});

const STATUS_FILTERS: Array<{ id: LifecycleStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "planned", label: "Planned" },
  { id: "testing", label: "Testing" },
  { id: "draft", label: "Draft" },
];

function statusLabel(status: LifecycleStatus): string {
  if (status === "available") return "Available";
  if (status === "testing") return "Testing";
  if (status === "planned") return "Planned — not operational";
  if (status === "draft") return "Draft — not operational";
  return status;
}

function CapabilitiesBrowser() {
  const departments = listDepartments();
  const capabilities = listCapabilities();
  const infra = listInfrastructureServices();
  const [status, setStatus] = useState<LifecycleStatus | "all">("all");
  const [deptNumber, setDeptNumber] = useState<number | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return capabilities.filter((c) => {
      if (status !== "all" && c.lifecycle_status !== status) return false;
      if (deptNumber !== "all" && c.department_number !== deptNumber) return false;
      if (!q) return true;
      return (
        c.capability_id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    });
  }, [capabilities, status, deptNumber, query]);

  const availableCount = capabilities.filter((c) => c.lifecycle_status === "available").length;

  return (
    <CommandShell
      title="Capability registry"
      subtitle={`${capabilities.length} roles · ${availableCount} Available (Wave 1) · ${departments.length} departments`}
    >
      <section className="cc-panel cc-cap-banner">
        <p className="cc-kicker">Workforce Architecture v1.0</p>
        <p className="text-sm leading-relaxed">
          The catalogue describes what the workforce can eventually do. The registry describes what
          is <strong>Available</strong> now. Planned roles are catalogue entries only — they are
          never presented as operational and cannot be assigned to missions.
        </p>
        <p className="cc-muted mt-2">
          Wave 1 Available: {WAVE1_AVAILABLE_IDS.join(", ")}. Spec:{" "}
          <Link to="/command" className="underline">
            Command Centre
          </Link>{" "}
          · docs/workforce-architecture-and-agent-catalogue.md
        </p>
      </section>

      <section className="cc-panel">
        <h2 className="cc-panel-title">Deterministic infrastructure (non-agent)</h2>
        <p className="cc-muted mb-3">
          Budget, permissions, and audit ceilings are services — not agents. DX-148 / DX-149 may
          advise; these services enforce.
        </p>
        <ul className="cc-infra-list">
          {infra.map((s) => (
            <li key={s.service_id}>
              <strong>{s.name}</strong>
              <span className="cc-chip cc-chip-infra">deterministic service</span>
              <p className="cc-muted">{s.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="cc-panel">
        <div className="cc-cap-filters">
          <div>
            <label className="cc-label" htmlFor="cap-q">
              Search
            </label>
            <input
              id="cap-q"
              className="cc-input"
              placeholder="DX-091, healthcare, PRD…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="cc-label" htmlFor="cap-status">
              Lifecycle status
            </label>
            <select
              id="cap-status"
              className="cc-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as LifecycleStatus | "all")}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="cc-label" htmlFor="cap-dept">
              Department
            </label>
            <select
              id="cap-dept"
              className="cc-input"
              value={deptNumber === "all" ? "all" : String(deptNumber)}
              onChange={(e) =>
                setDeptNumber(e.target.value === "all" ? "all" : Number(e.target.value))
              }
            >
              <option value="all">All 15 departments</option>
              {departments.map((d) => (
                <option key={d.number} value={d.number}>
                  {String(d.number).padStart(2, "0")} — {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(status !== "all" || deptNumber !== "all" || query.trim() !== "") && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="cc-muted text-xs">
              Showing {filtered.length} of {capabilities.length} roles
            </span>
            <button
              type="button"
              className="cc-btn cc-btn-secondary"
              onClick={() => {
                setStatus("all");
                setDeptNumber("all");
                setQuery("");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      <div className="cc-dept-grid">
        {departments.map((dept) => {
          const caps = filtered.filter((c) => c.department_number === dept.number);
          if (caps.length === 0) return null;
          return (
            <section key={dept.number} className="cc-panel cc-dept-panel">
              <h2 className="cc-panel-title">
                Department {String(dept.number).padStart(2, "0")} — {dept.name}
              </h2>
              <ul className="cc-cap-list">
                {caps.map((c) => {
                  const operational = isOperational(c.lifecycle_status);
                  return (
                    <li key={c.capability_id} className={operational ? "" : "cc-cap-planned"}>
                      <div className="cc-cap-row">
                        <code>{c.capability_id}</code>
                        <strong>{c.name}</strong>
                        <span
                          className={`cc-chip ${operational ? "cc-chip-available" : "cc-chip-planned"}`}
                        >
                          {statusLabel(c.lifecycle_status)}
                        </span>
                      </div>
                      <p className="cc-muted">{c.description}</p>
                      {!operational ? (
                        <p className="cc-cap-warn">
                          Not operational — catalogue entry only. Will not be assigned to missions.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="cc-muted">No capabilities match these filters.</p>
      ) : null}
    </CommandShell>
  );
}
