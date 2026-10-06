// Pure helpers for one-off pass fulfilment, shared by the payments webhook and tests.
export const PASS_PRICE_IDS = new Set(["career_sprint_pass"]);
export const PASS_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

export type PassRow = {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  environment: string;
  updated_at: string;
};

/** Returns the subscriptions row for a paid pass checkout, or null when the session is not a pass. */
export function buildPassRow(session: any, environment: string, now = new Date()): PassRow | null {
  if (session?.mode !== "payment") return null;
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId || !PASS_PRICE_IDS.has(priceId)) return null;
  const customer =
    typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
  return {
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
  };
}
