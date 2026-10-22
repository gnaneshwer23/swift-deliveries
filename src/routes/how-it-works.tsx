import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { CtaLink } from "@/components/marketing/cta-link";
import { pageHead } from "@/components/marketing/page-head";
import {
  ExportTree,
  LiveProgrammeFlow,
  WorkforceMatrix,
} from "@/components/marketing/dxsi-landing";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "How it works — DeliverX",
      "Describe an idea. 150 specialists plan, research, decide, build and verify it — and you approve every gate.",
    ),
  component: HowItWorks,
});

const STEPS = [
  { n: "01", title: "Describe", text: "Your idea, users, problem and goals. Five fields." },
  { n: "02", title: "Plan", text: "A roadmap appears: phases, milestones, owners, dependencies." },
  { n: "03", title: "Run", text: "Research, interviews, meetings and sprints run in order." },
  {
    n: "04",
    title: "Decide",
    text: "Panels debate. You approve at four gates — or send work back.",
  },
];

const ENGINE = [
  { title: "Dependency graph", text: "Nothing starts on unfinished or unapproved work." },
  { title: "Handoff contracts", text: "Every deliverable must meet its spec before it is used." },
  {
    title: "Rule-based verdicts",
    text: "Votes, vetoes and thresholds are code, not model opinion.",
  },
  { title: "Honest labels", text: "Simulated, model-written and real evidence are always marked." },
];

function HowItWorks() {
  return (
    <MarketingLayout>
      <section className="dxl-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">How it works</p>
          <h1 className="dxl-h1">
            From idea to launch,
            <br />
            <span className="dxl-grad">step by visible step.</span>
          </h1>
        </div>
        <div className="dxl-wrap dxl-wide">
          <LiveProgrammeFlow />
        </div>
      </section>

      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap">
          <ol className="dxl-steps4">
            {STEPS.map((s) => (
              <li key={s.n}>
                <span className="dxl-rail-step">{s.n}</span>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="dxl-section" id="workforce">
        <div className="dxl-wrap dxl-two">
          <header className="dxl-head dxl-left">
            <p className="dxl-eyebrow">The workforce</p>
            <h2 className="dxl-h2">15 departments. 150 roles.</h2>
            <p className="dxl-sub">
              Hover a square to meet a role. Every one has a seat in your programme.
            </p>
          </header>
          <WorkforceMatrix />
        </div>
      </section>

      <section className="dxl-section dxl-alt">
        <div className="dxl-wrap">
          <header className="dxl-head">
            <p className="dxl-eyebrow">Under the hood</p>
            <h2 className="dxl-h2">Built so you can trust the output.</h2>
          </header>
          <ul className="dxl-trust">
            {ENGINE.map((e) => (
              <li key={e.title}>
                <strong>{e.title}</strong>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dxl-section">
        <div className="dxl-wrap dxl-two">
          <ExportTree />
          <header className="dxl-head dxl-left">
            <p className="dxl-eyebrow">The result</p>
            <h2 className="dxl-h2">A project you own.</h2>
            <p className="dxl-sub">Download every document, decision and record as one archive.</p>
            <div className="dxl-ctas" style={{ justifyContent: "flex-start" }}>
              <CtaLink
                signedInTo="/command/programmes"
                signedInLabel="Start a programme"
                signedOutLabel="Start free"
                className="dxl-btn dxl-btn-primary"
              />
            </div>
          </header>
        </div>
      </section>
    </MarketingLayout>
  );
}
