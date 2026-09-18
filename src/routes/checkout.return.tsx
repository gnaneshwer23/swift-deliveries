import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    ...(typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Payment status — DeliverX" },
      { name: "description", content: "Review your DeliverX payment status and continue to your workspace." },
      { property: "og:title", content: "Payment status — DeliverX" },
      { property: "og:description", content: "Review your DeliverX payment status and continue to your workspace." },
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
          <h1 className="heading-1 mt-5">{sessionId ? "Payment received" : "Payment status unavailable"}</h1>
          <p className="body-large mt-4">
            {sessionId
              ? "Your access is being updated. Continue to your workspace to get started."
              : "We could not confirm a completed checkout from this page."}
          </p>
          <Link to="/workspace" className="btn btn-primary mt-8 inline-flex">Continue to workspace</Link>
        </div>
      </section>
    </MarketingLayout>
  );
}
