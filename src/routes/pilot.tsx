import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { pageHead } from "@/components/marketing/page-head";
const names = {
  builder: "Builder · £29/month",
  founder: "Founder · £99/month",
  studio: "Studio · £299/month",
};
export const Route = createFileRoute("/pilot")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan:
      typeof s["plan"] === "string" && s["plan"] in names
        ? (s["plan"] as keyof typeof names)
        : ("founder" as const),
  }),
  head: () =>
    pageHead(
      "/pilot",
      "Pilot access — DeliverX",
      "Choose a paid pilot and prepare your product brief before onboarding.",
    ),
  component: Pilot,
});
function Pilot() {
  const { plan } = Route.useSearch();
  return (
    <MarketingLayout>
      <section className="psi-page-hero">
        <div className="dxl-wrap">
          <p className="dxl-eyebrow">Paid pilot · Preparation only</p>
          <h1 className="dxl-h1">
            Start with
            <br />
            <span className="dxl-grad">a clear scope.</span>
          </h1>
          <p className="psi-lead">
            Selected offer: <strong>{names[plan]}</strong>
          </p>
          <ol className="psi-check-list">
            <li>Prepare and download your product brief; it will not transfer automatically.</li>
            <li>
              Explore account setup separately; creating an account does not activate this offer.
            </li>
            <li>Agree pilot availability, scope and billing before paid work begins.</li>
          </ol>
          <p className="psi-fine-print">
            This page does not submit an access request or charge you. Automated pilot approval and
            billing are not live. Your account does not establish a paid subscription.
          </p>
          <div className="psi-actions">
            <Link to="/resources" hash="brief-builder" className="dxl-btn dxl-btn-primary">
              Prepare my brief
            </Link>
            <Link to="/signup" className="dxl-btn dxl-btn-ghost">
              Create workspace account
            </Link>
            <Link to="/pricing" className="dxl-link">
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
