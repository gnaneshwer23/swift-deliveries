import { createFileRoute } from "@tanstack/react-router";
import type { StripeEnv } from "@/lib/stripe.server";
import { verifyWebhook } from "@/lib/stripe.server";

function getPriceId(subscription: any): string | undefined {
  const price = subscription.items?.data?.[0]?.price;
  return price?.lookup_key || price?.metadata?.lovable_external_id || price?.id;
}

async function upsertSubscription(subscription: any, environment: StripeEnv) {
  const userId = subscription.metadata?.userId;
  const priceId = getPriceId(subscription);
  const item = subscription.items?.data?.[0];
  if (!userId || !priceId || !item) throw new Error("Subscription is missing access metadata");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const periodStart = item.current_period_start ?? subscription.current_period_start;
  const periodEnd = item.current_period_end ?? subscription.current_period_end;
  const { error } = await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
    product_id: typeof item.price.product === "string" ? item.price.product : item.price.product?.id,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    environment,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id,environment" });
  if (error) throw error;
}

const PASS_PRICE_IDS = new Set(["career_sprint_pass"]);
const PASS_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

// One-off passes (e.g. the Career Sprint) never fire subscription webhooks,
// so the completed checkout session is the fulfilment record.
async function upsertPassPurchase(session: any, environment: StripeEnv) {
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId || !PASS_PRICE_IDS.has(priceId)) return;
  const customer =
    typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
  const now = new Date();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: session.id,
      stripe_customer_id: customer,
      product_id: session.metadata?.productId ?? "complete_journey_plan",
      price_id: priceId,
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + PASS_DURATION_MS).toISOString(),
      cancel_at_period_end: false,
      environment,
      updated_at: now.toISOString(),
    },
    { onConflict: "stripe_subscription_id,environment" },
  );
  if (error) throw error;
}

async function setSubscriptionStatus(subscription: any, environment: StripeEnv, status: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("subscriptions").update({
    status,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id).eq("environment", environment);
  if (error) throw error;
}

async function handleWebhook(request: Request, environment: StripeEnv) {
  const event = await verifyWebhook(request, environment);
  const object = event.data.object;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    if (object.payment_status !== "unpaid") await upsertPassPurchase(object, environment);
    return;
  }
  if (["customer.subscription.created", "customer.subscription.updated", "subscription.created", "subscription.updated"].includes(event.type)) {
    await upsertSubscription(object, environment);
    return;
  }
  if (["customer.subscription.deleted", "subscription.canceled"].includes(event.type)) {
    await setSubscriptionStatus(object, environment, "canceled");
    return;
  }
  if (["invoice.payment_failed", "transaction.payment_failed"].includes(event.type)) {
    const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
    if (subscriptionId) await setSubscriptionStatus({ id: subscriptionId }, environment, "past_due");
    const { recordMonitoringEvent } = await import("@/lib/monitoring.server");
    await recordMonitoringEvent({
      kind: "payment_failure",
      severity: "critical",
      source: "payments_webhook",
      message: `Payment failed (${event.type})`,
      userId: object.metadata?.userId ?? undefined,
      detail: {
        environment,
        subscriptionId: subscriptionId ?? null,
        customer: typeof object.customer === "string" ? object.customer : (object.customer?.id ?? null),
        amountDue: object.amount_due ?? null,
        currency: object.currency ?? null,
      },
    });
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnvironment = new URL(request.url).searchParams.get("env");
        if (rawEnvironment !== "sandbox" && rawEnvironment !== "live") {
          return Response.json({ received: true, ignored: "invalid environment" });
        }
        try {
          await handleWebhook(request, rawEnvironment);
          return Response.json({ received: true });
        } catch (error) {
          console.error("Payment webhook error", error);
          const { recordMonitoringEvent, describeUnknownError } = await import("@/lib/monitoring.server");
          const described = describeUnknownError(error);
          await recordMonitoringEvent({
            kind: "payment_failure",
            severity: "critical",
            source: "payments_webhook",
            message: `Webhook could not be processed: ${described.message}`,
            detail: { ...described.detail, environment: rawEnvironment },
          });
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
