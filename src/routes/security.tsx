import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/security")({
  head: () =>
    pageHead(
      "/security",
      "Trust and control — DeliverX",
      "Understand action approvals, permission boundaries, usage controls, generation labels and the current verification limits of DeliverX.",
    ),
  component: Trust,
});
function Trust() {
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Trust and control</p>
          <h1 className="dxl-h1">
            Know what can happen.
            <br />
            Decide what should.
          </h1>
          <p className="psi-lead">
            An agent recommendation is a proposal. Review its evidence, scope and cost before
            authorising consequential work.
          </p>
          <p className="journey-status">
            Safeguard foundations exist in code. Authenticated isolation, exact approval binding,
            recovery and measured provider-cost controls still require release verification. This
            page is not a security certification.
          </p>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Permission belongs to a specific action.</h2>
          <ol className="use-case-flow" aria-label="Action approval boundary">
            <li>
              <span>Specialist proposes</span>
              <strong>Action, target and intended output</strong>
            </li>
            <li>
              <span>You review</span>
              <strong>Evidence, access, budget and scope</strong>
            </li>
            <li>
              <span>Authorised continuation</span>
              <strong>Only the agreed next step</strong>
            </li>
          </ol>
          <p>
            A plan approval is not blanket permission to contact customers, change a live product or
            deploy. Material changes should require a new decision. Full action/version binding
            remains a release check.
          </p>
          <Link to="/how-it-works" hash="sample-record" className="dxl-link">
            Inspect a sample pending decision
          </Link>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Controls and their current limits.</h2>
          <div className="trust-controls">
            <article>
              <h3>Workspace access</h3>
              <p>
                Server ownership checks and tool permissions are implemented foundations.
                Two-workspace isolation and session/recovery tests are required before
                production-readiness claims.
              </p>
            </article>
            <article>
              <h3>Usage and spending</h3>
              <p>
                Usage-ceiling logic exists. Measured provider-cost reservation and reconciliation
                need verification. Advertised pilot allowances are offers, not active subscription
                entitlements.
              </p>
            </article>
            <article>
              <h3>External action</h3>
              <p>
                Consequential actions require explicit approval. Automated production deployment is
                outside the first bounded pilot promise.
              </p>
            </article>
            <article>
              <h3>Data handling</h3>
              <p>
                The public brief builder keeps entered text in the page until you download or leave.
                It does not submit a pilot request. Workspace retention, deletion and
                provider-processing details must be confirmed for the agreed pilot scope.
              </p>
              <Link to="/privacy" className="dxl-link">
                Read the privacy policy
              </Link>
            </article>
          </div>
        </div>
      </section>
      <section className="psi-section psi-tinted">
        <div className="dxl-wrap">
          <h2 className="dxl-h2">Read the evidence behind the label.</h2>
          <div className="trust-controls">
            {[
              [
                "Agent-reviewed",
                "Another agent examined the output. Agreement is not independent factual evidence.",
              ],
              [
                "Automatically tested",
                "A specified check ran with retained results. Static checks do not establish a working deployed product.",
              ],
              [
                "Human-reviewed",
                "A person reviewed the stated scope. This does not imply independent certification.",
              ],
              [
                "Externally attested",
                "A separate party supplied attestation for a specified claim. Do not infer this status without its evidence.",
              ],
            ].map(([title, text]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p>
            Generation mode is separate: model-generated, deterministic, simulated or
            human-authored. A hypothetical example must never be recorded as customer research or an
            observed outcome.
          </p>
          <Link to="/psi" className="dxl-link">
            Review product scope and planned capabilities
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
