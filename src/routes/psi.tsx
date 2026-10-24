import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { SectionExplorer } from "@/components/marketing/section-explorer";
import { ImpactExplorer } from "@/components/marketing/context-and-impact";
import { pageHead } from "@/components/marketing/page-head";

export const Route = createFileRoute("/psi")({
  head: () =>
    pageHead(
      "/psi",
      "The DeliverX product — Context, missions and human decisions",
      "Explore the product record, specialist handoffs and human controls behind DeliverX, with clear current and planned capabilities.",
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
            The reasoning stays
            <br />
            with the work.
          </h1>
          <p className="psi-lead">
            Product Brain holds the context. Missions organise bounded work. Specialist
            contributions propose a direction. You decide what moves forward.
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
            Interactive explanations of a product in development. Mission foundations require
            release verification; illustrations do not prove live execution.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted" id="product-brain">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Product Brain</p>
            <h2 className="dxl-h2">A record of what you know—and why.</h2>
            <p>
              Connect a source to an observation, an observation to a decision, and that decision to
              an artefact. Preserve assumptions and gaps so the next mission can question them.
            </p>
            <p>
              The current foundation includes source references, decision records and export
              history. A full interactive knowledge graph is planned.
            </p>
            <Link to="/how-it-works" hash="sample-record" className="dxl-link">
              Inspect linked sample records
            </Link>
          </div>
          <SectionExplorer kind="record" />
        </div>
      </section>
      <section className="psi-section" id="specialists">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Specialist contributions</p>
            <h2 className="dxl-h2">Know who passes what to whom.</h2>
            <p>
              Research hands an evidence brief to product strategy. Reviewers challenge the
              recommendation. The owner approves a bounded next step. Each handoff should retain its
              inputs and limitations.
            </p>
            <p>
              150 roles describe the catalogue; 12 are marked available with deterministic-stub
              limitations. Provider integration exists, but evaluated live execution is not yet
              established.
            </p>
            <Link to="/ai-agents" className="dxl-link">
              Inspect the specialist catalogue
            </Link>
          </div>
          <SectionExplorer kind="team" />
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Explore the wider lifecycle.</h2>
          <p>
            The first pilot focuses on evidence, decisions and experiment planning. The wider
            lifecycle includes planned build, release and outcome capabilities.
          </p>
          <details className="journey-detail">
            <summary>Explore lifecycle stages and human gates</summary>
            <ImpactExplorer />
          </details>
        </div>
      </section>
      <section className="psi-section" id="controls">
        <div className="dxl-wrap psi-split">
          <div>
            <p className="dxl-eyebrow">Human control</p>
            <h2 className="dxl-h2">A recommendation needs a decision.</h2>
            <p>
              Inspect scope, uncertainty and dissent before approving consequential work.
              Permissions, approval binding and measured usage controls need release verification
              alongside the mission runtime.
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
          <h2 className="dxl-h2">The next loop starts with an observed result.</h2>
          <p>
            Planned: compare an expected outcome with supplied observations, retain the uncertainty
            and propose a next mission for human approval. Automatic learning and connected outcome
            tracking are not live.
          </p>
          <details className="journey-detail">
            <summary>Explore the planned learning loop</summary>
            <SectionExplorer kind="learning" />
          </details>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Start with a bounded question.</h2>
          <p>
            Suggested first pilot scope: an evidence register, compared options, owner decision,
            experiment brief and portable record. Scope and availability are confirmed before
            billing.
          </p>
          <div className="psi-actions">
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare your brief
            </Link>
            <Link to="/pricing" className="dxl-btn dxl-btn-ghost">
              Explore pilot offers
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
