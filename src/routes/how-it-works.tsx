import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";
import { CtaLink } from "@/components/marketing/cta-link";
import { WAVE1_AVAILABLE_IDS } from "@/lib/workforce/registry";

const WAVE1_COUNT = WAVE1_AVAILABLE_IDS.length;

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DeliverX" },
      {
        name: "description",
        content: `DeliverX Command Centre runs supervised missions: intake, plan, approve, execute, deliver. Wave 1 ships ${WAVE1_COUNT} Available capabilities. The career evidence method (Experience → Prove) remains available separately.`,
      },
      {
        property: "og:title",
        content: "How DeliverX works — supervised missions and career evidence",
      },
      {
        property: "og:description",
        content:
          "Mission → Plan → Approve → Execute → Deliver for AI labour. Learn → Work → Build → Prove → Advance for career evidence.",
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
    title: "State a mission",
    gate: "Intent & Clarification Gate",
    body: "Choose Investigate, Prototype or Improve and describe your outcome in plain English. Ambiguous or underspecified briefs trigger structured clarification questions before any plan is drafted.",
  },
  {
    n: "2",
    title: "Review the plan",
    gate: `Wave 1 Assignment (${WAVE1_COUNT} Available)`,
    body: `The planner proposes a structured task graph, acceptance criteria, credit estimate and Wave 1 capability assignment. Only Available roles (${WAVE1_COUNT} today) are assigned — the 138 Planned catalogue roles are never routed.`,
  },
  {
    n: "3",
    title: "Approve under authority",
    gate: "Mandatory Human Gate · svc-permissions",
    body: "You accept, revise, or reject the plan within the four-tier permission ladder (Plan → Create → Execute internally → Act externally) and workspace budget ceiling. External actions require a separate explicit approval.",
  },
  {
    n: "4",
    title: "Execute with visibility",
    gate: "Hard-Stop Budget · svc-budget",
    body: "Approved tasks execute step-by-step with live status and artefact inspection. Billable execution checks remaining credits before every task and hard-stops deterministically at your ceiling.",
  },
  {
    n: "5",
    title: "Receive a delivery report",
    gate: "Discrete Quality Labels · svc-audit",
    body: "Outputs separate Sourced facts, Assumptions, Inferences, and Speculative claims. Quality labels are discrete (Agent-reviewed, Automatically tested, Human-reviewed, Externally attested) — never an unqualified Verified badge.",
  },
];

const ROADMAP = [
  {
    n: "Now · Stage 1",
    status: "Live in preview",
    title: "Supervised Command Centre",
    body: `${WAVE1_COUNT} Wave 1 Available capabilities, deterministic planner/executor, mandatory plan approval, scope revision, hard-stop usage ceiling, artefacts and delivery reports.`,
  },
  {
    n: "Next · Stage 2",
    status: "In development",
    title: "Deeper review & diff loops",
    body: "Task-level revision threads, side-by-side artefact diffing, and multi-reviewer sign-off — still under human authority.",
  },
  {
    n: "Later · Stage 3",
    status: "Planned",
    title: "Live model routing & connectors",
    body: "Multi-model execution, gated external connectors (GitHub PRs, Slack, email, deploy) and commercial credit metering. Not claimed as live today.",
  },
  {
    n: "Never promised",
    status: "Explicit non-goal",
    title: "Unbounded autonomy",
    body: "No unverified marketplace of 150 autonomous agents, no silent external actions, and no job placement guarantee on the career path.",
  },
];

function HowItWorksPage() {
  const [activeTrack, setActiveTrack] = useState<"workforce" | "career">("workforce");

  return (
    <MarketingLayout>
      <div className="hero-hiw">
        <div className="x-label" style={{ marginBottom: 14 }}>
          Architecture &amp; Governance Model
        </div>
        <h1>How DeliverX works</h1>
        <p>
          Inspect the <strong>Supervised AI Workforce</strong> lifecycle (Command Centre · Stage 1)
          or switch to the <strong>Career Evidence</strong> method (Experience · Launchpad · Prove).
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
            <span>Path A · Primary</span>
            <strong>Supervised AI Workforce (Stage 1)</strong>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTrack === "career"}
            onClick={() => setActiveTrack("career")}
            className={`hiw-track-btn${activeTrack === "career" ? " is-active" : ""}`}
          >
            <span>Path B · Coexisting</span>
            <strong>Career Evidence Path (PM Record)</strong>
          </button>
        </div>
      </div>

      {activeTrack === "workforce" ? (
        <>
          {/* 3D Architecture Visual Showcase */}
          <div className="hiw-3d-showcase">
            <img
              src="/assets/3d/command-core.jpg"
              alt="3D sculptural diagram of the DeliverX human approval gate prism"
              className="hiw-3d-img"
            />
            <div className="hiw-3d-caption">
              <div>
                <div className="x-label">Path A · Command Centre Architecture</div>
                <h2 className="heading-2" style={{ marginTop: 6 }}>
                  Mission → Plan → Approve → Execute → Deliver
                </h2>
                <p className="body" style={{ marginTop: 6, maxWidth: 560 }}>
                  Stage 1 operational preview. Every mission passes through a mandatory human
                  approval gate (`svc-permissions`) and a deterministic usage ceiling
                  (`svc-budget`).
                </p>
              </div>
              <CtaLink
                signedInTo="/command"
                signedInLabel="Open Command Centre →"
                signedOutLabel="Open Command Centre →"
                className="btn btn-primary"
              />
            </div>
          </div>

          <div className="steps-detailed" style={{ paddingBottom: 48 }}>
            {CC_STEPS.map((s) => (
              <div className="step-detail" key={s.n}>
                <div className={`step-num-circle${s.n === "3" ? " amber" : ""}`}>{s.n}</div>
                <div className="step-content">
                  <div className="x-label" style={{ marginBottom: 6 }}>
                    {s.gate}
                  </div>
                  <h2>{s.title}</h2>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="quote-rule">
            <div className="blockquote">
              <p>
                Planned capabilities stay Planned. Available means assignable. The catalogue size is
                not the operational workforce size.
              </p>
              <cite>WORKFORCE HONESTY RULE</cite>
            </div>
          </div>

          {/* Stage 1-3 Honest Roadmap */}
          <section className="steps-section" style={{ paddingTop: 64, paddingBottom: 64 }}>
            <div className="section-header-split">
              <div>
                <div className="x-label">Release &amp; Capability Roadmap</div>
                <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
                  An honest roadmap. Zero false connectors.
                </h2>
              </div>
              <p className="body" style={{ margin: 0, maxWidth: 460 }}>
                Stage 1 uses deterministic planning and execution stubs when live model keys are not
                configured — disclosed openly in every report.
              </p>
            </div>

            <div className="roadmap-grid">
              {ROADMAP.map((r, idx) => (
                <div className={`roadmap-card${idx === 0 ? " is-current" : ""}`} key={r.n}>
                  <div className="roadmap-card-top">
                    <span className="roadmap-stage">{r.n}</span>
                    <span className="roadmap-status">{r.status}</span>
                  </div>
                  <div className="roadmap-title">{r.title}</div>
                  <div className="roadmap-desc">{r.body}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="hero-hiw" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div className="x-label" style={{ marginBottom: 12 }}>
              Path B · Career evidence
            </div>
            <h2 className="heading-1" style={{ marginBottom: 12 }}>
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
                  Either way: the work happens first. Evidence does not exist before you act.
                </p>
                <div className="step-tags">
                  <span className="pill pill-teal">Experience</span>
                  <span className="pill pill-neutral">Workspace</span>
                  <span className="pill pill-neutral">Coaching capstone</span>
                </div>
                <div className="step-trust-note" style={{ marginTop: 12 }}>
                  <strong>Trust note:</strong> The hiring interview and entry ceremony are narrative
                  context. Neither creates evidence, capability, or Verified status.
                </div>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">2</div>
              <div className="step-content">
                <h2>Capture the artefact</h2>
                <p>
                  When you complete and submit work, an immutable artefact version is created. An
                  artefact_version_id is assigned at the moment of submission — this version is
                  locked. It carries the source type, the framework version it will be judged
                  against, and the timestamp.
                </p>
                <div className="step-trust-note">
                  <strong>Trust note:</strong> Evidence is private by default. Nothing is shared
                  without your explicit decision to share it.
                </div>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle amber">3</div>
              <div className="step-content">
                <h2>Judge capability</h2>
                <p>
                  Evidence is assessed against pm-core@2026.1, the pinned, versioned capability
                  framework. A two-pass AI scoring system runs: a primary grader assesses each
                  dimension, and an adversarial verifier challenges the assessment. The result is a
                  confidence band — explainable, never decorative.
                </p>
                <p>
                  For coaching submissions, a human coach reviews the AI draft and must confirm
                  before any ledger entry is created. Coach confirmation is the only pre-condition
                  that cannot be bypassed.
                </p>
                <div className="step-tags">
                  <span className="pill pill-purple">Capability Engine</span>
                  <span className="pill pill-neutral">ScoreRun</span>
                  <span className="pill pill-amber">Coach-confirmed</span>
                </div>
                <div className="step-trust-note">
                  <strong>Trust note:</strong> The Capability Engine is the only component that
                  writes capability levels. UI, ceremony, interview, learning, and recommendations
                  never write capability.
                </div>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">4</div>
              <div className="step-content">
                <h2>Package readiness</h2>
                <p>
                  Strong evidence becomes an explainable portfolio and a career readiness narrative.
                  Launchpad surfaces which claims are evidence-backed, which are still heuristic
                  (always labelled), and where evidence is thin. Interview Lab connects your STAR
                  stories to real artefacts you can defend.
                </p>
                <div className="step-trust-note">
                  <strong>Trust note:</strong> Readiness uses labelled heuristics where ScoreRun
                  data is thin. No unexplained percentages. Every signal is either evidenced or
                  flagged.
                </div>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">5</div>
              <div className="step-content">
                <h2>Verify externally</h2>
                <p>
                  Only an independent person outside DeliverX can activate the Verified signal. You
                  request attestation via Launchpad. Your attester receives a secure link and
                  reviews the frozen artefact — never your score. On confirmation, a credential is
                  issued and Verified lights.
                </p>
                <div className="step-trust-note">
                  <strong>Trust note:</strong> Verified is never lit by a ScoreRun, by coach
                  confirmation, by Experience completion, or by any action inside the platform.
                </div>
              </div>
            </div>

            <div className="step-detail">
              <div className="step-num-circle">6</div>
              <div className="step-content">
                <h2>Carry it into live work</h2>
                <p>
                  The same evidence discipline continues into your day-to-day product role. In the
                  Professional Workspace, live delivery work produces the same provenance-backed
                  records.
                </p>
                <div className="step-tags">
                  <span className="pill pill-neutral">Workspace</span>
                </div>
                <div className="step-trust-note">
                  <strong>Trust note:</strong> Live-work records follow the same rules: private by
                  default, shared only by your explicit decision.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Choose the path that matches the job.</h2>
          <p className="cta-sub">
            Supervised AI missions in Command Centre, or a career evidence record through
            Experience.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre →"
              signedOutLabel="Open Command Centre →"
            />
            <Link to="/pricing" className="btn btn-secondary">
              Career plans
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
