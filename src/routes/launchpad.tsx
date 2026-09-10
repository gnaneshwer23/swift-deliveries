import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ArrowRight, FileBadge, Mic2, Send, LineChart } from "lucide-react";

export const Route = createFileRoute("/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad — DeliverX" },
      { name: "description", content: "Turn your experience into interviews with readiness labels, evidence CV packaging and interview practice." },
      { property: "og:title", content: "Launchpad — DeliverX" },
      { property: "og:description", content: "Turn your experience into interviews with readiness labels, evidence CV packaging and interview practice." },
    ],
  }),
  component: LaunchpadPage,
});

const FEATURES = [
  {
    icon: FileBadge,
    title: "Readiness labels",
    body: "See which skills and stories are strongest — and where to invest next.",
  },
  {
    icon: Mic2,
    title: "Interview lab",
    body: "Practise behavioural and product questions with AI feedback on structure and evidence.",
  },
  {
    icon: Send,
    title: "Evidence CV packaging",
    body: "Generate a CV that links claims to artefacts, not just buzzwords.",
  },
  {
    icon: LineChart,
    title: "Application tracking",
    body: "Track roles, referrals and outcomes until you land the right offer.",
  },
];

function LaunchpadPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mkt-label">Land the opportunity</span>
            <h1 className="mkt-section-title mt-3">Launchpad</h1>
            <p className="mkt-section-sub mx-auto">
              Turn your Experience Record into interviews. Label readiness, package evidence and
              practise with AI until you're offer-ready.
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
