import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ArrowRight, Building2, ClipboardList, Trophy, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/experience")({
  head: () => ({
    meta: [
      { title: "Experience — DeliverX" },
      { name: "description", content: "Build product judgement inside living organisations with AI colleagues and an Experience Record employers can evaluate." },
      { property: "og:title", content: "Experience — DeliverX" },
      { property: "og:description", content: "Build product judgement inside living organisations with AI colleagues and an Experience Record employers can evaluate." },
    ],
  }),
  component: ExperiencePage,
});

const FEATURES = [
  {
    icon: Building2,
    title: "Living organisations",
    body: "Practise inside simulated companies with real product constraints, stakeholders and roadmaps.",
  },
  {
    icon: ClipboardList,
    title: "Real PM work",
    body: "Own charters, requirements, prioritisation and stakeholder alignment just like in a real role.",
  },
  {
    icon: Trophy,
    title: "Judgement feedback",
    body: "Get structured feedback on decisions, trade-offs and communication from AI teammates.",
  },
  {
    icon: BarChart3,
    title: "Experience Record",
    body: "Every artefact and outcome becomes evidence of your readiness and craft.",
  },
];

function ExperiencePage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-label">Build the experience</span>
            <h1 className="mkt-section-title mt-3">Experience</h1>
            <p className="mkt-section-sub mx-auto">
              Work as a Product Manager before you are one. Build judgement, craft and a portfolio of
              evidence that employers can evaluate.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--mkt-green)] px-7 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-[var(--mkt-green-m)]"
            >
              Join the pilot
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="mkt-card p-6">
                <div className="mkt-feature-icon mb-4">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mkt-text2)]">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
