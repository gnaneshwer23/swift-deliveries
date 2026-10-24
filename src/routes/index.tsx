import { HomeProductStory } from "@/components/marketing/home-product-story";
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
      <section className="dxl-hero dxl-hero-home">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">DeliverX · Product Super Intelligence</p>
          <h1 className="dxl-h1">
            From product idea
            <br />
            <span className="dxl-grad">to continuous intelligence.</span>
          </h1>
          <p className="dxl-lead">
            For founders and product builders, turn a product question into an evidence brief,
            compared options and a clear next step, then keep the reasoning together and approve the
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
      <HomeProductStory />
    </MarketingLayout>
  );
}
