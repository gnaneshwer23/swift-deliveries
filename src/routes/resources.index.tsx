import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, FileText, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { BriefBuilder } from "@/components/marketing/brief-builder";
import { RESOURCE_TEMPLATES, downloadText } from "@/lib/marketing/product-resources";
import { BRIEF_PRESETS, parseBriefPreset, type BriefPreset } from "@/lib/marketing/brief-presets";

const templateIllustrations = {
  evidence: "connected-record-v1",
  decision: "mission-workbench-v1",
  experiment: "learning-workbench-v1",
};

export const Route = createFileRoute("/resources/")({
  validateSearch: (search: Record<string, unknown>): { useCase?: BriefPreset | undefined } => ({
    useCase: parseBriefPreset(search["useCase"]),
  }),
  head: () =>
    pageHead(
      "/resources",
      "Resources — Frame your next product question | DeliverX",
      "Write a browser-local product brief, preview and download it, or use evidence, decision and experiment templates to keep the reasoning with your work.",
    ),
  component: Resources,
});
function Resources() {
  const { useCase } = Route.useSearch();
  const preset = useCase ? BRIEF_PRESETS[useCase] : undefined;
  return (
    <MarketingLayout>
      <div className="resources-page">
        <section className="resource-opening">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Resources for product work</p>
              <h1>
                A better starting point
                <br />
                for your next decision.
              </h1>
              <p>
                Frame the question, make uncertainty visible and carry the reasoning into the work.
                Start with a brief you can edit, preview and keep.
              </p>
              <div className="psi-actions">
                <a href="#brief-builder" className="dxl-btn dxl-btn-primary">
                  Write your brief
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
                <a href="#templates" className="dxl-btn dxl-btn-ghost">
                  Explore templates
                </a>
              </div>
            </div>
            <div className="resource-opening-visual">
              <FileText aria-hidden="true" />
              <span>Your first product brief</span>
              <h2>
                Context → question
                <br />→ boundaries
              </h2>
              <p>Audience, objective, constraints and the evidence you have.</p>
              <div>
                <ShieldCheck size={15} aria-hidden="true" />
                No account needed · browser-local draft
              </div>
            </div>
          </div>
        </section>
        <section className="resource-workspace-section">
          <div className="dxl-wrap">
            <div className="resource-section-heading">
              <div>
                <p className="dxl-eyebrow">Brief builder</p>
                <h2>
                  Start specific.
                  <br />
                  Leave room to learn.
                </h2>
              </div>
              <p>
                Three short stages create one inspectable brief. The preview updates as you write.
                Missing evidence can be part of the question.
              </p>
            </div>
            <div className="resource-starter-strip">
              <span>Choose a starting point</span>
              <div>
                <Link
                  to="/resources"
                  hash="brief-builder"
                  aria-current={!useCase ? "page" : undefined}
                >
                  Your draft
                </Link>
                {Object.entries(BRIEF_PRESETS).map(([key, item]) => (
                  <Link
                    key={key}
                    to="/resources"
                    search={{ useCase: parseBriefPreset(key) }}
                    hash="brief-builder"
                    aria-current={useCase === key ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            {preset && (
              <p className="resource-starter-notice">
                Selected starter: <strong>{preset.label}</strong>. Hypothetical, editable context.
                An existing saved draft is kept until you explicitly load this starter.
              </p>
            )}
            <BriefBuilder
              key={useCase ?? "blank"}
              initialBrief={preset?.brief}
              initialLabel={preset?.label}
            />
          </div>
        </section>
        <section className="resource-template-section" id="templates">
          <div className="dxl-wrap">
            <div className="resource-section-heading">
              <div>
                <p className="dxl-eyebrow">Keep the record connected</p>
                <h2>
                  Useful structure.
                  <br />
                  Your evidence and judgement.
                </h2>
              </div>
              <p>
                Blank Markdown templates for the work after your brief. They help organise thinking;
                they do not create findings or approve an action.
              </p>
            </div>
            <div className="resource-template-library">
              {RESOURCE_TEMPLATES.map((template, index) => (
                <article key={template.key}>
                  <figure>
                    <img
                      src={`/illustrations/${templateIllustrations[template.key]}.webp`}
                      width={1536}
                      height={1024}
                      alt={
                        template.key === "evidence"
                          ? "Illustrated evidence and decision objects."
                          : template.key === "decision"
                            ? "Illustration of human direction and review."
                            : "Illustrated learning loop."
                      }
                      loading="lazy"
                    />
                  </figure>
                  <div>
                    <span>0{index + 1} · Planning template</span>
                    <h3>{template.title}</h3>
                    <p>{template.description}</p>
                    <button
                      type="button"
                      aria-label={`Download ${template.title.toLowerCase()} template`}
                      onClick={() =>
                        downloadText(`deliverx-${template.key}-template.md`, template.body)
                      }
                    >
                      <Download size={14} aria-hidden="true" />
                      Download Markdown
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <Link to="/how-it-works" hash="sample-documents" className="dxl-link">
              Inspect a filled-in hypothetical example
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="resource-next-section">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Before commissioning work</p>
              <h2>
                Review the question.
                <br />
                Agree the next step.
              </h2>
              <p>
                Keep a downloaded copy. If you choose to make an enquiry on this device, your
                browser draft can carry forward for you to review before submitting.
              </p>
            </div>
            <div>
              <Link to="/pricing" className="dxl-btn dxl-btn-primary">
                Compare paid pilots
              </Link>
              <p>
                An enquiry does not take payment or activate a pilot. Availability, scope and
                billing are agreed separately.
              </p>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
