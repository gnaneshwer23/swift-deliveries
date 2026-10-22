import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { capabilityRegistryData as registry } from "@/lib/workforce/registry/data";
import { JudgementFlow } from "@/components/marketing/judgement-flow";
export const Route = createFileRoute("/ai-agents")({
  head: () =>
    pageHead(
      "/ai-agents",
      "150 AI Agents — DeliverX",
      "Search the DeliverX specialist catalogue, explore lifecycle departments and inspect capability status and limitations.",
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
  const [status, setStatus] = useState("");
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
            150 roles.
            <br />
            <span className="dxl-grad">Every capability visible.</span>
          </h1>
          <p className="psi-lead">
            Explore the disciplines behind a product mission. A role in the catalogue is not a
            guarantee that an autonomous agent is live.
          </p>
          <p className="psi-fine-print">
            12 navigation groups organise the existing 15 registry departments without changing
            execution rules. Foresight and analytics use the current PSI catalogue. Availability
            below is catalogue status; runtime also depends on configured providers, tools and
            permissions.
          </p>
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
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              className="dxl-btn dxl-btn-ghost"
              onClick={() => {
                setQ("");
                setGroup("");
                setStatus("");
              }}
            >
              Reset filters
            </button>
          </div>
          <p role="status">
            {roles.length} of {registry.capabilities.length} roles{group ? ` · ${group}` : ""}
          </p>
          <div className="psi-directory">
            {roles.map((c) => (
              <article className="psi-role" key={c.capability_id}>
                <span className="psi-role-status">{c.lifecycle_status}</span>
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
          {roles.length === 0 && <p>No matching roles. Reset filters or try another discipline.</p>}
        </div>
      </section>
      <div className="dxl-wrap">
        <JudgementFlow />
      </div>
    </MarketingLayout>
  );
}
