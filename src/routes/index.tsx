import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JudgementFlow } from "@/components/marketing/judgement-flow";
import { OnboardingGate } from "@/components/onboarding-gate";
import { ProductIllustration } from "@/components/marketing/product-illustration";
import { LiveDecision, LiveProgrammeFlow } from "@/components/marketing/dxsi-landing";

const TITLE = "DeliverX — From product idea to continuous intelligence";
const DESCRIPTION =
  "Product Super Intelligence connects evidence, specialist contributions, human decisions and product delivery in one evolving record.";

const HOW_IT_WORKS_SCHEMA = [
  { name: "Describe", desc: "Describe your idea or business case." },
  { name: "Discover", desc: "Agents research the market, customers and technology in parallel." },
  { name: "Decide", desc: "Specialist panels debate options; you approve high-impact decisions." },
  { name: "Build", desc: "Design, architecture and build sprints with peer review." },
  {
    name: "Verify & launch",
    desc: "Automated verification, go/no-go, launch plan and full export.",
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
            One intelligent workspace connecting evidence, decisions, specialist AI agents, product
            delivery and learning.
          </p>
          <div className="dxl-ctas">
            <Link to="/psi" className="dxl-btn dxl-btn-primary">
              Explore the platform <ArrowRight size={16} />
            </Link>
            <Link to="/how-it-works" className="dxl-btn dxl-btn-ghost">
              View example mission
            </Link>
          </div>
          <div className="psi-product-preview">
            <div className="psi-preview-sidebar">
              <strong>DeliverX / Product Brain</strong>
              <span>Overview</span>
              <span>Missions</span>
              <span>Evidence</span>
              <span>Decisions</span>
            </div>
            <div className="psi-preview-main">
              <p className="dxl-eyebrow">Example mission · illustrative interface</p>
              <h2>Improve onboarding</h2>
              <div className="psi-preview-metrics">
                <span>
                  Objective<strong>Reduce first-step friction</strong>
                </span>
                <span>
                  Specialists<strong>Research + Product + QA</strong>
                </span>
                <span>
                  Stage<strong>Decision ready</strong>
                </span>
              </div>
              <p className="psi-preview-chain">
                Evidence brief → Specialist positions → Your approval → Prototype brief
              </p>
              <p>
                Recommendation: compare a shorter first session with the current onboarding flow.
              </p>
              <small>Hypothetical scenario. No customer result or live execution is claimed.</small>
            </div>
          </div>
          <p className="psi-fine-print">
            Illustrative interface composition, not a verified live product screenshot.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">01 · The problem</p>
          <h2 className="dxl-h2">Every handoff can lose the reason.</h2>
          <p className="psi-lead">
            Research in one tool. Decisions in a chat. Delivery in another backlog. When the context
            disappears, teams repeat questions and build on assumptions.
          </p>
          <div className="psi-feature-grid">
            {[
              "Evidence without a decision",
              "A recommendation without a challenge",
              "Delivery without observed feedback",
            ].map((x) => (
              <div className="psi-feature" key={x}>
                <h3>{x}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">02 · Meet Product Brain</p>
            <h2 className="dxl-h2">One evolving product record.</h2>
            <p>
              Your sources connect to decisions, and decisions connect to artefacts. Inspect the
              rationale before the next mission starts.
            </p>
            <Link to="/product-brain" className="dxl-link">
              Explore Product Brain →
            </Link>
          </div>
          <ProductIllustration name="product-brain" />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">03 · Specialist workforce</p>
            <h2 className="dxl-h2">
              Different disciplines.
              <br />
              Shared context.
            </h2>
            <p>
              150 catalogue roles organised into 12 browsing groups. Explore the directory to see
              capability status and limitations. Missions use enabled capabilities.
            </p>
            <Link to="/ai-agents" className="dxl-link">
              Explore agents →
            </Link>
          </div>
          <ProductIllustration name="specialist-team" />
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">04 · From idea to impact</p>
          <h2 className="dxl-h2">A lifecycle with human gates.</h2>
          <LiveProgrammeFlow />
          <Link to="/how-it-works" className="dxl-link">
            Explore each stage →
          </Link>
        </div>
      </section>
      <section className="psi-section psi-tinted" id="decisions">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">05 · A mission in action</p>
          <JudgementFlow />
          <details>
            <summary>Inspect the sample decision engine</summary>
            <LiveDecision />
          </details>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">06 · Continuous learning</p>
            <h2 className="dxl-h2">
              What happened informs
              <br />
              what comes next.
            </h2>
            <p>
              Bring observed results back to the product record and use them to frame the next
              question. Connected outcome tracking and automatic learning are planned capabilities.
            </p>
            <Link to="/product-brain" className="dxl-link">
              Follow the learning loop →
            </Link>
          </div>
          <ProductIllustration name="learning-loop" />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">07 · Trust & governance</p>
            <h2 className="dxl-h2">Judgement stays accountable.</h2>
            <p>
              You approve consequential steps. Records retain dissent, sources and generation mode.
              Permissions and usage ceilings bound the work.
            </p>
            <Link to="/security" className="dxl-link">
              View safeguards →
            </Link>
          </div>
          <ProductIllustration name="human-direction" />
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">08 · Build with purpose</p>
          <h2 className="dxl-h2">
            Bring a product question.
            <br />
            Make the next step tangible.
          </h2>
          <div className="psi-actions">
            <Link to="/pricing" className="dxl-btn dxl-btn-primary">
              Explore paid pilots
            </Link>
            <Link to="/resources" className="dxl-btn dxl-btn-ghost">
              Prepare a product brief
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
