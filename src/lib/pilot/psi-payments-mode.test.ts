import { describe, expect, it } from "vitest";
import { resolvePsiPaymentsMode } from "./psi-payments-mode";

describe("resolvePsiPaymentsMode", () => {
  it("refuses when kill switch is on", () => {
    const result = resolvePsiPaymentsMode({
      PSI_PAYMENTS_KILL_SWITCH: "true",
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_test_x",
      STRIPE_SANDBOX_API_KEY: "rk_test_x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.toLowerCase()).toContain("kill switch");
  });

  it("refuses when checkout flag is off", () => {
    const result = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_test_x",
      STRIPE_SANDBOX_API_KEY: "rk_test_x",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Checkout is not live.");
  });

  it("uses sandbox when not live-approved", () => {
    const result = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_test_abc",
      STRIPE_SANDBOX_API_KEY: "rk_test_abc",
    });
    expect(result).toEqual({ ok: true, environment: "sandbox" });
  });

  it("refuses pk_live_ without live approval", () => {
    const result = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_live_abc",
      STRIPE_LIVE_API_KEY: "rk_live_abc",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message.toLowerCase()).toContain("not approved");
  });

  it("requires live keys once approved — no sandbox fallback", () => {
    const missingLive = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      PSI_PAYMENTS_LIVE_APPROVED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_live_abc",
      STRIPE_SANDBOX_API_KEY: "rk_test_abc",
    });
    expect(missingLive.ok).toBe(false);
    if (!missingLive.ok) expect(missingLive.message).toMatch(/STRIPE_LIVE_API_KEY/);

    const wrongPublishable = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      PSI_PAYMENTS_LIVE_APPROVED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_test_abc",
      STRIPE_LIVE_API_KEY: "rk_live_abc",
    });
    expect(wrongPublishable.ok).toBe(false);
    if (!wrongPublishable.ok) expect(wrongPublishable.message).toMatch(/pk_live_/);

    const live = resolvePsiPaymentsMode({
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      PSI_PAYMENTS_LIVE_APPROVED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: "pk_live_abc",
      STRIPE_LIVE_API_KEY: "rk_live_abc",
    });
    expect(live).toEqual({ ok: true, environment: "live" });
  });
});
