import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — DeliverX" },
      { name: "description", content: "Learn why DeliverX exists and how Professional Intelligence helps product people build, prove and deliver." },
      { property: "og:title", content: "About — DeliverX" },
      { property: "og:description", content: "Learn why DeliverX exists and how Professional Intelligence helps product people build, prove and deliver." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingLayout>
      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="mx-auto max-w-2xl">
            <span className="mkt-label">About</span>
            <h1 className="mt-4 font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.03em] text-[var(--mkt-text1)]">
              Professional Intelligence for product people
            </h1>
            <p className="mt-6 text-lg font-light leading-relaxed text-[var(--mkt-text2)]">
              DeliverX was built on a simple belief: the best way to prove product capability is to
              practise it, document it, and deliver with support. We combine AI colleagues,
              structured projects and evidence packaging so individuals and teams can move from
              ambition to impact faster.
            </p>
            <div className="mt-12 space-y-8">
              {[
                {
                  title: "Our mission",
                  body: "Make product capability visible, measurable and transferable — from first experience through senior delivery.",
                },
                {
                  title: "How we work",
                  body: "AI drafts, humans decide. Every recommendation is surfaced for review, and every artefact can be traced back to evidence.",
                },
                {
                  title: "Who it's for",
                  body: "Aspiring and practising product managers, delivery leads, and the teams that hire and grow them.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h2 className="font-serif text-xl tracking-[-0.01em] text-[var(--mkt-text1)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-base font-light leading-relaxed text-[var(--mkt-text2)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
