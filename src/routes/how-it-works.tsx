import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How DeliverX Works — Evidence to Opportunity" },
      { name: "description", content: "See how product work becomes traceable evidence, versioned capability judgement and externally verified career proof." },
      { property: "og:title", content: "How DeliverX Works — Evidence to Opportunity" },
      { property: "og:description", content: "A clear path from realistic product work to evidence, capability judgement and verified career proof." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  ["01", "Do realistic work", "Work through product situations with constraints, stakeholders and consequences."],
  ["02", "Capture the artefact", "Decisions and outputs enter a private, provenance-backed evidence record."],
  ["03", "Judge capability", "Evidence is assessed against a pinned, versioned capability framework."],
  ["04", "Package readiness", "Strong evidence becomes an explainable portfolio and readiness narrative."],
  ["05", "Verify externally", "Only external attestation can activate the Verified signal."],
] as const;

const PATHS = [
  ["Experience", "Build the experience", "/experience"],
  ["Launchpad", "Land the opportunity", "/launchpad"],
  ["Workspace", "Succeed in the role", "/professional-workspace"],
] as const;

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-[var(--mkt-border)] px-5 lg:px-8">
        <div className="mx-auto grid max-w-[var(--mkt-maxw)] border-x border-[var(--mkt-border)] lg:grid-cols-12">
          <div className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-14">
            <p className="mkt-label">How it works / One evidence loop</p>
            <h1 className="mt-8 max-w-4xl text-[clamp(3rem,6vw,5.75rem)] font-black uppercase leading-[0.9] text-[var(--mkt-text1)]">
              Work becomes proof.<br /><span className="text-[var(--mkt-text-faint)]">Proof earns trust.</span>
            </h1>
            <p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-[var(--mkt-text2)]">
              DeliverX keeps knowledge, evidence and capability separate—then connects them through a traceable process.
            </p>
          </div>
          <aside className="flex flex-col justify-between bg-[var(--mkt-text1)] p-6 text-[var(--mkt-on-dark)] sm:p-10 lg:col-span-4">
            <LockKeyhole className="size-8 text-[var(--mkt-green-l)]" />
            <div className="mt-24">
              <p className="mkt-label-dark">Trust rule</p>
              <p className="mt-4 text-xl font-bold leading-snug">A score, draft or self-report can never become Verified by itself.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            <div><p className="mkt-label">The method</p><h2 className="mkt-editorial-title mt-5">Five steps.<br />No shortcuts.</h2></div>
            <ol className="border-t border-[var(--mkt-border-l)]">
              {STEPS.map(([number, title, body]) => (
                <li key={number} className="grid gap-4 border-b border-[var(--mkt-border)] py-7 sm:grid-cols-[3rem_1fr_1.5fr] sm:items-start">
                  <span className="font-mono text-xs text-[var(--mkt-green-m)]">{number}</span>
                  <h3 className="text-base font-bold uppercase text-[var(--mkt-text1)]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-[var(--mkt-maxw)]">
          <p className="mkt-label">Choose your entry point</p>
          <div className="mt-8 grid border border-[var(--mkt-border-l)] bg-[var(--mkt-s1)] md:grid-cols-3">
            {PATHS.map(([title, subtitle, href], index) => (
              <Link key={title} to={href} className="group min-h-56 border-b border-[var(--mkt-border)] p-6 transition-colors hover:bg-[var(--mkt-text1)] md:border-b-0 md:border-r md:last:border-r-0">
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-[var(--mkt-green-m)]">0{index + 1}</span><ArrowRight className="size-4 text-[var(--mkt-text3)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--mkt-green-l)]" /></div>
                <h3 className="mt-20 text-xl font-black uppercase text-[var(--mkt-text1)] group-hover:text-[var(--mkt-on-dark)]">{title}</h3>
                <p className="mt-2 text-xs font-bold uppercase text-[var(--mkt-green-m)] group-hover:text-[var(--mkt-green-l)]">{subtitle}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 text-sm text-[var(--mkt-text2)]"><Check className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green-l)]" /><p>Evidence stays private by default throughout the journey.</p></div>
        </div>
      </section>
    </MarketingLayout>
  );
}