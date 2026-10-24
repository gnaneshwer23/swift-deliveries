import { useState } from "react";
import {
  ArrowRight,
  Link2,
  Unlink2,
  FileText,
  MessageSquare,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { LiveProgrammeFlow } from "./dxsi-landing";

const CONTEXT = [
  {
    name: "Research",
    icon: FileText,
    document: "Evidence brief",
    lost: "Which observation supports this?",
    kept: "Source E-01 stays attached",
    detail:
      "An interview note or cited source is linked to the brief. An unsupported assumption remains marked as a question.",
  },
  {
    name: "Decision",
    icon: MessageSquare,
    document: "Chosen direction",
    lost: "Why did we choose this?",
    kept: "Decision D-01 cites E-01",
    detail:
      "The decision preserves alternatives, rationale and dissent. The approved direction references its evidence.",
  },
  {
    name: "Delivery",
    icon: Layers,
    document: "Product prototype",
    lost: "What are we checking against?",
    kept: "Artefact A-01 follows D-01",
    detail:
      "The artefact links back to the decision and its acceptance criteria. Inspection can follow the reasoning, not just the file.",
  },
];
export function ContextContinuity() {
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(0);
  const item = CONTEXT[selected]!;
  return (
    <div className={`continuity ${connected ? "is-connected" : ""}`}>
      <div className="continuity-head">
        <span>{connected ? "One product record" : "Three disconnected workspaces"}</span>
        <div role="group" aria-label="Compare product context">
          <button type="button" onClick={() => setConnected(false)} aria-pressed={!connected}>
            <Unlink2 size={14} />
            Scattered
          </button>
          <button type="button" onClick={() => setConnected(true)} aria-pressed={connected}>
            <Link2 size={14} />
            Connected
          </button>
        </div>
      </div>
      <div className="continuity-scene">
        <svg viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 170 140 L 830 140" className="continuity-track" />
          {connected && (
            <>
              <path d="M 170 140 L 830 140" className="continuity-trace" />
              <circle r="5" className="continuity-token">
                <animateMotion dur="5s" repeatCount="indefinite" path="M 170 140 L 830 140" />
              </circle>
            </>
          )}
        </svg>
        {CONTEXT.map((step, i) => {
          const Icon = step.icon;
          return (
            <button
              type="button"
              key={step.name}
              onClick={() => setSelected(i)}
              className={`continuity-station ${selected === i ? "is-selected" : ""}`}
              aria-pressed={selected === i}
              aria-label={`Inspect ${step.name.toLowerCase()} context`}
            >
              <div className="continuity-workbench">
                <div className="continuity-sheet">
                  <Icon size={32} />
                  <i />
                  <i />
                  <i />
                </div>
                <span className="continuity-plinth" />
              </div>
              <strong>{step.name}</strong>
              <span className="continuity-document">{step.document}</span>
              <span className="continuity-state">
                {connected ? <Link2 size={12} /> : <Unlink2 size={12} />}{" "}
                {connected ? step.kept : step.lost}
              </span>
            </button>
          );
        })}
      </div>
      <div className="continuity-footer" aria-live="polite">
        <div>
          <span>{connected ? "Context carried forward" : "Context lost at the handoff"}</span>
          <h3>{connected ? item.kept : item.lost}</h3>
          <p>
            {connected
              ? item.detail
              : "A document can move forward while its source, assumptions and reason for the decision are left behind. Select a workspace to inspect the gap."}
          </p>
        </div>
        {connected ? (
          <Link to="/product-brain" className="continuity-action">
            Explore the product record <ArrowRight size={15} />
          </Link>
        ) : (
          <button type="button" className="continuity-action" onClick={() => setConnected(true)}>
            Connect the work <ArrowRight size={15} />
          </button>
        )}
      </div>
      <small className="continuity-note">
        Illustrative records E-01, D-01 and A-01 show traceability, not real customer evidence.
      </small>
    </div>
  );
}

const STAGES: Record<
  string,
  { title: string; team: string; output: string; call: string; phase: string; gate?: boolean }
> = {
  idea: {
    title: "Start with a product question",
    team: "You + Problem-Framing",
    output: "Objective, constraints and unresolved questions",
    call: "Define what useful progress would mean before selecting the work.",
    phase: "Idea",
  },
  market: {
    title: "Understand the market",
    team: "Market research disciplines",
    output: "Source-linked market context and assumptions",
    call: "Treat demand assumptions as hypotheses until supported by evidence.",
    phase: "Discovery",
  },
  research: {
    title: "Investigate the evidence",
    team: "Research Planning + Research Synthesis",
    output: "Evidence register and discovery brief",
    call: "Supply genuine interview notes; preserve missing and contradictory evidence.",
    phase: "Discovery",
  },
  foresight: {
    title: "Explore what could change",
    team: "Foresight disciplines",
    output: "Technology and opportunity hypotheses",
    call: "Separate emerging signals from established facts.",
    phase: "Discovery",
  },
  decide: {
    title: "Compare the possible directions",
    team: "Independent specialist panel",
    output: "Options, positions, dissent and a recommendation",
    call: "High-impact and weakly evidenced decisions come to you.",
    phase: "Discovery",
  },
  g1: {
    title: "You review the discovery",
    team: "Human approval gate",
    output: "Approval, rejection or a request for evidence",
    call: "Agents can recommend a direction; they cannot pass this gate.",
    phase: "Discovery gate",
    gate: true,
  },
  define: {
    title: "Turn direction into a product brief",
    team: "Product requirements + planning disciplines",
    output: "PRD, scope, roadmap and acceptance criteria",
    call: "Inspect what is included, deferred and explicitly out of scope.",
    phase: "Definition",
  },
  g2: {
    title: "You approve the scope",
    team: "Human approval gate",
    output: "An agreed product scope",
    call: "The next work starts from your reviewed requirements.",
    phase: "Scope gate",
    gate: true,
  },
  ux: {
    title: "Design the product experience",
    team: "Design and UX disciplines",
    output: "Journeys, wireframes and interface specification",
    call: "Check the proposed workflow against the user problem.",
    phase: "Design",
  },
  arch: {
    title: "Plan how the product fits together",
    team: "Architecture + security disciplines",
    output: "Architecture, data boundaries and risks",
    call: "Design and architecture inform each other in parallel.",
    phase: "Design",
  },
  g3: {
    title: "You review the design direction",
    team: "Human approval gate",
    output: "Reviewed experience and architecture",
    call: "Resolve material questions before build scope advances.",
    phase: "Design gate",
    gate: true,
  },
  build: {
    title: "Build in bounded increments",
    team: "Engineering + review disciplines",
    output: "Product documents and inspectable prototype",
    call: "Isolated code execution and repository delivery remain later gated capabilities.",
    phase: "Build",
  },
  verify: {
    title: "Inspect what was actually checked",
    team: "Quality and review disciplines",
    output: "Check results, issues and review record",
    call: "Static validation, executed tests and human review are different assurances.",
    phase: "Verification",
  },
  g4: {
    title: "You make the release decision",
    team: "Human approval gate",
    output: "Go, hold or rework decision",
    call: "This public walkthrough cannot authorise a deployment.",
    phase: "Release gate",
    gate: true,
  },
  launch: {
    title: "Keep the release record and plan",
    team: "Product owner + delivery disciplines",
    output: "Release plan, project export and follow-up questions",
    call: "Automatic production deployment and connected outcome tracking are not included in this example.",
    phase: "Release planning",
  },
};
export function ImpactExplorer() {
  const [selected, setSelected] = useState("idea");
  const stage = STAGES[selected] ?? STAGES["idea"]!;
  return (
    <div className="impact-explorer">
      <div className="impact-top">
        <span>Stages beyond the first pilot</span>
        <p>
          Select a stage. The walkthrough pauses at each human gate. These later stages are still
          planned.
        </p>
      </div>
      <LiveProgrammeFlow onSelectStage={setSelected} selectedStage={selected} />
      <div className={`impact-inspector ${stage.gate ? "is-gate" : ""}`} aria-live="polite">
        <div className="impact-stage-mark">
          {stage.gate ? <ShieldCheck size={26} /> : <Layers size={26} />}
          <span>{stage.phase}</span>
        </div>
        <div>
          <p className="impact-team">{stage.team}</p>
          <h3>{stage.title}</h3>
          <p>{stage.call}</p>
        </div>
        <div className="impact-output">
          <small>What comes out</small>
          <strong>{stage.output}</strong>
          <Link to="/how-it-works">
            Walk through a concrete mission <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div className="impact-shortcuts" role="group" aria-label="Inspect lifecycle stages">
        {Object.entries(STAGES).map(([id, s]) => (
          <button
            type="button"
            key={id}
            onClick={() => setSelected(id)}
            aria-pressed={selected === id}
          >
            {s.gate
              ? s.phase
              : s.phase === "Discovery"
                ? id.charAt(0).toUpperCase() + id.slice(1)
                : s.phase === "Design"
                  ? id === "ux"
                    ? "UX"
                    : "Architecture"
                  : s.phase}
          </button>
        ))}
      </div>
      <p className="impact-note">
        Illustrated workflow · catalogue roles and planned capabilities are not proof of live
        execution. No workspace data is changed.
      </p>
    </div>
  );
}
