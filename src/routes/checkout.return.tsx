import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { isLiveCheckout, isSandboxCheckout } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    ...(typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Payment status — DeliverX" },
      {
        name: "description",
        content: "Review your DeliverX payment status and continue to Studio.",
      },
      { property: "og:title", content: "Payment status — DeliverX" },
      {
        property: "og:description",
        content: "Review your DeliverX payment status and continue to Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutReturnPage,
});

function CheckoutReturnPage() {
  const { session_id: sessionId } = Route.useSearch();
  return (
    <MarketingLayout>
      <section className="section-sm">
        <div className="container max-w-2xl">
          <CheckCircle2 className="size-9 text-primary" aria-hidden="true" />
          <h1 className="heading-1 mt-5">
            {sessionId ? "Checkout submitted" : "Payment status unavailable"}
          </h1>
          <p className="body-large mt-4">
            {sessionId
              ? "This page does not grant access. Entitlement is written only after Stripe confirms payment via webhook. Open Studio in a moment to see your plan and remaining missions."
              : "We could not confirm a completed checkout from this page."}
          </p>
          {isSandboxCheckout ? (
            <p className="body-large mt-3">Sandbox mode — test cards only; not live billing.</p>
          ) : isLiveCheckout ? (
            <p className="body-large mt-3">
              Live mode — entitlement appears in Studio only after the webhook confirms payment.
            </p>
          ) : null}
          <Link to="/command" className="btn btn-primary mt-8 inline-flex">
            Continue to Studio
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
