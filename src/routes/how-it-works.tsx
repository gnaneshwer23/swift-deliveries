import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { MissionSampleRecord } from "@/components/marketing/mission-sample-record";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "Example mission — Investigate onboarding | DeliverX",
      "Follow one illustrative onboarding mission from a product question through evidence, alternatives, an owner decision and a sample experiment brief.",
    ),
  component: ExampleMission,
});
function ExampleMission() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Example mission · improve onboarding</p>
          <h1 className="dxl-h1">
            Which change should
            <br />
            we investigate first?
          </h1>
          <p className="psi-lead">
            People reach setup, but you do not yet know why some leave. Follow one question through
            the team, then open the documents that explain the proposed next step.
          </p>
          <div className="psi-actions">
            <a href="#walkthrough" className="dxl-btn dxl-btn-primary">
              Follow the handoffs
            </a>
            <a href="#sample-record" className="dxl-btn dxl-btn-ghost">
              Inspect sample documents
            </a>
          </div>
          <p className="journey-status">
            Interactive example, not a running customer mission. All sample material is
            hypothetical. No research, approval, experiment or deployment takes place here.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted" id="walkthrough">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">A question becomes work you can inspect.</h2>
          <p>
            Select a labelled object to see who contributes, what they receive and what moves
            forward. Playback pauses for an example human decision.
          </p>
          <SectionExplorer kind="mission" />
        </div>
      </section>
      <section className="psi-section" id="sample-record">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Inside the sample record</p>
          <h2 className="dxl-h2">Open the reasons behind the recommendation.</h2>
          <p>
            The sample links a hypothesis in E-02 to decision D-01 and experiment brief A-01. The
            reviewer's objection stays visible: without real abandonment evidence, implementation is
            not justified.
          </p>
          <MissionSampleRecord />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">What you bring. What stays your call.</h2>
          <div className="psi-feature-grid">
            <div className="psi-feature">
              <h3>You bring</h3>
              <p>
                A product question, authorised sources, constraints and the outcome you want to
                investigate. Missing evidence is an acceptable starting point.
              </p>
            </div>
            <div className="psi-feature">
              <h3>You decide</h3>
              <p>
                Inspect alternatives and objections. Approve a scoped next step, request more
                evidence or reject the recommendation. This example records no real approval.
              </p>
            </div>
            <div className="psi-feature">
              <h3>You receive</h3>
              <p>
                Proposed pilot scope: a brief, evidence register, decision record, experiment plan
                and export. A prototype requires an agreed extension; deployment is not included.
              </p>
            </div>
          </div>
          <p className="journey-status">
            Product status: supervised mission foundations require authenticated runtime and release
            verification. Outcome review and a human-approved follow-up mission are planned; no
            improvement has been observed in this example.
          </p>
          <Link to="/psi" className="dxl-link">
            Explore capabilities and current limitations
          </Link>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Bring your own product question.</h2>
          <p>
            Use the brief builder to describe your audience, problem, intended outcome and available
            evidence. You can download your brief without creating an account.
          </p>
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
