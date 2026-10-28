/**
 * Pure Checkout Session create params for PSI (Builder/Founder/Studio).
 * Matches founder Managed Payments curl shape: subscription mode, price+qty=1,
 * managed_payments.enabled, success/cancel URLs. Metadata binds workspace/plan.
 *
 * Stripe Node SDK 22.0.2 (API 2026-03-25.dahlia) does not yet type
 * `managed_payments`; docs require API ≥ 2025-03-31.basil (we already exceed that).
 * @see https://docs.stripe.com/payments/managed-payments/update-checkout
 */
import type Stripe from "stripe";
import { PSI_CATALOG, offerForPlan } from "./psi-catalog";
import type { PilotPlan } from "./model";

/** SDK intersection until stripe types include Managed Payments. */
export type PsiCheckoutSessionCreateParams = Stripe.Checkout.SessionCreateParams & {
  managed_payments?: { enabled: boolean };
};

export type BuildPsiCheckoutSessionParamsInput = {
  plan: PilotPlan;
  priceId: string;
  lookupKey: string;
  userId: string;
  workspaceId: string;
  userEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
  /** Deterministic suffix for tests; production passes a random 8-letter token. */
  integrationSuffix: string;
};

export function withCheckoutSessionIdPlaceholder(successUrl: string): string {
  if (successUrl.includes("{CHECKOUT_SESSION_ID}")) return successUrl;
  return `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Builds hosted Checkout Session params aligned with:
 * mode=subscription, line_items[0][price]+quantity=1, managed_payments[enabled]=true,
 * success_url / cancel_url, plus DeliverX metadata for webhook → psi_pilot_activations.
 */
export function buildPsiCheckoutSessionCreateParams(
  input: BuildPsiCheckoutSessionParamsInput,
): PsiCheckoutSessionCreateParams {
  const offer = offerForPlan(input.plan);
  const metadata = {
    catalog: PSI_CATALOG,
    userId: input.userId,
    workspaceId: input.workspaceId,
    plan: input.plan,
    missionAllowance: String(offer.missionAllowance),
    lookupKey: input.lookupKey,
  };

  return {
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    managed_payments: { enabled: true },
    success_url: withCheckoutSessionIdPlaceholder(input.successUrl),
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    ...(input.userEmail ? { customer_email: input.userEmail } : {}),
    metadata,
    subscription_data: { metadata },
    integration_identifier: `psi_checkout_${input.integrationSuffix}`,
  };
}
