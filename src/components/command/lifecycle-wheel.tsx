import { useMemo, useRef, useState } from "react";
import { CircleDot, List } from "lucide-react";
import {
  SEGMENT_STATE_TEXT,
  WHEEL_MAPPING_VERSION,
  wheelView,
  type SegmentState,
} from "@/lib/workforce/lifecycle-wheel";
import { LIFECYCLE_STAGE_LABELS, type WfArtefact, type WfMissionTask } from "@/lib/workforce/types";
import "@/styles/lifecycle-wheel.css";

const SIZE = 320;
const C = SIZE / 2;
const OUTER = 150;
const INNER = 94;
const GAP_DEG = 1.6;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;
}

/** One ring segment from `start` to `end` degrees, clockwise from twelve o'clock. */
function arc(start: number, end: number) {
  const [x1, y1] = polar(OUTER, start);
  const [x2, y2] = polar(OUTER, end);
  const [x3, y3] = polar(INNER, end);
  const [x4, y4] = polar(INNER, start);
  return `M${x1} ${y1} A${OUTER} ${OUTER} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${INNER} ${INNER} 0 0 0 ${x4} ${y4} Z`;
}

const TASK_STATUS_TEXT: Record<WfMissionTask["status"], string> = {
  pending: "Not started",
  running: "Running",
  completed: "Complete",
  skipped: "Skipped",
  blocked: "Blocked",
  failed: "Failed",
};

/**
 * The product lifecycle as a wheel of twelve segments, with a list beside it
 * that says the same thing. Every state is read from the mission's task
 * records and every row links to the record it describes: nothing here moves
 * unless a task did.
 */
export function LifecycleWheel({
  tasks,
  artefacts,
  onOpenArtefact,
}: {
  tasks: WfMissionTask[];
  artefacts: WfArtefact[];
  onOpenArtefact: (artefactId: string) => void;
}) {
  const view = useMemo(() => wheelView(tasks), [tasks]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [mode, setMode] = useState<"wheel" | "list">("wheel");
  const segRefs = useRef<Record<string, SVGGElement | null>>({});
  const selectedId = chosen ?? view.focusId ?? view.segments[0]!.segment.id;
  const selectedIndex = view.segments.findIndex((s) => s.segment.id === selectedId);
  const selected = view.segments[selectedIndex]!;
  const step = 360 / view.segments.length;

  const move = (by: number) => {
    const next = view.segments[(selectedIndex + by + view.segments.length) % view.segments.length]!;
    setChosen(next.segment.id);
    segRefs.current[next.segment.id]?.focus();
  };

  return (
    <section className="lw" aria-labelledby="lw-title">
      <div className="lw-head">
        <div>
          <h3 id="lw-title" className="lw-title">
            Product lifecycle
          </h3>
          <p className="lw-note">
            Twelve views over the eight stored stages ({WHEEL_MAPPING_VERSION}). Each state comes
            from the tasks below.
          </p>
        </div>
        <div className="lw-toggle" role="group" aria-label="Lifecycle view">
          <button type="button" aria-pressed={mode === "wheel"} onClick={() => setMode("wheel")}>
            <CircleDot className="size-3.5" aria-hidden="true" /> Wheel
          </button>
          <button type="button" aria-pressed={mode === "list"} onClick={() => setMode("list")}>
            <List className="size-3.5" aria-hidden="true" /> List
          </button>
        </div>
      </div>

      <div className="lw-body" data-mode={mode}>
        <div className="lw-wheel-wrap">
          <svg
            className="lw-wheel"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="group"
            aria-label="Lifecycle wheel. Use the arrow keys to move between stages."
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(-1);
              }
            }}
          >
            {view.segments.map(({ segment, state }, i) => {
              const start = i * step + GAP_DEG / 2;
              const end = (i + 1) * step - GAP_DEG / 2;
              const [lx, ly] = polar((OUTER + INNER) / 2, (start + end) / 2);
              const isSelected = segment.id === selectedId;
              return (
                <g
                  key={segment.id}
                  className="lw-seg"
                  data-state={state}
                  data-selected={isSelected || undefined}
                  role="button"
                  tabIndex={isSelected ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={`${i + 1}. ${segment.label}: ${SEGMENT_STATE_TEXT[state]}`}
                  onClick={() => setChosen(segment.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setChosen(segment.id);
                    }
                  }}
                  ref={(el) => {
                    segRefs.current[segment.id] = el;
                  }}
                >
                  <path d={arc(start, end)} />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central">
                    {i + 1}
                  </text>
                </g>
              );
            })}
            <text className="lw-centre-label" x={C} y={C - 10} textAnchor="middle">
              {selected.segment.label}
            </text>
            <text className="lw-centre-state" x={C} y={C + 14} textAnchor="middle">
              {SEGMENT_STATE_TEXT[selected.state]}
            </text>
          </svg>
          <Legend />
        </div>

        <div className="lw-detail" aria-live="polite">
          <SegmentDetail
            index={selectedIndex}
            entry={selected}
            artefacts={artefacts}
            onOpenArtefact={onOpenArtefact}
          />
        </div>

        <ol className="lw-list" aria-label="Lifecycle stages">
          {view.segments.map((entry, i) => (
            <li key={entry.segment.id} data-state={entry.state}>
              <details open={entry.segment.id === view.focusId}>
                <summary>
                  <span className="lw-dot" aria-hidden="true" />
                  <span className="lw-list-label">
                    {i + 1}. {entry.segment.label}
                  </span>
                  <span className="lw-list-state">{SEGMENT_STATE_TEXT[entry.state]}</span>
                </summary>
                <SegmentDetail
                  index={i}
                  entry={entry}
                  artefacts={artefacts}
                  onOpenArtefact={onOpenArtefact}
                  compact
                />
              </details>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SegmentDetail({
  index,
  entry,
  artefacts,
  onOpenArtefact,
  compact = false,
}: {
  index: number;
  entry: ReturnType<typeof wheelView<WfMissionTask>>["segments"][number];
  artefacts: WfArtefact[];
  onOpenArtefact: (artefactId: string) => void;
  compact?: boolean;
}) {
  const { segment, state, tasks } = entry;
  return (
    <div className="lw-seg-detail" data-state={state}>
      {compact ? null : (
        <>
          <p className="lw-kicker">
            Stage {index + 1} of 12 · stored as “
            {LIFECYCLE_STAGE_LABELS[segment.stage].replace(/^\d+ · /, "")}”
          </p>
          <h4 className="lw-seg-title">
            {segment.label} <span className="lw-state-chip">{SEGMENT_STATE_TEXT[state]}</span>
          </h4>
        </>
      )}
      <p className="lw-summary">{segment.summary}</p>
      {!tasks.length ? (
        <p className="lw-empty">No task in this mission's plan belongs here.</p>
      ) : (
        <ul className="lw-tasks">
          {tasks.map((t) => {
            const outputs = artefacts.filter((a) => a.taskId === t.id);
            return (
              <li key={t.id}>
                <a href={`#task-${t.id}`} className="lw-task-link">
                  {t.title}
                </a>
                <span className="lw-task-status">
                  {t.gate && t.status === "blocked"
                    ? "Awaiting your decision"
                    : TASK_STATUS_TEXT[t.status]}
                </span>
                {outputs.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="lw-artefact-link"
                    onClick={() => onOpenArtefact(a.id)}
                  >
                    Open {a.title}
                  </button>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const LEGEND: SegmentState[] = ["idle", "active", "gate", "done", "failed"];

function Legend() {
  return (
    <ul className="lw-legend" aria-label="Key">
      {LEGEND.map((s) => (
        <li key={s} data-state={s}>
          <span className="lw-dot" aria-hidden="true" />
          {SEGMENT_STATE_TEXT[s]}
        </li>
      ))}
    </ul>
  );
}
