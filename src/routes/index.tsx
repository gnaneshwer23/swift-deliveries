import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { ArrowRight, Check, FileCheck2, Fingerprint, Gauge, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "DeliverX — Professional Intelligence Platform" },
    { name: "description", content: "Do realistic product work, keep provenance-backed evidence and prove capability with DeliverX." },
    { property: "og:title", content: "DeliverX — Professional Intelligence Platform" },
    { property: "og:description", content: "Do realistic product work, keep provenance-backed evidence and prove capability with DeliverX." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: HomePage,
});

const RECORDS = [
  ["Discovery brief", "Observed", "Source retained"],
  ["Prioritisation decision", "Assessed", "Framework 2026.1"],
  ["Stakeholder plan", "Awaiting review", "Private by default"],
] as const;

const PATHS = [
  { number: "01", name: "Experience", line: "Build the experience", body: "Work through realistic product situations and produce evidence through action.", href: "/experience" as const },
  { number: "02", name: "Launchpad", line: "Land the opportunity", body: "Package judged evidence into an honest portfolio and readiness story.", href: "/launchpad" as const },
  { number: "03", name: "Professional Workspace", line: "Succeed in the role", body: "Carry the same evidence discipline into live organisational work.", href: "/professional-workspace" as const },
];

function HomePage() {
  return <MarketingLayout><Hero /><Journey /><Trust /><EvidenceLoop /><Closing /></MarketingLayout>;
}

function Hero() {
  return (
    <section className="mkt-grid px-4 pb-16 pt-8 sm:px-6 lg:pb-24 lg:pt-12">
      <div className="mkt-surface mx-auto grid max-w-[var(--mkt-maxw)] gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-14">
        <div>
          <span className="mkt-label inline-flex items-center gap-2 rounded-full border border-[var(--mkt-border)] bg-[var(--mkt-s2)] px-3 py-2"><span className="size-2 rounded-full bg-[var(--mkt-green-bright)]" />Professional Intelligence</span>
          <h1 className="mt-7 max-w-3xl font-display text-[clamp(3rem,7vw,5.8rem)] font-bold leading-[0.96] text-[var(--mkt-text1)]">Do the work.<br />Keep the proof.<br /><span className="text-[var(--mkt-green-bright)]">Earn the signal.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--mkt-text2)]">DeliverX turns real and realistic product work into traceable evidence, explainable capability and career-ready proof.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--mkt-green-bright)] px-6 py-4 text-sm font-bold text-[var(--mkt-on-dark)] transition-all hover:-translate-y-0.5 hover:bg-[var(--mkt-green-m)]">Start with Experience <ArrowRight className="size-4" /></Link>
            <Link to="/how-it-works" className="inline-flex items-center justify-center rounded-xl border border-[var(--mkt-border-l)] bg-[var(--mkt-s1)] px-6 py-4 text-sm font-bold text-[var(--mkt-text1)] hover:bg-[var(--mkt-s2)]">See how it works</Link>
          </div>
          <div className="mt-9 grid gap-3 border-t border-[var(--mkt-border)] pt-6 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm text-[var(--mkt-text2)]"><Check className="size-4 text-[var(--mkt-green-bright)]" />Evidence stays distinct from self-report</p>
            <p className="flex items-center gap-2 text-sm text-[var(--mkt-text2)]"><Check className="size-4 text-[var(--mkt-green-bright)]" />Private by default</p>
          </div>
        </div>
        <EvidencePreview />
      </div>
    </section>
  );
}

function EvidencePreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:pl-5">
      <div className="rounded-[1.5rem] border border-[var(--mkt-border)] bg-[var(--mkt-s2)] p-4 shadow-[var(--mkt-shadow-card)] sm:p-6">
        <div className="overflow-hidden rounded-xl border border-[var(--mkt-border)] bg-[var(--mkt-s1)]">
          <div className="flex items-center justify-between bg-[var(--mkt-green)] px-5 py-4 text-[var(--mkt-on-dark)]"><span className="text-sm font-bold">Evidence record</span><span className="font-mono text-[0.625rem] uppercase">Private</span></div>
          <div className="p-5">
            <div className="mb-5 flex items-center justify-between"><div><p className="mkt-label">Current record</p><h2 className="mt-1 font-display text-xl font-bold">Product discovery</h2></div><FileCheck2 className="size-6 text-[var(--mkt-green-bright)]" /></div>
            <div className="space-y-3">{RECORDS.map(([title,status,note],i) => <div key={title} className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg border border-[var(--mkt-border)] p-3"><span className="grid size-7 place-items-center rounded-full bg-[var(--mkt-s2)] font-mono text-[0.625rem] text-[var(--mkt-green-m)]">{i+1}</span><div><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold">{title}</p><span className="rounded-full bg-[var(--mkt-s2)] px-2 py-1 text-[0.625rem] font-bold text-[var(--mkt-green-m)]">{status}</span></div><p className="mt-1 text-xs text-[var(--mkt-text3)]">{note}</p></div></div>)}</div>
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-[var(--mkt-ink)] p-3"><Fingerprint className="mt-0.5 size-4 shrink-0 text-[var(--mkt-green-bright)]" /><p className="text-xs leading-relaxed text-[var(--mkt-text2)]"><strong className="text-[var(--mkt-text1)]">Verified remains off.</strong> External attestation is required.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Journey() {
  return (
    <section className="px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[var(--mkt-maxw)]">
      <div className="max-w-3xl"><p className="mkt-label">One evidence loop / Three entry points</p><h2 className="mkt-editorial-title mt-5">A guided path from doing the work to proving it.</h2></div>
      <div className="relative mt-16 space-y-8 lg:space-y-0"><div className="mkt-journey-line absolute left-8 right-8 top-1/2 hidden h-2 -translate-y-1/2 lg:block" />
        {PATHS.map((path,index) => <div key={path.name} className={`relative z-10 grid lg:grid-cols-2 ${index % 2 ? "lg:justify-items-end" : ""}`}><Link to={path.href} className={`group mkt-surface block max-w-xl p-7 transition-transform hover:-translate-y-1 ${index % 2 ? "lg:col-start-2" : ""}`}><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-full bg-[var(--mkt-s2)] font-mono text-xs font-bold text-[var(--mkt-green-m)]">{path.number}</span><ArrowRight className="size-5 text-[var(--mkt-green-bright)] transition-transform group-hover:translate-x-1" /></div><h3 className="mt-8 font-display text-2xl font-bold">{path.name}</h3><p className="mt-1 text-sm font-bold text-[var(--mkt-green-m)]">{path.line}</p><p className="mt-4 text-sm leading-relaxed text-[var(--mkt-text2)]">{path.body}</p></Link></div>)}
      </div>
    </div></section>
  );
}

function Trust() {
  const items = [{icon:FileCheck2,title:"Provenance-backed evidence",body:"Work stays tied to an immutable version and records where it came from."},{icon:Gauge,title:"Versioned judgement",body:"Capability is judged against a pinned framework through an explainable run."},{icon:ShieldCheck,title:"External verification",body:"Verified appears only after an outside person attests to eligible evidence."}];
  return <section className="bg-[var(--mkt-s2)] px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[var(--mkt-maxw)]"><div className="grid gap-8 lg:grid-cols-2"><div><p className="mkt-label">The trust model</p><h2 className="mkt-editorial-title mt-5">A claim is not evidence.<br />A score is not verification.</h2></div><p className="max-w-xl text-lg leading-relaxed text-[var(--mkt-text2)] lg:justify-self-end">DeliverX keeps knowledge, evidence and capability separate. That distinction makes every signal clear and inspectable.</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{items.map(({icon:Icon,title,body}) => <article key={title} className="mkt-surface p-6"><span className="grid size-11 place-items-center rounded-xl bg-[var(--mkt-s2)]"><Icon className="size-5 text-[var(--mkt-green-bright)]" /></span><h3 className="mt-8 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--mkt-text2)]">{body}</p></article>)}</div></div></section>;
}

function EvidenceLoop() {
  const steps=["Do realistic work","Capture the artefact","Judge against a framework","Package honest readiness","Verify externally"];
  return <section className="px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[var(--mkt-maxw)]"><p className="mkt-label">The loop</p><h2 className="mkt-editorial-title mt-5 max-w-3xl">Work becomes proof. Proof compounds.</h2><ol className="relative mt-12 grid gap-3 md:grid-cols-5">{steps.map((step,i)=><li key={step} className="mkt-surface min-h-40 p-5"><span className="font-mono text-xs font-bold text-[var(--mkt-green-bright)]">0{i+1}</span><p className="mt-12 font-display text-base font-bold">{step}</p></li>)}</ol><p className="mt-8 text-center text-sm text-[var(--mkt-text3)]">No silent promotion from a self-report, draft or score to Verified.</p></div></section>;
}

function Closing() {
  return <section className="px-5 pb-20 lg:px-8 lg:pb-28"><div className="mx-auto grid max-w-[var(--mkt-maxw)] gap-8 rounded-[1.5rem] bg-[var(--mkt-green)] p-8 text-[var(--mkt-on-dark)] sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="font-mono text-xs font-bold uppercase text-[var(--mkt-s3)]">Pilot access</p><h2 className="mt-4 max-w-3xl font-display text-4xl font-bold sm:text-6xl">Your work should speak for itself.</h2><p className="mt-5 max-w-xl text-[var(--mkt-on-dark-soft)]">Start with realistic work and build an evidence record you control.</p></div><Link to="/signup" className="inline-flex items-center justify-center gap-3 rounded-xl bg-[var(--mkt-s1)] px-6 py-4 text-sm font-bold text-[var(--mkt-green)] hover:bg-[var(--mkt-s2)]">Create account <ArrowRight className="size-4" /></Link></div></section>;
}
