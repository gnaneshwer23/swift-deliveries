import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
const AUDIENCES = [
  {
    name: "Founders",
    question: "Which product assumption should we test first?",
    bring: "Your audience, product idea, constraints and available evidence.",
    work: "Frame the uncertainty, compare directions and challenge the proposed next step.",
    leave: "A scoped decision and an experiment brief you can inspect.",
  },
  {
    name: "Product teams",
    question: "Why should this change be the next priority?",
    bring: "Product context, authorised feedback, competing priorities and acceptance criteria.",
    work: "Keep the evidence, trade-offs and dissent in one record for owner review.",
    leave: "A decision trail that explains the chosen direction and what is still uncertain.",
  },
  {
    name: "Students",
    question: "How do I turn an idea into a reasoned product decision?",
    bring: "A real product question and the sources you are permitted to use.",
    work: "Learn by investigating, comparing alternatives and inspecting specialist contributions.",
    leave: "Reviewable product work and the reasoning behind it, in the same environment.",
  },
];
export function PsiAudienceExplorer() {
  const [active, setActive] = useState(0);
  const id = useId();
  const item = AUDIENCES[active]!;
  return (
    <div className="platform-audience">
      <div role="group" className="platform-audience-selector" aria-label="Explore who PSI is for">
        {AUDIENCES.map((audience, index) => (
          <button
            type="button"
            key={audience.name}
            aria-pressed={active === index}
            aria-controls={id}
            onClick={() => setActive(index)}
          >
            {audience.name}
          </button>
        ))}
      </div>
      <div className="platform-audience-example" id={id}>
        <span>Example product question</span>
        <h3>{item.question}</h3>
        <dl>
          <div>
            <dt>You bring</dt>
            <dd>{item.bring}</dd>
          </div>
          <div>
            <dt>Work through</dt>
            <dd>{item.work}</dd>
          </div>
          <div>
            <dt>You can inspect</dt>
            <dd>{item.leave}</dd>
          </div>
        </dl>
        <Link to="/resources" hash="brief-builder" className="dxl-link">
          Prepare your own question
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
