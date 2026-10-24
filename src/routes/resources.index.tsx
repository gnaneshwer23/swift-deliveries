import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, Check } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { ProductIllustration } from "@/components/marketing/product-illustration";
import { BriefBuilder } from "@/components/marketing/brief-builder";
import { RESOURCE_TEMPLATES, downloadText } from "@/lib/marketing/product-resources";
import { CtaLink } from "@/components/marketing/cta-link";

export const Route = createFileRoute("/resources/")({
  head: () =>
    pageHead(
      "/resources",
      "Product-building resources — DeliverX",
      "Write and download a product brief. Get practical evidence, decision and experiment templates to work thoughtfully with an AI product team.",
    ),
  component: ResourcesPage,
});
function ResourcesPage() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">The builder's desk</p>
            <h1 className="dxl-h1">
              Less blank page.
              <br />
              <span className="dxl-grad">More clear thinking.</span>
            </h1>
            <p className="psi-lead">
              Practical starting points for a product worth building. Write your first brief, keep
              track of evidence and make your next decision easier to inspect.
            </p>
            <a href="#brief-builder" className="dxl-btn dxl-btn-primary">
              Build my brief <ArrowDownToLine size={16} />
            </a>
            <p className="psi-fine-print">Free tools and editable templates. No account needed.</p>
          </div>
          <ProductIllustration name="product-brain" priority />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-builder-layout">
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">01 · Frame the work</p>
            <h2 className="dxl-h2">
              A better brief makes
              <br />a better starting point.
            </h2>
            <p>
              Describe the person, the problem and the change you want to see. Leave room for the
              team to discover an answer you didn't expect.
            </p>
            <ProductIllustration name="specialist-team" compact />
            <ul className="psi-check-list">
              <li>
                <Check size={16} />
                Specific audience, rather than “everyone”.
              </li>
              <li>
                <Check size={16} />A problem to investigate, rather than a fixed feature list.
              </li>
              <li>
                <Check size={16} />A clear outcome and explicit boundaries.
              </li>
            </ul>
          </div>
          <BriefBuilder />
        </div>
      </section>
      <section className="psi-section" id="templates">
        <div className="dxl-wrap">
          <div className="psi-section-heading">
            <p className="dxl-eyebrow">02 · Keep the reasoning</p>
            <h2 className="dxl-h2">Three documents worth keeping.</h2>
            <p>
              Lightweight Markdown templates. Use them with DeliverX or wherever your team works.
            </p>
          </div>
          <div className="psi-template-grid">
            {RESOURCE_TEMPLATES.map((template) => (
              <article className="psi-template" key={template.key}>
                <ProductIllustration name={template.image} compact />
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
                    Download template <ArrowDownToLine size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <ProductIllustration name="product-delivery" />
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">03 · Review the output</p>
            <h2 className="dxl-h2">
              Before you call it done,
              <br />
              open the work.
            </h2>
            <div className="psi-review-checks">
              <details>
                <summary>Does it answer the original problem?</summary>
                <p>
                  Compare the deliverable with the brief and acceptance criteria. A long document is
                  not a substitute for the required outcome.
                </p>
              </details>
              <details>
                <summary>Can you trace the important claims?</summary>
                <p>
                  Follow the source references. Distinguish observations from assumptions. A second
                  agent agreeing with a claim is not independent evidence.
                </p>
              </details>
              <details>
                <summary>What actually ran?</summary>
                <p>
                  Look for retained execution logs before accepting a tested or deployed claim. An
                  HTML prototype and static checks have narrower assurance.
                </p>
              </details>
              <details>
                <summary>What is still unknown?</summary>
                <p>
                  Keep limitations and open questions with the output. Decide what evidence is
                  needed before taking a consequential next step.
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>
      <section className="psi-closing dxl-wrap">
        <p className="dxl-eyebrow">Ready to use your brief?</p>
        <h2 className="dxl-h2">
          Give your next idea
          <br />a team and a direction.
        </h2>
        <CtaLink
          signedInTo="/command/programmes"
          signedInLabel="Open my product workspace"
          signedOutLabel="Start a product project"
          className="dxl-btn dxl-btn-primary"
        />
      </section>
    </MarketingLayout>
  );
}
