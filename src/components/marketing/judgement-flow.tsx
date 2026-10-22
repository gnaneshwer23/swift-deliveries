import { useEffect, useState } from "react";

const STEPS = [
  {
    name: "Research",
    agents: "Research Planning → Web Research → Evidence Verification",
    output: "A source register with citations and gaps",
    next: "Research Synthesis sends the evidence brief to Product Discovery.",
    rule: "Missing evidence stays visible; synthetic interviews do not count as customer evidence.",
  },
  {
    name: "Frame options",
    agents: "Research Synthesis → Product Discovery → PRD",
    output: "Alternatives, trade-offs and a product recommendation",
    next: "The recommendation enters the programme decision panel.",
    rule: "Specialists state their positions before seeing the panel critique.",
  },
  {
    name: "Challenge",
    agents: "Decision panel → Security review + Engineering review",
    output: "Independent positions, dissent and any hard veto",
    next: "The rules-based tally produces a verdict or escalates to you.",
    rule: "A security veto cannot be outvoted. Agreement is not independent verification.",
  },
  {
    name: "Your judgement",
    agents: "Decision panel → You, the product owner",
    output: "An approval, rejection or request for more evidence",
    next: "Only an approved lifecycle gate releases downstream work.",
    rule: "High-impact and weakly evidenced decisions require your judgement.",
  },
  {
    name: "Deliver & inspect",
    agents: "Design → Engineering → QA → You",
    output: "Versioned documents, prototype and review record",
    next: "You inspect the export and add observed feedback to the product record.",
    rule: "A prototype is not a deployed product. Automatic outcome learning remains planned.",
  },
];
export function JudgementFlow() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (active < STEPS.length - 1) setActive(active + 1);
      else setPlaying(false);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [active, playing]);
  const step = STEPS[active]!;
  return (
    <section className="psi-judgement" aria-label="Example specialist judgement handoffs">
      <p className="dxl-eyebrow">Example mission · Improve onboarding</p>
      <h2 className="dxl-h2">Who contributes. Who challenges. Who decides.</h2>
      <p>
        Follow the direction of a judgement through the team. This is an illustrative workflow, not
        a running customer mission.
      </p>
      <button
        type="button"
        className="dxl-btn dxl-btn-ghost"
        onClick={() => {
          if (playing) setPlaying(false);
          else {
            setActive(0);
            setPlaying(true);
          }
        }}
        aria-pressed={playing}
      >
        {playing ? "Pause handoffs" : "Play example handoffs"}
      </button>
      <ol className="psi-flow-controls">
        {STEPS.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              aria-pressed={active === i}
              aria-controls="judgement-detail"
              onClick={() => {
                setActive(i);
                setPlaying(false);
              }}
            >
              <span>0{i + 1}</span>
              {s.name}
            </button>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="psi-flow-arrow">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      <div
        key={active}
        id="judgement-detail"
        className={`psi-flow-detail${playing ? " psi-flow-playing" : ""}`}
        aria-live="polite"
      >
        <p className="psi-agent-chain">{step.agents}</p>
        <h3>{step.output}</h3>
        <p>{step.next}</p>
        <small>{step.rule}</small>
      </div>
    </section>
  );
}
