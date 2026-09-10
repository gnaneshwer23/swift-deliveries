import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — DeliverX" },
      { name: "description", content: "Guides, templates and reference materials for product people using DeliverX." },
      { property: "og:title", content: "Resources — DeliverX" },
      { property: "og:description", content: "Guides, templates and reference materials for product people using DeliverX." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mkt-label">Resources</span>
            <h1 className="mkt-section-title mt-3">Learn and reference</h1>
            <p className="mkt-section-sub mx-auto">
              A growing library of guides, templates and playbooks for building product
              intelligence.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              "Product Charter Template",
              "Stakeholder Interview Guide",
              "Decision Log Template",
              "Experience Record Checklist",
              "Readiness Rubric",
              "AI Teammate Prompts",
            ].map((title) => (
              <div key={title} className="mkt-card p-6">
                <h3 className="font-serif text-lg tracking-[-0.01em] text-[var(--mkt-text1)]">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-[var(--mkt-text3)]">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
