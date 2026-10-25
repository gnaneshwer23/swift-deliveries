import { useState } from "react";
import { ArrowRight, Link2, Unlink2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

const STATIONS = [
  {
    name: "Research",
    role: "Research synthesis",
    output: "Evidence brief",
    id: "E-01",
    question: "Where did this insight come from?",
    gap: "A summary arrives without its sources. The next person cannot distinguish an observation from an assumption.",
    kept: "Evidence travels with the brief.",
    detail:
      "Source links and open questions stay attached to E-01. Product strategy can inspect the evidence before comparing options.",
    handoff: "Sources → evidence brief",
  },
  {
    name: "Judgement",
    role: "Product strategy + review",
    output: "Decision record",
    id: "D-01",
    question: "Why was this direction chosen?",
    gap: "The chosen option arrives without the alternatives or reasoning. The team has to reconstruct the decision.",
    kept: "The decision preserves the reason.",
    detail:
      "D-01 references E-01, the alternatives and the review. The owner decides whether to approve the proposed scope.",
    handoff: "Evidence → owner decision",
  },
  {
    name: "Delivery",
    role: "Design + engineering",
    output: "Experiment brief",
    id: "A-01",
    question: "What should this work achieve?",
    gap: "A task arrives without the decision or acceptance criteria. Completion becomes difficult to assess.",
    kept: "The output stays tied to its purpose.",
    detail:
      "A-01 carries the approved scope, decision reference and acceptance criteria into a reviewable experiment brief.",
    handoff: "Approved scope → reviewable work",
  },
];

export function ContextContinuity() {
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(0);
  const item = STATIONS[selected]!;
  return (
    <div className={`handoff-demo ${connected ? "is-connected" : ""}`}>
      <header className="handoff-toolbar">
        <div>
          <span className="handoff-status-dot" />
          <strong>
            {connected ? "One connected product record" : "The work moves. The context doesn’t."}
          </strong>
        </div>
        <div className="handoff-toggle" role="group" aria-label="Compare product context">
          <button type="button" aria-pressed={!connected} onClick={() => setConnected(false)}>
            <Unlink2 size={15} />
            Scattered
          </button>
          <button type="button" aria-pressed={connected} onClick={() => setConnected(true)}>
            <Link2 size={15} />
            Connected
          </button>
        </div>
      </header>
      <div className="handoff-layout">
        <div className="handoff-visual">
          <div className="handoff-art">
            <img
              src="/illustrations/context-handoff-v2.webp"
              alt="Isometric research documents, a branching decision workbench and an experiment checklist"
              width="1536"
              height="1024"
              loading="lazy"
            />
            <div className="handoff-stage-labels">
              {STATIONS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Inspect ${s.name.toLowerCase()} context`}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                >
                  <span>0{i + 1}</span>
                  <strong>{s.name}</strong>
                  <small>{connected ? s.id : "Context missing"}</small>
                </button>
              ))}
            </div>
            <svg className="handoff-wires" viewBox="0 0 900 90" aria-hidden="true">
              <defs>
                <marker
                  id="handoff-arrow"
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0L7 3.5L0 7" fill="currentColor" />
                </marker>
              </defs>
              <path d="M160 40H430M470 40H740" markerEnd="url(#handoff-arrow)" />
              <path className="handoff-moving" d="M160 40H430M470 40H740" />
            </svg>
          </div>
          <div className="handoff-outputs">
            {STATIONS.map((s) => (
              <div key={s.id}>
                <span>{s.role}</span>
                <strong>{s.output}</strong>
              </div>
            ))}
          </div>
          <div className="handoff-chain">
            <span>{connected ? "Evidence E-01" : "Source lost"}</span>
            <ArrowRight size={15} />
            <span>{connected ? "Decision D-01" : "Reason lost"}</span>
            <ArrowRight size={15} />
            <span>{connected ? "Artefact A-01" : "Purpose lost"}</span>
          </div>
        </div>
        <aside className="handoff-inspector" aria-live="polite">
          <span className="handoff-inspector-step">
            0{selected + 1} / {item.name}
          </span>
          <h3>{connected ? item.kept : item.question}</h3>
          <p>{connected ? item.detail : item.gap}</p>
          <div className="handoff-transfer">
            <span>{connected ? "Passed forward" : "Missing at this handoff"}</span>
            <strong>
              {connected
                ? item.handoff
                : [
                    "Source + assumptions",
                    "Alternatives + rationale",
                    "Scope + acceptance criteria",
                  ][selected]}
            </strong>
          </div>
          {connected ? (
            <Link to="/psi" hash="product-brain" className="handoff-cta">
              Explore Product Brain <ArrowRight size={16} />
            </Link>
          ) : (
            <button type="button" className="handoff-cta" onClick={() => setConnected(true)}>
              Keep the context attached <ArrowRight size={16} />
            </button>
          )}
        </aside>
      </div>
      <footer className="handoff-caption">
        Interactive example · Select a workstation to inspect the handoff. E-01, D-01 and A-01 are
        illustrative records; no mission runs or approvals are created.
      </footer>
    </div>
  );
}
