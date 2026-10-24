import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { SpecialistHandoff } from "@/components/marketing/specialist-handoff";
import { ImpactExplorer } from "@/components/marketing/context-and-impact";
import { ProductBench, ProductCards } from "@/components/marketing/product-reading";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/psi")({
  head: () =>
    pageHead(
      "/psi",
      "The DeliverX product: who it is for, and what it keeps",
      "Founders, product teams, and students turn a product question into evidence, compared options, a human decision, and an export. Product Brain keeps that record. See what is present and what is still planned.",
    ),
  component: ProductPage,
});
function ProductPage() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">The DeliverX product</p>
          <h1 className="dxl-h1">
            For founders, product teams,
            <br />
            and students.
          </h1>
          <div className="psi-hero-reading">
            <ProductBench
              label="Who the product is for"
              source="This page describes the product as it stands."
              known="Founders and product teams use it to decide what to build. Students learn by building the same work. A product question becomes evidence, compared options, a human decision, and an export."
              open="The pictures are examples. They are not a completed live mission. Release checks are still required before that mission is offered as working software."
              note="Page reading only. These cards are not a completed live mission."
            />
            <ProductCards
              label="Who it is for"
              cards={[
                {
                  name: "Founders",
                  status: "Who it is for",
                  meta: "Decide what to build",
                  source: "This page",
                  known: "Founders use DeliverX to decide what to build.",
                  open: "Release checks are still required before a live mission is offered.",
                },
                {
                  name: "Product teams",
                  status: "Who it is for",
                  meta: "Same record of the work",
                  source: "This page",
                  known: "Product teams decide what to build in the same record.",
                  open: "The pictures on this page are examples.",
                },
                {
                  name: "Students",
                  status: "Who it is for",
                  meta: "Learning by building",
                  source: "This page",
                  known: "Students learn by building the same work.",
                  open: "This page does not start a mission.",
                },
              ]}
            />
            <div className="psi-actions">
              <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
                Inspect an example mission
              </Link>
              <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-ghost">
                Prepare your brief
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="psi-section psi-reading" id="product-brain">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <p className="dxl-eyebrow">Product Brain</p>
            <h2 className="dxl-h2">Where the reasoning is kept.</h2>
          </div>
          <SectionExplorer kind="record" />
          <div className="psi-reading-stage">
            <ProductBench
              label="Where the reasoning is kept"
              source="Product Brain is the persistent record of that work: the question, the evidence, the options, the decision, and the export."
              known="Source references, decision records, and export history are present. A later step can cite why it exists."
              open="A full interactive knowledge graph is still planned, and it is not part of this page."
              note="Record reading only. The diagram above is an example, not a live knowledge graph."
            />
            <div className="psi-reading-follow">
              <ProductCards
                label="What the record holds"
                cards={[
                  {
                    name: "Sources",
                    status: "In the record",
                    meta: "Gaps stay visible",
                    source: "The question you brought",
                    known: "Each source stays attached, and gaps are left visible.",
                    open: "A missing source is not filled in on this page.",
                  },
                  {
                    name: "Options",
                    status: "In the record",
                    meta: "Compared, including dissent",
                    source: "The evidence already recorded",
                    known: "Approaches are compared, including dissent.",
                    open: "The comparison is not itself the decision.",
                  },
                  {
                    name: "Decision and export",
                    status: "In the record",
                    meta: "A person records the choice",
                    source: "The options and the dissent",
                    known: "A person records the decision, and the export follows.",
                    open: "An interactive knowledge graph is still planned.",
                  },
                ]}
              />
              <Link to="/how-it-works" hash="sample-record" className="dxl-link">
                Inspect linked sample records
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="psi-section psi-reading" id="specialists">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <p className="dxl-eyebrow">Specialist contributions</p>
            <h2 className="dxl-h2">Each role finishes one piece.</h2>
          </div>
          <SectionExplorer kind="team" />
          <div className="psi-reading-stage">
            <div className="psi-reading-follow">
              <ProductBench
                label="Each role finishes one piece"
                source="The six working roles are Evidence, Options, Challenge, Decision, Builder, and Export."
                known="Evidence starts from what you supplied. Options compares approaches. Challenge tests the recommendation. Decision prepares the choice for the owner to record. Builder drafts inside that choice. Export packs the work and waits."
                open="The picture is an example of work moving forward. The wider catalogue describes further roles. It is not a live team of 150."
                note="Role reading only. The control below shows one role at a time. It does not run a live team."
              />
              <Link to="/ai-agents" className="dxl-link">
                Inspect the specialist catalogue
              </Link>
            </div>
          </div>
          <SpecialistHandoff />
        </div>
      </section>
      <section className="psi-section psi-reading">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <h2 className="dxl-h2">Later stages are drawn, not running.</h2>
          </div>
          <ProductBench
            label="Later stages are drawn, not running"
            source="The map below continues into design, build, verification, and release."
            known="The first pilot stops at a decision and an experiment brief."
            open="Those later stages are still planned. Opening one does not build, test, or ship software."
            note="Stage reading only. Opening a drawn stage does not build, test, or ship software."
          />
          <ProductCards
            label="Planned stages"
            cards={[
              {
                name: "Design",
                status: "Drawn, not running",
                meta: "After the experiment brief",
                planned: true,
                source: "The map in this section",
                known: "Design is drawn after the first pilot stops.",
                open: "Opening it does not design software.",
              },
              {
                name: "Build",
                status: "Drawn, not running",
                meta: "After the experiment brief",
                planned: true,
                source: "The map in this section",
                known: "Build is drawn on the same map.",
                open: "Opening it does not build software.",
              },
              {
                name: "Verification",
                status: "Drawn, not running",
                meta: "After the experiment brief",
                planned: true,
                source: "The map in this section",
                known: "Verification is drawn on the same map.",
                open: "Opening it does not test software.",
              },
              {
                name: "Release",
                status: "Drawn, not running",
                meta: "After the experiment brief",
                planned: true,
                source: "The map in this section",
                known: "Release is drawn on the same map.",
                open: "Opening it does not ship software.",
              },
            ]}
          />
          <details className="journey-detail">
            <summary>Open the planned stages and the human gates</summary>
            <ImpactExplorer />
          </details>
        </div>
      </section>
      <section className="psi-section psi-reading" id="controls">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <p className="dxl-eyebrow">Human control</p>
            <h2 className="dxl-h2">The owner approves the consequential step.</h2>
          </div>
          <SectionExplorer kind="trust" />
          <div className="psi-reading-stage">
            <ProductBench
              label="The owner approves the consequential step"
              source="A specialist can prepare the case."
              known="A specialist does not approve their own step. You read the scope, the uncertainty, and the dissent, then approve, reject, or ask for more evidence. That rule is part of the product."
              open="Binding the approval to live permissions and measured usage still needs release verification, alongside the mission runtime."
              note="Control reading only. Approval on this page is not bound to live permissions."
            />
            <div className="psi-reading-follow">
              <ProductCards
                label="Owner actions"
                cards={[
                  {
                    name: "Approve",
                    status: "Owner step",
                    meta: "The consequential step",
                    source: "The case a specialist prepared",
                    known: "You approve the step. A specialist does not.",
                    open: "Live permissions are not bound on this page.",
                  },
                  {
                    name: "Reject",
                    status: "Owner step",
                    meta: "The same case",
                    source: "Scope, uncertainty, and dissent",
                    known: "You can reject the step.",
                    open: "Measured usage limits are not bound on this page.",
                  },
                  {
                    name: "Ask for more evidence",
                    status: "Owner step",
                    meta: "Send the case back",
                    source: "What is still uncertain",
                    known: "You can ask for more evidence before the step proceeds.",
                    open: "Release verification is still required for the mission runtime.",
                  },
                ]}
              />
              <Link to="/security" className="dxl-link">
                Read safeguards and limitations
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="psi-section psi-reading" id="learning">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <h2 className="dxl-h2">A result counts only if you supply it.</h2>
          </div>
          <ProductBench
            label="A result counts only if you supply it"
            source="Before a change, record the hypothesis, the metric you expect, a baseline, and the observation window."
            known="Afterwards, add the result you actually saw and the evidence for it. DeliverX does not measure that result. The review keeps it beside the expectation and may propose one next mission. The proposal stays inactive until you approve it."
            open="Connected analytics and automatic learning are still planned. This page does not store a result or start a mission."
            note="Result reading only. This page does not store a result or start a mission."
          />
          <ProductCards
            label="What you supply"
            cards={[
              {
                name: "Before the change",
                status: "You record it",
                meta: "Expectation",
                source: "Your hypothesis",
                known: "The metric, a baseline, and the observation window sit with it.",
                open: "This page does not store that record.",
              },
              {
                name: "The result you saw",
                status: "You supply it",
                meta: "Observed, not inferred",
                source: "What you actually observed",
                known: "The review keeps the result beside the expectation.",
                open: "DeliverX does not measure that result.",
              },
              {
                name: "One next mission",
                status: "Inactive until you approve",
                meta: "Proposal only",
                planned: true,
                source: "The review of what you supplied",
                known: "The review may propose one next mission.",
                open: "The proposal stays inactive until you approve it.",
              },
            ]}
          />
          <details className="journey-detail">
            <summary>See how a supplied result is reviewed</summary>
            <SectionExplorer kind="learning" />
          </details>
        </div>
      </section>
      <section className="psi-section psi-reading">
        <div className="dxl-wrap">
          <div className="psi-reading-head">
            <h2 className="dxl-h2">An account is not a paid pilot.</h2>
          </div>
          <ProductBench
            label="An account is not a paid pilot"
            source="A useful first scope is an evidence register, compared options, your decision, an experiment brief, and a portable record."
            known="You can prepare the brief in this browser."
            open="Creating an account does not activate a paid pilot. Scope and availability are confirmed before any billing."
            note="Offer reading only. Creating an account does not activate a paid pilot."
          />
          <ProductCards
            label="A useful first scope"
            cards={[
              {
                name: "Evidence register",
                status: "First scope",
                meta: "Named, not billed",
                source: "This page",
                known: "It is part of a useful first scope.",
                open: "An account does not activate a paid pilot.",
              },
              {
                name: "Compared options",
                status: "First scope",
                meta: "Named, not billed",
                source: "This page",
                known: "Compared options belong in that first scope.",
                open: "Scope is confirmed before any billing.",
              },
              {
                name: "Your decision",
                status: "First scope",
                meta: "Named, not billed",
                source: "This page",
                known: "The decision in that scope is yours.",
                open: "Availability is confirmed before any billing.",
              },
              {
                name: "Experiment brief",
                status: "First scope",
                meta: "Prepare it in this browser",
                source: "This page",
                known: "You can prepare the brief in this browser.",
                open: "Preparing the brief does not start a paid pilot.",
              },
              {
                name: "Portable record",
                status: "First scope",
                meta: "Named, not billed",
                source: "This page",
                known: "A portable record is part of that first scope.",
                open: "Creating an account does not activate a paid pilot.",
              },
            ]}
          />
          <div className="psi-actions">
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare your brief
            </Link>
            <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
              Read the pilot offers
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
