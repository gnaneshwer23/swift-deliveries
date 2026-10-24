/**
 * Sample programme visuals use the blueprint and deliberation engine.
 * These are demonstrations, not evidence of a real mission or deployment.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { generateRoadmap, allStaffed } from "@/lib/programme/blueprint";
import { deliberate } from "@/lib/programme/deliberation";
import { member } from "@/lib/programme/roster";
import { listCapabilities, listDepartments } from "@/lib/workforce/registry";
import { CRITERION_LABELS, type BusinessCase, type DecisionRecord } from "@/lib/programme/types";

const SAMPLE_CASE: BusinessCase = {
  name: "PayNudge",
  idea: "An invoicing and late-payment assistant that drafts invoices, tracks payment status and nudges clients politely.",
  targetUsers: "UK freelancers, small creative agencies",
  problem: "Freelancers lose hours chasing late payments.",
  goals: "500 paying users in 6 months.",
  constraints: "UK only at launch.",
  timelineWeeks: 16,
  budgetCredits: 400,
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, inView];
}

// ---------------------------------------------------------------------------
// Live programme flow (hero)
// ---------------------------------------------------------------------------

type FlowNode = { id: string; label: string; x: number; y: number; gate?: boolean; phase?: string };

const NODES: FlowNode[] = [
  { id: "idea", label: "Idea", x: 70, y: 190 },
  { id: "market", label: "Market", x: 230, y: 90, phase: "discovery" },
  { id: "research", label: "Research", x: 230, y: 190, phase: "discovery" },
  { id: "foresight", label: "Foresight", x: 230, y: 290, phase: "discovery" },
  { id: "decide", label: "Decide", x: 390, y: 190, phase: "discovery" },
  { id: "g1", label: "You", x: 505, y: 190, gate: true },
  { id: "define", label: "PRD", x: 615, y: 190, phase: "definition" },
  { id: "g2", label: "You", x: 725, y: 190, gate: true },
  { id: "ux", label: "UX", x: 835, y: 120, phase: "design" },
  { id: "arch", label: "Architecture", x: 835, y: 260, phase: "design" },
  { id: "g3", label: "You", x: 950, y: 190, gate: true },
  { id: "build", label: "Sprints", x: 1060, y: 190, phase: "build" },
  { id: "verify", label: "Verify", x: 1190, y: 190, phase: "verification" },
  { id: "g4", label: "You", x: 1320, y: 190, gate: true },
  { id: "launch", label: "Launch", x: 1450, y: 190, phase: "launch" },
];
const EDGES: Array<[string, string]> = [
  ["idea", "market"],
  ["idea", "research"],
  ["idea", "foresight"],
  ["market", "decide"],
  ["research", "decide"],
  ["foresight", "decide"],
  ["decide", "g1"],
  ["g1", "define"],
  ["define", "g2"],
  ["g2", "ux"],
  ["g2", "arch"],
  ["ux", "g3"],
  ["arch", "g3"],
  ["g3", "build"],
  ["build", "verify"],
  ["verify", "g4"],
  ["g4", "launch"],
];
const ORDER = [
  ["idea"],
  ["market", "research", "foresight"],
  ["decide"],
  ["g1"],
  ["define"],
  ["g2"],
  ["ux", "arch"],
  ["g3"],
  ["build"],
  ["verify"],
  ["g4"],
  ["launch"],
];

/** One label per ORDER group, for the stacked mobile layout. */
const MOBILE_STEPS = [
  "Idea",
  "Discovery · 3 parallel tracks",
  "Team decision",
  "You approve",
  "PRD & roadmap",
  "You approve",
  "UX & architecture",
  "You approve",
  "Build sprints",
  "Verify",
  "You approve",
  "Launch",
];

export function LiveProgrammeFlow() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const [step, setStep] = useState(ORDER.length - 1);
  const [playing, setPlaying] = useState(true);
  const byId = useMemo(() => new Map(NODES.map((n) => [n.id, n])), []);

  const agentsPerPhase = useMemo(() => {
    const r = generateRoadmap(SAMPLE_CASE, "landing");
    const out: Record<string, number> = {};
    for (const p of ["discovery", "definition", "design", "build", "verification", "launch"]) {
      out[p] = allStaffed({ ...r, items: r.items.filter((i) => i.phase === p) }).size;
    }
    return out;
  }, []);

  useEffect(() => {
    if (reduced || !inView || !playing) return;
    setStep(0);
    const t = window.setInterval(() => setStep((s) => (s + 1) % (ORDER.length + 2)), 1100);
    return () => window.clearInterval(t);
  }, [reduced, inView, playing]);

  const stateOf = (id: string) => {
    const idx = ORDER.findIndex((g) => g.includes(id));
    return idx < step ? "done" : idx === step ? "active" : "idle";
  };
  const activeGate = ORDER[step]?.find((id) => byId.get(id)?.gate);

  return (
    <div
      ref={ref}
      className={`dxl-flow${!playing ? " is-paused" : ""}`}
      aria-label="A programme flows from idea through parallel discovery, a team decision, four founder approval gates, design, build sprints and verification to launch."
    >
      <button
        type="button"
        className="psi-flow-toggle"
        aria-pressed={playing}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? "Pause example flow" : "Play example flow"}
      </button>
      <svg
        viewBox="0 0 1550 380"
        className="dxl-flow-svg"
        role="img"
        aria-label="Example lifecycle with parallel discovery and design, joined by human approval gates"
      >
        <defs>
          <linearGradient id="dxlEdge" x1="0" x2="1">
            <stop offset="0" stopColor="#3e63dd" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        {EDGES.map(([a, b]) => {
          const s = byId.get(a)!;
          const t = byId.get(b)!;
          const mx = (s.x + t.x) / 2;
          const d = `M${s.x + (s.gate ? 32 : 58)},${s.y} C${mx},${s.y} ${mx},${t.y} ${t.x - (t.gate ? 32 : 58)},${t.y}`;
          const live = stateOf(a) === "done";
          return (
            <g key={`${a}-${b}`}>
              <path d={d} className="dxl-edge" />
              {live ? <path d={d} className="dxl-edge-live" /> : null}
              {live && stateOf(b) === "active" && !reduced && playing ? (
                <circle r="4" className="dxl-particle">
                  <animateMotion dur="1.1s" repeatCount="indefinite" path={d} />
                </circle>
              ) : null}
            </g>
          );
        })}
        {NODES.map((n) => {
          const st = stateOf(n.id);
          return n.gate ? (
            <g key={n.id} className={`dxl-gate is-${st}`} transform={`translate(${n.x},${n.y})`}>
              <rect x="-22" y="-22" width="44" height="44" rx="6" transform="rotate(45)" />
              <text y="5" textAnchor="middle">
                You
              </text>
            </g>
          ) : (
            <g key={n.id} className={`dxl-node is-${st}`} transform={`translate(${n.x},${n.y})`}>
              <rect x="-58" y="-24" width="116" height="48" rx="12" />
              <text y="-1" textAnchor="middle" className="dxl-node-label">
                {n.label}
              </text>
              {n.phase && agentsPerPhase[n.phase] ? (
                <text y="15" textAnchor="middle" className="dxl-node-sub">
                  {agentsPerPhase[n.phase]} catalogue roles
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="dxl-flow-caption">
        {activeGate ? (
          <span className="dxl-pill is-gate">Example: human approval gate</span>
        ) : step >= ORDER.length - 1 ? (
          <span className="dxl-pill is-done">Example: release planning & export</span>
        ) : (
          <span className="dxl-pill">Example: specialist handoff</span>
        )}
      </div>
      <ol className="dxl-flow-mobile">
        {MOBILE_STEPS.map((label, i) => (
          <li
            key={i}
            className={`${label === "You approve" ? "is-gate" : ""} ${i < step ? "is-done" : i === step ? "is-active" : ""}`}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live decision (real deliberation engine)
// ---------------------------------------------------------------------------

const DECISION_TABS: Record<string, string> = {
  D1: "Target segment",
  D2: "MVP scope",
  D3: "Build approach",
  D4: "Experience",
  D5: "Go / no-go",
};

const OPTION_COLOURS = ["#3e63dd", "#0f8c68", "#c98a12", "#7c3aed"];
const STAGES = [
  "Options framed",
  "Independent positions",
  "Red-team & vetoes",
  "Changes of mind",
  "Weighted tally",
  "Verdict",
] as const;

export function LiveDecision() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const decisions = useMemo(() => {
    const r = generateRoadmap(SAMPLE_CASE, "landing");
    return r.items.filter((i) => i.decision).map((i) => deliberate(i.decision!, "landing"));
  }, []);
  // Open on the build-approach decision: it shows a real security veto.
  const [which, setWhich] = useState(() =>
    Math.max(
      0,
      decisions.findIndex((x) => x.key.startsWith("D3")),
    ),
  );
  const [stage, setStage] = useState(STAGES.length - 1);
  const [run, setRun] = useState(0);
  const d: DecisionRecord = decisions[which]!;
  const colour = (id: string) =>
    OPTION_COLOURS[d.options.findIndex((o) => o.id === id) % OPTION_COLOURS.length]!;
  const label = (id: string | null) => d.options.find((o) => o.id === id)?.label ?? "—";

  useEffect(() => {
    if (reduced || !inView) return;
    setStage(0);
    const t = window.setInterval(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), 1300);
    return () => window.clearInterval(t);
  }, [reduced, inView, which, run]);

  const positions = stage >= 3 ? d.round2 : d.round1;
  const vetoed = new Set(d.vetoes.map((v) => v.optionId));

  return (
    <div ref={ref} className="dxl-decision">
      <div className="dxl-decision-tabs" role="tablist" aria-label="Example decisions">
        {decisions.slice(0, 4).map((x, i) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={i === which}
            className={i === which ? "active" : ""}
            onClick={() => setWhich(i)}
          >
            {DECISION_TABS[x.key.slice(0, 2)] ?? x.key}
          </button>
        ))}
        <button type="button" className="dxl-replay" onClick={() => setRun((r) => r + 1)}>
          Replay
        </button>
      </div>
      <p className="dxl-question">{d.question}</p>

      <ol className="dxl-stages" aria-label="Decision stages">
        {STAGES.map((s, i) => (
          <li key={s} className={i < stage ? "done" : i === stage ? "active" : ""}>
            {s}
          </li>
        ))}
      </ol>

      <div className="dxl-decision-body">
        <div className="dxl-panel" aria-label="Panel positions">
          {positions.map((p, i) => {
            const shown = stage >= 1;
            return (
              <div
                key={p.capabilityId}
                className={`dxl-agent${p.revisedFrom && stage >= 3 ? " revised" : ""}`}
                style={{
                  ["--c" as string]: shown ? colour(p.optionId) : "#d0d5dd",
                  animationDelay: `${i * 60}ms`,
                }}
                title={`${member(p.capabilityId).name} — ${label(p.optionId)}${p.persuadedBy && stage >= 3 ? ` (persuaded)` : ""}`}
              >
                <span className="dxl-dot" />
                <span className="dxl-agent-name">{member(p.capabilityId).name}</span>
              </div>
            );
          })}
        </div>

        <div className="dxl-options">
          {d.options.map((o) => {
            const t = d.tally.find((x) => x.optionId === o.id)!;
            const isVetoed = vetoed.has(o.id) && stage >= 2;
            const share = stage >= 4 ? t.share : 0;
            const chosen = stage >= 5 && d.chosenOptionId === o.id;
            return (
              <div
                key={o.id}
                className={`dxl-option${isVetoed ? " vetoed" : ""}${chosen ? " chosen" : ""}`}
                style={{ ["--c" as string]: colour(o.id) }}
              >
                <div className="dxl-option-head">
                  <span className="dxl-swatch" />
                  <strong>{o.label}</strong>
                  {isVetoed ? <span className="dxl-tag veto">Vetoed</span> : null}
                  {chosen ? (
                    <span className="dxl-tag win">
                      {d.outcome === "adopted" ? "Adopted" : "Leads"}
                    </span>
                  ) : null}
                </div>
                <div className="dxl-bar">
                  <span style={{ width: `${Math.round(share * 100)}%` }} />
                  <i className="dxl-threshold" aria-hidden="true" />
                </div>
                <small>{stage >= 4 ? `${Math.round(t.share * 100)}% weighted support` : " "}</small>
              </div>
            );
          })}
          <div className="dxl-verdict" aria-live="polite">
            {stage >= 2 && d.vetoes[0] ? (
              <p>
                <b>Veto:</b> {member(d.vetoes[0].capabilityId).name} — {d.vetoes[0].reason}.
              </p>
            ) : null}
            {stage >= 2 ? (
              <p>
                <b>Red team:</b> weakest on {d.challenge.weakest}.
              </p>
            ) : null}
            {stage >= 3 ? (
              <p>
                <b>Changed minds:</b> {d.round2.filter((p) => p.revisedFrom).length} ·{" "}
                <b>Dissent kept:</b> {d.dissent.length}
              </p>
            ) : null}
            {stage >= 5 ? (
              <p className="dxl-verdict-line">
                {d.outcome === "adopted" ? "Adopted" : "Escalated"}: {label(d.chosenOptionId)}
                {d.needsHumanRatification ? " → goes to you for sign-off" : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <p className="dxl-footnote">
        Live output of the DeliverX decision engine on a sample business case. Votes weighted by
        expertise; 60% needed to adopt; scores across {Object.keys(CRITERION_LABELS).length}{" "}
        criteria.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workforce matrix
// ---------------------------------------------------------------------------

export function WorkforceMatrix() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const departments = listDepartments();
  const names = useMemo(
    () => new Map(listCapabilities().map((c) => [c.capability_id, c.name.replace(/ Agent$/, "")])),
    [],
  );
  return (
    <div ref={ref} className={`dxl-matrix${inView && !reduced ? " is-live" : ""}`}>
      {departments.map((d, r) => (
        <div key={d.number} className="dxl-matrix-row">
          <span className="dxl-matrix-label">{d.name}</span>
          <span className="dxl-matrix-dots">
            {d.capability_ids.map((id, c) => (
              <i
                key={id}
                title={`${id} · ${names.get(id)}`}
                style={{ animationDelay: `${(r + c) * 70}ms` }}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export tree
// ---------------------------------------------------------------------------

const TREE = [
  "your-product/",
  "├─ README.md",
  "├─ project-manifest.json",
  "├─ business/  case · model",
  "├─ research/  sources.json · interviews",
  "├─ product/   PRD · roadmap.json",
  "├─ design/    journeys · UI spec",
  "├─ engineering/  architecture · prototype",
  "├─ operations/   tasks.csv · meetings · decisions",
  "├─ quality/   verification · known issues",
  "└─ audit/     every agent · every event",
];

export function ExportTree() {
  const [ref, inView] = useInView<HTMLPreElement>();
  return (
    <pre
      ref={ref}
      className={`dxl-tree${inView ? " is-live" : ""}`}
      aria-label="Exported project folder structure"
    >
      {TREE.map((l, i) => (
        <span key={l} style={{ animationDelay: `${i * 90}ms` }}>
          {l}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}
