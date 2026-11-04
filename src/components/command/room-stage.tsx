/**
 * The live stage: the case's recorded events arriving around the idea.
 *
 * Every chip is a real record — a saved finding, gap, assumption or specialist activity event.
 * On first view the recorded events replay in order; while the team is still working, new
 * events animate in as the record refreshes. Nothing here is generated for show.
 */
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import {
  ROOM_STREAMS,
  type RoomAgent,
  type RoomBadge,
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

function badgePhrase(badge: RoomBadge, count: number): string {
  switch (badge) {
    case "Source-backed":
      return `${count} source-backed`;
    case "User-provided":
      return `${count} user-provided`;
    case "Assumption":
      return `${count} assumption${count === 1 ? "" : "s"}`;
    case "Unverified":
      return `${count} unverified`;
    case "Team note":
      return `${count} team note${count === 1 ? "" : "s"}`;
    default: {
      const exhaustive: never = badge;
      return exhaustive;
    }
  }
}

function recordStatus(findings: RoomFinding[]): string {
  if (!findings.length) return "Nothing recorded on the investigation map yet.";
  const order: RoomBadge[] = [
    "Source-backed",
    "User-provided",
    "Assumption",
    "Unverified",
    "Team note",
  ];
  const parts = order.flatMap((badge) => {
    const count = findings.filter((finding) => finding.badge === badge).length;
    return count ? [badgePhrase(badge, count)] : [];
  });
  return `On the record: ${parts.join(" · ")}.`;
}

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
  missionId,
}: {
  idea: string;
  findings: RoomFinding[];
  agents: RoomAgent[];
  live: boolean;
  ariaLine: string;
  missionId: string;
}) {
  // How many recorded events are on stage. The first render (server and no-JS) shows every
  // recorded event settled; in the browser the record then replays in order.
  const [shown, setShown] = useState(findings.length);
  const [landed, setLanded] = useState<Set<string>>(() => new Set(findings.map((f) => f.id)));
  const [replayKey, setReplayKey] = useState(0);
  const [selectedStream, setSelectedStream] = useState<RoomStreamId | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
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
  const selected = findings.find((finding) => finding.id === selectedId) ?? null;
  const leftStreams = ROOM_STREAMS.filter((stream) => ANCHORS[stream.id].side === "l");
  const rightStreams = ROOM_STREAMS.filter((stream) => ANCHORS[stream.id].side === "r");
  const streamFindings = selectedStream
    ? findings.filter((finding) => finding.stream === selectedStream)
    : [];
  const streamLabel = ROOM_STREAMS.find((stream) => stream.id === selectedStream)?.label ?? null;

  const openFinding = (finding: RoomFinding) => {
    setSelectedStream(finding.stream);
    setSelectedId(finding.id);
    setSelectedAgent(null);
  };
  const agent = agents.find((item) => item.name === selectedAgent) ?? null;
  const replay = () => {
    setLanded(new Set());
    setShown(0);
    setReplayKey((k) => k + 1);
  };

  const renderStream = (stream: (typeof ROOM_STREAMS)[number]) => {
    const a = ANCHORS[stream.id];
    const items = byStream.get(stream.id) ?? [];
    return (
      <div key={stream.id} className="room-stream" data-side={a.side}>
        <span className="room-stream-label">
          {stream.label}
          <em>{items.length}</em>
        </span>
        {items.map((f) => (
          <button
            key={f.id}
            type="button"
            className="room-chip"
            tabIndex={-1}
            data-kind={f.kind}
            data-selected={selectedId === f.id ? "true" : "false"}
            data-landed={landed.has(f.id) ? "true" : "false"}
            data-from={a.side}
            title={`${f.badge}: ${f.statement}`}
            onClick={() => openFinding(f)}
          >
            <span className="room-chip-badge">{f.badge}</span>
            <span className="room-chip-text">{f.statement}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="room-invest">
      <p className="room-invest-status">{recordStatus(findings)}</p>
      <div className="room-stream-bar" role="group" aria-label="Investigation workstreams">
        {ROOM_STREAMS.map((stream) => {
          const count = findings.filter((finding) => finding.stream === stream.id).length;
          return (
            <button
              key={stream.id}
              type="button"
              className="room-stream-btn"
              aria-pressed={selectedStream === stream.id}
              onClick={() => {
                setSelectedStream(stream.id);
                setSelectedId(null);
                setSelectedAgent(null);
              }}
            >
              {stream.label}
              <span>{count}</span>
            </button>
          );
        })}
      </div>
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

        {/* Map columns sit beside the idea. The list below is the accessible copy. */}
        <div className="room-stage-field" aria-hidden="true">
          <div className="room-stage-col">{leftStreams.map(renderStream)}</div>
          <div className="room-stage-idea">
            <span className="room-mono">Your idea</span>
            <strong>{idea}</strong>
          </div>
          <div className="room-stage-col">{rightStreams.map(renderStream)}</div>
        </div>

        {/* Accessible and narrow-screen view of the same events. */}
        <ol className="room-stage-list" aria-label="Recorded investigation events">
          {visible
            .slice()
            .reverse()
            .map((f) => (
              <li key={f.id} data-kind={f.kind}>
                <button type="button" onClick={() => openFinding(f)}>
                  <span className="room-mono">{f.badge}</span> {f.statement}
                </button>
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
              {agents.map((member) => (
                <li key={member.name} data-state={member.state}>
                  <button
                    type="button"
                    className="room-agent"
                    aria-pressed={selectedAgent === member.name}
                    onClick={() => {
                      setSelectedAgent(selectedAgent === member.name ? null : member.name);
                      setSelectedId(null);
                    }}
                  >
                    <AgentAvatar name={member.name} role={member.role} size={30} />
                    <span>
                      <b>{member.name}</b> {member.task}
                    </span>
                    <i
                      aria-label={
                        member.state === "working"
                          ? "Working"
                          : member.state === "done"
                            ? "Done"
                            : "Waiting"
                      }
                    />
                  </button>
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
      {selected ? (
        <FindingDetail
          finding={selected}
          missionId={missionId}
          onBack={() => setSelectedId(null)}
        />
      ) : agent ? (
        <AgentDetail agent={agent} onBack={() => setSelectedAgent(null)} />
      ) : selectedStream && streamLabel ? (
        <section className="room-inspect" aria-label={`${streamLabel} events`}>
          <div className="room-inspect-head">
            <p>
              <b>{streamLabel}</b>
              <span className="room-mono">{streamFindings.length} recorded</span>
            </p>
            <button
              type="button"
              className="room-inspect-close"
              onClick={() => setSelectedStream(null)}
            >
              Close
            </button>
          </div>
          {streamFindings.length ? (
            <ul className="room-inspect-list">
              {streamFindings.map((finding) => (
                <li key={finding.id}>
                  <button type="button" onClick={() => openFinding(finding)}>
                    <span className="room-badge" data-badge={finding.badge}>
                      {finding.badge}
                    </span>
                    <span>{finding.statement}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="room-inspect-empty">No events recorded for {streamLabel}.</p>
          )}
        </section>
      ) : (
        <p className="room-invest-hint">
          Choose a workstream, a note on the map, or a specialist to read what was saved.
        </p>
      )}
    </div>
  );
}

function FindingDetail({
  finding,
  missionId,
  onBack,
}: {
  finding: RoomFinding;
  missionId: string;
  onBack: () => void;
}) {
  const stream = ROOM_STREAMS.find((item) => item.id === finding.stream)?.label ?? finding.stream;
  return (
    <section className="room-inspect" aria-label="Recorded event">
      <div className="room-inspect-head">
        <p>
          <span className="room-badge" data-badge={finding.badge}>
            {finding.badge}
          </span>
          <span className="room-mono">{stream}</span>
        </p>
        <button type="button" className="room-inspect-close" onClick={onBack}>
          All in {stream}
        </button>
      </div>
      <p className="room-inspect-statement">{finding.statement}</p>
      <FindingSource finding={finding} missionId={missionId} />
    </section>
  );
}

function AgentDetail({ agent, onBack }: { agent: RoomAgent; onBack: () => void }) {
  const state = agent.state === "working" ? "Working" : agent.state === "done" ? "Done" : "Waiting";
  return (
    <section className="room-inspect" aria-label={`${agent.name} on this case`}>
      <div className="room-inspect-head">
        <p>
          <span className="room-badge" data-badge="Team note">
            Team plan
          </span>
          <b>{agent.name}</b>
        </p>
        <button type="button" className="room-inspect-close" onClick={onBack}>
          Close
        </button>
      </div>
      <p className="room-inspect-statement">
        {agent.role}. {agent.task}
      </p>
      <p className="room-inspect-source">
        Status on the saved team plan: {state}. Not a quality mark.
      </p>
    </section>
  );
}

function FindingSource({ finding, missionId }: { finding: RoomFinding; missionId: string }) {
  return (
    <div className="room-inspect-source">
      {finding.source ? (
        <a href={finding.source} target="_blank" rel="noreferrer">
          {finding.source}
        </a>
      ) : finding.sourceNote ? (
        <p>Source on record: {finding.sourceNote}</p>
      ) : finding.badge === "Team note" ? (
        <p>Saved team activity. This is not an evidence row.</p>
      ) : (
        <p>No source recorded.</p>
      )}
      <Link
        to="/command/supervised/$missionId"
        params={{ missionId }}
        hash={finding.recordHref ? "mission-evidence" : "mission-record"}
      >
        {finding.recordHref ? "Open the evidence register" : "Open the full project record"}
      </Link>
    </div>
  );
}
