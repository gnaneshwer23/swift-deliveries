import { useId, useState } from "react";
import { ArrowRight, Database, GitBranch, Layers, RefreshCw, ShieldCheck } from "lucide-react";
import { PSI_LAYER_LABELS } from "@/lib/psi-journey";

const LAYERS = [
  {
    key: "evidence",
    icon: Database,
    step: "01",
    short: "Sources stay connected",
    role: "Research Synthesis",
    input: "Your question, authorised notes and source references",
    output: "Evidence brief with assumptions and gaps",
    detail:
      "Keep the source behind each assertion. Product context persists without turning an unsupported assumption into a fact.",
    next: "Judgement compares directions using this context.",
  },
  {
    key: "judgement",
    icon: GitBranch,
    step: "02",
    short: "Options meet scrutiny",
    role: "Specialist contributions + product owner",
    input: "Evidence, alternatives and product constraints",
    output: "Recommendation, review findings and owner decision",
    detail:
      "Compare trade-offs and preserve objections. Specialist agreement alone is not independent verification; the consequential decision belongs to you.",
    next: "Delivery follows the scope you actually approve.",
  },
  {
    key: "delivery",
    icon: Layers,
    step: "03",
    short: "Scope becomes reviewable work",
    role: "Enabled delivery capabilities",
    input: "Agreed scope, decision references and acceptance criteria",
    output: "A decision pack and proposed experiment brief",
    detail:
      "Inspect what was produced and how. A document is not proof that software was tested or deployed. Prototypes require an agreed extension.",
    next: "Feedback begins with a measure and a genuine observation.",
  },
  {
    key: "feedback",
    icon: RefreshCw,
    step: "04",
    short: "Observations inform the next question",
    role: "Product owner + outcome review",
    input: "Expected measure, baseline and an owner-supplied result",
    output: "Versioned review and a proposed follow-up",
    detail:
      "Compare the expectation with what actually happened. The next mission stays proposed until you approve it; connected analytics collection remains planned.",
    next: "The approved next question returns to Evidence & memory.",
  },
] as const;
export function PsiPlatformMap() {
  const [active, setActive] = useState(0);
  const id = useId().replaceAll(":", "");
  const layer = LAYERS[active]!;
  const ActiveIcon = layer.icon;
  return (
    <div className="platform-map">
      <div className="platform-map-top">
        <span>Product Super Intelligence</span>
        <span>Interactive concept · select a layer</span>
      </div>
      <div className="platform-map-canvas">
        <svg viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
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
              <path d="M0 0 L10 5 L0 10z" fill="#8c9ed0" />
            </marker>
          </defs>
          <path
            d="M 270 100 L 730 100 M 835 160 L 835 280 M 730 340 L 270 340 M 165 280 L 165 160"
            className="platform-map-orbit"
            markerEnd={`url(#${id}-arrow)`}
          />
          <path
            d="M 270 100 L 440 185 M 730 100 L 560 185 M 730 340 L 560 255 M 270 340 L 440 255"
            className="platform-map-spokes"
          />
        </svg>
        <div className="platform-brain-core">
          <Database size={25} aria-hidden="true" />
          <strong>Product Brain</strong>
          <span>Shared product record</span>
          <small>Evidence · decisions · artefacts</small>
        </div>
        <div
          className="platform-layer-nodes"
          role="group"
          aria-label="Explore PSI intelligence layers"
        >
          {LAYERS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.key}
                className={`platform-layer-node platform-layer-${item.key}`}
                aria-pressed={active === index}
                aria-controls={`${id}-inspector`}
                onClick={() => setActive(index)}
              >
                <span className="platform-layer-number">{item.step}</span>
                <Icon size={22} aria-hidden="true" />
                <strong>{PSI_LAYER_LABELS[item.key]}</strong>
                <small>{item.short}</small>
              </button>
            );
          })}
        </div>
        <span className="platform-flow-caption platform-caption-top">Context → comparison</span>
        <span className="platform-flow-caption platform-caption-bottom">
          Learning → next question
        </span>
      </div>
      <div className="platform-map-inspector" id={`${id}-inspector`} aria-live="polite">
        <div>
          <ActiveIcon size={21} aria-hidden="true" />
          <span>{layer.role}</span>
          <h3>{PSI_LAYER_LABELS[layer.key]}</h3>
          <p>{layer.detail}</p>
        </div>
        <dl>
          <div>
            <dt>Receives</dt>
            <dd>{layer.input}</dd>
          </div>
          <div>
            <dt>Passes forward</dt>
            <dd>{layer.output}</dd>
          </div>
        </dl>
        <p className="platform-next-handoff">
          <ArrowRight size={16} aria-hidden="true" />
          {layer.next}
        </p>
      </div>
      <div className="platform-human-rail">
        <ShieldCheck size={17} aria-hidden="true" />
        <span>Human authority across every layer</span>
        <p>You approve consequential scope. Exploring this diagram changes no workspace records.</p>
      </div>
    </div>
  );
}
