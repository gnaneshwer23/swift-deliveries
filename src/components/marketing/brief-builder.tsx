import { useState } from "react";
import { ArrowDownToLine, Check, RotateCcw } from "lucide-react";
import {
  briefMarkdown,
  downloadText,
  EMPTY_BRIEF,
  EXAMPLE_BRIEF,
  type ProductBrief,
} from "@/lib/marketing/product-resources";

const FIELDS: {
  key: keyof ProductBrief;
  label: string;
  placeholder: string;
  required?: boolean;
}[] = [
  {
    key: "product",
    label: "Product or working title",
    placeholder: "What are you thinking of building?",
  },
  {
    key: "audience",
    label: "Who is it for?",
    placeholder: "Name a specific group and their context.",
    required: true,
  },
  {
    key: "problem",
    label: "What problem do you want to investigate?",
    placeholder: "Describe the difficulty, rather than the feature you want.",
    required: true,
  },
  {
    key: "objective",
    label: "What should be better?",
    placeholder: "An observable outcome for that person.",
    required: true,
  },
  {
    key: "constraints",
    label: "Constraints and non-goals",
    placeholder: "Time, budget, scope and what the team must not do.",
  },
  {
    key: "evidence",
    label: "What evidence do you have?",
    placeholder: "Notes, sources or a clear statement of what is still unknown.",
  },
];

export function BriefBuilder() {
  const [brief, setBrief] = useState<ProductBrief>(EMPTY_BRIEF);
  const [downloaded, setDownloaded] = useState(false);
  const ready = [brief.audience, brief.problem, brief.objective].every(
    (value) => value.trim().length > 0,
  );
  return (
    <div className="psi-brief-builder" id="brief-builder">
      <div className="psi-builder-top">
        <span className="psi-label">Your first product brief</span>
        <button
          type="button"
          className="psi-text-button"
          onClick={() => {
            setBrief(EXAMPLE_BRIEF);
            setDownloaded(false);
          }}
        >
          Load an example
        </button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) {
            downloadText("deliverx-product-brief.md", briefMarkdown(brief));
            setDownloaded(true);
          }
        }}
      >
        {FIELDS.map((field) => (
          <div className="psi-field" key={field.key}>
            <label htmlFor={`brief-${field.key}`}>
              {field.label}
              {field.required ? <span aria-hidden="true"> *</span> : null}
            </label>
            <textarea
              id={`brief-${field.key}`}
              value={brief[field.key]}
              placeholder={field.placeholder}
              rows={field.key === "product" ? 1 : 2}
              maxLength={2000}
              required={field.required}
              onChange={(event) => {
                setBrief((previous) => ({ ...previous, [field.key]: event.target.value }));
                setDownloaded(false);
              }}
            />
          </div>
        ))}
        <p className="psi-fine-print">
          Required: audience, problem and outcome. Your answers stay in this page; they are not sent
          to a server or saved when you leave.
        </p>
        <div className="psi-builder-actions">
          <button type="submit" className="dxl-btn dxl-btn-primary" disabled={!ready}>
            <ArrowDownToLine size={16} /> Download my brief
          </button>
          <button
            type="button"
            className="psi-text-button"
            onClick={() => {
              setBrief(EMPTY_BRIEF);
              setDownloaded(false);
            }}
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>
        <p className="psi-download-status" role="status">
          {downloaded ? (
            <>
              <Check size={15} /> Your brief is ready in your downloads.
            </>
          ) : (
            "Markdown format · editable in any text editor"
          )}
        </p>
      </form>
    </div>
  );
}
