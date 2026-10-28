import { describe, expect, it } from "vitest";
import {
  PSI_CHECKOUT_INTEGRATION_IDENTIFIER,
  buildPsiCheckoutSessionCreateParams,
  withCheckoutSessionIdPlaceholder,
} from "./psi-checkout-session";

describe("withCheckoutSessionIdPlaceholder", () => {
  it("leaves an existing placeholder alone", () => {
    const url = "https://www.deliverx.dev/checkout/return?session_id={CHECKOUT_SESSION_ID}";
    expect(withCheckoutSessionIdPlaceholder(url)).toBe(url);
  });

  it("appends session_id when missing", () => {
    expect(withCheckoutSessionIdPlaceholder("https://www.deliverx.dev/checkout/return")).toBe(
      "https://www.deliverx.dev/checkout/return?session_id={CHECKOUT_SESSION_ID}",
    );
  });

  it("uses & when the URL already has a query", () => {
    expect(withCheckoutSessionIdPlaceholder("https://www.deliverx.dev/checkout/return?x=1")).toBe(
      "https://www.deliverx.dev/checkout/return?x=1&session_id={CHECKOUT_SESSION_ID}",
    );
  });
});

describe("buildPsiCheckoutSessionCreateParams", () => {
  const base = {
    plan: "founder" as const,
    priceId: "price_1UVRjW2X2opf83VZ0E9zN7bi",
    lookupKey: "founder_monthly",
    userId: "user_abc",
    workspaceId: "11111111-1111-4111-8111-111111111111",
    successUrl: "https://www.deliverx.dev/checkout/return?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://www.deliverx.dev/pricing",
  };

  it("matches founder hosted Checkout + Managed Payments shape", () => {
    const params = buildPsiCheckoutSessionCreateParams(base);

    expect(params.mode).toBe("subscription");
    expect(params.ui_mode).toBe("hosted_page");
    expect(params.line_items).toEqual([{ price: base.priceId, quantity: 1 }]);
    expect(params.managed_payments).toEqual({ enabled: true });
    expect(params.success_url).toBe(base.successUrl);
    expect(params.cancel_url).toBe(base.cancelUrl);
    expect(params.billing_address_collection).toBe("auto");
    expect(params.payment_method_collection).toBe("always");
    expect(params.allow_promotion_codes).toBe(false);
    expect(params.submit_type).toBe("auto");
    expect(params.integration_identifier).toBe(PSI_CHECKOUT_INTEGRATION_IDENTIFIER);
    expect(params.integration_identifier).toBe("hosted_web_0001");
    expect(params.origin_context).toBe("web");
    expect(params.client_reference_id).toBe(base.userId);
  });

  it("sets workspace/plan metadata on session and subscription", () => {
    const params = buildPsiCheckoutSessionCreateParams(base);
    const expected = {
      catalog: "psi",
      userId: base.userId,
      workspaceId: base.workspaceId,
      plan: "founder",
      missionAllowance: "4",
      lookupKey: "founder_monthly",
    };
    expect(params.metadata).toEqual(expected);
    expect(params.subscription_data?.metadata).toEqual(expected);
  });

  it("includes customer_email only when provided", () => {
    expect(buildPsiCheckoutSessionCreateParams(base).customer_email).toBeUndefined();
    expect(
      buildPsiCheckoutSessionCreateParams({ ...base, userEmail: "ada@example.com" }).customer_email,
    ).toBe("ada@example.com");
  });

  it("does not set Managed Payments–unsupported tax or payment_method_types", () => {
    const params = buildPsiCheckoutSessionCreateParams(base);
    expect(params.automatic_tax).toBeUndefined();
    expect(params.tax_id_collection).toBeUndefined();
    expect(params.payment_method_types).toBeUndefined();
    expect(params.payment_method_configuration).toBeUndefined();
    expect(params.shipping_address_collection).toBeUndefined();
  });

  it("uses Builder allowance 1 and Studio 12 in metadata", () => {
    expect(
      buildPsiCheckoutSessionCreateParams({
        ...base,
        plan: "builder",
        lookupKey: "builder_monthly",
        priceId: "price_builder",
      }).metadata?.["missionAllowance"],
    ).toBe("1");
    expect(
      buildPsiCheckoutSessionCreateParams({
        ...base,
        plan: "studio",
        lookupKey: "studio_monthly",
        priceId: "price_studio",
      }).metadata?.["missionAllowance"],
    ).toBe("12");
  });
});
