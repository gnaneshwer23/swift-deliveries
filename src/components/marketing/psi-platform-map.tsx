import { useEffect, useId, useState } from "react";
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
  const [animate, setAnimate] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  const id = useId().replaceAll(":", "");
  const layer = LAYERS[active]!;
  const ActiveIcon = layer.icon;
  return (
    <div className="platform-map">
      <div className="platform-map-top">
        <span>Product Super Intelligence</span>
        <span>Interactive concept · select a layer</span>
      </div>
      <div className="platform-isometric-scene">
        <img
          src="/illustrations/psi-intelligence-isometric-v1.webp"
          width={1536}
          height={1024}
          alt="Isometric Product Brain: source documents feed a shared reasoning cube; specialist judgement, a human checkpoint, reviewable outputs and observations connect around it."
        />
        <svg
          className="platform-isometric-motion"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {animate && !reduced && (
            <circle r=".55" fill="#a9661f">
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={
                  [
                    "M31 24 C42 24 38 30 43 33",
                    "M58 31 C59 23 61 24 66 24",
                    "M89 60 C85 59 89 66 84 68",
                    "M33 73 C42 73 37 65 41 61",
                  ][active]
                }
              />
            </circle>
          )}
        </svg>
        <div
          className="platform-isometric-labels"
          role="group"
          aria-label="Explore PSI intelligence layers"
        >
          {LAYERS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={`platform-art-label platform-art-${item.key}`}
              aria-pressed={active === index}
              aria-controls={`${id}-inspector`}
              onClick={() => setActive(index)}
            >
              <span>{item.step}</span>
              <strong>{PSI_LAYER_LABELS[item.key]}</strong>
            </button>
          ))}
        </div>
        <div className="platform-art-brain">
          <strong>Product Brain</strong>
          <span>Shared product record</span>
        </div>
        <div className="platform-art-human">
          <ShieldCheck size={13} aria-hidden="true" />
          Human approval
        </div>
      </div>
      <div className="platform-isometric-controls">
        <span>Evidence → Product Brain → judgement → human checkpoint → work → feedback</span>
        <button
          type="button"
          disabled={reduced}
          aria-pressed={animate}
          onClick={() => setAnimate(!animate)}
        >
          {reduced ? "Reduced motion enabled" : animate ? "Pause flow" : "Animate selected flow"}
        </button>
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
