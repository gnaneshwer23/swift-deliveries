/** Customer-facing statements for the manual pilot. No reply-time promise. */
export const PUBLISHED_OPERATOR_EMAIL = "gnaneshwer.jadav@gmail.com";

export const ACCOUNT_DOES_NOT_ACTIVATE =
  "Creating an account is free and does not activate a paid pilot.";

export const MANUAL_ACTIVATION_COPY =
  "Activation is manual. An authorised operator records one scoped plan and a mission allowance for one workspace. That record does not mean a payment was taken.";

export const CHECKOUT_NOT_LIVE_COPY = "Checkout is not live.";

export const CHECKOUT_SANDBOX_COPY =
  "Sandbox checkout is available for testing with Stripe test cards. This is not live billing.";

export const CHECKOUT_LIVE_COPY =
  "Self-serve checkout is live. Real cards are charged. Entitlements are granted only after Stripe confirms payment via webhook.";

export const ALLOWANCE_EXHAUSTED_COPY =
  "When the mission allowance is used, the next billable comparison in that workspace is blocked. The mission record stays readable and the work is not deleted. Another workspace is not affected.";

export const SUPPORT_RECOVERY_COPY = `If a request fails or you need the record reviewed, email ${PUBLISHED_OPERATOR_EMAIL}. An authorised operator can read a stored enquiry. There is no promised reply time.`;

/**
 * Pricing honesty: “not live” until checkout is on; sandbox labelled until
 * the build uses pk_live_ (live copy only then — never while sandbox keys ship).
 */
export function pricingCheckoutCopy(input: {
  checkoutEnabled: boolean;
  sandbox: boolean;
  live?: boolean;
}): string {
  if (!input.checkoutEnabled) return CHECKOUT_NOT_LIVE_COPY;
  if (input.sandbox) return CHECKOUT_SANDBOX_COPY;
  if (input.live) return CHECKOUT_LIVE_COPY;
  return CHECKOUT_NOT_LIVE_COPY;
}
