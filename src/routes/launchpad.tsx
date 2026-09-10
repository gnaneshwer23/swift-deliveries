import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileBadge2, MessagesSquare, ScanSearch, Stamp } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/launchpad")({
  head: () => ({
    meta: [
      { title: "Launchpad — Evidence-Led Career Readiness" },
      { name: "description", content: "Turn demonstrated product work into an explainable portfolio, stronger interview stories and externally attested career proof." },
      { property: "og:title", content: "Launchpad — Evidence-Led Career Readiness" },
      { property: "og:description", content: "Package demonstrated product work into clear, explainable career proof." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaunchpadPage,
});

const FEATURES = [
  { icon: ScanSearch, title: "Explainable readiness", body: "Understand which claims are supported, what is still heuristic and where evidence is thin." },
  { icon: FileBadge2, title: "Evidence portfolio", body: "Package selected work into a clear story without separating claims from their source." },
  { icon: MessagesSquare, title: "Interview stories", body: "Practise communicating decisions, trade-offs and outcomes using evidence you can defend." },
  { icon: Stamp, title: "External attestation", body: "Request independent confirmation. Verified remains off until the required checks are complete." },
] as const;

function LaunchpadPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[var(--mkt-border)] px-5 lg:px-8">
        <div className="mx-auto max-w-[var(--mkt-maxw)] rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)] overflow-hidden">
          <div className="grid lg:grid-cols-12">
            <div className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-14"><p className="mkt-label">Launchpad / Land the opportunity</p><h1 className="mt-8 text-[clamp(3rem,6vw,5.75rem)] font-display font-bold leading-[1] text-[var(--mkt-text1)]">Make your readiness<br /><span className="text-[var(--mkt-text-faint)]">easy to inspect.</span></h1><p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-[var(--mkt-text2)]">Turn demonstrated work into a portfolio, interview narrative and trust signal that can be explained.</p><Link to="/signup" className="mt-8 inline-flex items-center gap-3 bg-[var(--mkt-green-bright)] px-6 py-4 text-xs font-bold text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green-m)]">Join the pilot <ArrowRight className="size-4" /></Link></div>
            <aside className="flex flex-col justify-between bg-[var(--mkt-green)] p-6 text-[var(--mkt-on-dark)] sm:p-10 lg:col-span-4"><Stamp className="size-9" /><div className="mt-24"><p className="font-mono text-xs uppercase text-[var(--mkt-on-dark-soft)]">Readiness rule</p><p className="mt-4 text-2xl font-display font-bold leading-tight">Explain the signal—or label it heuristic.</p></div></aside>
          </div>
          <div className="grid border-t border-[var(--mkt-border)] sm:grid-cols-3">{["Claims link to evidence", "Framework versions stay visible", "Verification comes from outside"].map((item) => <div key={item} className="border-b border-[var(--mkt-border)] p-5 text-xs font-bold text-[var(--mkt-text2)] last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">{item}</div>)}</div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[var(--mkt-maxw)]"><div className="grid gap-8 lg:grid-cols-[1fr_2fr]"><div><p className="mkt-label">What Launchpad does</p><h2 className="mkt-editorial-title mt-5">Package the truth.<br />Not the theatre.</h2></div><p className="max-w-xl text-lg leading-relaxed text-[var(--mkt-text2)] lg:justify-self-end">Launchpad helps you select, explain and present what your record supports. It does not manufacture capability or inflate confidence.</p></div><div className="mt-16 border-t border-[var(--mkt-border-l)]">{FEATURES.map(({ icon: Icon, title, body }, index) => <article key={title} className="grid gap-5 border-b border-[var(--mkt-border)] py-7 sm:grid-cols-[3rem_1fr_1.5fr_auto] sm:items-start"><span className="font-mono text-xs text-[var(--mkt-green-m)]">0{index + 1}</span><h3 className="font-display text-base font-bold text-[var(--mkt-text1)]">{title}</h3><p className="text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p><Icon className="size-5 text-[var(--mkt-green-m)]" /></article>)}</div></div></section>

      <section className="border-y border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-5 py-16 lg:px-8"><div className="mx-auto grid max-w-[var(--mkt-maxw)] gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="mkt-label">From record to opportunity</p><h2 className="mt-5 max-w-3xl font-display text-3xl font-bold text-[var(--mkt-text1)] sm:text-5xl">Show the work behind every claim.</h2></div><Link to="/signup" className="inline-flex items-center gap-3 bg-[var(--mkt-green-bright)] px-6 py-4 text-xs font-bold text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green-m)]">Open Launchpad <ArrowRight className="size-4" /></Link></div></section>
    </MarketingLayout>
  );
}