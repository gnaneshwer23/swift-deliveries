import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Briefcase, Target, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DeliverX" },
      { name: "description", content: "Discover how DeliverX connects experience, opportunity and delivery in one platform." },
      { property: "og:title", content: "How it works — DeliverX" },
      { property: "og:description", content: "Discover how DeliverX connects experience, opportunity and delivery in one platform." },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: Briefcase,
    title: "Experience",
    subtitle: "Build the experience",
    body: "Join a living organisation and work on real product problems with AI colleagues. Every decision, artefact and outcome is captured in your Experience Record.",
  },
  {
    icon: Target,
    title: "Launchpad",
    subtitle: "Land the opportunity",
    body: "Label your readiness, package evidence into a CV employers can evaluate, and practise interviews with AI feedback. Track applications until you land the offer.",
  },
  {
    icon: Users,
    title: "Professional Workspace",
    subtitle: "Succeed in the role",
    body: "Bring the same intelligence into your real team. AI teammates help draft, review and align work while humans stay in control of every decision.",
  },
];

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mkt-label">How it works</span>
            <h1 className="mkt-section-title mt-3">One loop: experience, opportunity, delivery</h1>
            <p className="mkt-section-sub mx-auto">
              DeliverX replaces disconnected career and delivery tools with a single intelligence
              layer that grows with you.
            </p>
          </div>
          <div className="mt-14 space-y-6">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="mkt-feature-row mkt-card flex flex-col gap-6 p-6 md:flex-row md:items-center"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--mkt-green)] text-lg font-bold text-white">
                  {index + 1}
                </div>
                <div className="mkt-feature-icon hidden md:flex">
                  <step.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <span className="mkt-label">{step.subtitle}</span>
                  <h2 className="mt-1 font-serif text-2xl tracking-[-0.02em] text-[var(--mkt-text1)]">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-base font-light leading-relaxed text-[var(--mkt-text2)]">
                    {step.body}
                  </p>
                </div>
                <ArrowRight className="hidden size-5 shrink-0 text-[var(--mkt-text3)] md:block" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
