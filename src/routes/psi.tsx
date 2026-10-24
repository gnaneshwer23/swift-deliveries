import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { SpecialistHandoff } from "@/components/marketing/specialist-handoff";
import { ImpactExplorer } from "@/components/marketing/context-and-impact";
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
          <p className="psi-lead">
            Founders and product teams use it to decide what to build. Students learn by building
            the same work. A product question becomes evidence, compared options, a human decision,
            and an export.
          </p>
          <div className="psi-actions">
            <Link to="/how-it-works" className="dxl-btn dxl-btn-primary">
              Inspect an example mission
            </Link>
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-ghost">
              Prepare your brief
            </Link>
          </div>
          <p className="journey-status">
            This page describes the product as it stands. The pictures are examples. They are not a
            completed live mission. Release checks are still required before that mission is offered
            as working software.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted" id="product-brain">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Product Brain</p>
            <h2 className="dxl-h2">Where the reasoning is kept.</h2>
            <p>
              Product Brain is the persistent record of that work: the question, the evidence, the
              options, the decision, and the export. A later step can cite why it exists.
            </p>
            <ol className="mt-3 grid gap-2" aria-label="What the record holds">
              <li>Sources, with gaps left visible.</li>
              <li>Options that were compared, including dissent.</li>
              <li>The decision a person recorded, and the export that followed.</li>
            </ol>
            <p>
              Source references, decision records, and export history are present. A full
              interactive knowledge graph is still planned, and it is not part of this page.
            </p>
            <Link to="/how-it-works" hash="sample-record" className="dxl-link">
              Inspect linked sample records
            </Link>
          </div>
          <SectionExplorer kind="record" />
        </div>
      </section>
      <section className="psi-section" id="specialists">
        <div className="dxl-wrap">
          <div className="psi-split">
            <div>
              <p className="dxl-eyebrow">Specialist contributions</p>
              <h2 className="dxl-h2">Each role finishes one piece.</h2>
              <p>
                The six working roles are Evidence, Options, Challenge, Decision, Builder, and
                Export. Evidence starts from what you supplied. Options compares approaches.
                Challenge tests the recommendation. Decision prepares the choice for the owner to
                record. Builder drafts inside that choice. Export packs the work and waits.
              </p>
              <p>
                The picture is an example of work moving forward. The wider catalogue describes
                further roles. It is not a live team of 150.
              </p>
              <Link to="/ai-agents" className="dxl-link">
                Inspect the specialist catalogue
              </Link>
            </div>
            <SectionExplorer kind="team" />
          </div>
          <SpecialistHandoff />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Later stages are drawn, not running.</h2>
          <p>
            The first pilot stops at a decision and an experiment brief. The map below continues
            into design, build, verification, and release. Those later stages are still planned.
            Opening one does not build, test, or ship software.
          </p>
          <details className="journey-detail">
            <summary>Open the planned stages and the human gates</summary>
            <ImpactExplorer />
          </details>
        </div>
      </section>
      <section className="psi-section" id="controls">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Human control</p>
            <h2 className="dxl-h2">The owner approves the consequential step.</h2>
            <p>
              A specialist can prepare the case. A specialist does not approve their own step. You
              read the scope, the uncertainty, and the dissent, then approve, reject, or ask for
              more evidence.
            </p>
            <p>
              That rule is part of the product. Binding the approval to live permissions and
              measured usage still needs release verification, alongside the mission runtime.
            </p>
            <Link to="/security" className="dxl-link">
              Read safeguards and limitations
            </Link>
          </div>
          <SectionExplorer kind="trust" />
        </div>
      </section>
      <section className="psi-section psi-tinted" id="learning">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">A result counts only if you supply it.</h2>
          <p>
            Before a change, record the hypothesis, the metric you expect, a baseline, and the
            observation window. Afterwards, add the result you actually saw and the evidence for it.
            DeliverX does not measure that result. The review keeps it beside the expectation and
            may propose one next mission. The proposal stays inactive until you approve it.
          </p>
          <p>
            Connected analytics and automatic learning are still planned. This page does not store a
            result or start a mission.
          </p>
          <details className="journey-detail">
            <summary>See how a supplied result is reviewed</summary>
            <SectionExplorer kind="learning" />
          </details>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">An account is not a paid pilot.</h2>
          <p>
            A useful first scope is an evidence register, compared options, your decision, an
            experiment brief, and a portable record. You can prepare the brief in this browser.
            Creating an account does not activate a paid pilot. Scope and availability are confirmed
            before any billing.
          </p>
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
