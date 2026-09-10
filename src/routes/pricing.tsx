import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — DeliverX" },
      { name: "description", content: "Open pilot access for Experience, Launchpad and Professional Workspace." },
      { property: "og:title", content: "Pricing — DeliverX" },
      { property: "og:description", content: "Open pilot access for Experience, Launchpad and Professional Workspace." },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Experience",
    price: "Free",
    period: "during pilot",
    description: "Build product judgement inside living organisations.",
    features: [
      "Access to pilot organisations",
      "Experience Record",
      "AI PM Copilot",
      "Project artefacts and evidence",
    ],
    cta: "Join pilot",
    href: "/signup",
    featured: false,
  },
  {
    name: "Launchpad",
    price: "Free",
    period: "during pilot",
    description: "Turn experience into interviews and offers.",
    features: [
      "Readiness labelling",
      "Evidence CV packaging",
      "Interview practice",
      "Application tracking",
    ],
    cta: "Join pilot",
    href: "/signup",
    featured: false,
  },
  {
    name: "Professional Workspace",
    price: "Free",
    period: "during pilot",
    description: "Collaborate with AI teammates in one workspace.",
    features: [
      "Role-based AI teammates",
      "Meetings and decisions",
      "Stakeholder artefacts",
      "Delivery evidence trail",
    ],
    cta: "Join pilot",
    href: "/signup",
    featured: true,
  },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mkt-label">Pricing</span>
            <h1 className="mkt-section-title mt-3">Pilot access is open</h1>
            <p className="mkt-section-sub mx-auto">
              All three products are free while in pilot. We'll introduce paid plans as the platform
              matures, with generous free tiers for individuals.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={tier.featured ? "mkt-pricing-tier-featured" : "mkt-pricing-tier"}
              >
                <h3 className={`font-serif text-xl tracking-[-0.01em] ${tier.featured ? "text-white" : "text-[var(--mkt-text1)]"}`}>
                  {tier.name}
                </h3>
                <p className={`mt-1 text-sm ${tier.featured ? "text-white/80" : "text-[var(--mkt-text3)]"}`}>
                  {tier.description}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className={`font-serif text-3xl tracking-[-0.02em] ${tier.featured ? "text-white" : "text-[var(--mkt-text1)]"}`}>
                    {tier.price}
                  </span>
                  <span className={`text-xs ${tier.featured ? "text-white/70" : "text-[var(--mkt-text3)]"}`}>
                    {tier.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`size-4 shrink-0 ${tier.featured ? "text-white" : "text-[var(--mkt-green-l)]"}`} />
                      <span className={tier.featured ? "text-white/90" : "text-[var(--mkt-text2)]"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={tier.href}
                  className={`mt-8 block w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                    tier.featured
                      ? "bg-white text-[var(--mkt-green)] hover:bg-[var(--mkt-s2)]"
                      : "bg-[var(--mkt-green)] text-white hover:bg-[var(--mkt-green-m)]"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
