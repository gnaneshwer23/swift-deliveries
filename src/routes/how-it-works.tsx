import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { MissionSampleRecord } from "@/components/marketing/mission-sample-record";
import { ProductBench, ProductCards } from "@/components/marketing/product-reading";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageHead(
      "/how-it-works",
      "Example mission — Investigate onboarding | DeliverX",
      "One example: why people leave during setup. Follow the question through evidence, options, a challenge, the owner's decision, and a held export.",
    ),
  component: ExampleMission,
});

function ExampleMission() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Example mission · why people leave during setup</p>
          <h1 className="dxl-h1">
            Which change should
            <br />
            we investigate first?
          </h1>
          <div className="psi-hero-reading">
            <ProductBench
              label="This page is one onboarding example"
              source="People reach setup, and you do not yet know why some leave."
              known="This page follows that one question. You hand it to Evidence. Evidence hands a brief to Options. Options hands a comparison to Challenge. Challenge hands the objection to you. Export holds the pack until you approve."
              open="The sample is hypothetical. No abandonment evidence is supplied here, no approval is recorded, and nothing is exported."
              note="Example reading only. One question, one stepper, one sample. This is not a live mission."
            />
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
        </div>
      </section>
      <section className="psi-section psi-reading psi-mission" id="walkthrough">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <p className="dxl-eyebrow">The handoff</p>
            <h2 className="dxl-h2">The question moves. You decide before export.</h2>
          </div>
          <ProductBench
            label="How this onboarding example moves"
            source="The question is why people leave during setup."
            known="Each step names what moves and who receives it. Challenge keeps the objection beside the recommendation. The picture pauses at your decision. The experiment brief is a document inside the pack, not a second walkthrough."
            open="You have not approved an investigation. Export stays held. No one on this page fills in the missing reason people leave."
            note="The picture below is the same example. Selecting a station does not run the mission."
          />
          <ProductCards
            label="Steps in this onboarding example"
            cards={[
              {
                name: "Question",
                status: "You hand it on",
                meta: "To Evidence",
                source: "People reach setup and some leave",
                known:
                  "The question that moves is which change to investigate first. You hand that question to Evidence.",
                open: "The question is not a finding, and it is not an approval.",
              },
              {
                name: "Evidence",
                status: "Hands the brief on",
                meta: "To Options",
                source: "Sample setup notes, not interviews",
                known:
                  "What moves is the note that setup asks for several details before the first useful action. Evidence hands that brief to Options.",
                open: "Where people leave, and why, is missing. The gap stays open.",
              },
              {
                name: "Options",
                status: "Hands the comparison on",
                meta: "To Challenge",
                source: "The brief, including the gap",
                known:
                  "Three options move forward: shorten the fields, defer optional details until after the first useful action, or explain why each detail is needed.",
                open: "No option is chosen here. No change in completion is claimed.",
              },
              {
                name: "Challenge",
                status: "Hands the case to you",
                meta: "The objection stays visible",
                source: "The suggestion to investigate deferring optional details",
                known:
                  "The reviewer objects: without abandonment evidence, the cause is unknown, so implementation is not justified. Challenge hands that case to you.",
                open: "Challenge does not approve the next step.",
              },
              {
                name: "Owner decision",
                status: "You decide",
                meta: "Before Export",
                source: "The options, the objection, and the missing evidence",
                known:
                  "You approve a scoped investigation, ask for the missing evidence, or reject the recommendation. The sample leaves the decision pending.",
                open: "Approving this page does not approve a mission. Export waits.",
              },
              {
                name: "Export",
                status: "Held for you",
                meta: "Leaves only after you approve",
                source: "The brief, the register, the decision, and the experiment brief",
                known:
                  "Export packs those documents and holds them. The experiment brief states a hypothesis and a measure. It does not report a result.",
                open: "This page does not release the pack. No experiment has run.",
              },
            ]}
          />
          <SectionExplorer kind="mission" />
        </div>
      </section>
      <section className="psi-section psi-reading psi-mission" id="sample-record">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <p className="dxl-eyebrow">Inside the sample record</p>
            <h2 className="dxl-h2">Open the reasons behind the recommendation.</h2>
          </div>
          <ProductBench
            label="What the sample record holds"
            source="The sample links hypothesis E-02 to decision D-01 and experiment brief A-01."
            known="The reviewer's objection stays in the record: without real abandonment evidence, implementation is not justified. The owner decision is written as pending, so the pack is not cleared for export."
            open="You can read and download the sample. Downloading it does not approve the mission, start an experiment, or record what happened in setup."
            note="One sample. These documents are hypothetical teaching material."
          />
          <MissionSampleRecord />
        </div>
      </section>
      <section className="psi-section psi-reading psi-mission">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <h2 className="dxl-h2">What you bring. What stays your call.</h2>
          </div>
          <ProductBench
            label="What stays with the owner in this example"
            source="You bring the setup question, the notes you are allowed to use, and the outcome you want to investigate."
            known="You decide after Challenge has handed you the objection. A scoped investigation can be approved, sent back for the missing abandonment evidence, or rejected. The pack you would receive is the brief, the register, the decision, and the experiment plan."
            open="This example records no approval. A prototype needs an agreed extension. Deployment is not part of the pack."
            note="Owner reading only. Nothing on this page is an observed improvement."
          />
          <ProductCards
            label="Your part of this example"
            cards={[
              {
                name: "You bring",
                status: "Starting point",
                meta: "A gap is allowed",
                source: "Your setup question and authorised notes",
                known:
                  "You hand Evidence the question, the constraints, and the outcome you want to investigate.",
                open: "Missing abandonment evidence is an acceptable start. It is not filled in for you.",
              },
              {
                name: "You decide",
                status: "Before export",
                meta: "Challenge has handed you the case",
                source: "The options and the objection",
                known:
                  "You approve a scoped investigation, ask for more evidence, or reject the recommendation.",
                open: "This example records no real approval.",
              },
              {
                name: "You receive",
                status: "Only after you approve",
                meta: "The held pack",
                source: "Export, still held",
                known:
                  "The pack is a brief, an evidence register, a decision record, and an experiment plan.",
                open: "A prototype needs an agreed extension. Deployment is not included.",
              },
            ]}
          />
          <p className="journey-status">
            Product status: a supervised mission can store an owner-supplied result, a versioned
            review and a follow-up that stays proposed until you approve it. This example does not
            record an observation or approve a mission. No improvement has been observed here.
          </p>
          <Link to="/psi" className="dxl-link">
            Explore capabilities and current limitations
          </Link>
        </div>
      </section>
      <section className="psi-section psi-reading psi-mission">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <h2 className="dxl-h2">Bring your own product question.</h2>
          </div>
          <ProductBench
            label="Prepare a brief without starting this example"
            source="The brief builder asks for your audience, the problem, the outcome you want, and the evidence you already have."
            known="You can download that brief without creating an account. It is your question, not this onboarding sample."
            open="Downloading a brief does not open a paid pilot, approve a mission, or export this sample."
            note="Brief reading only. The onboarding sample stays on this page."
          />
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
