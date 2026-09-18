import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentTestModeBanner } from "@/components/payments/payment-test-mode-banner";
import {
  StripeEmbeddedCheckout,
  type CheckoutPriceId,
} from "@/components/payments/stripe-embedded-checkout";
import { isCheckoutEnabled } from "@/lib/stripe";
import { useSession } from "@/hooks/use-session";

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
    price: "£19",
    priceId: "experience_monthly" as CheckoutPriceId,
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
    price: "£19",
    priceId: "launchpad_monthly" as CheckoutPriceId,
    features: [
      "Readiness surfaces from real evidence",
      "Shareable, tokenised portfolio",
      "Honest labelling — heuristic or judged",
      "Attestation pathway to Verified",
    ],
  },
  {
    name: "Complete Journey",
    tag: "BUILD, LAND, SUCCEED",
    description: "Experience and Launchpad, plus the Professional Workspace for live delivery.",
    price: "£29",
    priceId: "complete_journey_monthly" as CheckoutPriceId,
    features: [
      "Organisation and team invitations",
      "Observed work contributions",
      "Consent-off observation by default",
      "Private-by-default evidence",
    ],
  },
];

function PricingPage() {
  const { user } = useSession();
  const [selectedPrice, setSelectedPrice] = useState<CheckoutPriceId | null>(null);

  return (
    <MarketingLayout>
      <section className="section-sm">
        <div className="container">
          <span className="mono-label">Pricing</span>
          <h1 className="heading-1" style={{ marginTop: 16, maxWidth: 520 }}>Choose your route</h1>
          <p className="body-large" style={{ marginTop: 16, maxWidth: 560 }}>
            Build practical experience, turn it into career intelligence, or follow the complete journey.
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
                   <span style={{ fontSize: 32, fontWeight: 800 }}>{t.price}</span>
                   <span className="caption">per month</span>
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--x-teal)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCheckoutEnabled ? (
                  user ? (
                    <Button className="mt-8 w-full" onClick={() => setSelectedPrice(t.priceId)}>
                      Choose {t.name}
                    </Button>
                  ) : (
                    <Button asChild className="mt-8 w-full">
                      <Link to="/login" search={{ redirect: "/pricing" }}>Sign in to choose</Link>
                    </Button>
                  )
                ) : (
                  <Link to="/signup" className="btn btn-primary mt-8 w-full justify-center">
                    Create account
                  </Link>

                )}
              </div>
            ))}
          </div>

          {!isCheckoutEnabled && (
            <p className="caption mt-10 text-center">
              Checkout is not yet open. Pilot access remains available without a card.
            </p>
          )}

          <div className="card mt-14" style={{ padding: 28 }}>
            <span className="mono-label">What we do not promise</span>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <strong>No money-back guarantee.</strong> Paid subscriptions can be cancelled at any
                time; cancellation takes effect immediately.
              </li>
              <li>
                <strong>No job guarantee.</strong> We stand behind the quality of the work, the
                evidence and the tooling — not that any employer will invite you to interview.
              </li>
              <li>
                <strong>No employer marketplace.</strong> We do not sell your record or list you to
                recruiters. Portfolios are shared only on links you create and can revoke.
              </li>
              <li>
                <strong>No score without a method.</strong> Capability judgements cite the evidence
                they used and explain the level. A Verified claim needs a named independent
                attestor.
              </li>
            </ul>
          </div>
        </div>
      </section>


      <Dialog open={selectedPrice !== null} onOpenChange={(open) => !open && setSelectedPrice(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          <PaymentTestModeBanner />
          <DialogHeader className="px-6 pt-2">
            <DialogTitle>Complete your subscription</DialogTitle>
            <DialogDescription>Payment details are handled securely.</DialogDescription>
          </DialogHeader>
          <div className="px-2 pb-4 sm:px-6">
            {selectedPrice && <StripeEmbeddedCheckout priceId={selectedPrice} />}
          </div>
        </DialogContent>
      </Dialog>
    </MarketingLayout>
  );
}
