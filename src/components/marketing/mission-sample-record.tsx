import { useId, useState } from "react";
import { ArrowRight, Download, FileText, GitBranch, Search, FlaskConical } from "lucide-react";
import { downloadText } from "@/lib/marketing/product-resources";

type Field = { label: string; value: string; tone?: "gap" | "proposal" };
type RecordDocument = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  icon: typeof FileText;
  fields: Field[];
  next: string;
};
const RECORDS: RecordDocument[] = [
  {
    id: "B-01",
    title: "Mission brief",
    subtitle: "Define the question before choosing a solution.",
    status: "Example scope",
    icon: FileText,
    next: "Research Synthesis receives the brief and keeps missing evidence visible.",
    fields: [
      { label: "Product question", value: "Which onboarding change should we investigate first?" },
      { label: "Audience", value: "New users setting up a small software product." },
      { label: "Objective", value: "Identify a bounded experiment worth investigating." },
      { label: "Constraints", value: "Do not contact users, modify the live product or deploy." },
      {
        label: "Inputs required",
        value: "Authorised setup notes and a description of the current flow.",
        tone: "gap",
      },
      {
        label: "Acceptance criteria",
        value: "Compare alternatives, preserve evidence gaps and obtain an owner decision.",
      },
    ],
  },
  {
    id: "E-01 / E-02",
    title: "Evidence register",
    subtitle: "Separate the source, the inference and what is still missing.",
    status: "Evidence gaps open",
    icon: Search,
    next: "Product Discovery receives the evidence brief, including its limitations.",
    fields: [
      {
        label: "E-01 · Sample assertion",
        value:
          "Setup asks for several details before the first useful action. Source: illustrative setup description. Not independently observed.",
      },
      {
        label: "E-02 · Agent inference",
        value: "Some details might be deferred. Derived from E-01; not a validated user need.",
        tone: "proposal",
      },
      {
        label: "G-01 · Missing measurement",
        value: "Actual abandonment location and baseline completion data.",
        tone: "gap",
      },
      {
        label: "G-02 · Missing explanation",
        value: "Authorised customer notes explaining why people leave.",
        tone: "gap",
      },
    ],
  },
  {
    id: "D-01",
    title: "Decision record",
    subtitle: "The recommendation travels with alternatives and dissent.",
    status: "Owner decision pending",
    icon: GitBranch,
    next: "Experiment planning follows only after the owner's scoped decision.",
    fields: [
      {
        label: "Option A · Remove fields",
        value: "Shorten setup. Risk: useful information may be lost.",
      },
      {
        label: "Option B · Defer optional details",
        value: "Ask after the first useful action. Risk: later completion may suffer.",
      },
      {
        label: "Option C · Explain each field",
        value:
          "Explain why details are needed. Risk: explanation may not address the actual cause.",
      },
      {
        label: "Provisional recommendation",
        value:
          "Investigate B, subject to evidence and owner review. Basis: hypothesis E-02, not measured behaviour.",
        tone: "proposal",
      },
      {
        label: "Reviewer's objection",
        value:
          "Without abandonment data, the cause is unknown. Gather evidence before approving implementation.",
        tone: "gap",
      },
      {
        label: "Owner decision",
        value:
          "Pending: approve investigation only, request more evidence, or reject. No real approval is recorded.",
      },
    ],
  },
  {
    id: "A-01",
    title: "Experiment brief",
    subtitle: "Make the hypothesis testable before claiming an outcome.",
    status: "Not run",
    icon: FlaskConical,
    next: "An owner-supplied observation informs a review. No follow-up is approved in this sample.",
    fields: [
      {
        label: "Hypothesis",
        value: "Deferring optional details could help users reach the first useful action.",
        tone: "proposal",
      },
      {
        label: "Proposed investigation",
        value: "Explore a staged setup flow. Do not change the live product.",
      },
      { label: "Primary measures", value: "Setup completion and time to first useful action." },
      { label: "Guardrail", value: "Later profile completion must also be considered." },
      {
        label: "Baseline & window",
        value:
          "Baseline not supplied. Agree the observation window with the owner based on traffic and measurement quality.",
        tone: "gap",
      },
      {
        label: "Approval & outcome",
        value:
          "Approval is required for the specific experiment scope and any external action. No experiment has run; no result is observed.",
      },
    ],
  },
];

export function MissionSampleRecord() {
  const [active, setActive] = useState(0);
  const id = useId();
  const record = RECORDS[active]!;
  const Icon = record.icon;
  const markdown = `# ${record.title} · ${record.id}\n\nHypothetical DeliverX sample. No customer research, real owner approval or experiment was performed.\n\n${record.fields.map((field) => `## ${field.label}\n${field.value}`).join("\n\n")}\n\n## Next handoff\n${record.next}\n\nLinked records: B-01 → E-01 / E-02 → D-01 → A-01. This sample records no observed improvement.\n`;
  return (
    <div className="sample-record-reader">
      <div className="sample-reader-banner">
        <span>Onboarding investigation</span>
        <span>Hypothetical sample · no real approvals</span>
      </div>
      <div className="sample-reader-layout">
        <div className="sample-reader-directory" role="group" aria-label="Inspect sample documents">
          <span className="sample-directory-label">Mission documents</span>
          {RECORDS.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                aria-pressed={active === index}
                aria-controls={id}
                onClick={() => setActive(index)}
              >
                <ItemIcon aria-hidden="true" size={18} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.id}</small>
                </span>
                <ArrowRight aria-hidden="true" size={14} />
              </button>
            );
          })}
          <p>
            Fixed example records. Choices in the decision exercise do not change these documents.
          </p>
        </div>
        <article id={id} className="sample-reader-document" aria-label={`Sample ${record.title}`}>
          <header aria-live="polite">
            <div className="sample-document-icon">
              <Icon size={23} aria-hidden="true" />
            </div>
            <div>
              <span className="sample-document-reference">{record.id}</span>
              <h4>{record.title}</h4>
            </div>
            <span className="sample-document-status">{record.status}</span>
          </header>
          <p className="sample-document-subtitle">{record.subtitle}</p>
          <dl className="sample-document-fields">
            {record.fields.map((field) => (
              <div key={field.label} data-tone={field.tone}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          <div className="sample-record-provenance">
            <span>Trace the reasoning</span>
            <div role="group" aria-label="Follow linked sample records">
              {RECORDS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                >
                  {item.id}
                  {index < RECORDS.length - 1 && <ArrowRight aria-hidden="true" size={12} />}
                </button>
              ))}
            </div>
          </div>
          <footer>
            <div>
              <span>Next handoff</span>
              <p>{record.next}</p>
            </div>
            <button
              type="button"
              className="dxl-btn dxl-btn-ghost"
              onClick={() => downloadText(`deliverx-onboarding-sample-${active + 1}.md`, markdown)}
            >
              <Download aria-hidden="true" size={15} />
              Download sample {record.title.toLowerCase()}
            </button>
          </footer>
        </article>
      </div>
      <p className="sample-reader-footnote">
        Downloads are local documents. They grant no permission to contact customers, run an
        experiment or deploy.
      </p>
    </div>
  );
}
