import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — DeliverX" },
      { name: "description", content: "Open pilot access for Experience, Launchpad and Professional Workspace." },
      { property: "og:title", content: "Pricing — DeliverX" },
      { property: "og:description", content: "Open pilot access for Experience, Launchpad and Professional Workspace." },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Experience",
    tag: "BUILD THE EXPERIENCE",
    description: "Work inside simulated organisations. Your actions create the evidence.",
    features: [
      "Simulated pilot organisations",
      "Evidence ledger entries per task",
      "Immutable artefact versions",
      "Judged against a versioned framework",
    ],
  },
  {
    name: "Launchpad",
    tag: "LAND THE OPPORTUNITY",
    description: "Turn judged evidence into an explainable readiness story.",
    features: [
      "Readiness surfaces from real evidence",
      "Shareable, tokenised portfolio",
      "Honest labelling — heuristic or judged",
      "Attestation pathway to Verified",
    ],
  },
  {
    name: "Professional Workspace",
    tag: "SUCCEED IN THE ROLE",
    description: "Carry the same evidence discipline into live work with your team.",
    features: [
      "Organisation and team invitations",
      "Observed work contributions",
      "Consent-off observation by default",
      "Private-by-default evidence",
    ],
  },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <section className="section-sm">
        <div className="container">
          <span className="mono-label">Pricing</span>
          <h1 className="heading-1" style={{ marginTop: 16, maxWidth: 520 }}>
            Pilot access is open
          </h1>
          <p className="body-large" style={{ marginTop: 16, maxWidth: 560 }}>
            All three products are free while in pilot. We'll introduce paid plans as the platform
            matures, with generous free tiers for individuals.
          </p>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.name} className="card flex flex-col" style={{ padding: 28 }}>
                <span className="mono-label">{t.tag}</span>
                <h2 className="heading-2" style={{ marginTop: 10 }}>
                  {t.name}
                </h2>
                <p className="body" style={{ marginTop: 6 }}>
                  {t.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span style={{ fontSize: 32, fontWeight: 800 }}>Free</span>
                  <span className="caption">during pilot</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--x-teal)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/pilot" className="btn btn-primary mt-8 w-full justify-center">
                  Join the pilot
                </Link>
              </div>
            ))}
          </div>

          <p className="caption mt-10 text-center">
            No card required. No payment gate during pilot. Your evidence stays yours.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}
