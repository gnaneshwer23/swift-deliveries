/**
 * The live stage: the case's recorded events arriving around the idea.
 *
 * Every chip is a real record — a saved finding, gap, assumption or specialist activity event.
 * On first view the recorded events replay in order; while the team is still working, new
 * events animate in as the record refreshes. Nothing here is generated for show.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import {
  ROOM_STREAMS,
  type RoomAgent,
  type RoomFinding,
  type RoomStreamId,
} from "@/lib/pilot-mission/room-story";

const ANCHORS: Record<RoomStreamId, { x: number; y: number; side: "l" | "r" }> = {
  market: { x: 0.04, y: 0.04, side: "l" },
  users: { x: 0.96, y: 0.04, side: "r" },
  competition: { x: 0.04, y: 0.36, side: "l" },
  risks: { x: 0.96, y: 0.36, side: "r" },
  opportunities: { x: 0.04, y: 0.68, side: "l" },
  direction: { x: 0.96, y: 0.68, side: "r" },
};

const PER_STREAM = 2;
const KIND_LABEL: Record<RoomFinding["kind"], string> = {
  finding: "Finding",
  gap: "Open question",
  assumption: "Assumption",
  activity: "Team",
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function RoomStage({
  idea,
  findings,
  agents,
  live,
  ariaLine,
}: {
  idea: string;
  findings: RoomFinding[];
  agents: RoomAgent[];
  live: boolean;
  ariaLine: string;
}) {
  // How many recorded events are on stage. The first render (server and no-JS) shows every
  // recorded event settled; in the browser the record then replays in order.
  const [shown, setShown] = useState(findings.length);
  const [landed, setLanded] = useState<Set<string>>(() => new Set(findings.map((f) => f.id)));
  const [replayKey, setReplayKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setLanded(new Set());
    setShown(0);
    // Replay once on mount only; later records animate in as they arrive.
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(findings.length);
      return;
    }
    if (shown >= findings.length) return;
    const gap = Math.max(260, Math.min(700, 6000 / Math.max(1, findings.length)));
    timer.current = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 500 : gap);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [shown, findings.length, replayKey]);

  // A chip renders at its entry point first, then lands on the next frame (CSS transition).
  const visible = findings.slice(0, shown);
  useEffect(() => {
    const pending = visible.filter((f) => !landed.has(f.id));
    if (!pending.length) return;
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setLanded((prev) => {
          const next = new Set(prev);
          for (const f of pending) next.add(f.id);
          return next;
        }),
      ),
    );
    return () => cancelAnimationFrame(frame);
  }, [visible, landed]);

  const byStream = useMemo(() => {
    const groups = new Map<RoomStreamId, RoomFinding[]>();
    for (const f of visible) groups.set(f.stream, [...(groups.get(f.stream) ?? []), f]);
    return groups;
  }, [visible]);

  const done = shown >= findings.length;
  const replay = () => {
    setLanded(new Set());
    setShown(0);
    setReplayKey((k) => k + 1);
  };

  return (
    <div className="room-stage" data-live={live ? "true" : "false"}>
      <div className="room-stage-grain" aria-hidden="true" />
      <div className="room-stage-floor" aria-hidden="true" />

      <div className="room-stage-top">
        <span className="room-mono">
          {live ? "Team working" : "Investigation"} · {Math.min(shown, findings.length)}/
          {findings.length} events
        </span>
        {!live && done && findings.length > 0 ? (
          <button type="button" className="room-stage-replay" onClick={replay}>
            Replay
          </button>
        ) : null}
      </div>

      <div className="room-stage-idea">
        <span className="room-mono">Your idea</span>
        <strong>{idea}</strong>
      </div>

      {/* Desktop field: chips fly in and settle beside their workstream. */}
      <div className="room-stage-field" aria-hidden="true">
        {ROOM_STREAMS.map((stream) => {
          const a = ANCHORS[stream.id];
          const items = byStream.get(stream.id) ?? [];
          return (
            <div
              key={stream.id}
              className="room-stream"
              data-side={a.side}
              style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
            >
              <span className="room-stream-label">
                {stream.label}
                <em>{items.length}</em>
              </span>
              {items.slice(-PER_STREAM).map((f) => (
                <span
                  key={f.id}
                  className="room-chip"
                  data-kind={f.kind}
                  data-landed={landed.has(f.id) ? "true" : "false"}
                  data-from={a.side}
                  title={`${KIND_LABEL[f.kind]}: ${f.text}`}
                >
                  {f.text}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Accessible and narrow-screen view of the same events. */}
      <ol className="room-stage-list" aria-label="Recorded investigation events">
        {visible
          .slice()
          .reverse()
          .slice(0, 6)
          .map((f) => (
            <li key={f.id} data-kind={f.kind}>
              <span className="room-mono">{KIND_LABEL[f.kind]}</span> {f.text}
            </li>
          ))}
        {findings.length === 0 ? (
          <li>
            <span className="room-mono">Waiting</span> No events recorded yet.
          </li>
        ) : null}
      </ol>

      <div className="room-stage-foot">
        {agents.length ? (
          <ul className="room-agents" aria-label="Specialists on this investigation">
            {agents.map((agent) => (
              <li key={agent.name} data-state={agent.state}>
                <AgentAvatar name={agent.name} role={agent.role} size={30} />
                <span>
                  <b>{agent.name}</b> {agent.task}
                </span>
                <i
                  aria-label={
                    agent.state === "working"
                      ? "Working"
                      : agent.state === "done"
                        ? "Done"
                        : "Waiting"
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <div className="room-aria-line" aria-live="polite">
          <AgentAvatar name="Aria" role="Product Manager" size={34} />
          <p>
            <b>Aria</b>
            {ariaLine}
          </p>
        </div>
      </div>
    </div>
  );
}
