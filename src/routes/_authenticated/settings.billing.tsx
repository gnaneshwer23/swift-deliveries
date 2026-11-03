import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/components/settings/billing-page";
import type { AppUser } from "@/lib/auth/client";

export const Route = createFileRoute("/_authenticated/settings/billing")({
  head: () => ({
    meta: [{ title: "Billing — Settings — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: Billing,
});

function Billing() {
  const { user } = Route.useRouteContext() as { user: AppUser };
  return <BillingPage accountEmail={user.email ?? ""} />;
}
