import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/experience")({
  head: () => ({
    meta: [
      { title: "Product Management Experience — DeliverX" },
      { name: "description", content: "Practise product management inside realistic organisations and build provenance-backed evidence through the work you complete." },
      { property: "og:title", content: "Product Management Experience — DeliverX" },
      { property: "og:description", content: "Do realistic product work and build a traceable record of what you can demonstrate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperiencePage,
});

const FEATURES = [
  { icon: Building2, number: "01", title: "Living organisations", body: "Enter simulated companies with real constraints, stakeholders and product context." },
  { icon: Scale, number: "02", title: "Consequential decisions", body: "Make trade-offs, explain your reasoning and respond as the situation changes." },
  { icon: FileCheck2, number: "03", title: "Evidence record", body: "Keep artefacts, decisions and provenance together in a private record." },
  { icon: ShieldCheck, number: "04", title: "Structured judgement", body: "See how demonstrated work maps to a versioned capability framework." },
] as const;

const ENTRY = ["Offer", "Hiring interview", "Ceremony", "Day one"] as const;

function ExperiencePage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[var(--mkt-border)] px-5 lg:px-8">
        <div className="mx-auto grid max-w-[var(--mkt-maxw)] rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)] overflow-hidden lg:grid-cols-12">
          <div className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-14">
            <p className="mkt-label">Experience / Build the experience</p>
            <h1 className="mt-8 text-[clamp(3rem,6vw,5.75rem)] font-display font-bold leading-[1] text-[var(--mkt-text1)]">
              Stop describing potential.<br /><span className="text-[var(--mkt-text-faint)]">Demonstrate it.</span>
            </h1>
            <p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-[var(--mkt-text2)]">Work as a product manager inside realistic organisations. Your actions—not the setup—create the evidence.</p>
            <Link to="/signup" className="mt-8 inline-flex items-center gap-3 bg-[var(--mkt-green-bright)] px-6 py-4 text-xs font-bold text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green-m)]">Join the pilot <ArrowRight className="size-4" /></Link>
          </div>
          <aside className="bg-[var(--mkt-s2)] p-6 sm:p-10 lg:col-span-4">
            <p className="mkt-label">Joining Experience</p>
            <ol className="mt-10 border-t border-[var(--mkt-border-l)]">
              {ENTRY.map((item, index) => <li key={item} className="grid grid-cols-[2rem_1fr] border-b border-[var(--mkt-border)] py-5"><span className="font-mono text-xs text-[var(--mkt-text3)]">0{index + 1}</span><span className="text-sm font-bold text-[var(--mkt-text1)]">{item}</span></li>)}
            </ol>
            <p className="mt-8 text-sm leading-relaxed text-[var(--mkt-text2)]">The interview is skippable. The ceremony is narrative. Neither creates capability.</p>
          </aside>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]"><div><p className="mkt-label">The work</p><h2 className="mkt-editorial-title mt-5">A role you act in.<br />Not content you consume.</h2></div><p className="max-w-xl text-lg leading-relaxed text-[var(--mkt-text2)] lg:justify-self-end">Build product judgement through decisions, artefacts and consequences. Feedback helps you improve; only completed work enters the record.</p></div>
          <div className="mt-16 grid border-l border-t border-[var(--mkt-border)] md:grid-cols-2">
            {FEATURES.map(({ icon: Icon, number, title, body }) => <article key={title} className="min-h-64 border-b border-r border-[var(--mkt-border)] p-6 sm:p-8"><div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--mkt-green-m)]">{number}</span><Icon className="size-5 text-[var(--mkt-green-m)]" /></div><h3 className="mt-20 font-display text-xl font-bold text-[var(--mkt-text1)]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bg-[var(--mkt-s2)] px-5 py-16 text-[var(--mkt-text1)] lg:px-8"><div className="mx-auto flex max-w-[var(--mkt-maxw)] flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="mkt-label">Evidence principle</p><h2 className="mt-5 max-w-2xl font-display text-3xl font-bold sm:text-5xl">No evidence before you act.</h2></div><Link to="/signup" className="inline-flex items-center gap-3 rounded-xl border border-[var(--mkt-border-l)] bg-[var(--mkt-s1)] px-6 py-4 text-xs font-bold hover:bg-[var(--mkt-ink)]">Start Experience <ArrowRight className="size-4" /></Link></div></section>
    </MarketingLayout>
  );
}