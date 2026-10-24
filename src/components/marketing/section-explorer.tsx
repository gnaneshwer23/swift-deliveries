import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Pause, RotateCcw } from "lucide-react";
import { downloadText } from "@/lib/marketing/product-resources";
import { capabilityRegistryData } from "@/lib/workforce/registry/data";

type Point = {
  id: string;
  name: string;
  role: string;
  input: string;
  output: string;
  explanation: string;
  x: number;
  y: number;
  path: string;
  capability?: string;
  gate?: boolean;
};
const RECORD: Point[] = [
  {
    id: "sources",
    name: "Sources",
    role: "Research Synthesis",
    input: "Your brief, source links and genuine notes",
    output: "Evidence register",
    explanation:
      "Keep each observation attached to its origin. Missing evidence stays a visible question.",
    x: 18,
    y: 49,
    path: "M 18 49 L 50 49",
    capability: "DX-020",
  },
  {
    id: "memory",
    name: "Product record",
    role: "Shared product context",
    input: "Evidence and product constraints",
    output: "Context for a decision",
    explanation:
      "The product record keeps the objective, evidence and decisions together. A complete interactive knowledge graph remains planned.",
    x: 50,
    y: 49,
    path: "M 50 49 L 50 22",
  },
  {
    id: "decision",
    name: "Decision",
    role: "Specialist panel + you",
    input: "Context, alternatives and unresolved questions",
    output: "Decision with rationale",
    explanation:
      "Inspect alternatives, trade-offs and dissent. High-impact or weakly evidenced recommendations come to you.",
    x: 50,
    y: 22,
    path: "M 50 22 C 67 22 82 30 82 49",
  },
  {
    id: "artefacts",
    name: "Artefacts",
    role: "Design + Engineering",
    input: "Approved scope and decision references",
    output: "Versioned product work",
    explanation:
      "Connect the prototype and documents to the decision behind them. A document is not proof of a runtime test or deployment.",
    x: 82,
    y: 49,
    path: "M 82 49 C 82 68 67 78 50 78",
  },
  {
    id: "observations",
    name: "Observations",
    role: "Product owner",
    input: "A baseline, observation window and actual result",
    output: "Evidence for the next question",
    explanation:
      "You supply what happened. Connected outcome collection and automatic learning are planned; missing results are never invented.",
    x: 50,
    y: 78,
    path: "M 50 78 L 50 49",
  },
];
const TEAM: Point[] = [
  {
    id: "research",
    name: "Research",
    role: "Research Synthesis",
    input: "Product question and supplied sources",
    output: "Evidence brief",
    explanation:
      "Summarise what is supported, distinguish assumptions and pass open questions forward.",
    x: 13,
    y: 50,
    path: "M 13 50 C 13 28 28 28 38 28",
    capability: "DX-020",
  },
  {
    id: "strategy",
    name: "Product strategy",
    role: "Product Strategy",
    input: "Evidence brief and constraints",
    output: "Options and trade-offs",
    explanation:
      "Compare possible approaches before committing to scope. This role is in the planned catalogue, not a promise of live autonomous execution.",
    x: 38,
    y: 28,
    path: "M 38 28 L 65 28",
    capability: "DX-022",
  },
  {
    id: "design-build",
    name: "Design + Engineering",
    role: "Wireframing + Software Architect",
    input: "Proposed scope and chosen direction",
    output: "Interface and architecture proposal",
    explanation:
      "Design and architecture develop in parallel around the same product objective, rather than working from disconnected briefs.",
    x: 65,
    y: 28,
    path: "M 65 28 C 82 28 87 38 87 50",
    capability: "DX-041",
  },
  {
    id: "review",
    name: "Independent review",
    role: "Code Review + review disciplines",
    input: "Proposed artefacts and acceptance criteria",
    output: "Findings, dissent and blockers",
    explanation:
      "Challenge the work before it reaches you. Security vetoes and unresolved blockers are preserved, not averaged away.",
    x: 87,
    y: 50,
    path: "M 87 50 C 87 76 75 76 65 76",
    capability: "DX-049",
  },
  {
    id: "human",
    name: "Your approval",
    role: "Product owner",
    input: "Recommendation, evidence and review findings",
    output: "Approve, reject or request more evidence",
    explanation:
      "The walkthrough pauses here. Continuing approves this example handoff only; it cannot approve a workspace mission.",
    x: 65,
    y: 76,
    path: "M 65 76 L 38 76",
    gate: true,
  },
  {
    id: "output",
    name: "Reviewable output",
    role: "You inspect and keep the work",
    input: "Approved example scope",
    output: "Product documents and inspection record",
    explanation:
      "Take the work and the reasoning together. Production code execution, automatic deployment and connected learning are outside this example.",
    x: 38,
    y: 76,
    path: "M 38 76 L 38 76",
  },
];
export function SectionExplorer({ kind }: { kind: "record" | "team" }) {
  const points = kind === "record" ? RECORD : TEAM;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replaceAll(":", "");
  const point = points[index]!;
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
  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setTimeout(() => {
      const next = index + 1;
      if (next >= points.length) {
        setPlaying(false);
        return;
      }
      setIndex(next);
      if (points[next]?.gate && !approved) {
        setWaiting(true);
        setPlaying(false);
      }
    }, 2300);
    return () => window.clearTimeout(timer);
  }, [playing, visible, index, points, approved]);
  const select = (next: number) => {
    setIndex(next);
    setPlaying(false);
    setWaiting(false);
  };
  const restart = () => {
    setIndex(0);
    setApproved(false);
    setWaiting(false);
    setPlaying(true);
  };
  const capability = point.capability
    ? capabilityRegistryData.capabilities.find((c) => c.capability_id === point.capability)
    : undefined;
  const markdown = `# ${point.output}\n\nIllustrative DeliverX handoff template — no live mission executed.\n\n## Contributor\n${point.role}\n\n## Required input\n${point.input}\n\n## Output\n${point.output}\n\n## Review questions\n- Which source supports this?\n- What is still assumed or missing?\n- Who must inspect or approve the next step?\n\n## Your notes\n[Add genuine evidence and decisions here.]\n`;
  return (
    <div
      className={`section-explorer section-explorer-${kind}`}
      ref={ref}
      aria-label={
        kind === "record"
          ? "Explore the connected product record"
          : "Explore specialist team handoffs"
      }
    >
      <div className="section-explorer-toolbar">
        <span>
          {kind === "record" ? "Follow a product record" : "Follow the specialist handoffs"}
        </span>
        <div>
          <button
            type="button"
            onClick={() => {
              if (index === points.length - 1) restart();
              else setPlaying(!playing);
            }}
            disabled={waiting}
            aria-label={`${playing ? "Pause" : "Play"} ${kind} walkthrough`}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
            {waiting ? "Your decision needed" : playing ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={restart} aria-label={`Restart ${kind} walkthrough`}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div className="section-explorer-layout">
        <div className="section-explorer-visual">
          <img
            src={`/illustrations/${kind === "record" ? "connected-record-v1" : "specialist-workbench-v1"}.webp`}
            width="1536"
            height="1024"
            alt={
              kind === "record"
                ? "A central product archive connects sources, decisions, artefacts and observations."
                : "An illustrated workbench connects research, strategy, parallel design and architecture, independent review, a human approval gate and an output folio."
            }
            loading="lazy"
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={point.path} className="section-active-path" />
            {playing && visible && !reduced && !(index === points.length - 1) && (
              <circle r=".8" fill="#795bc9">
                <animateMotion dur="2.3s" repeatCount="indefinite" path={point.path} />
              </circle>
            )}
          </svg>
          <div className="section-explorer-hotspots">
            {points.map((p, i) => (
              <button
                key={p.id}
                type="button"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={i === index ? "is-selected" : ""}
                data-edge={p.x > 80 ? "right" : p.x < 15 ? "left" : undefined}
                onClick={() => select(i)}
                aria-label={`Inspect ${kind} ${p.name}`}
                aria-pressed={i === index}
                aria-controls={`${id}-detail`}
              >
                <span className="section-explorer-dot" />
                <span className="section-explorer-label">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div id={`${id}-detail`} className="section-explorer-detail" aria-live="polite">
          <p className="section-explorer-role">
            {point.role}
            {capability && (
              <span>
                {capability.lifecycle_status} · {capability.capability_id}
              </span>
            )}
          </p>
          <h3>{point.name}</h3>
          <p>{point.explanation}</p>
          <dl>
            <div>
              <dt>Receives</dt>
              <dd>{point.input}</dd>
            </div>
            <div>
              <dt>Passes forward</dt>
              <dd>{point.output}</dd>
            </div>
          </dl>
          {waiting ? (
            <button
              type="button"
              className="section-explorer-action"
              onClick={() => {
                setApproved(true);
                setWaiting(false);
                setPlaying(true);
              }}
            >
              Approve example handoff <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="section-explorer-action"
              onClick={() => downloadText(`deliverx-${kind}-${point.id}.md`, markdown)}
            >
              Download handoff template <ArrowRight size={14} />
            </button>
          )}
          {approved && (
            <small className="section-example-approved">Approved for this example only.</small>
          )}
          <Link
            to={kind === "record" ? "/product-brain" : "/ai-agents"}
            className="section-explorer-destination"
          >
            {kind === "record" ? "Explore Product Brain" : "Browse the role directory"}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
      <div
        className="section-explorer-stages"
        role="group"
        aria-label={`${kind} walkthrough stages`}
      >
        {points.map((p, i) => (
          <button type="button" key={p.id} aria-pressed={index === i} onClick={() => select(i)}>
            <span>{i + 1}</span>
            {p.name}
          </button>
        ))}
      </div>
      <p className="section-explorer-note">
        Interactive concept · click a labelled object to inspect its contribution. Catalogue status
        does not certify live execution.
        {kind === "record"
          ? " Connected outcome tracking remains planned."
          : " Human gates control real missions; this example changes no workspace data."}
      </p>
    </div>
  );
}
