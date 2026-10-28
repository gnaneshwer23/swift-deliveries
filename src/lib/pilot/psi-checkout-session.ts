/**
 * Pure Checkout Session create params for PSI (Builder/Founder/Studio).
 * Aligns with founder hosted Checkout snippet + Managed Payments:
 * subscription mode, ui_mode hosted_page, price+qty=1, managed_payments.enabled,
 * success/cancel URLs, billing/payment collection flags, origin_context web.
 * Metadata binds workspace/plan for webhook → psi_pilot_activations.
 *
 * Stripe Node SDK 22.0.2 (API 2026-03-25.dahlia) types ui_mode hosted_page,
 * integration_identifier, origin_context, and submit_type; it does not yet type
 * managed_payments (docs require API ≥ 2025-03-31.basil — we already exceed that).
 * @see https://docs.stripe.com/payments/managed-payments/update-checkout
 * @see https://docs.stripe.com/api/checkout/sessions/create
 */
import type Stripe from "stripe";
import { PSI_CATALOG, offerForPlan } from "./psi-catalog";
import type { PilotPlan } from "./model";

/** Stable Dashboard-style identifier from founder hosted Checkout snippet. */
export const PSI_CHECKOUT_INTEGRATION_IDENTIFIER = "hosted_web_0001";

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
};

export function withCheckoutSessionIdPlaceholder(successUrl: string): string {
  if (successUrl.includes("{CHECKOUT_SESSION_ID}")) return successUrl;
  return `${successUrl}${successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Builds hosted Checkout Session params aligned with founder snippet:
 * mode=subscription, ui_mode=hosted_page, line_items[0][price]+quantity=1,
 * billing_address_collection=auto, payment_method_collection=always,
 * allow_promotion_codes=false, submit_type=auto,
 * integration_identifier=hosted_web_0001, origin_context=web,
 * plus managed_payments[enabled]=true (compatible with hosted_page; not mutually exclusive)
 * and DeliverX metadata for webhook → psi_pilot_activations.
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
    ui_mode: "hosted_page",
    line_items: [{ price: input.priceId, quantity: 1 }],
    managed_payments: { enabled: true },
    success_url: withCheckoutSessionIdPlaceholder(input.successUrl),
    cancel_url: input.cancelUrl,
    billing_address_collection: "auto",
    payment_method_collection: "always",
    allow_promotion_codes: false,
    submit_type: "auto",
    integration_identifier: PSI_CHECKOUT_INTEGRATION_IDENTIFIER,
    origin_context: "web",
    client_reference_id: input.userId,
    ...(input.userEmail ? { customer_email: input.userEmail } : {}),
    metadata,
    subscription_data: { metadata },
  };
}
