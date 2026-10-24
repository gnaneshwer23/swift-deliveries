import { ContextContinuity } from "@/components/marketing/context-and-impact";
import { ProductBrainExplorer } from "@/components/marketing/product-brain-explorer";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { OnboardingGate } from "@/components/onboarding-gate";

const TITLE = "DeliverX — From product idea to continuous intelligence";
const DESCRIPTION =
  "DeliverX helps founders and product builders turn a product question into evidence, an accountable decision and inspectable work.";

const HOW_IT_WORKS_SCHEMA = [
  { name: "Frame", desc: "Define one product question, constraints and supplied evidence." },
  { name: "Investigate", desc: "Organise supplied sources and retain evidence gaps." },
  { name: "Compare", desc: "Inspect alternatives, trade-offs and a recommendation." },
  { name: "Decide", desc: "The owner approves a bounded next step or requests more evidence." },
  {
    name: "Inspect",
    desc: "Review the decision record and experiment brief. This is an illustrative workflow.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/" },
      { property: "og:site_name", content: "DeliverX" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://deliverx.dev/#organization",
              name: "DeliverX",
              url: "https://deliverx.dev/",
              logo: "https://deliverx.dev/favicon.svg",
              description: DESCRIPTION,
            },
            {
              "@type": "WebSite",
              "@id": "https://deliverx.dev/#website",
              url: "https://deliverx.dev/",
              name: "DeliverX",
              description: DESCRIPTION,
              inLanguage: "en-GB",
              publisher: { "@id": "https://deliverx.dev/#organization" },
            },
            {
              "@type": "WebPage",
              "@id": "https://deliverx.dev/#webpage",
              url: "https://deliverx.dev/",
              name: TITLE,
              description: DESCRIPTION,
              isPartOf: { "@id": "https://deliverx.dev/#website" },
            },
            {
              "@type": "SoftwareApplication",
              name: "DeliverX Command Centre",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: DESCRIPTION,
              url: "https://deliverx.dev/",
              brand: { "@id": "https://deliverx.dev/#organization" },
            },
            {
              "@type": "HowTo",
              name: "How DeliverX runs a supervised product mission",
              description: "Mission through plan, approval, execution and delivery.",
              step: HOW_IT_WORKS_SCHEMA.map((s, i) => ({
                "@type": "HowToStep",
                position: i + 1,
                name: s.name,
                text: s.desc,
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <OnboardingGate />
      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">DeliverX · Product Super Intelligence</p>
          <h1 className="dxl-h1">
            From product idea
            <br />
            <span className="dxl-grad">to continuous intelligence.</span>
          </h1>
          <p className="dxl-lead">
            For founders and product builders. Turn your product question into an evidence brief,
            compared options and a clear next step. Keep the reasoning together and approve the
            decisions that matter.
          </p>
          <div className="dxl-ctas">
            <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
              Explore the example <ArrowRight size={16} />
            </Link>
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-ghost">
              Prepare your brief
            </Link>
          </div>
          <ProductBrainExplorer />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">01 · The problem</p>
          <h2 className="dxl-h2">Every handoff can lose the reason.</h2>
          <ContextContinuity />
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">A useful first outcome</p>
            <h2 className="dxl-h2">One question. A decision you can explain.</h2>
            <p>
              Which onboarding change should we investigate first? Follow a sample from supplied
              evidence to compared options, an owner decision and an experiment brief.
            </p>
            <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
              Inspect the example mission
            </Link>
          </div>
          <div className="journey-output-list">
            <p>
              <strong>Evidence register</strong>
              <span>Sources, observations and what is still unknown.</span>
            </p>
            <p>
              <strong>Decision record</strong>
              <span>Alternatives, objections and the reason for the owner's choice.</span>
            </p>
            <p>
              <strong>Experiment brief</strong>
              <span>A bounded next step and a plan to measure it.</span>
            </p>
            <p className="psi-fine-print">
              Illustrative sample documents, not customer research or observed results.
            </p>
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">The product behind the example</p>
          <h2 className="dxl-h2">Shared context. Specialist contributions. Your call.</h2>
          <div className="psi-feature-grid">
            <div className="psi-feature">
              <h3>Keep the reasoning</h3>
              <p>
                Product Brain keeps the order on a supervised mission: decision, owner-supplied
                observation, review, then a proposed next mission.
              </p>
              <Link to="/psi" hash="product-brain" className="dxl-link">
                Explore the product record
              </Link>
            </div>
            <div className="psi-feature">
              <h3>Understand the contribution</h3>
              <p>
                Specialist roles have bounded inputs and outputs. Catalogue entries are not proof of
                live execution.
              </p>
              <Link to="/ai-agents" className="dxl-link">
                Inspect specialist status
              </Link>
            </div>
            <div className="psi-feature">
              <h3>Control the next step</h3>
              <p>
                Consequential work needs human approval. Inspect scope, evidence and uncertainty.
              </p>
              <Link to="/security" className="dxl-link">
                Read about safeguards
              </Link>
            </div>
          </div>
          <p className="journey-status">
            Current scope: a supervised mission can keep a decision, an owner-supplied observation,
            a versioned review and a proposed next mission. Connected analytics, automatic approval
            and production deployment are not included. Release verification is still required.
          </p>
          <Link to="/psi" className="dxl-link">
            See the system and its current scope
          </Link>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Build with purpose</p>
            <h2 className="dxl-h2">Bring a question worth investigating.</h2>
            <p>
              Founders validate a direction. Product teams investigate an improvement. Students
              learn by building and inspecting the same work.
            </p>
          </div>
          <div>
            <p>
              Prepare your brief without an account, or explore the three scoped paid pilot offers.
              Pilot scope and availability are confirmed before billing.
            </p>
            <div className="psi-actions">
              <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
                Prepare your brief
              </Link>
              <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
                Explore paid pilots
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
