import { useId, useState } from "react";
import {
  ArrowRight,
  Check,
  FileText,
  Fingerprint,
  Search,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { getCapability } from "@/lib/workforce/registry";

const STEPS = [
  {
    id: "DX-012",
    label: "Research",
    icon: Search,
    input: "Owner's question and supplied context",
    output: "Source notes",
    description:
      "Organise the supplied context and, when approved tools are configured, collect source material. A generated assertion does not become customer evidence.",
    checks: ["Keep source references attached", "Separate unknowns from observations"],
    sample: [
      "Question: Where does onboarding create friction?",
      "Input: owner-supplied setup notes",
      "Missing: measured abandonment data",
    ],
  },
  {
    id: "DX-018",
    label: "Evidence review",
    icon: ShieldCheck,
    input: "Source notes",
    output: "Evidence matrix",
    description:
      "Check whether the supplied material supports each claim. Unsupported claims and evidence gaps remain visible for the next specialist.",
    checks: ["Trace each claim to its source", "Keep assumptions explicitly labelled"],
    sample: [
      "Supplied: setup asks for role before the question",
      "Assumption: changing the order may reduce friction",
      "Gap: no baseline conversion measurement",
    ],
  },
  {
    id: "DX-021",
    label: "Product options",
    icon: Workflow,
    input: "Evidence matrix",
    output: "Options & trade-offs",
    description:
      "Frame bounded options from the evidence. Specialist recommendations stop at the owner decision; agreement is not permission to proceed.",
    checks: [
      "Include an option to gather more evidence",
      "State the trade-offs and unresolved gaps",
    ],
    sample: [
      "Option A: show the product question first",
      "Option B: retain the sequence and measure it",
      "Decision needed: which option to investigate?",
    ],
  },
  {
    id: null,
    label: "Your decision",
    icon: Fingerprint,
    input: "Options & trade-offs",
    output: "Approved direction",
    description:
      "The workspace owner accepts a proposal or requests more evidence. The decision applies to its recorded scope and version; a changed scope requires a new decision.",
    checks: ["Record your reasoning", "Approval is bound to the proposed scope"],
    sample: [
      "Owner decision: required before downstream work",
      "Scope: one onboarding experiment",
      "External actions: separately approved",
    ],
  },
  {
    id: "DX-023",
    label: "Product brief",
    icon: FileText,
    input: "Approved direction",
    output: "Reviewable PRD",
    description:
      "Turn the approved direction into requirements, acceptance criteria and open questions. The brief stays reviewable before implementation.",
    checks: ["Preserve the owner's constraints", "Define acceptance criteria before building"],
    sample: [
      "Requirement: ask the question before profile details",
      "Acceptance: returning users retain their draft",
      "Measurement: baseline required before experiment",
    ],
  },
  {
    id: "DX-041",
    label: "Architecture review",
    icon: Workflow,
    input: "Reviewable PRD",
    output: "Implementation approach",
    description:
      "Describe the technical approach, dependencies and risks. This output is a proposal for review, not evidence that a product has shipped.",
    checks: [
      "Surface dependencies and failure modes",
      "Keep deployment behind a separate approval",
    ],
    sample: [
      "Approach: reuse the existing mission draft store",
      "Risk: overwriting a saved question on reload",
      "Next: review the plan before implementation",
    ],
  },
];
export function WorkforceHandoff({
  onSelectRole,
}: {
  onSelectRole?: ((id: string) => void) | undefined;
}) {
  const [selected, setSelected] = useState(0);
  const connectorId = useId();
  const step = STEPS[selected]!;
  const role = step.id ? getCapability(step.id) : null;
  return (
    <div className="ps-handoff">
      <div className="ps-example-caption">
        <span>Example handoff</span>
        <p>Improve product onboarding · illustrative sequence, no tasks executed</p>
      </div>
      <ol className="ps-handoff-steps" aria-label="Example specialist handoff">
        <li className="ps-handoff-connectors" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker
                id={connectorId}
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0 0 10 5 0 10Z" fill="#7287ae" />
              </marker>
            </defs>
            <path
              className="ps-wrap-three"
              d="M83 44 V50 H17 V56"
              markerEnd={`url(#${connectorId})`}
            />
            <path
              className="ps-wrap-two"
              d="M75 29 V33 H25 V37 M75 63 V67 H25 V71"
              markerEnd={`url(#${connectorId})`}
            />
          </svg>
        </li>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.label}>
              <button
                className={s.id ? "" : "is-owner"}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="ps-step-top">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <Icon size={19} />
                </span>
                <strong>{s.label}</strong>
                <small>{s.id ? getCapability(s.id)?.name : "Workspace owner"}</small>
                <span className="ps-step-output">{s.output}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ArrowRight className="ps-step-arrow" size={14} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <div className="ps-handoff-inspector">
        <div>
          <span className="ps-detail-label">
            Selected handoff · {selected + 1} of {STEPS.length}
          </span>
          <h3>{role?.name ?? "Your decision is the gate."}</h3>
          <p>{step.description}</p>
          <ul>
            {step.checks.map((c) => (
              <li key={c}>
                <Check size={13} />
                {c}
              </li>
            ))}
          </ul>
          {step.id && onSelectRole && (
            <button className="ps-inspect-link" onClick={() => onSelectRole(step.id!)}>
              Inspect {step.id}
              <ArrowRight size={13} />
            </button>
          )}
        </div>
        <div className="ps-artefact-preview">
          <header>
            <FileText size={16} />
            <strong>{step.output}</strong>
            <span>Example content</span>
          </header>
          <div className="ps-artefact-lines">
            {step.sample.map((s, i) => (
              <p key={s}>
                <span>{i + 1}</span>
                {s}
              </p>
            ))}
          </div>
          <footer>
            <span>Receives</span>
            {step.input}
            <ArrowRight size={13} />
            <span>Produces</span>
            {step.output}
          </footer>
        </div>
      </div>
    </div>
  );
}
