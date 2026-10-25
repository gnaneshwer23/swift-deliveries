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
const MISSION: Point[] = [
  {
    id: "question",
    name: "Question",
    role: "Product owner → Research Synthesis",
    input: "Why people leave during setup, and the constraints you set",
    output: "One bounded question for this sample",
    explanation:
      "People reach setup, and you do not yet know why some leave. That question is what moves. You hand it to Evidence. Nothing is approved here, and this is not customer research.",
    x: 14,
    y: 50,
    path: "M 14 50 C 14 26 26 26 37 26",
  },
  {
    id: "evidence",
    name: "Evidence",
    role: "Research Synthesis → Product Discovery",
    input: "The question, plus the setup notes you actually supplied",
    output: "A brief that keeps the gap open",
    explanation:
      "What moves is the sample note that setup asks for several details before the first useful action, and the missing record of where people leave. Evidence hands that brief to Options. Missing interviews stay missing.",
    x: 37,
    y: 26,
    path: "M 37 26 L 65 26",
    capability: "DX-020",
  },
  {
    id: "options",
    name: "Options",
    role: "Product Discovery → Review challenge",
    input: "The brief, including the abandonment gap",
    output: "Three options, and no chosen change",
    explanation:
      "What moves is the comparison: shorten the fields, defer optional details until after the first useful action, or explain why each detail is needed. Options hands that comparison to Challenge. No change in completion is claimed.",
    x: 65,
    y: 26,
    path: "M 65 26 C 80 26 86 38 86 50",
  },
  {
    id: "approval",
    name: "Owner decision",
    role: "Product owner · consequential scope stays with you",
    input: "The options, the challenge, and the missing abandonment evidence",
    output: "Approve a scoped investigation, ask for evidence, or reject",
    explanation:
      "Challenge hands you the objection: without abandonment evidence, the cause is unknown, so implementation is not justified. You choose the scope of the next investigation. Continuing here only explores the illustration; it records no real approval.",
    x: 86,
    y: 50,
    path: "M 86 50 C 86 76 76 76 65 76",
    gate: true,
  },
  {
    id: "experiment",
    name: "Experiment brief",
    role: "Experiment planning · proposed artefact",
    input: "The investigation you would allow",
    output: "A hypothesis and a measure, with no observed outcome",
    explanation:
      "What moves into the pack is a plan: defer optional details, then watch setup completion and time to the first useful action. The baseline is not supplied. This station is inside the export. It is not a second mission, and it reports no result.",
    x: 65,
    y: 76,
    path: "M 65 76 L 37 76",
  },
  {
    id: "record",
    name: "Decision pack",
    role: "Product record → your local copy",
    input: "The brief, the register, the decision, and the experiment brief",
    output: "Traceable sample documents",
    explanation:
      "The record connects the brief, evidence, decision and proposed experiment. Inspect or download the fixed sample documents below. A local download authorises no experiment or external action.",
    x: 37,
    y: 76,
    path: "M 37 76 L 37 76",
  },
];
const LEARNING: Point[] = [
  {
    id: "measure",
    name: "Measurement plan",
    role: "Product owner",
    input: "A hypothesis and success question",
    output: "Expected metric, baseline and observation window",
    explanation:
      "Decide what you would measure before making a change. Expected outcomes are hypotheses, not observed results.",
    x: 17,
    y: 48,
    path: "M 17 48 C 17 23 35 23 49 23",
  },
  {
    id: "change",
    name: "Inspectable change",
    role: "Product and engineering disciplines",
    input: "Approved experiment scope",
    output: "An artefact to inspect",
    explanation:
      "Connect the proposed change to its decision and acceptance criteria. Runtime execution and deployment require their own evidence.",
    x: 49,
    y: 23,
    path: "M 49 23 C 75 23 82 35 82 48",
  },
  {
    id: "observe",
    name: "Observed evidence",
    role: "You supply actual results",
    input: "Genuine feedback or measured observations",
    output: "Source-linked outcome material",
    explanation:
      "Bring a result you actually saw. DeliverX does not measure it. This illustration does not collect telemetry or invent a result.",
    x: 82,
    y: 48,
    path: "M 82 48 C 82 70 78 78 67 78",
  },
  {
    id: "compare",
    name: "Outcome review",
    role: "Outcome review",
    input: "Expected result and supplied observation",
    output: "Comparison, limitations and open questions",
    explanation:
      "On a supervised mission the owner compares the expected metric with a result they supplied. The review is versioned and keeps the uncertainty in words. This scene does not store that review.",
    x: 67,
    y: 78,
    path: "M 67 78 L 30 78",
  },
  {
    id: "next",
    name: "Next question",
    role: "Human-directed follow-up",
    input: "Review findings and unresolved assumptions",
    output: "A proposed next mission",
    explanation:
      "A review can propose one next question. On a supervised mission that proposal stays inactive until a person approves it. This scene does not start a mission.",
    x: 30,
    y: 78,
    path: "M 30 78 C 12 78 17 65 17 48",
    gate: true,
  },
];
const TRUST: Point[] = [
  {
    id: "proposal",
    name: "Proposed action",
    role: "Specialist recommendation",
    input: "The intended action and target",
    output: "A scoped proposal",
    explanation:
      "An agent proposes the work. The proposal itself is not permission to act, spend or contact an external service.",
    x: 12,
    y: 53,
    path: "M 12 53 C 18 38 24 38 32 38",
  },
  {
    id: "permissions",
    name: "Permission scope",
    role: "Deterministic server controls",
    input: "Workspace, actor and allowed action",
    output: "An allowed scope or a block",
    explanation:
      "Permissions constrain which workspace and actions are allowed. Review enabled safeguards and access scope before starting sensitive work.",
    x: 32,
    y: 38,
    path: "M 32 38 L 52 34",
  },
  {
    id: "budget",
    name: "Usage ceiling",
    role: "Budget enforcement",
    input: "Approved allowance and usage",
    output: "Continue within limits or pause",
    explanation:
      "Usage ceilings stop further work when exhausted. Workflow credits and model spending are different limits; cash-based model budgets are still being developed.",
    x: 52,
    y: 34,
    path: "M 52 34 L 72 44",
  },
  {
    id: "approval",
    name: "Human authority",
    role: "You approve consequential work",
    input: "Evidence, target, scope and risks",
    output: "Approval, rejection or revision",
    explanation:
      "Human lifecycle gates cannot be passed by an agent. Example continuation here is local only; it grants no tool access and performs no external action.",
    x: 72,
    y: 44,
    path: "M 72 44 C 85 44 89 53 89 65",
    gate: true,
  },
  {
    id: "audit",
    name: "Audit record",
    role: "Inspection and accountability",
    input: "Actor, decision and artefact history",
    output: "A reviewable work record",
    explanation:
      "Keep who decided what alongside the evidence and output. Agent review, executed tests, human review and external attestation are distinct assurance labels.",
    x: 89,
    y: 65,
    path: "M 89 65 L 89 65",
  },
];
type SceneKind = "record" | "team" | "mission" | "learning" | "trust";
const SCENES = {
  record: {
    points: RECORD,
    title: "What this record holds",
    image: "connected-record-v1",
    alt: "A central archive connects sources, decisions, artefacts and observations.",
    to: "/psi",
    hash: "product-brain",
    link: "Explore Product Brain",
    note: "Sources, decisions, and export history are the present record. A full knowledge graph is still planned.",
  },
  team: {
    points: TEAM,
    title: "An example of work passed along",
    image: "specialist-workbench-v1",
    alt: "A specialist workbench connects research, strategy, design, review and human approval.",
    to: "/ai-agents",
    link: "Browse the role directory",
    note: "Example only. It is not a live team, and continuing here does not approve a workspace mission.",
  },
  mission: {
    points: MISSION,
    title: "One example: why people leave during setup",
    image: "mission-workbench-v1",
    alt: "A product question flows through evidence, alternatives, human approval and an experiment brief into a mission archive.",
    to: "/how-it-works",
    hash: "sample-record",
    link: "Open the sample documents",
    note: "One hypothetical mission. You control consequential scope; downloading a sample records no approval.",
  },
  learning: {
    points: LEARNING,
    title: "Review a result you supply",
    image: "learning-workbench-v1",
    alt: "A circular workbench links a measurement plan, change, supplied observations, outcome comparison and a human-reviewed next question.",
    to: "/psi",
    hash: "product-brain",
    link: "Explore the learning direction",
    note: "Illustration only. This scene does not measure a result or start a mission.",
  },
  trust: {
    points: TRUST,
    title: "Checks before a consequential step",
    image: "trust-workbench-v1",
    alt: "A proposed action passes permission, budget and human-approval checkpoints before a reviewable audit record.",
    to: "/security",
    link: "Inspect the safeguards",
    note: "Safeguard explanation, not a security certification. No permissions, budget or workspace records are changed.",
  },
} as const;

export function SectionExplorer({ kind }: { kind: SceneKind }) {
  const scene = SCENES[kind];
  const points: Point[] = scene.points;
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
    <div className={`section-explorer section-explorer-${kind}`} ref={ref} aria-label={scene.title}>
      <div className="section-explorer-toolbar">
        <span>{scene.title}</span>
        <div>
          <button
            type="button"
            onClick={() => {
              if (point.gate && !approved) {
                setWaiting(true);
                setPlaying(false);
                return;
              }
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
            src={`/illustrations/${scene.image}.webp`}
            width="1536"
            height="1024"
            alt={scene.alt}
            loading="lazy"
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker
                id={`${id}-arrow`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#795bc9" />
              </marker>
            </defs>
            <path d={point.path} className="section-active-path" markerEnd={`url(#${id}-arrow)`} />
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
              Explore next handoff <ArrowRight size={14} />
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
            <small className="section-example-approved">
              Example handoff explored. No workspace approval recorded.
            </small>
          )}
          {"hash" in scene ? (
            <Link to={scene.to} hash={scene.hash} className="section-explorer-destination">
              {scene.link}
              <ArrowRight size={13} />
            </Link>
          ) : (
            <Link to={scene.to} className="section-explorer-destination">
              {scene.link}
              <ArrowRight size={13} />
            </Link>
          )}
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
        does not certify live execution. {scene.note}
      </p>
    </div>
  );
}
