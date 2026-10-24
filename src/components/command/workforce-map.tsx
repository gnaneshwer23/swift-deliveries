import { useId, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  GitBranch,
  Layers3,
  Search,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { WorkforceHandoff } from "./workforce-handoff";
import { listCapabilities } from "@/lib/workforce/registry";

const GROUPS = [
  {
    name: "Research & foresight",
    icon: Search,
    departments: [2, 10],
    x: 23,
    y: 20,
    output: "Sources, patterns and evidence gaps",
    description:
      "Research contributions inform the product question. Foresight roles remain visible in the catalogue even where they are not available.",
  },
  {
    name: "Product & strategy",
    icon: Compass,
    departments: [1, 3],
    x: 77,
    y: 20,
    output: "Options, priorities and scope",
    description:
      "Frame the problem and compare alternatives. Recommendations become decisions only when the workspace owner accepts them.",
  },
  {
    name: "Design & engineering",
    icon: Layers3,
    departments: [4, 5, 6, 9],
    x: 18,
    y: 50,
    output: "Specifications and reviewable builds",
    description:
      "Translate an approved direction into design and engineering work. Execution depends on the mission plan and available capabilities.",
  },
  {
    name: "Quality & governance",
    icon: ShieldCheck,
    departments: [7, 8, 14],
    x: 82,
    y: 50,
    output: "Checks, risks and approval gates",
    description:
      "Review outputs and surface limitations. Permission and budget services enforce gates independently of specialist recommendations.",
  },
  {
    name: "Growth & learning",
    icon: GitBranch,
    departments: [11, 12, 13],
    x: 23,
    y: 80,
    output: "Experiments and outcome reviews",
    description:
      "Connect the proposed change to an experiment. Observed results must be supplied with evidence; they are never inferred from task completion.",
  },
  {
    name: "Agent operations",
    icon: Workflow,
    departments: [15],
    x: 77,
    y: 80,
    output: "Coordination and bounded handoffs",
    description:
      "Orchestration coordinates the plan. The catalogue does not mean every role is deployed or acting independently.",
  },
];
export function WorkforceMap({
  onExplore,
  onSelectRole,
}: {
  onExplore?: (departments: number[]) => void;
  onSelectRole?: (id: string) => void;
}) {
  const [view, setView] = useState<"map" | "handoff">("map");
  const [selected, setSelected] = useState(0);
  const arrow = useId();
  const group = GROUPS[selected]!;
  const caps = listCapabilities();
  const members = caps.filter((c) => group.departments.includes(c.department_number));
  const available = members.filter((c) => c.lifecycle_status === "available").length;
  return (
    <section className="ps-network" aria-label="Workforce architecture map">
      <div className="ps-network-toolbar">
        <div>
          <h2>One product brain. A connected workforce.</h2>
          <p>Shared context. Named specialists. Reviewable handoffs.</p>
        </div>
        <div className="ps-map-tabs" aria-label="Workforce view">
          <button aria-pressed={view === "map"} onClick={() => setView("map")}>
            Workforce map
          </button>
          <button aria-pressed={view === "handoff"} onClick={() => setView("handoff")}>
            Example handoff
          </button>
        </div>
      </div>
      {view === "map" ? (
        <div className="ps-network-body">
          <div className="ps-constellation">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <marker
                  id={arrow}
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8da4ff" />
                </marker>
              </defs>
              {GROUPS.map((g) => (
                <line
                  key={g.name}
                  x1={g.x < 50 ? g.x : 50}
                  y1={g.x < 50 ? g.y : 50}
                  x2={g.x < 50 ? 50 - (50 - g.x) * 0.26 : 50 + (g.x - 50) * 0.65}
                  y2={g.x < 50 ? 50 - (50 - g.y) * 0.26 : 50 + (g.y - 50) * 0.65}
                  markerEnd={g === group ? `url(#${arrow})` : undefined}
                  style={{ stroke: g === group ? "#8da4ff" : undefined }}
                />
              ))}
            </svg>
            <div className="ps-brain-node ps-brain-stack">
              <svg className="ps-brain-art" viewBox="0 0 180 140" aria-hidden="true">
                <defs>
                  <linearGradient id={`${arrow}-plate`} x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#a5b7ff" />
                    <stop offset="1" stopColor="#4b66ce" />
                  </linearGradient>
                </defs>
                <path d="M20 96 90 60 160 96 90 132Z" fill="#142038" stroke="#42547d" />
                <path d="M20 78 90 42 160 78 90 114Z" fill="#23385e" stroke="#607db9" />
                <path
                  d="M20 60 90 24 160 60 90 96Z"
                  fill={`url(#${arrow}-plate)`}
                  stroke="#c6d1ff"
                />
                <path d="M20 60V69L90 105V96M160 60V69L90 105" fill="#3c56aa" stroke="#8da4ed" />
                <path d="M60 59 90 43 120 59 90 75Z" fill="#e8edff" fillOpacity=".9" />
                <path d="M90 43V75M60 59H120" stroke="#6480d4" strokeWidth="1.5" />
                <circle cx="90" cy="59" r="5" fill="#4567ec" />
                <circle cx="90" cy="116" r="2" fill="#a7baff" />
              </svg>
              <strong>Product Brain</strong>
              <small>Evidence · decisions · artefacts</small>
            </div>
            {GROUPS.map((g, i) => {
              const roles = caps.filter((c) => g.departments.includes(c.department_number));
              return (
                <button
                  key={g.name}
                  className="ps-dept-node"
                  style={{ left: `${g.x}%`, top: `${g.y}%` }}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                >
                  <span className="ps-node-heading">
                    <g.icon size={15} />
                    <strong>{g.name}</strong>
                  </span>
                  <small>
                    {roles.length} roles ·{" "}
                    {roles.filter((c) => c.lifecycle_status === "available").length} available
                  </small>
                  <span className="ps-role-dots" aria-hidden="true">
                    {roles.map((c) => (
                      <i
                        key={c.capability_id}
                        className={c.lifecycle_status === "available" ? "is-available" : ""}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <aside className="ps-network-detail">
            <span>Selected contribution group</span>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <dl>
              <div>
                <dt>Catalogue roles</dt>
                <dd>{members.length}</dd>
              </div>
              <div>
                <dt>Available for planning</dt>
                <dd>{available}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{group.output}</dd>
              </div>
            </dl>
            <div className="ps-selected-specialists">
              <span>Specialists in this group</span>
              {[...members]
                .sort(
                  (a, b) =>
                    Number(b.lifecycle_status === "available") -
                    Number(a.lifecycle_status === "available"),
                )
                .slice(0, 3)
                .map((role) => (
                  <button
                    key={role.capability_id}
                    onClick={() => onSelectRole?.(role.capability_id)}
                    disabled={!onSelectRole}
                  >
                    <span className="ps-mini-avatar">
                      {role.name
                        .split(" ")
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")}
                    </span>
                    <span>
                      <strong>{role.name}</strong>
                      <small>
                        {role.capability_id} ·{" "}
                        {role.lifecycle_status === "available"
                          ? "Available for planning"
                          : role.lifecycle_status}
                      </small>
                    </span>
                    <ArrowUpRight size={12} />
                  </button>
                ))}
            </div>
            {onExplore && (
              <button onClick={() => onExplore(group.departments)}>
                Inspect roles
                <ArrowDown size={13} />
              </button>
            )}
          </aside>
        </div>
      ) : (
        <WorkforceHandoff onSelectRole={onSelectRole} />
      )}
      <div className="ps-network-footer">
        <span>
          <i />
          Available for planning
        </span>
        <span>
          <i style={{ background: "#48536b" }} />
          Planned role
        </span>
        <span>
          {view === "map"
            ? "Contribution architecture · activity is shown in mission records below."
            : "Illustrative workflow · actual plans depend on scope, tools and approvals."}
        </span>
      </div>
    </section>
  );
}
