import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
import { PilotEnquiryForm } from "@/components/marketing/pilot-enquiry-form";
import { PILOT_PLAN_LABELS, parsePilotPlan } from "@/lib/pilot/model";
import {
  ACCOUNT_DOES_NOT_ACTIVATE,
  CHECKOUT_NOT_LIVE_COPY,
  MANUAL_ACTIVATION_COPY,
  PUBLISHED_OPERATOR_EMAIL,
  SUPPORT_RECOVERY_COPY,
} from "@/lib/pilot/commercial-copy";

export const Route = createFileRoute("/pilot")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: parsePilotPlan(search["plan"]),
  }),
  head: () =>
    pageHead(
      "/pilot",
      "Request a pilot — DeliverX",
      "Submit a DeliverX pilot enquiry with your product question. Account creation does not activate a paid pilot.",
    ),
  component: Pilot,
});

function Pilot() {
  const { plan } = Route.useSearch();
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Pilot enquiry</p>
          <h1 className="dxl-h1">
            Request a review
            <br />
            <span className="dxl-grad">of one question.</span>
          </h1>
          <p className="psi-lead">
            Selected offer: <strong>{PILOT_PLAN_LABELS[plan]}</strong>. This is a proposed paid
            pilot. Sending this form stores the request. It does not take payment or start the
            pilot.
          </p>
          <div className="psi-actions">
            {(["builder", "founder", "studio"] as const).map((item) => (
              <Link
                key={item}
                to="/pilot"
                search={{ plan: item }}
                className={item === plan ? "dxl-btn dxl-btn-primary" : "dxl-btn dxl-btn-ghost"}
                aria-current={item === plan ? "page" : undefined}
              >
                {PILOT_PLAN_LABELS[item].split(" · ")[0]}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="psi-section">
        <div className="dxl-wrap psi-builder-layout">
          <div className="psi-section-copy">
            <h2 className="dxl-h2">What happens after you submit</h2>
            <ol className="psi-check-list">
              <li>You get a request reference on this page once it is saved.</li>
              <li>We review your question, then follow up to agree the scope with you.</li>
              <li>
                {MANUAL_ACTIVATION_COPY} {CHECKOUT_NOT_LIVE_COPY}
              </li>
            </ol>
            <p className="psi-fine-print">
              {ACCOUNT_DOES_NOT_ACTIVATE} There is no promised reply window. If saving fails, the
              page says so and the request is not confirmed.
            </p>
            <p className="psi-fine-print">{SUPPORT_RECOVERY_COPY}</p>
            <p>
              <a className="dxl-link" href={`mailto:${PUBLISHED_OPERATOR_EMAIL}`}>
                Email the pilot team
              </a>
            </p>
            <Link to="/resources" hash="brief-builder" className="dxl-link">
              Prepare the brief first
            </Link>
          </div>
          <PilotEnquiryForm plan={plan} />
        </div>
      </section>
    </MarketingLayout>
  );
}
