import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { useSession } from "@/hooks/use-session";
import "@/styles/product-intelligence.css";

const TITLE = "Welcome to DeliverX";
const DESCRIPTION =
  "Tell us about your idea. Our AI product team will investigate it and bring you a clear plan.";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: `${TITLE} — DeliverX` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://www.deliverx.dev/welcome" }],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { user, loading } = useSession();
  const nextTo = user ? "/command" : "/signup";
  const nextLabel = user ? "Describe my idea" : "Describe my idea";

  return (
    <MarketingLayout>
      <div className="dx-pi dx-pi-nav-dark">
        <section className="dx-pi-welcome" aria-labelledby="dx-welcome-title">
          <div className="dx-pi-welcome-card">
            <p className="dx-pi-eyebrow">Getting started</p>
            <h1 id="dx-welcome-title">Welcome to DeliverX</h1>
            <p>{DESCRIPTION}</p>
            <ul className="dx-pi-trust-list">
              <li>
                <strong>You stay in control of major decisions</strong>
                <span>Agents propose. You approve consequential choices.</span>
              </li>
              <li>
                <strong>Plain-language PM updates</strong>
                <span>Findings, assumptions and recommendations stay distinct.</span>
              </li>
              <li>
                <strong>Traceable decisions</strong>
                <span>Evidence and approvals remain on the mission record.</span>
              </li>
            </ul>
            {loading ? (
              <span className="dx-pi-btn dx-pi-btn-primary" aria-busy="true">
                Preparing…
              </span>
            ) : (
              <Link to={nextTo} className="dx-pi-btn dx-pi-btn-primary">
                {nextLabel} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
            <p className="dx-pi-welcome-note">
              You can edit your idea before the investigation is complete.
            </p>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}
