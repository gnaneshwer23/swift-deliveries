import { useEffect, useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, FileText, RotateCcw } from "lucide-react";
import {
  briefMarkdown,
  downloadText,
  EMPTY_BRIEF,
  EXAMPLE_BRIEF,
  type ProductBrief,
} from "@/lib/marketing/product-resources";
import {
  clearPilotBrief,
  loadPilotBrief,
  savePilotBrief,
  loadPilotPlan,
} from "@/lib/pilot/storage";

const FIELDS = [
  {
    key: "product",
    label: "Product or working title",
    placeholder: "A working name is enough.",
    required: false,
  },
  {
    key: "audience",
    label: "Who is it for?",
    placeholder: "Name a specific group and the situation they are in.",
    required: true,
  },
  {
    key: "problem",
    label: "What problem do you want to investigate?",
    placeholder: "Describe the difficulty or unanswered question, rather than a feature.",
    required: true,
  },
  {
    key: "objective",
    label: "What should be better?",
    placeholder: "Describe an observable outcome for that person.",
    required: true,
  },
  {
    key: "constraints",
    label: "Constraints and non-goals",
    placeholder: "Time, budget, scope and what must not happen without approval.",
    required: false,
  },
  {
    key: "evidence",
    label: "What evidence do you have?",
    placeholder: "Authorised notes, source references, or an honest statement of what is unknown.",
    required: false,
  },
] as const;
const STEPS = [
  {
    title: "Context",
    description: "Define the product and the people.",
    fields: ["product", "audience"],
  },
  {
    title: "Question",
    description: "Frame the uncertainty and useful progress.",
    fields: ["problem", "objective"],
  },
  {
    title: "Boundaries",
    description: "Keep constraints and evidence gaps visible.",
    fields: ["constraints", "evidence"],
  },
] as const;
export function BriefBuilder({
  initialBrief = EMPTY_BRIEF,
  initialLabel,
}: {
  initialBrief?: ProductBrief | undefined;
  initialLabel?: string | undefined;
}) {
  const [brief, setBrief] = useState<ProductBrief>(initialBrief);
  const [downloaded, setDownloaded] = useState(false);
  const [plan, setPlan] = useState<"builder" | "founder" | "studio">("founder");
  const [restored, setRestored] = useState(false);
  const [persistenceUnavailable, setPersistenceUnavailable] = useState(false);
  const [step, setStep] = useState(0);
  const id = useId();
  useEffect(() => {
    setPlan(loadPilotPlan() ?? "founder");
    const stored = loadPilotBrief();
    if (stored && Object.values(stored).some((value) => value.trim())) {
      setBrief(stored);
      setRestored(true);
    } else {
      setBrief(initialBrief);
      if (Object.values(initialBrief).some((value) => value.trim()))
        setPersistenceUnavailable(!savePilotBrief(initialBrief));
    }
  }, [initialBrief]);
  const requiredCount = [brief.audience, brief.problem, brief.objective].filter((value) =>
    value.trim(),
  ).length;
  const ready = requiredCount === 3;
  const current = STEPS[step]!;
  const hasDraft = Object.values(brief).some((value) => value.trim());
  const replaceWithStarter = () => {
    const next = initialLabel ? initialBrief : EXAMPLE_BRIEF;
    setBrief(next);
    setPersistenceUnavailable(!savePilotBrief(next));
    setDownloaded(false);
    setRestored(false);
    setStep(0);
  };
  const download = () => {
    if (ready) {
      downloadText("deliverx-product-brief.md", briefMarkdown(brief));
      setDownloaded(true);
    }
  };
  return (
    <div className="resource-brief-workspace" id="brief-builder">
      <div className="resource-builder-toolbar">
        <div>
          <FileText size={18} aria-hidden="true" />
          <strong>Your product brief</strong>
        </div>
        <span role="status">
          {persistenceUnavailable
            ? "Browser saving unavailable"
            : hasDraft
              ? "Draft kept in this browser"
              : "Start a browser-local draft"}
        </span>
      </div>
      {restored && (
        <p className="resource-builder-notice" role="status">
          Your saved draft is restored. It takes priority over a starter. Loading an example
          replaces it; Clear removes it from this browser.
        </p>
      )}
      {persistenceUnavailable && (
        <p className="resource-builder-warning" role="status">
          Download before leaving or reloading. This browser could not save the draft, so automatic
          enquiry transfer is unavailable.
        </p>
      )}
      <div className="resource-builder-columns">
        <div className="resource-builder-editor">
          <div className="resource-step-selector" role="group" aria-label="Brief writing stages">
            {STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-pressed={step === index}
                aria-controls={id}
                onClick={() => setStep(index)}
              >
                <span>0{index + 1}</span>
                {item.title}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              download();
            }}
          >
            <div className="resource-stage-heading">
              <span>
                Step {step + 1} of 3{step === 2 ? " · Optional context" : ""}
              </span>
              <h3>{current.title}</h3>
              <p>{current.description}</p>
            </div>
            <div id={id}>
              {FIELDS.filter((field) =>
                (current.fields as readonly string[]).includes(field.key),
              ).map((field) => (
                <div className="resource-brief-field" key={field.key}>
                  <label htmlFor={`brief-${field.key}`}>
                    {field.label}
                    <span>{field.required ? "Required" : "Optional"}</span>
                  </label>
                  <textarea
                    id={`brief-${field.key}`}
                    value={brief[field.key]}
                    placeholder={field.placeholder}
                    rows={field.key === "product" ? 1 : 4}
                    maxLength={field.key === "product" ? 200 : 2000}
                    required={field.required}
                    onChange={(event) => {
                      const next = { ...brief, [field.key]: event.target.value };
                      setBrief(next);
                      setPersistenceUnavailable(!savePilotBrief(next));
                      setDownloaded(false);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="resource-stage-actions">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
                <ArrowLeft size={14} aria-hidden="true" />
                Back
              </button>
              {step < 2 ? (
                <button type="button" onClick={() => setStep(step + 1)}>
                  Next: {STEPS[step + 1]!.title}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              ) : (
                <span>Review the preview before downloading.</span>
              )}
            </div>
            <div className="resource-editor-tools">
              <button type="button" onClick={replaceWithStarter}>
                {initialLabel ? `Load ${initialLabel} starter` : "Load onboarding example"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrief(EMPTY_BRIEF);
                  clearPilotBrief();
                  setDownloaded(false);
                  setRestored(false);
                  setStep(0);
                }}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Clear
              </button>
            </div>
            <p className="resource-local-note">
              Examples are hypothetical. No research is generated. Your text stays in this browser
              and out of the URL.
            </p>
          </form>
        </div>
        <aside className="resource-brief-preview" aria-label="Your brief preview">
          <div className="resource-preview-heading">
            <span>Live document preview</span>
            <span>{requiredCount}/3 required fields</span>
          </div>
          <h3>{brief.product.trim() || "Untitled product"}</h3>
          <dl>
            {FIELDS.filter((field) => field.key !== "product").map((field) => (
              <div key={field.key} data-empty={!brief[field.key].trim()}>
                <dt>{field.label}</dt>
                <dd>
                  {brief[field.key].trim() ||
                    (field.required
                      ? "Not supplied yet."
                      : "Not supplied — clarify before starting.")}
                </dd>
              </div>
            ))}
          </dl>
          <div className="resource-preview-review">
            <Check size={15} aria-hidden="true" />
            <p>
              Check scope, assumptions and sources. This brief is your input, not validated
              research.
            </p>
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={download}
            className="dxl-btn dxl-btn-primary"
          >
            <ArrowDownToLine size={15} aria-hidden="true" />
            Download my brief
          </button>
          <p className="resource-brief-download-status" role="status">
            {downloaded
              ? "Your Markdown brief is ready in your downloads."
              : ready
                ? "Ready to download · editable Markdown"
                : "Add an audience, problem and desired outcome to download."}
          </p>
          <Link to="/pilot" search={{ plan }} className="resource-enquiry-link">
            Use this brief in a pilot enquiry
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
          <small>
            Nothing is submitted until you send the enquiry. Downloading does not activate a paid
            pilot.
          </small>
        </aside>
      </div>
    </div>
  );
}
