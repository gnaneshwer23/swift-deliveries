import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, EyeOff, FileClock, GitPullRequestArrow } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/professional-workspace")({
  head: () => ({
    meta: [
      { title: "Professional Workspace — DeliverX" },
      { name: "description", content: "Plan, align and document product work with clear ownership, review controls and private-by-default evidence." },
      { property: "og:title", content: "Professional Workspace — DeliverX" },
      { property: "og:description", content: "A controlled workspace for product decisions, artefacts, meetings and evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfessionalWorkspacePage,
});

const FEATURES = [
  { icon: CalendarDays, number: "01", title: "Meetings with continuity", body: "Keep agendas, decisions and follow-ups connected to the work they affect." },
  { icon: FileClock, number: "02", title: "Living artefacts", body: "Maintain charters, requirements and change history without losing context." },
  { icon: GitPullRequestArrow, number: "03", title: "Review before commitment", body: "Drafts remain drafts until a person reviews and submits them." },
  { icon: EyeOff, number: "04", title: "Consent-led observation", body: "Observation is off by default. People decide when it is active and what stays private." },
] as const;

const FLOW = ["Context captured", "Draft prepared", "Human reviewed", "Team committed"] as const;

function ProfessionalWorkspacePage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[var(--mkt-border)] px-5 lg:px-8"><div className="mx-auto grid max-w-[var(--mkt-maxw)] rounded-2xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)] shadow-[var(--mkt-shadow-card)] overflow-hidden lg:grid-cols-12"><div className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-14"><p className="mkt-label">Professional Workspace / Succeed in the role</p><h1 className="mt-8 text-[clamp(3rem,6vw,5.75rem)] font-display font-bold leading-[1] text-[var(--mkt-text1)]">Move the work forward.<br /><span className="text-[var(--mkt-text-faint)]">Keep the context.</span></h1><p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-[var(--mkt-text2)]">One controlled space for meetings, artefacts, decisions and evidence—built around human ownership.</p><Link to="/signup" className="mt-8 inline-flex items-center gap-3 bg-[var(--mkt-green-bright)] px-6 py-4 text-xs font-bold text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green-m)]">Join the pilot <ArrowRight className="size-4" /></Link></div><aside className="flex flex-col justify-between bg-[var(--mkt-s2)] p-6 text-[var(--mkt-text1)] sm:p-10 lg:col-span-4"><EyeOff className="size-9 text-[var(--mkt-green-l)]" /><div className="mt-24"><p className="mkt-label-dark">Consent standard</p><p className="mt-4 text-2xl font-display font-bold leading-tight">Observation starts off. Privacy starts on.</p></div></aside></div></section>

      <section className="px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[var(--mkt-maxw)]"><div className="grid gap-8 lg:grid-cols-[1fr_2fr]"><div><p className="mkt-label">Working system</p><h2 className="mkt-editorial-title mt-5">Assistance without<br />loss of control.</h2></div><p className="max-w-xl text-lg leading-relaxed text-[var(--mkt-text2)] lg:justify-self-end">Support can prepare and review work. People remain accountable for decisions, submissions and commitments.</p></div><div className="mt-16 grid border-l border-t border-[var(--mkt-border)] md:grid-cols-2">{FEATURES.map(({ icon: Icon, number, title, body }) => <article key={title} className="min-h-64 border-b border-r border-[var(--mkt-border)] p-6 sm:p-8"><div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--mkt-green-m)]">{number}</span><Icon className="size-5 text-[var(--mkt-green-m)]" /></div><h3 className="mt-20 font-display text-xl font-bold text-[var(--mkt-text1)]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p></article>)}</div></div></section>

      <section className="border-y border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-5 py-20 lg:px-8"><div className="mx-auto max-w-[var(--mkt-maxw)]"><p className="mkt-label">Control path</p><h2 className="mt-5 max-w-3xl text-3xl font-black uppercase text-[var(--mkt-text1)] sm:text-5xl">Nothing becomes a commitment by accident.</h2><ol className="mt-12 grid border border-[var(--mkt-border-l)] bg-[var(--mkt-s1)] md:grid-cols-4">{FLOW.map((item, index) => <li key={item} className="min-h-44 border-b border-[var(--mkt-border)] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><span className="font-mono text-xs text-[var(--mkt-green-m)]">0{index + 1}</span><p className="mt-16 text-sm font-bold text-[var(--mkt-text1)]">{item}</p></li>)}</ol><div className="mt-10 flex justify-end"><Link to="/signup" className="inline-flex items-center gap-3 bg-[var(--mkt-green-bright)] px-6 py-4 text-xs font-bold text-[var(--mkt-on-dark)] hover:bg-[var(--mkt-green-m)]">Open Workspace <ArrowRight className="size-4" /></Link></div></div></section>
    </MarketingLayout>
  );
}