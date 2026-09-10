import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ArrowRight, Check, FileCheck2, Fingerprint, Gauge, Quote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeliverX — Professional Intelligence Platform" },
      {
        name: "description",
        content:
          "Do realistic product work, keep provenance-backed evidence and prove capability with DeliverX.",
      },
      {
        property: "og:title",
        content: "DeliverX — Professional Intelligence Platform",
      },
      {
        property: "og:description",
        content:
          "Do realistic product work, keep provenance-backed evidence and prove capability with DeliverX.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <MarketingLayout>
      <HeroSection />
      <ProductPaths />
      <EvidenceSection />
      <JourneySection />
      <ClosingSection />
    </MarketingLayout>
  );
}

function HeroSection() {
  return (
    <section className="border-b border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 lg:px-8">
      <div className="mx-auto max-w-[var(--mkt-maxw)] border-x border-[var(--mkt-border)]">
        <div className="grid lg:grid-cols-12">
          <div className="border-b border-[var(--mkt-border)] p-6 sm:p-10 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-14">
            <span className="mkt-label">Professional intelligence / Product people</span>
            <h1 className="mt-8 max-w-4xl text-[clamp(3.25rem,7vw,6.5rem)] font-black uppercase leading-[0.88] text-[var(--mkt-text1)]">
              Do the work.<br />Keep the proof.<br /><span className="text-[var(--mkt-text-faint)]">Earn the signal.</span>
            </h1>
            <p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-[var(--mkt-text2)]">
              DeliverX turns realistic product work into traceable evidence, capability judgements and career-ready proof.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
                className="inline-flex items-center justify-center gap-3 bg-[var(--mkt-text1)] px-6 py-4 text-xs font-bold uppercase text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green)]"
            >
                Start with Experience
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
                className="inline-flex items-center justify-center border border-[var(--mkt-border-l)] px-6 py-4 text-xs font-bold uppercase text-[var(--mkt-text1)] transition-colors hover:bg-[var(--mkt-s2)]"
            >
                How it works
            </Link>
          </div>
          </div>
          <div className="flex flex-col lg:col-span-4">
            <div className="border-b border-[var(--mkt-border)] bg-[var(--mkt-s2)] p-6 sm:p-8 lg:p-10">
              <div className="mkt-label">Evidence record / Private by default</div>
              <div className="mt-8 space-y-6">
                {[
                  ["Discovery brief", "Observed", "01"],
                  ["Prioritisation decision", "Assessed", "02"],
                  ["Stakeholder plan", "Awaiting review", "03"],
                ].map(([title, status, number]) => (
                  <div className="grid grid-cols-[auto_1fr] gap-4 border-t border-[var(--mkt-border-l)] pt-4" key={title}>
                    <span className="font-mono text-xs text-[var(--mkt-text3)]">{number}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--mkt-text1)]">{title}</p>
                      <p className="mt-1 text-xs uppercase text-[var(--mkt-green-m)]">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between bg-[var(--mkt-text1)] p-6 text-[var(--mkt-on-dark)] sm:p-8 lg:p-10">
              <Fingerprint className="size-8 text-[var(--mkt-green-l)]" />
              <div className="mt-16">
                <p className="mkt-label-dark">Verified means verified</p>
                <p className="mt-3 text-lg font-bold leading-snug">Only external attestation can light the Verified signal.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid border-t border-[var(--mkt-border)] sm:grid-cols-3">
          {["Evidence stays distinct from self-report", "Capability comes from versioned judgement", "Readiness is explained, never decorated"].map((item) => (
            <div key={item} className="flex items-start gap-3 border-b border-[var(--mkt-border)] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <Check className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green-l)]" />
              <span className="text-xs font-bold uppercase leading-relaxed text-[var(--mkt-text2)]">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPaths() {
  const paths = [
    { number: "01", name: "Experience", line: "Build the experience", body: "Join a simulated company, work through realistic product situations and produce evidence through action.", href: "/experience" as const },
    { number: "02", name: "Launchpad", line: "Land the opportunity", body: "Turn judged evidence into a clear portfolio, honest readiness story and stronger interview preparation.", href: "/launchpad" as const },
    { number: "03", name: "Workspace", line: "Succeed in the role", body: "Carry the same evidence discipline into live product work with your organisation and team.", href: "/professional-workspace" as const },
  ];
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="grid gap-8 border-b border-[var(--mkt-border)] pb-10 lg:grid-cols-[1fr_2fr]">
          <p className="mkt-label">Choose your stage</p>
          <h2 className="mkt-editorial-title">One professional journey.<br />Three clear entry points.</h2>
        </div>
        <div className="divide-y divide-[var(--mkt-border)]">
          {paths.map((path) => (
            <Link to={path.href} key={path.name} className="group grid gap-4 py-8 transition-colors hover:bg-[var(--mkt-s2)] sm:grid-cols-[4rem_1fr_1.5fr_auto] sm:items-center sm:px-4">
              <span className="font-mono text-xs text-[var(--mkt-text3)]">{path.number}</span>
              <div><h3 className="text-2xl font-black uppercase text-[var(--mkt-text1)]">{path.name}</h3><p className="mt-1 text-xs font-bold uppercase text-[var(--mkt-green-m)]">{path.line}</p></div>
              <p className="max-w-xl text-sm leading-relaxed text-[var(--mkt-text2)]">{path.body}</p>
              <ArrowRight className="size-5 text-[var(--mkt-text3)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--mkt-green)]" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function EvidenceSection() {
  return (
    <section className="bg-[var(--mkt-text1)] px-5 py-20 text-[var(--mkt-on-dark)] lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[var(--mkt-maxw)] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="mkt-label-dark">The trust model</p>
          <h2 className="mt-6 text-[clamp(2.5rem,5vw,4.5rem)] font-black uppercase leading-[0.94]">A claim is not evidence.<br /><span className="text-[var(--mkt-on-dark-muted)]">A score is not verification.</span></h2>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[var(--mkt-on-dark-soft)]">DeliverX keeps knowledge, evidence and capability separate. That distinction makes every signal clearer—and harder to fake.</p>
        </div>
        <div className="lg:col-span-7 lg:border-l lg:border-[var(--mkt-on-dark-border)] lg:pl-12">
          {[{ icon: FileCheck2, title: "Provenance-backed evidence", body: "Work is tied to an immutable version and records where it came from." }, { icon: Gauge, title: "Versioned capability judgement", body: "Capability is written only through a pinned framework and an explainable score run." }, { icon: Fingerprint, title: "External verification", body: "Verified appears only after an outside person attests to externally verified evidence." }].map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="grid grid-cols-[auto_1fr] gap-5 border-t border-[var(--mkt-on-dark-border)] py-7 first:border-t-0 first:pt-0">
              <span className="font-mono text-xs text-[var(--mkt-green-l)]">0{index + 1}</span>
              <div><Icon className="mb-5 size-6 text-[var(--mkt-green-l)]" /><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--mkt-on-dark-soft)]">{body}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const steps = ["Do realistic work", "Capture the artefact", "Judge against a framework", "Package honest readiness", "Verify externally"];
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[var(--mkt-maxw)]">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]"><div><p className="mkt-label">The loop</p><h2 className="mkt-editorial-title mt-5">Work becomes proof.<br />Proof compounds.</h2></div><blockquote className="border-l border-[var(--mkt-border-l)] pl-8"><Quote className="size-7 text-[var(--mkt-green-l)]" /><p className="mt-6 text-2xl font-bold leading-snug text-[var(--mkt-text1)]">No silent promotion from a self-report, AI draft or score to Verified.</p><p className="mt-4 text-sm text-[var(--mkt-text3)]">The DeliverX evidence principle</p></blockquote></div>
        <ol className="mt-16 grid border border-[var(--mkt-border)] sm:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step} className="min-h-44 border-b border-[var(--mkt-border)] p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="font-mono text-xs text-[var(--mkt-green-m)]">0{index + 1}</span><p className="mt-12 text-sm font-bold uppercase leading-snug text-[var(--mkt-text1)]">{step}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="border-t border-[var(--mkt-border)] bg-[var(--mkt-s1)] px-5 lg:px-8">
      <div className="mx-auto grid max-w-[var(--mkt-maxw)] border-x border-[var(--mkt-border)] lg:grid-cols-[2fr_1fr]">
        <div className="p-8 sm:p-12 lg:p-16"><p className="mkt-label">Pilot access</p><h2 className="mt-6 max-w-3xl text-[clamp(2.75rem,6vw,5.5rem)] font-black uppercase leading-[0.9] text-[var(--mkt-text1)]">Your work should<br />speak for itself.</h2></div>
        <div className="flex flex-col justify-end border-t border-[var(--mkt-border)] p-8 lg:border-l lg:border-t-0 lg:p-12"><p className="text-sm leading-relaxed text-[var(--mkt-text2)]">Start with realistic product work and build an evidence record you control.</p><Link to="/signup" className="mt-8 inline-flex items-center justify-between bg-[var(--mkt-green)] px-6 py-4 text-xs font-bold uppercase text-[var(--mkt-on-dark)] transition-colors hover:bg-[var(--mkt-green-m)]">Create account <ArrowRight className="size-4" /></Link><Link to="/login" className="mt-3 text-center text-xs font-bold uppercase text-[var(--mkt-text2)] hover:text-[var(--mkt-text1)]">Already a member? Sign in</Link></div>
        </div>
    </section>
  );
}
