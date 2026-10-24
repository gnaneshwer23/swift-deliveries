import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { SpecialistWorkforce } from "@/components/marketing/specialist-workforce";
import { capabilityRegistryData as registry } from "@/lib/workforce/registry/data";
export const Route = createFileRoute("/ai-agents")({
  head: () =>
    pageHead(
      "/ai-agents",
      "Specialist workforce — Six working roles and the wider catalogue | DeliverX",
      "Follow six specialists from evidence to a held export. The wider catalogue is not 150 live working agents.",
    ),
  component: Agents,
});
const GROUPS = [
  { name: "Strategy & orchestration", ids: [1, 15] },
  { name: "Research", ids: [2] },
  { name: "Product", ids: [3] },
  { name: "Design", ids: [4] },
  { name: "Engineering", ids: [5] },
  { name: "AI & data", ids: [6] },
  { name: "Trust & governance", ids: [7, 14] },
  { name: "QA & reliability", ids: [8] },
  { name: "Infrastructure", ids: [9] },
  { name: "Growth & commercial", ids: [11, 12] },
  { name: "Foresight", ids: [10] },
  { name: "Analytics & improvement", ids: [13] },
];
function Agents() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("available");
  const foundationCount = registry.capabilities.filter(
    (c) => c.lifecycle_status === "available",
  ).length;
  const plannedCount = registry.capabilities.filter((c) => c.lifecycle_status === "planned").length;
  const selected = GROUPS.find((g) => g.name === group);
  const roles = registry.capabilities.filter(
    (c) =>
      (!selected || selected.ids.includes(c.department_number)) &&
      (!status || c.lifecycle_status === status) &&
      `${c.name} ${c.description} ${c.capability_id}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Specialist workforce · capability directory</p>
          <h1 className="dxl-h1">
            Specialists with
            <br />
            <span className="dxl-grad">a defined contribution.</span>
          </h1>
          <p className="psi-lead">
            Six roles finish a task, record why, attach evidence, and hand the artefact on. You
            approve the export. A specialist does not approve that step.
          </p>
          <p className="journey-status">
            The wider catalogue lists {registry.capabilities.length} roles. {foundationCount} are
            available as role foundations with deterministic-stub limitations, and {plannedCount}{" "}
            are planned. This is not {registry.capabilities.length} live working agents.
          </p>
          <SpecialistWorkforce />
        </div>
      </section>
      <section className="psi-section" id="catalogue">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Wider catalogue</h2>
          <p>
            The six roles above are the working set on this page. The entries below describe the
            wider catalogue. Available means a role foundation with stub limitations. Planned means
            the role is not in use. Provider integration, tools and permissions still need separate
            verification.
          </p>
          <details className="journey-detail">
            <summary>How the catalogue is organised</summary>
            <p>
              Twelve browsing groups organise the specialist disciplines. They are navigation
              categories, not teams that automatically run together. A mission should select only
              capabilities evaluated for its scope.
            </p>
          </details>
          <div className="psi-wheel" aria-label="Lifecycle department explorer">
            {GROUPS.map((g, i) => (
              <button
                type="button"
                key={g.name}
                aria-pressed={group === g.name}
                onClick={() => setGroup(group === g.name ? "" : g.name)}
                style={{ "--angle": `${i * 30}deg` } as React.CSSProperties}
              >
                <span>{g.name}</span>
              </button>
            ))}
            <div className="psi-wheel-centre">
              <strong>Product Brain</strong>
              <span>Evidence ↔ decisions</span>
            </div>
          </div>
          <div className="psi-directory-tools">
            <label>
              Search roles{" "}
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, role or DX ID"
              />
            </label>
            <label>
              Department{" "}
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                <option value="">All groups</option>
                {GROUPS.map((g) => (
                  <option key={g.name}>{g.name}</option>
                ))}
              </select>
            </label>
            <label>
              Capability status{" "}
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {[...new Set(registry.capabilities.map((c) => c.lifecycle_status))].map((s) => (
                  <option key={s} value={s}>
                    {s === "available"
                      ? "Role foundations (stub limitations)"
                      : s === "planned"
                        ? "Planned roles"
                        : s}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="dxl-btn dxl-btn-ghost"
              onClick={() => {
                setQ("");
                setGroup("");
                setStatus("available");
              }}
            >
              Reset to foundations
            </button>
          </div>
          <p role="status">
            {`${roles.length} matching catalogue entries${
              status === "available" ? ", shown as role foundations with stub limitations" : ""
            }${status === "planned" ? ", shown as planned roles" : ""}. ${registry.capabilities.length} entries in the wider catalogue${group ? `, ${group}` : ""}.`}
          </p>
          <div className="psi-directory">
            {roles.map((c) => (
              <article className="psi-role" key={c.capability_id}>
                <span className="psi-role-status">
                  {c.lifecycle_status === "available"
                    ? "Role foundation · stub limitations"
                    : c.lifecycle_status === "planned"
                      ? "Planned role"
                      : c.lifecycle_status}
                </span>
                <h3>{c.name}</h3>
                <small>
                  {c.capability_id} · {c.department}
                </small>
                <p>{c.description}</p>
                <details>
                  <summary>Execution & limitations</summary>
                  <p>{c.implementation_type.replaceAll("_", " ")}</p>
                  <ul>
                    {c.known_limitations.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p>{c.evaluation_notes}</p>
                </details>
              </article>
            ))}
          </div>
          {roles.length === 0 && (
            <p>No matching roles. Reset to foundations or try another discipline.</p>
          )}
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">See a contribution in context.</h2>
          <p>
            A catalogue is useful when you can see what moves from one role to the next. Follow the
            onboarding example and inspect its hypothetical outputs.
          </p>
          <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
            Explore the example mission
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
