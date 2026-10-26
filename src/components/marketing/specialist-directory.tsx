import {
  Brain,
  ChartLine,
  ChevronDown,
  Code2,
  Cpu,
  Compass,
  Megaphone,
  Palette,
  Rocket,
  Scale,
  Search,
  ServerCog,
  ShieldCheck,
  Telescope,
  TestTubes,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { capabilityRegistryData as registry } from "@/lib/workforce/registry/data";
import { INTENT_LABELS, PERMISSION_LABELS, type MissionIntent } from "@/lib/workforce/types";

const DEPT_ICONS: Record<number, LucideIcon> = {
  1: Compass,
  2: Search,
  3: Brain,
  4: Palette,
  5: Code2,
  6: Cpu,
  7: ShieldCheck,
  8: TestTubes,
  9: ServerCog,
  10: Telescope,
  11: Megaphone,
  12: Rocket,
  13: ChartLine,
  14: Scale,
  15: Workflow,
};

type Status = "available" | "planned" | "all";

/** Which mission types each available specialist joins, from the registry's intent map. */
const MISSIONS_FOR = (() => {
  const m = new Map<string, MissionIntent[]>();
  for (const [intent, ids] of Object.entries(registry.intent_capability_map)) {
    for (const id of ids) m.set(id, [...(m.get(id) ?? []), intent as MissionIntent]);
  }
  return m;
})();

const short = (name: string) => name.replace(/ Agent$/, "");

export function SpecialistDirectory() {
  const [dept, setDept] = useState<number | 0>(0);
  const [status, setStatus] = useState<Status>("available");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byDept = new Map<number, { total: number; available: number }>();
    for (const c of registry.capabilities) {
      const d = byDept.get(c.department_number) ?? { total: 0, available: 0 };
      d.total += 1;
      if (c.lifecycle_status === "available") d.available += 1;
      byDept.set(c.department_number, d);
    }
    return byDept;
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registry.capabilities.filter(
      (c) =>
        (!dept || c.department_number === dept) &&
        (status === "all" || c.lifecycle_status === status) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.capability_id.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)),
    );
  }, [dept, status, query]);

  const available = registry.capabilities.filter((c) => c.lifecycle_status === "available").length;

  return (
    <div className="sd">
      <div className="sd-depts" role="group" aria-label="Filter by department">
        <button type="button" aria-pressed={dept === 0} onClick={() => setDept(0)}>
          <span className="sd-dept-icon">
            <Workflow size={18} aria-hidden="true" />
          </span>
          <span>
            <strong>All departments</strong>
            <small>
              {available} available · {registry.capabilities.length} roles
            </small>
          </span>
        </button>
        {registry.departments.map((d) => {
          const Icon = DEPT_ICONS[d.number] ?? Workflow;
          const c = counts.get(d.number)!;
          return (
            <button
              key={d.number}
              type="button"
              aria-pressed={dept === d.number}
              data-live={c.available > 0 || undefined}
              onClick={() => setDept(d.number)}
            >
              <span className="sd-dept-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span>
                <strong>{d.name}</strong>
                <small>
                  {c.available > 0 ? `${c.available} available · ` : ""}
                  {c.total} roles
                </small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sd-main">
        <div className="sd-tools">
          <label className="sd-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search specialists</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID or what it does"
            />
          </label>
          <div className="sd-status" role="group" aria-label="Availability">
            {(
              [
                ["available", "Available"],
                ["planned", "In development"],
                ["all", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={status === id}
                onClick={() => setStatus(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="sd-count" aria-live="polite">
          {list.length} {list.length === 1 ? "specialist" : "specialists"}
          {dept ? ` in ${registry.departments.find((d) => d.number === dept)?.name}` : ""}
        </p>
        <ul className="sd-grid">
          {list.map((c) => {
            const live = c.lifecycle_status === "available";
            const missions = MISSIONS_FOR.get(c.capability_id) ?? [];
            const expanded = open === c.capability_id;
            const Icon = DEPT_ICONS[c.department_number] ?? Workflow;
            return (
              <li key={c.capability_id} data-live={live || undefined}>
                <button
                  type="button"
                  className="sd-card"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : c.capability_id)}
                >
                  <span className="sd-card-top">
                    <span className="sd-card-icon">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="sd-badge" data-live={live || undefined}>
                      {live ? "Available" : "In development"}
                    </span>
                  </span>
                  <strong>{short(c.name)}</strong>
                  <small>
                    {c.capability_id} · {c.department}
                  </small>
                  <span className="sd-desc">{c.description}</span>
                  {missions.length > 0 && (
                    <span className="sd-missions">
                      Joins {missions.map((m) => INTENT_LABELS[m]).join(", ")} missions
                    </span>
                  )}
                  <ChevronDown size={16} className="sd-chev" aria-hidden="true" />
                </button>
                {expanded && (
                  <dl className="sd-more">
                    <div>
                      <dt>Can do at most</dt>
                      <dd>
                        {PERMISSION_LABELS[
                          c.permission_profile as keyof typeof PERMISSION_LABELS
                        ] ?? c.permission_profile}
                      </dd>
                    </div>
                    <div>
                      <dt>Runs as</dt>
                      <dd>{c.implementation_type.replaceAll("_", " ")}</dd>
                    </div>
                    {c.known_limitations[0] && (
                      <div>
                        <dt>Known limitation</dt>
                        <dd>{c.known_limitations[0]}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
