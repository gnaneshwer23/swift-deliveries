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
      { name: "description", content: "Experience £19, Launchpad £19 and the Complete Journey £29 per month. Cancel any time." },
      { property: "og:title", content: "Pricing — DeliverX" },
      { property: "og:description", content: "Experience £19, Launchpad £19 and the Complete Journey £29 per month. Cancel any time." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://deliverx.dev/pricing" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://deliverx.dev/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "DeliverX plans",
          itemListElement: [
            { name: "Experience", price: "19.00" },
            { name: "Launchpad", price: "19.00" },
            { name: "Complete Journey", price: "29.00" },
          ].map((plan, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: `DeliverX ${plan.name}`,
              url: "https://deliverx.dev/pricing",
              brand: { "@type": "Brand", name: "DeliverX" },
              offers: {
                "@type": "Offer",
                price: plan.price,
                priceCurrency: "GBP",
                url: "https://deliverx.dev/pricing",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }),
      },
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
      "Realistic simulated organisations",
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
      "Shareable portfolio on links you create and revoke",
      "Honest labelling — heuristic or judged",
      "Attestation pathway to Verified",
    ],
  },
  {
    name: "Complete Journey",
    tag: "BUILD, LAND, SUCCEED",
    description: "Experience and Launchpad, plus the individual Workspace for live delivery.",
    price: "£29",
    priceId: "complete_journey_monthly" as CheckoutPriceId,
    features: [
      "Everything in Experience and Launchpad",
      "Individual Workspace for live product work",
      "Observation off by default — you consent first",
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
          <h1 className="heading-1" style={{ marginTop: 16, maxWidth: 520 }}>DeliverX plans and pricing</h1>
          <p className="body-large" style={{ marginTop: 16, maxWidth: 560 }}>
            Build practical experience, turn it into career intelligence, or follow the complete journey.
          </p>

          <div className="card mt-8 flex items-start gap-3" style={{ padding: "18px 22px" }}>
            <Check className="mt-1 size-4 shrink-0" style={{ color: "var(--x-teal)" }} />
            <p className="text-sm">
              <strong>Start free.</strong> Create an account and begin your first scenario in
              Experience today — no card needed. Pay only when you want the full journey.
            </p>
          </div>

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

          <h2 className="heading-2 mt-16">Prefer not to subscribe?</h2>
          <p className="body mt-3" style={{ maxWidth: 560 }}>
            One-off ways to take the Complete Journey. No renewal you did not choose.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="card flex flex-col" style={{ padding: 28 }}>
              <span className="mono-label">ONE-OFF · NO RENEWAL</span>
              <h3 className="heading-2" style={{ marginTop: 10 }}>Career Sprint</h3>
              <p className="body" style={{ marginTop: 6 }}>
                Three months of the Complete Journey, paid once. Built around an active job search.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span style={{ fontSize: 32, fontWeight: 800 }}>£69</span>
                <span className="caption">one payment · 3 months</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                <li>Everything in Complete Journey for 3 months</li>
                <li>No renewal and nothing to cancel</li>
                <li>Save £18 versus three monthly payments</li>
              </ul>
              {isCheckoutEnabled ? (
                user ? (
                  <Button className="mt-8 w-full" onClick={() => setSelectedPrice("career_sprint_pass")}>
                    Buy the Career Sprint
                  </Button>
                ) : (
                  <Button asChild className="mt-8 w-full">
                    <Link to="/login" search={{ redirect: "/pricing" }}>Sign in to buy</Link>
                  </Button>
                )
              ) : (
                <Link to="/signup" className="btn btn-primary mt-8 w-full justify-center">
                  Create account
                </Link>
              )}
            </div>
            <div className="card flex flex-col" style={{ padding: 28 }}>
              <span className="mono-label">ANNUAL · COMPLETE JOURNEY</span>
              <h3 className="heading-2" style={{ marginTop: 10 }}>Journey Annual</h3>
              <p className="body" style={{ marginTop: 6 }}>
                Twelve months of the Complete Journey for the price of ten.
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span style={{ fontSize: 32, fontWeight: 800 }}>£290</span>
                <span className="caption">per year</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                <li>Everything in Complete Journey for a full year</li>
                <li>Two months free versus paying monthly</li>
                <li>Renews yearly; cancel any time</li>
              </ul>
              {isCheckoutEnabled ? (
                user ? (
                  <Button className="mt-8 w-full" onClick={() => setSelectedPrice("complete_journey_yearly")}>
                    Choose the annual plan
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
          </div>

          {!isCheckoutEnabled && (
            <p className="caption mt-10 text-center">
              Checkout is temporarily unavailable. Create an account and you can subscribe from your
              workspace.

            </p>
          )}

          <p className="caption mt-10 text-center" style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Running a team or sponsoring delivery? The Professional Workspace for organisations is
            separate — from £750 per active project per month.{" "}
            <Link to="/professional-workspace" className="underline">
              See the Workspace
            </Link>
            .
          </p>

          <div className="card mt-14" style={{ padding: 28 }}>
            <span className="mono-label">What we do not promise</span>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <strong>No money-back guarantee.</strong> Paid subscriptions can be cancelled at any
                time; access runs to the end of the period you've paid for.
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
                attester.
              </li>
            </ul>
          </div>
        </div>
      </section>


      <Dialog open={selectedPrice !== null} onOpenChange={(open) => !open && setSelectedPrice(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          <PaymentTestModeBanner />
          <DialogHeader className="px-6 pt-2">
            <DialogTitle>Complete your purchase</DialogTitle>
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
