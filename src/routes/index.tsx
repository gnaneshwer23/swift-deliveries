import { HomePlatformStory } from "@/components/marketing/home-platform-story";
import { ProductBrainExplorer } from "@/components/marketing/product-brain-explorer";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { OnboardingGate } from "@/components/onboarding-gate";

const TITLE = "DeliverX — From product idea to continuous intelligence";
const DESCRIPTION =
  "DeliverX helps founders and product builders turn a product question into evidence, an accountable decision and inspectable work.";

/** The path every project takes; the steps marked "you" never move without the owner. */
const RUN_STEPS = [
  { label: "Idea", who: "You describe it", you: true },
  { label: "Plan", who: "You approve it", you: true },
  { label: "Research", who: "Specialists", you: false },
  { label: "Decide", who: "You choose", you: true },
  { label: "Build", who: "Specialists", you: false },
  { label: "Record", who: "You download it", you: false },
];

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
      { property: "og:url", content: "https://www.deliverx.dev/" },
      { property: "og:site_name", content: "DeliverX" },
      { property: "og:locale", content: "en_GB" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://www.deliverx.dev/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://www.deliverx.dev/#organization",
              name: "DeliverX",
              url: "https://www.deliverx.dev/",
              logo: "https://www.deliverx.dev/favicon.svg",
              description: DESCRIPTION,
            },
            {
              "@type": "WebSite",
              "@id": "https://www.deliverx.dev/#website",
              url: "https://www.deliverx.dev/",
              name: "DeliverX",
              description: DESCRIPTION,
              inLanguage: "en-GB",
              publisher: { "@id": "https://www.deliverx.dev/#organization" },
            },
            {
              "@type": "WebPage",
              "@id": "https://www.deliverx.dev/#webpage",
              url: "https://www.deliverx.dev/",
              name: TITLE,
              description: DESCRIPTION,
              isPartOf: { "@id": "https://www.deliverx.dev/#website" },
            },
            {
              "@type": "SoftwareApplication",
              name: "DeliverX Command Centre",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: DESCRIPTION,
              url: "https://www.deliverx.dev/",
              brand: { "@id": "https://www.deliverx.dev/#organization" },
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
      <section className="dxl-hero dxl-hero-home">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">DeliverX · Product Super Intelligence</p>
          <h1 className="dxl-h1">
            From product idea
            <br />
            <span className="dxl-grad">to continuous intelligence.</span>
          </h1>
          <p className="dxl-lead">
            Describe a product. An AI team researches it and drafts the plan and prototype. You
            approve every decision that matters.
          </p>
          <div className="dxl-ctas">
            <Link to="/onboarding" className="dxl-btn dxl-btn-primary">
              Start building <ArrowRight size={16} />
            </Link>
            <a href="#hp-record" className="dxl-btn dxl-btn-ghost">
              See how a product is built
            </a>
          </div>
          <ol className="hp-runs" aria-label="How a project runs">
            {RUN_STEPS.map((step, i) => (
              <li key={step.label} data-you={step.you ? "true" : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
                <em>{step.who}</em>
              </li>
            ))}
          </ol>
          <ProductBrainExplorer />
        </div>
      </section>
      <HomePlatformStory />
    </MarketingLayout>
  );
}
