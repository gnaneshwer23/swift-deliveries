import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { BriefBuilder } from "@/components/marketing/brief-builder";
import { RESOURCE_TEMPLATES, downloadText } from "@/lib/marketing/product-resources";
import { BRIEF_PRESETS, parseBriefPreset, type BriefPreset } from "@/lib/marketing/brief-presets";

export const Route = createFileRoute("/resources/")({
  validateSearch: (search: Record<string, unknown>): { useCase?: BriefPreset | undefined } => ({
    useCase: parseBriefPreset(search["useCase"]),
  }),
  head: () =>
    pageHead(
      "/resources",
      "Prepare your product brief — DeliverX resources",
      "Write and download a product brief, or start with an editable founder, product-team or student example. Keep evidence, decisions and experiments inspectable.",
    ),
  component: Resources,
});
function Resources() {
  const { useCase } = Route.useSearch();
  const preset = useCase ? BRIEF_PRESETS[useCase] : undefined;
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Resources</p>
          <h1 className="dxl-h1">
            Prepare a question
            <br />
            worth investigating.
          </h1>
          <p className="psi-lead">
            Write a brief you can download and keep. Use the evidence, decision and experiment
            templates as the work develops.
          </p>
          <a href="#brief-builder" className="dxl-btn dxl-btn-primary">
            Write your brief
          </a>
          <p className="journey-status">
            These public tools need no account. Your entered brief is not sent to a server or saved
            when you leave. Download it before navigating away. This does not submit a pilot request
            or activate paid access.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-builder-layout">
          <div className="psi-section-copy">
            <h2 className="dxl-h2">
              Start specific.
              <br />
              Keep room to learn.
            </h2>
            <p>
              Name the audience, the difficulty and the outcome you want to investigate. Record what
              you do not yet know.
            </p>
            {preset ? (
              <div className="journey-status">
                <strong>Starting point: {preset.label}</strong>
                <p>
                  This editable starter is hypothetical, not validated research. Replace its
                  assumptions with your own context before downloading.
                </p>
              </div>
            ) : (
              <p>
                Use a blank brief below, load the onboarding example, or choose a starting point:
              </p>
            )}
            <div className="resource-starts">
              {Object.entries(BRIEF_PRESETS).map(([key, item]) => (
                <Link
                  key={key}
                  to="/resources"
                  search={{ useCase: parseBriefPreset(key) }}
                  hash="brief-builder"
                  aria-current={useCase === key ? "page" : undefined}
                  className="dxl-link"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link to="/how-it-works" hash="sample-record" className="dxl-link">
              Inspect completed sample documents
            </Link>
          </div>
          <BriefBuilder key={useCase ?? "blank"} initialBrief={preset?.brief} />
        </div>
      </section>
      <section className="psi-section" id="templates">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Keep the reasons alongside the work.</h2>
          <p>
            Blank Markdown templates, editable in any text editor. These are planning tools, not
            generated findings.
          </p>
          <div className="psi-template-grid">
            {RESOURCE_TEMPLATES.map((template, index) => (
              <article className="psi-template" key={template.key}>
                <div className="resource-document-mark" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div>
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <button
                    type="button"
                    className="psi-text-button"
                    onClick={() =>
                      downloadText(`deliverx-${template.key}-template.md`, template.body)
                    }
                  >
                    Download {template.title.toLowerCase()}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Before your next step.</h2>
          <ol className="use-case-flow" aria-label="Prepare for pilot discussion">
            <li>
              <span>Review</span>
              <strong>Check scope, evidence gaps and non-goals.</strong>
            </li>
            <li>
              <span>Download</span>
              <strong>Keep your brief; it does not transfer automatically.</strong>
            </li>
            <li>
              <span>Compare</span>
              <strong>Explore a paid pilot offer for the bounded work.</strong>
            </li>
          </ol>
          <Link to="/pricing" className="dxl-btn dxl-btn-primary">
            Compare pilot offers
          </Link>
          <p className="psi-fine-print">
            Pilot availability and billing must be agreed separately. The current preparation page
            does not submit an enquiry.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
