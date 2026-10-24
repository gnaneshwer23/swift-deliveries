import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { ProductIllustration } from "@/components/marketing/product-illustration";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "/about",
      "About — An AI product company | DeliverX",
      "DeliverX brings product disciplines together around your idea. Build with specialist agents, retain human judgement and learn through the work.",
    ),
  component: About,
});
function About() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Why DeliverX exists</p>
            <h1 className="dxl-h1">
              Good ideas deserve
              <br />
              <span className="dxl-grad">a product team.</span>
            </h1>
            <p className="psi-lead">
              Research, strategy, design, engineering and review belong in the same conversation.
              DeliverX is bringing those disciplines together around the person with the idea.
            </p>
            <Link to="/how-it-works" className="dxl-link">
              See the team at work <ArrowRight size={16} />
            </Link>
          </div>
          <ProductIllustration name="specialist-team" priority />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <div className="psi-section-heading">
            <p className="dxl-eyebrow">The way we work</p>
            <h2 className="dxl-h2">
              More capable tools.
              <br />
              Clear human responsibility.
            </h2>
          </div>
          <div className="psi-template-grid">
            <article className="psi-template">
              <ProductIllustration name="human-direction" compact />
              <div>
                <h3>You direct the work.</h3>
                <p>
                  Agents can propose and challenge. Your judgement belongs at consequential
                  decisions, with space to change the plan.
                </p>
              </div>
            </article>
            <article className="psi-template">
              <ProductIllustration name="evidence-decision" compact />
              <div>
                <h3>The reasoning stays visible.</h3>
                <p>
                  Keep the sources, assumptions and alternatives. Label simulated material and
                  distinguish a generated claim from an observed result.
                </p>
              </div>
            </article>
            <article className="psi-template">
              <ProductIllustration name="product-delivery" compact />
              <div>
                <h3>The work remains yours.</h3>
                <p>
                  Inspect and export the documents, prototype and decision history. Your product
                  should have a usable record outside the platform.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <ProductIllustration name="learning-loop" />
          <div className="psi-section-copy">
            <p className="dxl-eyebrow">For founders, teams and new builders</p>
            <h2 className="dxl-h2">
              Learn through the decisions
              <br />a product asks of you.
            </h2>
            <p>
              Students belong in the same building environment. Frame a problem, inspect an agent's
              contribution, compare the options and take responsibility for the next step.
            </p>
            <p>
              The goal is useful work and better judgement. A generated artefact alone does not
              establish someone's professional capability.
            </p>
            <Link to="/resources" className="dxl-link">
              Start with a practical brief <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="psi-founder">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Built independently</p>
          <h2>A product company, built in the open with its users.</h2>
          <p>
            DeliverX is built and run by its founder, Gnaneshwer Jadav. Questions or feedback?{" "}
            <a href="mailto:gnaneshwer.jadav@gmail.com">Get in touch</a>.
          </p>
          <p className="psi-fine-print">
            A registered company entity is being established. Current service details are in our{" "}
            <Link to="/terms">terms</Link>.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
