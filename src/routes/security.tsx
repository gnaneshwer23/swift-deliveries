import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileSearch, ShieldCheck, UserRoundCheck } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
export const Route = createFileRoute("/security")({
  head: () =>
    pageHead(
      "/security",
      "Security & Trust — Human authority, visible evidence | DeliverX",
      "Understand the boundaries around specialist proposals, human decisions, workspace access and usage. Inspect the current safeguards and their verification limits.",
    ),
  component: Trust,
});
const CONTROLS = [
  {
    title: "Workspace access",
    scope: "Your records stay scoped to your workspace",
    text: "Server ownership checks and tool permissions form the access boundary. Two-workspace read, write and export checks, plus session and recovery acceptance, remain required release evidence.",
  },
  {
    title: "Usage and spending",
    scope: "Limits need a clear unit and a hard stop",
    text: "Comparison-unit reservations and usage ceilings exist. They are not measured GBP spend. Provider-cost reconciliation and uncertain attempts still require operational acceptance. A public price is not an active subscription entitlement.",
  },
  {
    title: "Consequential actions",
    scope: "A recommendation does not grant authority",
    text: "A plan is not blanket permission to contact customers, change a live product or deploy. Material changes need a fresh decision. Exact action/version binding is a release check; automatic production deployment is outside the first bounded pilot.",
  },
  {
    title: "Your brief and data",
    scope: "Know when information leaves your browser",
    text: "The public brief builder saves a draft in this browser when storage is available. You can clear it. Editing or downloading does not submit an enquiry; submitting the pilot form sends its listed fields for review. Workspace retention and provider-processing arrangements must be confirmed for the agreed pilot.",
  },
];
function Trust() {
  return (
    <MarketingLayout>
      <div className="public-trust-page">
        <section className="public-start-opening">
          <div className="dxl-wrap public-trust-intro">
            <div>
              <p className="dxl-eyebrow">Security & Trust</p>
              <h1>
                Specialists propose.
                <br />
                You hold the authority.
              </h1>
              <p>
                Understand what is being proposed, inspect its evidence and decide what can move
                forward. Keep the decision attached to a specific scope.
              </p>
              <a href="#safeguard-boundaries" className="dxl-btn dxl-btn-primary">
                Inspect the boundaries <ArrowRight size={15} />
              </a>
            </div>
            <figure>
              <img
                src="/illustrations/trust-workbench-v1.webp"
                width="1536"
                height="1024"
                alt="A proposed action passing through permission, usage, human-authority and audit checkpoints."
              />
              <figcaption>Illustrated safeguards · not a security certification</figcaption>
            </figure>
          </div>
        </section>
        <section className="public-trust-boundary">
          <div className="dxl-wrap">
            <ol aria-label="From proposal to an owner decision">
              <li>
                <FileSearch aria-hidden="true" />
                <span>Specialist proposal</span>
                <strong>Action · target · intended output</strong>
              </li>
              <li>
                <ShieldCheck aria-hidden="true" />
                <span>Review boundary</span>
                <strong>Evidence · permissions · usage</strong>
              </li>
              <li>
                <UserRoundCheck aria-hidden="true" />
                <span>Your decision</span>
                <strong>Approve scope · reject · ask for more</strong>
              </li>
            </ol>
            <p>
              A proposal can reach your review. It cannot pass a human lifecycle gate on its own.
            </p>
          </div>
        </section>
        <section className="public-trust-controls" id="safeguard-boundaries">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Controls and current limits</p>
              <h2>
                Make the boundary
                <br />
                easy to inspect.
              </h2>
              <p>
                Implemented foundations and outstanding release checks are different things. Open
                each area for its scope.
              </p>
              <Link to="/privacy" className="dxl-link">
                Read the privacy policy <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              {CONTROLS.map((c, i) => (
                <details key={c.title} open={i === 0}>
                  <summary>
                    <span>0{i + 1}</span>
                    <strong>{c.title}</strong>
                  </summary>
                  <div>
                    <h3>{c.scope}</h3>
                    <p>{c.text}</p>
                    {i === 3 && (
                      <Link to="/resources" hash="brief-builder" className="dxl-link">
                        Inspect the brief builder <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="public-review-labels">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">Read the evidence behind a label</p>
              <h2>
                Reviewed how?
                <br />
                And against what?
              </h2>
              <p>
                Generation mode—model, deterministic, simulated or human-authored—is recorded
                separately from review. A hypothetical example is never an observed customer
                outcome.
              </p>
            </div>
            <dl>
              {[
                [
                  "Agent-reviewed",
                  "An agent examined the output. Agreement is not independent factual evidence.",
                ],
                [
                  "Automatically tested",
                  "A specified check has retained results. Static checks do not prove a working deployment.",
                ],
                [
                  "Human-reviewed",
                  "A person reviewed the stated scope. This does not imply independent certification.",
                ],
                [
                  "Externally attested",
                  "A separate party supplied evidence for a specified claim. Its scope must be inspectable.",
                ],
              ].map(([name, text]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className="public-next-section">
          <div className="dxl-wrap">
            <div>
              <p className="dxl-eyebrow">See the boundary in context</p>
              <h2>
                Inspect the decision.
                <br />
                Keep the owner in control.
              </h2>
              <p>
                The sample mission shows alternatives, open gaps and a pending owner decision
                without running a live mission.
              </p>
            </div>
            <div className="public-next-actions">
              <Link to="/how-it-works" hash="sample-documents" className="dxl-btn dxl-btn-primary">
                Open the sample record <ArrowRight size={15} />
              </Link>
              <Link to="/psi" hash="capabilities" className="dxl-link">
                Review platform scope <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
