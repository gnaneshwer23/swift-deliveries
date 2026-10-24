import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { MissionSampleRecord } from "@/components/marketing/mission-sample-record";
import { MissionDecisionExample } from "@/components/marketing/mission-decision-example";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "How DeliverX works — One question, a traceable decision",
      "Follow an onboarding question through evidence, specialist contributions, your decision, a reviewable pack and an outcome review.",
    ),
  component: ExampleMission,
});

function ExampleMission() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero mission-journey-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">How DeliverX works</p>
          <h1 className="dxl-h1">
            One question.
            <br />A decision you can explain.
          </h1>
          <p className="mission-intro">
            Follow a product question as specialists organise evidence, compare options and
            challenge a recommendation. You choose what happens next.
          </p>
          <div className="psi-actions">
            <a href="#walkthrough" className="dxl-btn dxl-btn-primary">
              Explore the mission
            </a>
            <a href="#sample-record" className="dxl-btn dxl-btn-ghost">
              Open the decision pack
            </a>
          </div>
          <p className="mission-example-label">
            Hypothetical onboarding example. No customer research, live agent execution or real
            approval takes place here.
          </p>
          <nav className="mission-page-nav" aria-label="On this page">
            <a href="#walkthrough">Follow the work</a>
            <a href="#your-decision">Make an example decision</a>
            <a href="#sample-record">Inspect the record</a>
            <a href="#outcome-review">Close the loop</a>
          </nav>
        </div>
      </section>
      <section className="psi-section" id="walkthrough">
        <div className="dxl-wrap">
          <div className="mission-section-heading">
            <div>
              <p className="dxl-eyebrow">Evidence & memory → Judgement → Delivery</p>
              <h2 className="dxl-h2">
                Which onboarding change
                <br />
                should we investigate first?
              </h2>
            </div>
            <p>
              Sample context: setup asks for several details before the first useful action. Where
              people leave, and why, is still unknown.
            </p>
          </div>
          <SectionExplorer kind="mission" />
        </div>
      </section>
      <section className="psi-section mission-decision-section" id="your-decision">
        <div className="dxl-wrap">
          <div className="mission-section-heading">
            <div>
              <p className="dxl-eyebrow">Your decision</p>
              <h2 className="dxl-h2">
                A recommendation needs
                <br />
                your judgement.
              </h2>
            </div>
            <p>
              The evidence gap travels with the recommendation. Explore three possible responses
              without changing a workspace mission.
            </p>
          </div>
          <MissionDecisionExample />
        </div>
      </section>
      <section className="psi-section" id="sample-record">
        <div className="dxl-wrap">
          <div className="mission-section-heading">
            <div>
              <p className="dxl-eyebrow">The product record</p>
              <h2 className="dxl-h2">
                Take the reasoning
                <br />
                with the work.
              </h2>
            </div>
            <p>
              Inspect the brief, evidence, alternatives and experiment plan. These fixed sample
              documents keep the owner decision pending, regardless of your example choice above.
            </p>
          </div>
          <MissionSampleRecord />
          <p className="mission-example-label">
            Downloading a sample is a local document action. It authorises no experiment, external
            action or deployment.
          </p>
        </div>
      </section>
      <section className="psi-section mission-learning-section" id="outcome-review">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Feedback loop</p>
          <h2 className="dxl-h2">
            A plan becomes learning
            <br />
            when you bring a result.
          </h2>
          <ol className="mission-learning-flow">
            <li>
              <span>01 · Plan</span>
              <h3>Define the measure</h3>
              <p>
                Setup completion and time to first useful action. Track later profile completion as
                a guardrail.
              </p>
              <strong>Baseline still needed</strong>
            </li>
            <li>
              <span>02 · Observe</span>
              <h3>Supply what happened</h3>
              <p>
                After separately approved work, bring an actual result, source and observation
                window.
              </p>
              <strong>No result supplied in this example</strong>
            </li>
            <li>
              <span>03 · Review</span>
              <h3>Compare with the hypothesis</h3>
              <p>
                Keep limitations in the review. Propose the next question; the owner decides whether
                it becomes a mission.
              </p>
              <strong>Next mission requires your approval</strong>
            </li>
          </ol>
          <p className="mission-learning-return">
            ↶ The next approved question returns to Evidence & memory.
          </p>
          <Link to="/psi" className="dxl-link">
            Explore current capabilities and limitations
          </Link>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap mission-final">
          <div>
            <h2 className="dxl-h2">
              What question is
              <br />
              your product facing?
            </h2>
            <p>
              Start with your audience, constraints and the evidence you have. An honest gap is a
              useful starting point.
            </p>
          </div>
          <div className="psi-actions">
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare your brief
            </Link>
            <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
              Explore paid pilots
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
