import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { OnboardingGate } from "@/components/onboarding-gate";
import { DeliverxLanding } from "@/components/marketing/deliverx-landing";
import "@/styles/product-intelligence.css";

const TITLE = "DeliverX — Turn an idea into a complete product project";
const DESCRIPTION =
  "Describe your idea. DeliverX’s AI product team researches it, plans it, builds it, and keeps the evidence.";

const HOW_IT_WORKS_SCHEMA = [
  { name: "Describe", desc: "Submit a short product idea and optional constraints." },
  {
    name: "Investigate",
    desc: "Specialist capabilities research the opportunity and surface gaps.",
  },
  { name: "Brief", desc: "The AI PM explains options, evidence and a recommendation." },
  { name: "Decide", desc: "You approve, revise or request more research." },
  {
    name: "Deliver",
    desc: "Approved work continues with a visible team and a downloadable record.",
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
      <DeliverxLanding />
    </MarketingLayout>
  );
}
