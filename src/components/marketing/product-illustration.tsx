import { useEffect, useId, useRef, useState } from "react";

type Node = { label: string; role: string; x: number; y: number; gate?: boolean };
type Diagram = { label: string; nodes: Node[]; edges: [number, number][]; note: string };
const DIAGRAMS = {
  "product-brain": {
    label: "Evidence becomes product memory",
    nodes: [
      { label: "Sources", role: "You + Research", x: 95, y: 90 },
      { label: "Brief", role: "Product owner", x: 95, y: 250 },
      { label: "Evidence", role: "Research Synthesis", x: 285, y: 170 },
      { label: "Decision", role: "Panel + you", x: 475, y: 170 },
      { label: "Artefacts", role: "Design + Engineering", x: 665, y: 170 },
    ],
    edges: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    note: "Source references and decision history travel with the work.",
  },
  "specialist-team": {
    label: "Specialists contribute. Reviewers challenge.",
    nodes: [
      { label: "Objective", role: "You", x: 95, y: 170 },
      { label: "Research", role: "Evidence brief", x: 285, y: 80 },
      { label: "Product", role: "Options + trade-offs", x: 285, y: 260 },
      { label: "Challenge", role: "Security + Engineering", x: 475, y: 170 },
      { label: "Your call", role: "Human approval", x: 665, y: 170, gate: true },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
    ],
    note: "This is a sample team structure; enabled capabilities vary by mission.",
  },
  "evidence-decision": {
    label: "From evidence to a judgement",
    nodes: [
      { label: "Evidence", role: "Research Synthesis", x: 95, y: 170 },
      { label: "Option A", role: "Product recommendation", x: 285, y: 80 },
      { label: "Option B", role: "Alternative approach", x: 285, y: 260 },
      { label: "Challenge", role: "Reviewers + veto rules", x: 475, y: 170 },
      { label: "Decide", role: "Panel / your call", x: 665, y: 170, gate: true },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
    ],
    note: "Dissent stays in the record. High-impact decisions escalate to you.",
  },
  "human-direction": {
    label: "Approval controls the next handoff",
    nodes: [
      { label: "Proposal", role: "Specialist team", x: 95, y: 170 },
      { label: "Review", role: "Evidence + risks", x: 285, y: 170 },
      { label: "You", role: "Approve or return", x: 475, y: 170, gate: true },
      { label: "Next task", role: "Approved scope only", x: 665, y: 170 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    note: "The moving trace illustrates a handoff; it never approves real work.",
  },
  "product-delivery": {
    label: "From approved scope to reviewable output",
    nodes: [
      { label: "PRD", role: "Product", x: 95, y: 170 },
      { label: "UX", role: "Design", x: 285, y: 80 },
      { label: "Architecture", role: "Engineering", x: 285, y: 260 },
      { label: "Prototype", role: "Build + QA review", x: 475, y: 170 },
      { label: "Inspect", role: "You + project export", x: 665, y: 170 },
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [3, 4],
    ],
    note: "A reviewable prototype is distinct from runtime-tested, deployed software.",
  },
  "learning-loop": {
    label: "Observation informs the next question",
    nodes: [
      { label: "Decision", role: "Expected result", x: 95, y: 170 },
      { label: "Build", role: "Inspectable artefact", x: 285, y: 170 },
      { label: "Observe", role: "You supply results", x: 475, y: 170 },
      { label: "Next question", role: "Proposed mission", x: 665, y: 170 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    note: "Connected measurement and automatic learning remain planned.",
  },
} satisfies Record<string, Diagram>;
export const ILLUSTRATIONS = DIAGRAMS;
export type IllustrationName = keyof typeof DIAGRAMS;

/** Code-native explanatory diagrams: real text, explicit direction, optional motion. */
export function ProductIllustration({
  name,
  caption,
  compact = false,
}: {
  name: IllustrationName;
  caption?: string | undefined;
  priority?: boolean;
  compact?: boolean;
}) {
  const diagram: Diagram = DIAGRAMS[name];
  const id = useId().replaceAll(":", "");
  const ref = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  const moving = playing && visible && !reduced;
  return (
    <figure ref={ref} className={`psi-process${compact ? " psi-process-compact" : ""}`}>
      <div className="psi-process-top">
        <span>{diagram.label}</span>
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          aria-label={`${playing ? "Pause" : "Play"} ${diagram.label} flow`}
          aria-pressed={playing}
          disabled={reduced}
        >
          {reduced ? "Static view" : playing ? "Pause flow" : "Play flow"}
        </button>
      </div>
      <svg
        className="psi-process-svg"
        viewBox="0 0 760 340"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>{diagram.label}</title>
        <desc id={`${id}-desc`}>
          {diagram.edges
            .map(([a, b]) => `${diagram.nodes[a]!.label} to ${diagram.nodes[b]!.label}`)
            .join("; ")}
          . {diagram.note}
        </desc>
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8881d4" />
          </marker>
        </defs>
        {diagram.edges.map(([a, b], i) => {
          const from = diagram.nodes[a]!;
          const to = diagram.nodes[b]!;
          const backwards = b < a;
          const mid = (from.x + to.x) / 2;
          const d = backwards
            ? `M ${from.x} ${from.y + 30} C ${from.x} 330 ${to.x} 330 ${to.x} ${to.y + 30}`
            : `M ${from.x + 65} ${from.y} C ${mid} ${from.y} ${mid} ${to.y} ${to.x - 70} ${to.y}`;
          return (
            <g key={i}>
              <path d={d} className="psi-process-edge" markerEnd={`url(#${id}-arrow)`} />
              {moving && (
                <circle r="3" fill="#6d5ce7">
                  <animateMotion
                    dur={`${2 + i * 0.15}s`}
                    begin="0s"
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              )}
            </g>
          );
        })}
        {diagram.nodes.map((node, i) => (
          <g
            key={i}
            transform={`translate(${node.x},${node.y})`}
            className={node.gate ? "psi-process-gate" : "psi-process-node"}
          >
            <rect x="-65" y="-28" width="130" height="56" rx={node.gate ? 20 : 12} />
            <text textAnchor="middle" y="-2" className="psi-process-label">
              {node.label}
            </text>
            <text textAnchor="middle" y="16" className="psi-process-role">
              {node.role}
            </text>
          </g>
        ))}
      </svg>
      <ol className="psi-process-mobile">
        {diagram.nodes.map((node, i) => (
          <li key={i} className={node.gate ? "is-gate" : ""}>
            <strong>{node.label}</strong>
            <span>
              {node.role}
              <small>
                {diagram.edges.filter(([, target]) => target === i).length > 0
                  ? `From ${diagram.edges
                      .filter(([, target]) => target === i)
                      .map(([source]) => diagram.nodes[source]!.label)
                      .join(" + ")}`
                  : "Mission input"}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        {diagram.note}
        {caption && <span> {caption}</span>}
      </figcaption>
    </figure>
  );
}
