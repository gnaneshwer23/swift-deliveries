import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { CtaLink } from "@/components/marketing/cta-link";
import { ProductAccordionVisual } from "@/components/marketing/motion-product-visuals";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const WAVE1_COUNT = WAVE1_AVAILABLE_IDS.length;

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DeliverX" },
      {
        name: "description",
        content:
          "DeliverX runs supervised AI product missions through intake, planning, human approval, bounded execution, and classified delivery.",
      },
      {
        property: "og:title",
        content: "How DeliverX works — supervised missions and career evidence",
      },
      {
        property: "og:description",
        content:
          "Mission → Plan → Approve → Execute → Deliver for AI product labour. Learn → Work → Build → Prove → Advance for career evidence.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/how-it-works" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const CC_STEPS = [
  {
    n: "1",
    title: "State a product mission",
    gate: "Intent & Clarification",
    body: "Choose Investigate, Prototype, or Improve and describe your product outcome in plain English. Ambiguous or underspecified briefs prompt clarifying questions before any plan is drafted.",
    visualSection: "discovery" as const,
    visualIndex: 1,
  },
  {
    n: "2",
    title: "Review the task dependency plan",
    gate: "Task Breakdown & Assignment",
    body: `Inspect the proposed task graph, acceptance criteria, credit estimate, and assigned specialist roles. Only verified Available capabilities (${WAVE1_COUNT} operational today) are assigned.`,
    visualSection: "lifecycle" as const,
    visualIndex: 0,
  },
  {
    n: "3",
    title: "Approve under human authority",
    gate: "Mandatory Human Approval Gate",
    body: "Accept, revise, or reject the plan within the four-tier permission ladder (Plan → Create → Execute internally → Act externally) and workspace credit ceiling. External actions require separate sign-off.",
    visualSection: "lifecycle" as const,
    visualIndex: 1,
  },
  {
    n: "4",
    title: "Execute with hard-stop protection",
    gate: "Bounded Execution",
    body: "Approved tasks run step-by-step with live status updates and artefact inspection. Execution checks remaining credits before every task and hard-stops automatically at your ceiling.",
    visualSection: "governance" as const,
    visualIndex: 0,
  },
  {
    n: "5",
    title: "Receive a classified delivery report",
    gate: "Classified Evidence & Quality",
    body: "Deliverables separate Sourced facts, Assumptions, Inferences, and Speculative claims, paired with discrete quality labels (Agent-reviewed, Automatically tested, Human-reviewed, Externally attested).",
    visualSection: "lifecycle" as const,
    visualIndex: 2,
  },
];

function HowItWorksPage() {
  const [activeTrack, setActiveTrack] = useState<"workforce" | "career">("workforce");
  const [activeStepIdx, setActiveStepIdx] = useState(2); // Default to Step 3: Approve Gate

  const activeStep = CC_STEPS[activeStepIdx] ?? CC_STEPS[0]!;

  return (
    <MarketingLayout>
      <div className="hero-hiw">
        <span className="motion-eyebrow">PLATFORM ARCHITECTURE</span>
        <h1 style={{ marginTop: 10 }}>How DeliverX works</h1>
        <p>
          Explore the <strong>Supervised AI Product Workforce</strong> lifecycle or switch to the{" "}
          <strong>PM Career Evidence</strong> path.
        </p>

        {/* Segmented Architecture Track Switcher */}
        <div className="hiw-track-switcher" role="tablist" aria-label="Select product architecture">
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === "workforce"}
            onClick={() => setActiveTrack("workforce")}
            className={`hiw-track-btn${activeTrack === "workforce" ? " is-active" : ""}`}
          >
            <span>Primary Platform</span>
            <strong>Supervised AI Workforce</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === "career"}
            onClick={() => setActiveTrack("career")}
            className={`hiw-track-btn${activeTrack === "career" ? " is-active" : ""}`}
          >
            <span>Career Product</span>
            <strong>PM Career Evidence Path</strong>
          </button>
        </div>
      </div>

      {activeTrack === "workforce" ? (
        <>
          {/* Interactive 5-Stage Lifecycle Explorer (Motion UI Card Style) */}
          <section className="motion-feature-section" style={{ paddingTop: 16 }}>
            <div className="motion-accordion-grid">
              <div className="motion-accordion-list" role="tablist" aria-label="Lifecycle steps">
                {CC_STEPS.map((s, idx) => {
                  const isActive = idx === activeStepIdx;
                  return (
                    <button
                      key={s.n}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`motion-accordion-item${isActive ? " is-active" : ""}`}
                    >
                      <div className="motion-accordion-item-top">
                        <span className="motion-accordion-tag">
                          Step 0{s.n} · {s.gate}
                        </span>
                        <span className="motion-accordion-step">0{s.n}</span>
                      </div>
                      <h2 className="motion-accordion-title">{s.title}</h2>
                      {isActive && <p className="motion-accordion-body">{s.body}</p>}
                    </button>
                  );
                })}
              </div>

              <div className="motion-accordion-stage">
                <ProductAccordionVisual
                  section={activeStep.visualSection}
                  activeIndex={activeStep.visualIndex}
                />
              </div>
            </div>
          </section>

          <div className="quote-rule">
            <div className="blockquote">
              <p>
                Planned capabilities stay Planned. Available means assignable. Supervision and
                budget ceilings are enforced deterministically.
              </p>
              <cite>THE DELIVERX SUPERVISION PRINCIPLE</cite>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="hero-hiw" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <span className="motion-eyebrow">CAREER EVIDENCE PATH</span>
            <h2 className="heading-1" style={{ marginTop: 10, marginBottom: 12 }}>
              Learn → Work → Build → Prove → Advance
            </h2>
            <p>
              Six steps connect realistic product work to a career-ready record an outsider can
              verify.
            </p>
          </div>

          <JourneyLadder active="learn" />

          <div className="quote-rule">
            <div className="blockquote">
              <p>No silent promotion from a self-report, AI draft or score to Verified.</p>
              <cite>THE DELIVERX EVIDENCE PRINCIPLE</cite>
            </div>
          </div>

          <div className="steps-detailed">
            <div className="step-detail">
              <div className="step-num-circle">1</div>
              <div className="step-content">
                <h2>Do realistic work</h2>
                <p>
                  Work through product situations with real constraints, stakeholders, and
                  consequences. In Experience, this means joining a simulated company as a Product
                  Manager. In the Professional Workspace, this means your actual delivery role.
                </p>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">2</div>
              <div className="step-content">
                <h2>Capture the artefact</h2>
                <p>
                  When you complete and submit work, an immutable artefact version is created and
                  locked with its source type, framework version, and timestamp.
                </p>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle amber">3</div>
              <div className="step-content">
                <h2>Judge capability</h2>
                <p>
                  Evidence is assessed against pm-core@2026.1 using a two-pass grading and
                  verification system, producing an explainable confidence band.
                </p>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">4</div>
              <div className="step-content">
                <h2>Package readiness</h2>
                <p>
                  Strong evidence becomes an explainable portfolio and a career readiness narrative
                  in Launchpad, connecting your STAR stories to real artefacts you can defend.
                </p>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">5</div>
              <div className="step-content">
                <h2>Verify externally</h2>
                <p>
                  Only an independent person outside DeliverX can activate the Verified signal by
                  attesting to the frozen artefact.
                </p>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">6</div>
              <div className="step-content">
                <h2>Carry it into live work</h2>
                <p>
                  The same evidence discipline continues into your day-to-day product role in the
                  Professional Workspace.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="cta-section">
        <div className="cta-box motion-cta-box">
          <h2 className="cta-h">Choose the path that matches the job.</h2>
          <p className="cta-sub">
            Commission supervised AI product missions in the Command Centre, or build a verified
            career evidence record through Experience.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Try DeliverX for free →"
              className="btn motion-btn-primary motion-btn-lg"
            />
            <Link to="/pricing" className="btn btn-secondary">
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
