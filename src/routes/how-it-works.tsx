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
      { property: "og:title", content: "How DeliverX works — supervised missions and career evidence" },
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
    body: "Choose Investigate, Prototype or Improve. Describe the outcome in natural language. Incomplete requests get clarification questions before planning.",
  },
  {
    n: "2",
    title: "Review the plan",
    body: `The planner proposes tasks, acceptance criteria, usage estimate and Wave 1 capability assignment. Only Available roles (${WAVE1_COUNT} today) are assigned — Planned catalogue roles are never routed.`,
  },
  {
    n: "3",
    title: "Approve under authority",
    body: "You accept the plan within the permission ladder and budget ceiling. External actions require a separate explicit approval.",
  },
  {
    n: "4",
    title: "Execute with visibility",
    body: "Tasks run with artefacts and evidence classification (sourced facts, assumptions, inferences, speculative). Usage hard-stops at the ceiling.",
  },
  {
    n: "5",
    title: "Receive a delivery report",
    body: "Quality labels are discrete: Agent-reviewed, Automatically tested, Human-reviewed, Externally attested. Workforce never lights a generic Verified badge.",
  },
];

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="hero-hiw">
        <h1>How DeliverX works</h1>
        <p>
          Two product paths share one brand: a Stage 1 Command Centre for supervised AI labour, and
          a career evidence journey for people who need a record they can defend.
        </p>
        <div
          className="hero-actions"
          style={{ justifyContent: "center", marginTop: 28, marginBottom: 0 }}
        >
          <CtaLink
            signedInTo="/command"
            signedInLabel="Open Command Centre"
            signedOutLabel="Open Command Centre"
          />
          <Link to="/experience" className="btn btn-secondary">
            Career path
          </Link>
        </div>
      </div>

      <div className="steps-detailed" style={{ paddingBottom: 48 }}>
        <div className="x-label" style={{ marginBottom: 12 }}>
          Path A · Command Centre
        </div>
        <h2 className="heading-1" style={{ marginBottom: 8, maxWidth: 640 }}>
          Mission → Plan → Approve → Execute → Deliver
        </h2>
        <p className="body" style={{ marginBottom: 36, maxWidth: 560 }}>
          Stage 1 early product preview. Not a marketplace of 150 live agents.
        </p>

        {CC_STEPS.map((s) => (
          <div className="step-detail" key={s.n}>
            <div className={`step-num-circle${s.n === "3" ? " amber" : ""}`}>{s.n}</div>
            <div className="step-content">
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="quote-rule">
        <div className="blockquote">
          <p>
            Planned capabilities stay Planned. Available means assignable. The catalogue size is not
            the operational workforce size.
          </p>
          <cite>WORKFORCE HONESTY RULE</cite>
        </div>
      </div>

      <div className="hero-hiw" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <div className="x-label" style={{ marginBottom: 12 }}>
          Path B · Career evidence
        </div>
        <h2 className="heading-1" style={{ marginBottom: 12 }}>
          Learn → Work → Build → Prove → Advance
        </h2>
        <p>
          Six steps connect realistic product work to a career-ready record an outsider can verify.
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
              Work through product situations with real constraints, stakeholders, and consequences.
              In Experience, this means joining a simulated company as a Product Manager. In the
              Professional Workspace, this means your actual delivery role. Either way: the work
              happens first. Evidence does not exist before you act.
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
              artefact_version_id is assigned at the moment of submission — this version is locked.
              It carries the source type, the framework version it will be judged against, and the
              timestamp.
            </p>
            <div className="step-trust-note">
              <strong>Trust note:</strong> Evidence is private by default. Nothing is shared without
              your explicit decision to share it.
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
              For coaching submissions, a human coach reviews the AI draft and must confirm before
              any ledger entry is created. Coach confirmation is the only pre-condition that cannot
              be bypassed.
            </p>
            <div className="step-tags">
              <span className="pill pill-purple">Capability Engine</span>
              <span className="pill pill-neutral">ScoreRun</span>
              <span className="pill pill-amber">Coach-confirmed</span>
            </div>
            <div className="step-trust-note">
              <strong>Trust note:</strong> The Capability Engine is the only component that writes
              capability levels. UI, ceremony, interview, learning, and recommendations never write
              capability.
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
              <strong>Trust note:</strong> Readiness uses labelled heuristics where ScoreRun data is
              thin. No unexplained percentages. Every signal is either evidenced or flagged.
            </div>
          </div>
        </div>

        <div className="step-detail">
          <div className="step-num-circle">5</div>
          <div className="step-content">
            <h2>Verify externally</h2>
            <p>
              Only an independent person outside DeliverX can activate the Verified signal. You
              request attestation via Launchpad. Your attester receives a secure link and reviews
              the frozen artefact — never your score. On confirmation, a credential is issued and
              Verified lights.
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

      <div className="cta-section">
        <div className="cta-box">
          <h2 className="cta-h">Choose the path that matches the job.</h2>
          <p className="cta-sub">
            Supervised AI missions in Command Centre, or a career evidence record through Experience.
          </p>
          <div className="cta-btns">
            <CtaLink
              signedInTo="/command"
              signedInLabel="Open Command Centre"
              signedOutLabel="Open Command Centre"
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
