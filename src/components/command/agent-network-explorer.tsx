import { TaskContribution } from "./task-contribution";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Compass,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Layers3,
  List,
  Network,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useSession } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { listCapabilities, listDepartments, getCapability } from "@/lib/workforce/registry";
import { commandCentreBootstrapQuery, missionBundleQuery } from "@/lib/workforce-queries";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import type { CapabilityRecord } from "@/lib/workforce/registry";
import "@/styles/agent-network-explorer.css";

const ICONS = [
  Compass,
  Search,
  Target,
  Palette,
  Code2,
  Database,
  ShieldCheck,
  FlaskConical,
  Rocket,
  Sparkles,
  GitBranch,
  UsersRound,
  Layers3,
  FileText,
  Workflow,
];
const COLORS = [
  "#6974d8",
  "#3287cc",
  "#438f85",
  "#a16cbd",
  "#4879d4",
  "#6589a0",
  "#748c63",
  "#a78a48",
  "#4d98ab",
  "#8c79b6",
  "#628dbb",
  "#a47b76",
  "#5b9a8c",
  "#9a8c65",
  "#6e80ac",
];
const SHORT = [
  "Executive",
  "Research",
  "Product",
  "Design & UX",
  "Engineering",
  "AI & data",
  "Security",
  "Quality",
  "Infrastructure",
  "Foresight",
  "Growth",
  "Commercial",
  "Analytics",
  "Finance & legal",
  "Orchestration",
];
const TABS = ["Overview", "Tasks", "Tools", "Dependencies", "Activity"] as const;
const STAGES = ["brief", "evidence", "alternatives", "decision", "artefact", "exported"];
function schemaFields(schema: Record<string, unknown>) {
  const properties = schema["properties"];
  return properties && typeof properties === "object" && !Array.isArray(properties)
    ? Object.keys(properties)
    : [];
}
function readable(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

export function AgentNetworkExplorer() {
  const capabilities = listCapabilities();
  const departments = listDepartments();
  const { user } = useSession();
  const gradient = useId();
  const signOut = useSignOut();
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(max-width: 650px)").matches) setView("list");
  }, []);
  const [department, setDepartment] = useState(5);
  const [selected, setSelected] = useState("DX-041");
  const [focused, setFocused] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [view, setView] = useState<"network" | "list">("network");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [missionId, setMissionId] = useState("");
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const bootstrap = useQuery(commandCentreBootstrapQuery);
  const decisionHome = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = bootstrap.data?.recentMissions ?? [];
  const mission = useQuery({
    ...missionBundleQuery(missionId),
    enabled: !!missionId,
    refetchInterval: (q) => (q.state.data?.mission.status === "running" ? 15000 : false),
  });
  const assigned = useMemo(
    () => new Set((mission.data?.tasks ?? []).flatMap((t) => t.capabilityIds)),
    [mission.data?.tasks],
  );
  const role = getCapability(selected) ?? capabilities[0]!;
  const dept = departments.find((d) => d.number === department)!;
  const color = COLORS[department - 1]!;
  const matches = useMemo(
    () =>
      capabilities.filter(
        (c) =>
          (!focused || c.department_number === department) &&
          (!assignedOnly || assigned.has(c.capability_id)) &&
          (status === "all" || c.lifecycle_status === status) &&
          `${c.name} ${c.capability_id} ${c.department} ${c.description} ${c.tool_allowlist.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [capabilities, focused, department, status, query, assignedOnly, assigned],
  );
  const members = capabilities.filter((c) => c.department_number === department);
  const graphRoles = members.filter(
    (c) =>
      (!assignedOnly || assigned.has(c.capability_id)) &&
      (status === "all" || c.lifecycle_status === status) &&
      (!query.trim() ||
        `${c.name} ${c.capability_id} ${c.department} ${c.description} ${c.tool_allowlist.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  const tasks = mission.data?.tasks ?? [];
  const roleTasks = tasks.filter((t) => t.capabilityIds.includes(role.capability_id));
  const done = tasks.filter((t) => t.status === "completed").length;
  const latestDecision = decisionHome.data?.missions[0];
  const stage = latestDecision ? STAGES.indexOf(latestDecision.stage) : -1;
  function selectRole(c: CapabilityRecord) {
    setSelected(c.capability_id);
    setDepartment(c.department_number);
    setFocused(true);
    setTab("Overview");
    setRailOpen(false);
  }
  function selectDepartment(number: number) {
    setDepartment(number);
    setFocused(true);
    const first = capabilities.find((c) => c.department_number === number);
    if (first) setSelected(first.capability_id);
    setTab("Overview");
    setRailOpen(false);
  }
  const name = user?.user_metadata.full_name ?? "Workspace owner";
  return (
    <div
      className="an-app"
      onKeyDown={(event) => {
        if (event.key === "Escape") setAccountOpen(false);
      }}
    >
      <header className="an-header">
        <BrandLogo to="/command" className="an-brand" />
        <nav aria-label="Product navigation">
          <Link to="/command" activeOptions={{ exact: true }}>
            Overview
          </Link>
          <Link to="/command/capabilities" aria-current="page">
            Specialists
          </Link>
          <Link to="/command/projects">Projects</Link>
          <Link to="/command/programmes">Programmes</Link>
        </nav>
        <div className="an-header-end">
          <ShieldCheck size={15} />
          <span>Human supervised</span>
          <div className="an-account">
            <button
              className="an-user"
              title={name}
              aria-label="Account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(!accountOpen)}
            >
              {name[0]?.toUpperCase()}
            </button>
            {accountOpen && (
              <div className="an-account-menu">
                <strong>{name}</strong>
                <Link to="/onboarding" onClick={() => setAccountOpen(false)}>
                  Edit workspace setup
                </Link>
                <button onClick={() => void signOut()}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="an-heading">
        <div>
          <p>Product Super Intelligence</p>
          <h1>Your specialist network.</h1>
          <span>Explore roles. Inspect their contribution. Follow work through your product.</span>
        </div>
        <div className="an-summary">
          <strong>
            {capabilities.length}
            <small>catalogue roles</small>
          </strong>
          <strong>
            {capabilities.filter((c) => c.lifecycle_status === "available").length}
            <small>available for planning</small>
          </strong>
        </div>
      </div>
      <div className="an-toolbar">
        <div className="an-search">
          <Search size={16} />
          <input
            aria-label="Search specialists"
            placeholder="Search agents, capabilities or tools…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                setFocused(false);
                setView("list");
              }
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>
        <select
          aria-label="Capability status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All capability states</option>
          <option value="available">Available for planning</option>
          <option value="planned">Planned roles</option>
          <option value="testing">Testing</option>
          <option value="implementing">Implementing</option>
          <option value="draft">Draft</option>
          <option value="suspended">Suspended</option>
          <option value="retired">Retired</option>
        </select>
        <select
          aria-label="Mission context"
          value={missionId}
          onChange={(e) => {
            setMissionId(e.target.value);
            setAssignedOnly(false);
          }}
        >
          <option value="">Catalogue · no task mission selected</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        {missionId && (
          <button
            className="cc-btn cc-btn-secondary"
            aria-pressed={assignedOnly}
            disabled={!mission.data && !assignedOnly}
            onClick={() => {
              setAssignedOnly(!assignedOnly);
              setFocused(false);
              setView("list");
              setQuery("");
              setStatus("all");
            }}
          >
            Assigned specialists{mission.data ? ` (${assigned.size})` : ""}
          </button>
        )}
        <div className="an-view-switch" aria-label="Network display">
          <button
            aria-label="Network view"
            aria-pressed={view === "network"}
            onClick={() => {
              setView("network");
              if (query.trim() && matches[0]) selectRole(matches[0]);
            }}
          >
            <Network size={15} />
          </button>
          <button
            aria-label="List view"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <a className="po-inspector-shortcut" href="#specialist-inspector">
        Inspect {role.name}
      </a>
      <div className="an-layout">
        <aside className={`an-departments ${railOpen ? "is-open" : ""}`}>
          <button
            className="an-rail-toggle"
            onClick={() => setRailOpen(!railOpen)}
            aria-expanded={railOpen}
          >
            Departments <span>{departments.length}</span>
            <ChevronRight size={14} />
          </button>
          <div className="an-department-content">
            <div className="an-rail-heading">
              <h2>Departments</h2>
              <span>{departments.length}</span>
            </div>
            <button
              className={`an-all-departments ${!focused ? "is-active" : ""}`}
              onClick={() => {
                setFocused(false);
                setRailOpen(false);
                setQuery("");
              }}
            >
              <Network size={15} />
              All departments<span>{capabilities.length}</span>
            </button>
            {departments.map((d, i) => {
              const Icon = ICONS[i] ?? Bot;
              const ready = capabilities.filter(
                (c) => c.department_number === d.number && c.lifecycle_status === "available",
              ).length;
              return (
                <button
                  className={`an-department ${focused && department === d.number ? "is-active" : ""}`}
                  key={d.number}
                  onClick={() => selectDepartment(d.number)}
                  aria-pressed={focused && department === d.number}
                >
                  <span
                    className="an-dept-icon"
                    style={{ color: COLORS[i], background: `${COLORS[i]}12` }}
                  >
                    <Icon size={16} />
                  </span>
                  <span>
                    <strong>{d.name}</strong>
                    <small>{ready ? `${ready} available for planning` : "Planned catalogue"}</small>
                  </span>
                  <em>{d.capability_ids.length}</em>
                </button>
              );
            })}
            <div className="an-rail-note">
              <CircleHelp size={14} />
              <p>
                Capability status is separate from task activity. A planned role cannot be assigned.
              </p>
            </div>
          </div>
        </aside>
        <section className="an-canvas" aria-label="Agent network explorer">
          <header className="an-canvas-heading">
            <div>
              <span>{focused ? "Department focus" : "Workforce architecture"}</span>
              <h2>{focused ? dept.name : "One product brain. Every contribution connected."}</h2>
              <p>
                {focused
                  ? `${members.length} specialist roles · select a role to inspect it`
                  : "Select a department to explore its specialist roles."}
              </p>
            </div>
            {focused && (
              <button
                onClick={() => {
                  setFocused(false);
                  setQuery("");
                }}
              >
                <ArrowLeft size={13} />
                All departments
              </button>
            )}
          </header>
          {view === "list" ? (
            <div className="an-role-list" aria-label="Specialist list">
              <p className="an-results">{matches.length} matching roles</p>
              {matches.length === 0 ? (
                <div className="an-empty">
                  No roles match these filters. Clear the search or choose another capability state.
                </div>
              ) : (
                matches.map((c) => (
                  <button
                    key={c.capability_id}
                    onClick={() => selectRole(c)}
                    aria-pressed={selected === c.capability_id}
                  >
                    <span
                      className="an-role-glyph"
                      style={{ color: COLORS[c.department_number - 1] }}
                    >
                      <Bot size={18} />
                    </span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {c.capability_id} · {c.department}
                      </small>
                    </span>
                    <em className="an-state" data-state={c.lifecycle_status}>
                      {c.lifecycle_status === "available"
                        ? "Available"
                        : readable(c.lifecycle_status)}
                    </em>
                    <ChevronRight size={13} />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className={`an-graph ${focused ? "is-focused" : ""}`}>
              <svg
                className="an-graph-lines"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <ellipse
                  cx="50"
                  cy="50"
                  rx={focused ? 33 : 36}
                  ry={focused ? 34 : 35}
                  className="an-orbit"
                />
                <ellipse cx="50" cy="50" rx="18" ry="18" className="an-inner-orbit" />
                {(focused ? graphRoles : departments).map((item, i, items) => {
                  const angle = ((-90 + i * (360 / items.length)) * Math.PI) / 180;
                  const x = 50 + (focused ? 33 : 36) * Math.cos(angle),
                    y = 50 + (focused ? 34 : 35) * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1="50"
                      y1="50"
                      x2={x}
                      y2={y}
                      className={
                        focused && "capability_id" in item && item.capability_id === selected
                          ? "is-selected"
                          : ""
                      }
                    />
                  );
                })}
              </svg>
              <div className="an-brain">
                <div className="an-brain-globe">
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <defs>
                      <radialGradient id={gradient} cx="30%" cy="20%" r="85%">
                        <stop stopColor="#529ff1" />
                        <stop offset=".48" stopColor="#2259b3" />
                        <stop offset="1" stopColor="#122e66" />
                      </radialGradient>
                    </defs>
                    <circle cx="60" cy="60" r="55" fill={`url(#${gradient})`} />
                    <ellipse
                      cx="60"
                      cy="60"
                      rx="28"
                      ry="55"
                      fill="none"
                      stroke="#a9ccff"
                      opacity=".18"
                    />
                    <ellipse
                      cx="60"
                      cy="60"
                      rx="55"
                      ry="24"
                      fill="none"
                      stroke="#a9ccff"
                      opacity=".18"
                    />
                    <path d="M7 48H113M7 72H113M60 5V115" stroke="#a9ccff" opacity=".13" />
                  </svg>
                  <BrainCircuit size={25} />
                  <strong>DeliverX</strong>
                  <small>Product Brain</small>
                </div>
                <span>Evidence · decisions · artefacts</span>
              </div>
              {focused
                ? graphRoles.map((c, i) => {
                    const angle = ((-90 + i * (360 / graphRoles.length)) * Math.PI) / 180;
                    return (
                      <button
                        className={`an-agent-node ${selected === c.capability_id ? "is-selected" : ""}`}
                        data-state={c.lifecycle_status}
                        key={c.capability_id}
                        style={{
                          left: `${50 + 33 * Math.cos(angle)}%`,
                          top: `${50 + 34 * Math.sin(angle)}%`,
                        }}
                        onClick={() => selectRole(c)}
                        aria-pressed={selected === c.capability_id}
                      >
                        <span className="an-agent-disk" style={{ borderColor: color }}>
                          <Bot size={20} />
                          {assigned.has(c.capability_id) && (
                            <i title="Assigned in selected mission" />
                          )}
                        </span>
                        <strong>{c.name.replace(/ Agent$/, "")}</strong>
                        <small>
                          {c.capability_id} ·{" "}
                          {c.lifecycle_status === "available"
                            ? "Available"
                            : readable(c.lifecycle_status)}
                        </small>
                      </button>
                    );
                  })
                : departments.map((d, i) => {
                    const angle = ((-90 + i * (360 / departments.length)) * Math.PI) / 180;
                    const Icon = ICONS[i] ?? Bot;
                    return (
                      <button
                        className="an-dept-node"
                        key={d.number}
                        style={{
                          left: `${50 + 36 * Math.cos(angle)}%`,
                          top: `${50 + 35 * Math.sin(angle)}%`,
                        }}
                        onClick={() => selectDepartment(d.number)}
                        aria-label={`${d.name}, ${d.capability_ids.length} roles`}
                      >
                        <span style={{ borderColor: `${COLORS[i]}65`, color: COLORS[i] }}>
                          <Icon size={19} />
                        </span>
                        <strong>{SHORT[i]}</strong>
                        <small>{d.capability_ids.length} roles</small>
                      </button>
                    );
                  })}
              {focused && graphRoles.length === 0 && (
                <p className="an-graph-empty">
                  No roles in this department match the selected filters.
                </p>
              )}
            </div>
          )}
          <footer className="an-graph-legend">
            <span>
              <i />
              Product context
            </span>
            <span>
              <i />
              Department / specialist
            </span>
            <strong>
              {focused
                ? `${graphRoles.length} roles shown`
                : `${capabilities.length} roles · ${departments.length} departments`}
            </strong>
            <p>Catalogue relationships · task activity comes from mission records</p>
          </footer>
        </section>
        <aside id="specialist-inspector" className="an-inspector" aria-label="Specialist inspector">
          <div className="an-inspector-meta">
            <span>{role.capability_id}</span>
            <span className="an-state" data-state={role.lifecycle_status}>
              {role.lifecycle_status === "available"
                ? "Available for planning"
                : readable(role.lifecycle_status)}
            </span>
          </div>
          <div className="an-inspector-identity">
            <span style={{ color: COLORS[role.department_number - 1] }}>
              <Bot size={25} />
            </span>
            <h2>{role.name}</h2>
            <p>{role.department}</p>
          </div>
          <div className="an-inspector-tabs" aria-label="Specialist detail views">
            {TABS.map((t) => (
              <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
          <div className="an-inspector-content">
            {missionId &&
            (mission.isPending || mission.isError) &&
            ["Tasks", "Dependencies", "Activity"].includes(tab) ? (
              <section>
                <h3>{tab}</h3>
                <p>
                  {mission.isError
                    ? "Could not load the selected mission."
                    : "Loading the selected mission records…"}
                </p>
                {mission.isError && (
                  <button
                    className="cc-btn cc-btn-secondary"
                    onClick={() => void mission.refetch()}
                  >
                    Retry mission
                  </button>
                )}
              </section>
            ) : tab === "Overview" ? (
              <>
                <section>
                  <h3>Role summary</h3>
                  <p>{role.description}</p>
                  <div className="an-facts">
                    <div>
                      <small>Contribution type</small>
                      <strong>{readable(role.implementation_type)}</strong>
                    </div>
                    <div>
                      <small>Permission ceiling</small>
                      <strong>{readable(role.permission_profile)}</strong>
                    </div>
                    <div>
                      <small>Runtime limit</small>
                      <strong>{role.limits.max_runtime_seconds} seconds</strong>
                    </div>
                    <div>
                      <small>Usage ceiling</small>
                      <strong>{role.limits.max_usage_credits} units</strong>
                    </div>
                  </div>
                </section>
                <section>
                  <h3>Inputs</h3>
                  <div className="an-schema-chips">
                    {schemaFields(role.input_schema).length ? (
                      schemaFields(role.input_schema).map((s) => <span key={s}>{readable(s)}</span>)
                    ) : (
                      <p>No input fields specified in the registry.</p>
                    )}
                  </div>
                </section>
                <section>
                  <h3>Outputs</h3>
                  <div className="an-schema-chips">
                    {schemaFields(role.output_schema).length ? (
                      schemaFields(role.output_schema).map((s) => (
                        <span key={s}>{readable(s)}</span>
                      ))
                    ) : (
                      <p>No output fields specified in the registry.</p>
                    )}
                  </div>
                </section>
                <section className="an-limitations">
                  <h3>
                    <ShieldCheck size={14} />
                    Known limitations
                  </h3>
                  {role.known_limitations.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </section>
              </>
            ) : tab === "Tasks" ? (
              <section>
                <h3>Assigned tasks</h3>
                {!missionId ? (
                  <div className="an-empty">
                    Choose a task mission in the toolbar to inspect this specialist's recorded
                    assignments.
                  </div>
                ) : mission.isPending ? (
                  <p>Loading mission tasks…</p>
                ) : mission.isError ? (
                  <p className="an-error">Could not load the selected mission.</p>
                ) : roleTasks.length === 0 ? (
                  <p>No task in this mission is assigned to {role.capability_id}.</p>
                ) : (
                  roleTasks.map((t) => (
                    <div className="an-task" key={t.id}>
                      <strong>{t.title}</strong>
                      <span className="an-state" data-state={t.status}>
                        {readable(t.status)}
                      </span>
                      <p>{t.description}</p>
                      <small>{t.actualUsage} usage units recorded</small>
                      <TaskContribution
                        task={t}
                        tasks={tasks}
                        artefacts={mission.data?.artefacts ?? []}
                      />
                    </div>
                  ))
                )}
              </section>
            ) : tab === "Tools" ? (
              <section>
                <h3>Allowed tools</h3>
                <p>
                  Tool use is bounded by the role allowlist and the mission's approved permission
                  scope.
                </p>
                <div className="an-schema-chips">
                  {role.tool_allowlist.length ? (
                    role.tool_allowlist.map((t) => <span key={t}>{t}</span>)
                  ) : (
                    <p>No tools are configured for this role.</p>
                  )}
                </div>
              </section>
            ) : tab === "Dependencies" ? (
              <section>
                <h3>Role dependencies</h3>
                {role.dependencies.length ? (
                  role.dependencies.map((id) => (
                    <button
                      className="an-dependency-link"
                      key={id}
                      onClick={() => {
                        const c = getCapability(id);
                        if (c) selectRole(c);
                      }}
                    >
                      {getCapability(id)?.name ?? id}
                      <ArrowUpRight size={12} />
                    </button>
                  ))
                ) : (
                  <p>No role dependencies are specified in the registry.</p>
                )}
                <h3 style={{ marginTop: 24 }}>Mission handoffs</h3>
                {!missionId ? (
                  <p>Choose a task mission to see recorded upstream dependencies.</p>
                ) : roleTasks.length === 0 ? (
                  <p>No assigned tasks for this specialist in the selected mission.</p>
                ) : (
                  roleTasks.map((t) => (
                    <p key={t.id}>
                      <strong>{t.title}</strong>
                      <br />
                      {t.dependsOn.length
                        ? t.dependsOn
                            .map((k) => tasks.find((upstream) => upstream.key === k)?.title ?? k)
                            .join(" + ")
                        : "No upstream task dependency recorded."}
                    </p>
                  ))
                )}
              </section>
            ) : (
              <section>
                <h3>Evaluation record</h3>
                <p>{role.evaluation_notes}</p>
                <h3 style={{ marginTop: 24 }}>Recorded task completion</h3>
                {!missionId ? (
                  <p>
                    Select a task mission to see completion evidence. No performance score is
                    inferred from capability status.
                  </p>
                ) : (
                  <>
                    <strong className="an-completion">
                      {roleTasks.filter((t) => t.status === "completed").length}
                      <small> / {roleTasks.length} assigned tasks</small>
                    </strong>
                    <p>Completion reflects task records, not a measured product outcome.</p>
                  </>
                )}
              </section>
            )}
          </div>
          <div className="an-inspector-action">
            {role.lifecycle_status === "available" ? (
              <Link to="/command">
                Open mission planner
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button disabled>
                {role.lifecycle_status === "planned"
                  ? "Planned role"
                  : readable(role.lifecycle_status)}{" "}
                · assignment unavailable
              </button>
            )}
            <p>Role assignments require a scoped mission plan and owner approval.</p>
          </div>
        </aside>
      </div>
      <section className="an-mission-bar" aria-label="Recorded mission progress">
        {missionId ? (
          <>
            <div className="an-mission-label">
              <span className="an-mission-icon">
                <Workflow size={21} />
              </span>
              <div>
                <small>Selected task mission</small>
                <strong>{mission.data?.mission.title ?? "Loading mission…"}</strong>
                <p>
                  {mission.data
                    ? readable(mission.data.mission.status)
                    : mission.isError
                      ? "Could not load mission"
                      : ""}
                </p>
              </div>
            </div>
            <div className="an-mission-progress">
              {mission.data && (
                <progress
                  aria-label="Task completion"
                  max={Math.max(tasks.length, 1)}
                  value={done}
                />
              )}
              <span>
                {mission.data
                  ? `${done} / ${tasks.length} tasks completed · ${assigned.size} assigned specialists`
                  : mission.isError
                    ? "Task records could not load"
                    : "Loading task records…"}
              </span>
            </div>
            <Link to="/command/missions/$missionId" params={{ missionId }}>
              Open mission
              <ArrowUpRight size={14} />
            </Link>
          </>
        ) : latestDecision ? (
          <>
            <div className="an-mission-label">
              <span className="an-mission-icon">
                <FileText size={21} />
              </span>
              <div>
                <small>Saved decision mission</small>
                <strong>{latestDecision.question}</strong>
                <p>{latestDecision.nextTitle}</p>
              </div>
            </div>
            <ol
              className="an-decision-stages"
              aria-label={`Recorded mission stage: ${latestDecision.stage}`}
            >
              {STAGES.map((s, i) => (
                <li key={s} data-done={stage >= i}>
                  <span>{stage >= i ? <Check size={12} /> : i + 1}</span>
                  {s === "exported" ? "Export" : s[0]!.toUpperCase() + s.slice(1)}
                </li>
              ))}
            </ol>
            <Link to="/command/supervised/$missionId" params={{ missionId: latestDecision.id }}>
              Open record
              <ArrowUpRight size={14} />
            </Link>
          </>
        ) : (
          <>
            <div className="an-mission-label">
              <span className="an-mission-icon">
                <FileText size={21} />
              </span>
              <div>
                <small>Your product work</small>
                <strong>
                  {decisionHome.isPending
                    ? "Loading saved missions…"
                    : decisionHome.isError
                      ? "Saved missions could not load"
                      : "Start with one product question."}
                </strong>
                <p>Evidence, decisions and useful artefacts stay connected.</p>
              </div>
            </div>
            <Link to="/command">
              Open workspace
              <ArrowRight size={14} />
            </Link>
          </>
        )}
      </section>
      <p className="an-page-note">
        {capabilities.length} canonical roles across {departments.length} departments. Capability
        availability, task completion and observed product outcomes are separate records.
      </p>
    </div>
  );
}
