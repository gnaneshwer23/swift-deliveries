import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentOfficeIllustration } from "@/components/illustrations/agent-office-illustration";
import { podAnchor } from "@/components/illustrations/agent-office-layout";
import { buildAgentOffice, type OfficeState } from "@/lib/agent-office";
import { getRecentWorkspaceEvents } from "@/lib/workforce.functions";
import { describeEvent } from "@/lib/workforce/event-labels";
import type { WfMission, WfMissionTask } from "@/lib/workforce/types";
import "@/styles/agent-office.css";

const STATE_LABEL: Record<OfficeState, string> = {
  waiting: "Waiting for you",
  doing: "Working",
  next: "Up next",
  later: "Later",
  done: "Done",
  stopped: "Stopped",
};
const FILTERS: Array<"all" | OfficeState> = [
  "all",
  "waiting",
  "doing",
  "stopped",
  "next",
  "later",
  "done",
];

export function AgentOffice({
  missions,
  tasks,
  usage,
  tasksUnavailable = false,
}: {
  missions: readonly WfMission[];
  tasks: readonly WfMissionTask[];
  usage: { consumed: number; ceiling: number };
  /** The task read failed; the office shows missions only and says so. */
  tasksUnavailable?: boolean;
}) {
  const office = useMemo(() => buildAgentOffice(missions, tasks), [missions, tasks]);
  const [filter, setFilter] = useState<"all" | OfficeState>("all");
  const [desk, setDesk] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // particles only while the office is on screen and motion is welcome
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !ref.current) return;
    const observer = new IntersectionObserver(([e]) => setLive(Boolean(e?.isIntersecting)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const deskName = office.departments
    .flatMap((d) => d.specialists)
    .find((s) => s.id === desk)?.name;
  const items = office.items.filter(
    (i) => (filter === "all" || i.state === filter) && (!desk || i.specialists.includes(desk)),
  );
  const share = usage.ceiling > 0 ? Math.min(1, usage.consumed / usage.ceiling) : 0;
  const n = office.departments.length;

  return (
    <section className="ao" ref={ref} aria-labelledby="ao-title">
      <header className="ao-head">
        <div>
          <span className="ao-overline">
            Living desks · {missions.length} recent mission
            {missions.length === 1 ? "" : "s"}
          </span>
          <h2 id="ao-title">
            {office.totals.waiting > 0
              ? `${office.totals.waiting} ${office.totals.waiting === 1 ? "item waits" : "items wait"} for you`
              : office.totals.stopped > 0
                ? `${office.totals.stopped} ${office.totals.stopped === 1 ? "item has" : "items have"} stopped`
                : office.totals.doing > 0
                  ? `${office.totals.doing} ${office.totals.doing === 1 ? "task is" : "tasks are"} being worked on`
                  : "Everyone is ready for the next mission"}
          </h2>
        </div>
        <p className="ao-usage-note">
          Usage {usage.consumed}/{usage.ceiling}
          <span className="ao-bar" style={{ ["--share" as string]: `${share * 100}%` }} aria-hidden="true">
            <i />
          </span>
        </p>
      </header>

      <div className="ao-body">
        <div className="ao-floor">
          <div className="ao-stage ix">
            <AgentOfficeIllustration
              departments={office.departments}
              selected={desk}
              onSelect={setDesk}
              live={live}
            />
            {office.departments.map((d, k) => {
              const a = podAnchor(k, n);
              return (
                <div
                  key={d.n}
                  className="ao-card"
                  data-waiting={d.counts.waiting > 0 || undefined}
                  style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
                >
                  <strong>{d.short}</strong>
                  <small>
                    {d.specialists.length} specialist{d.specialists.length === 1 ? "" : "s"}
                  </small>
                  <DeptCounts counts={d.counts} />
                </div>
              );
            })}
          </div>
          <ul className="ao-dept-list" aria-label="Departments">
            {office.departments.map((d) => (
              <li key={d.n} data-waiting={d.counts.waiting > 0 || undefined}>
                <strong>{d.short}</strong>
                <DeptCounts counts={d.counts} />
              </li>
            ))}
          </ul>
          {tasksUnavailable && (
            <p className="ao-dev" role="status">
              Task details could not load, so desks and counts show missions only. Reload to try
              again.
            </p>
          )}
          <p className="ao-dev">
            <span>
              {office.inDevelopment.length} more departments in development, not assignable yet:
            </span>{" "}
            {office.inDevelopment.map((d) => d.short).join(" · ")}
          </p>
        </div>

        <aside className="ao-panel" aria-labelledby="ao-panel-title">
          <h3 id="ao-panel-title">Task status</h3>
          <div className="ao-filters" role="group" aria-label="Filter tasks">
            {FILTERS.map((f) => {
              const count =
                f === "all"
                  ? office.items.length
                  : office.items.filter((i) => i.state === f).length;
              if (f !== "all" && count === 0) return null;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  data-state={f}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : STATE_LABEL[f]} <span>{count}</span>
                </button>
              );
            })}
          </div>
          {desk && (
            <button type="button" className="ao-desk-filter" onClick={() => setDesk(null)}>
              Showing {deskName} <X size={13} aria-hidden="true" />
            </button>
          )}
          {items.length === 0 ? (
            <p className="ao-empty">
              {office.items.length === 0
                ? "No missions yet. Describe what you need below and the team will plan it for your approval."
                : "Nothing here for this filter."}
            </p>
          ) : (
            <ol className="ao-list">
              {items.map((i) => (
                <li key={i.key} data-state={i.state}>
                  <Link to="/command/missions/$missionId" params={{ missionId: i.missionId }}>
                    <span className="ao-pill">{STATE_LABEL[i.state]}</span>
                    <strong>{i.title}</strong>
                    <small>
                      {i.who} · {i.mission}
                    </small>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
      <OfficeActivity
        missions={missions}
        tasks={tasks}
        active={missions.some((m) => m.status === "queued" || m.status === "running")}
      />
    </section>
  );
}

/**
 * The latest events across the workspace, read from the event log. While
 * work is active it refreshes, and new events refresh the office itself.
 */
function OfficeActivity({
  missions,
  tasks,
  active,
}: {
  missions: readonly WfMission[];
  tasks: readonly WfMissionTask[];
  active: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isError } = useQuery({
    queryKey: ["command", "workspace-events"],
    queryFn: () => getRecentWorkspaceEvents(),
    refetchInterval: active ? 5000 : false,
  });
  const newest = data?.[0]?.id;
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (newest === undefined) return;
    if (seen.current !== undefined && newest !== seen.current)
      void queryClient.invalidateQueries({ queryKey: ["command", "bootstrap"] });
    seen.current = newest;
  }, [newest, queryClient]);

  if (isError || !data?.length) return null;
  const titles = new Map(tasks.map((t) => [t.id, t.title]));
  const missionTitles = new Map(missions.map((m) => [m.id, m.title]));
  return (
    <div className="ao-activity">
      <h3>Latest activity</h3>
      <ol aria-live="polite">
        {data.slice(0, 6).map((e) => (
          <li key={e.id}>
            <time dateTime={e.createdAt}>
              {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
            <span>
              {describeEvent(e, e.taskId ? titles.get(e.taskId) : null).text}
              {e.missionId && missionTitles.get(e.missionId) ? (
                <small> · {missionTitles.get(e.missionId)}</small>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DeptCounts({ counts }: { counts: Record<OfficeState, number> }) {
  return (
    <>
      <dl>
        <div>
          <dt>Doing</dt>
          <dd>{counts.doing}</dd>
        </div>
        <div>
          <dt>Next</dt>
          <dd>{counts.next + counts.later}</dd>
        </div>
        <div>
          <dt>Done</dt>
          <dd>{counts.done}</dd>
        </div>
      </dl>
      {counts.waiting > 0 && <p className="ao-card-wait">{counts.waiting} waiting for you</p>}
    </>
  );
}
