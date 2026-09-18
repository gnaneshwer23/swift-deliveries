import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createStripeClient,
  getStripeErrorMessage,
  type StripeEnv,
} from "@/lib/stripe.server";

const PRICE_IDS = ["experience_monthly", "launchpad_monthly", "complete_journey_monthly"] as const;
type PriceId = (typeof PRICE_IDS)[number];

type CheckoutResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid user ID");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  const byUserId = found.data[0];
  if (byUserId) return byUserId.id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const byEmail = existing.data[0];
    if (byEmail) {
      if (byEmail.metadata?.userId !== options.userId) {
        await stripe.customers.update(byEmail.id, {
          metadata: { ...byEmail.metadata, userId: options.userId },
        });
      }
      return byEmail.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email ? { email: options.email } : {}),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: PriceId; returnUrl: string; environment: StripeEnv }) => {
    if (!PRICE_IDS.includes(data.priceId)) throw new Error("Unknown plan");
    if (data.environment !== "sandbox" && data.environment !== "live") throw new Error("Invalid environment");
    const url = new URL(data.returnUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Invalid return URL");
    return data;
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId], limit: 1 });
      const stripePrice = prices.data[0];
      if (!stripePrice || stripePrice.type !== "recurring") throw new Error("Plan price not found");

      const { data: authData } = await context.supabase.auth.getUser();
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: authData.user?.email,
        userId: context.userId,
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        metadata: { userId: context.userId, priceId: data.priceId, managed_payments: "true" },
        subscription_data: { metadata: { userId: context.userId, priceId: data.priceId } },
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
