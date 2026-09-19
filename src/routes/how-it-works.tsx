import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { JourneyLadder } from "@/components/marketing/journey-ladder";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — DeliverX" },
      {
        name: "description",
        content:
          "Five steps connect realistic product work to a career-ready, externally verifiable professional intelligence record. No silent promotion from self-report, AI draft or score to Verified.",
      },
      { property: "og:title", content: "How DeliverX works — evidence to Verified" },
      {
        property: "og:description",
        content:
          "Do realistic work, capture the artefact, judge against a versioned framework, package readiness honestly, verify externally.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="hero-hiw">
        <h1>
          Work becomes proof.
          <br />
          Proof compounds.
        </h1>
        <p>
          Five stages connect realistic product work to a career-ready record an outsider can
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
              Work through product situations with real constraints, stakeholders, and consequences.
              In Experience, this means joining a simulated company — MediFlow, GreenGrid, or
              LearnFlow — as a Product Manager. In the Workspace, this means your actual delivery
              role. Either way: the work happens first. Evidence doesn't exist before you act.
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
              It carries the source type (Experience simulation, coaching submission, or Workspace
              observation), the framework version it will be judged against, and the timestamp.
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
              Evidence is assessed against pm-core@2026.1, the versioned capability framework for
              the pilot. A two-pass AI scoring system runs: a primary grader assesses each
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
              request attestation via Launchpad. Your attestor receives a secure token, reviews the
              specific evidence you've selected, and confirms it reflects demonstrated capability
              they've witnessed. On confirmation, the ledger entry receives an
              external_verification record and Verified lights.
            </p>
            <div className="step-trust-note">
              <strong>Trust note:</strong> Verified is never lit by a ScoreRun, by coach
              confirmation, by Experience completion, or by any action inside the platform.
              External attestation is the only gate — enforced at the architecture level.
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
