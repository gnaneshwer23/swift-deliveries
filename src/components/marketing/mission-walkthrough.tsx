import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileText } from "lucide-react";
import { ProductIllustration, type IllustrationName } from "./product-illustration";

const STEPS: {
  title: string;
  image: IllustrationName;
  heading: string;
  text: string;
  input: string;
  work: string[];
  output: string;
  decision: string;
  future?: boolean;
}[] = [
  {
    title: "Frame",
    image: "product-brain",
    heading: "Start with a problem worth understanding.",
    text: "You run a small software product. People reach setup, but you don't yet know why some leave. A useful mission starts with a question, not a predetermined redesign.",
    input:
      "Investigate where new users struggle in onboarding. Compare options and draft an experiment. Do not change the live product.",
    work: [
      "Clarify the audience, desired outcome and non-goals.",
      "Identify which notes or product data are available.",
      "Propose bounded work and a credit ceiling.",
    ],
    output: "A mission brief and a plan to review.",
    decision: "Does this scope answer the question you actually have?",
  },
  {
    title: "Investigate",
    image: "specialist-team",
    heading: "Give each specialist a bounded job.",
    text: "Suppose you supply interview notes and a description of your setup flow. Research, product and design roles examine the material from different perspectives.",
    input: "Your supplied notes, the current flow and the approved mission brief.",
    work: [
      "Extract observations and retain their source references.",
      "Separate user assertions, assumptions and agent inferences.",
      "Record missing or contradictory evidence.",
    ],
    output: "An evidence register and a problem summary.",
    decision: "Are the sources sufficient, or should the team ask for more?",
  },
  {
    title: "Compare",
    image: "evidence-decision",
    heading: "See the options that were considered.",
    text: "Shorter setup, progressive setup and clearer explanations are possible approaches. The team compares them against the objective and makes the uncertainty visible.",
    input: "Evidence-backed observations, constraints and competing hypotheses.",
    work: [
      "Explain the value and trade-offs of each option.",
      "Preserve challenges and dissent in the decision record.",
      "Recommend an option without pretending agreement proves it works.",
    ],
    output: "A decision pack with alternatives and reasons.",
    decision: "Choose an option, request more evidence or reject the recommendation.",
  },
  {
    title: "Approve",
    image: "human-direction",
    heading: "You hold the consequential decisions.",
    text: "The team can recommend a smaller first step. You decide whether the proposed experiment and its scope make sense before the next stage proceeds.",
    input: "The proposed approach, acceptance criteria and bounded work plan.",
    work: [
      "Stop at the human approval gate.",
      "Keep the approval or requested changes in the record.",
      "Do not treat an internal approval as permission to deploy.",
    ],
    output: "An approved direction or a clear request for rework.",
    decision: "Approve the scope, or send it back with your reasoning.",
  },
  {
    title: "Inspect",
    image: "product-delivery",
    heading: "Open the work. Check the reasoning.",
    text: "Inspect the product specification, interface prototype and verification report. Review the actual output rather than relying on a completion badge.",
    input: "The approved direction and earlier evidence.",
    work: [
      "Produce reviewable documents and a lightweight HTML prototype.",
      "Check output contracts and static prototype properties.",
      "Package files, decisions and production-mode disclosures.",
    ],
    output: "A reviewable prototype and portable project archive.",
    decision:
      "Does the delivered work meet the brief? Runtime tests and live deployment are not implied.",
  },
  {
    title: "Learn",
    image: "learning-loop",
    heading: "Close the loop with an observed result.",
    text: "The next PSI capability is to link an expected outcome to a later observation and use it to propose the next mission. Until that is available, our experiment template helps you record this explicitly.",
    input: "A baseline, an expected change, a measurement window and later observed data.",
    work: [
      "Keep expectations separate from actual observations.",
      "Document limitations and alternative explanations.",
      "Propose a next step when the evidence supports it.",
    ],
    output: "An outcome review and a proposed next mission.",
    decision: "No outcome data? Ask for measurement, rather than inventing success.",
    future: true,
  },
];

export function MissionWalkthrough() {
  const [active, setActive] = useState(0);
  const step = STEPS[active]!;
  return (
    <div className="psi-walkthrough" id="walkthrough">
      <div
        className="psi-step-selector"
        role="group"
        aria-label="Choose a step in the example mission"
      >
        {STEPS.map((item, index) => (
          <button
            type="button"
            key={item.title}
            aria-pressed={active === index}
            aria-controls="mission-example-panel"
            onClick={() => setActive(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.title}
          </button>
        ))}
      </div>
      <div className="psi-walk-panel" id="mission-example-panel">
        <div className="psi-walk-art">
          <ProductIllustration name={step.image} priority />
          <div className="psi-example-tag">Illustrative mission · no real customer results</div>
        </div>
        <div className="psi-walk-copy" aria-live="polite" aria-atomic="true">
          <p className="psi-label">
            Step {active + 1} of {STEPS.length}
            {step.future ? " · planned outcome capability" : ""}
          </p>
          <h3>{step.heading}</h3>
          <p>{step.text}</p>
          <div className="psi-example-input">
            <span>You bring</span>
            <p>{step.input}</p>
          </div>
          <ul className="psi-check-list">
            {step.work.map((item) => (
              <li key={item}>
                <Check size={15} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="psi-example-output">
            <FileText size={18} />
            <div>
              <span>You receive</span>
              <strong>{step.output}</strong>
            </div>
          </div>
          <p className="psi-human-question">
            <strong>Your call:</strong> {step.decision}
          </p>
        </div>
      </div>
      <div className="psi-walk-nav">
        <button
          type="button"
          className="psi-text-button"
          disabled={active === 0}
          onClick={() => setActive((n) => n - 1)}
        >
          <ArrowLeft size={16} /> Previous
        </button>
        <span>{step.title}</span>
        <button
          type="button"
          className="psi-text-button"
          disabled={active === STEPS.length - 1}
          onClick={() => setActive((n) => n + 1)}
        >
          Next step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
