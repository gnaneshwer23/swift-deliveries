import { describe, expect, it } from "vitest";
import { shouldApplySubscriptionUpdate } from "./subscription-update";

describe("shouldApplySubscriptionUpdate", () => {
  it("applies the first event for a subscription", () => {
    expect(shouldApplySubscriptionUpdate(null, { status: "active", current_period_end: "2026-11-08T00:00:00Z" })).toBe(true);
  });

  it("applies an in-order update with a newer period end", () => {
    const existing = { status: "active", current_period_end: "2026-11-08T00:00:00Z" };
    const renewal = { status: "active", current_period_end: "2026-12-08T00:00:00Z" };
    expect(shouldApplySubscriptionUpdate(existing, renewal)).toBe(true);
  });

  it("applies a cancellation for the current period (same period end)", () => {
    const existing = { status: "active", current_period_end: "2026-11-08T00:00:00Z" };
    const canceled = { status: "canceled", current_period_end: "2026-11-08T00:00:00Z" };
    expect(shouldApplySubscriptionUpdate(existing, canceled)).toBe(true);
  });

  it("rejects a late active event that would restore a canceled subscription", () => {
    // The cancellation for period ending 2026-12-08 was stored first; a stale
    // "active" event from the previous period arrives afterwards.
    const existing = { status: "canceled", current_period_end: "2026-12-08T00:00:00Z" };
    const staleActive = { status: "active", current_period_end: "2026-11-08T00:00:00Z" };
    expect(shouldApplySubscriptionUpdate(existing, staleActive)).toBe(false);
  });

  it("rejects a late past_due event that would overwrite a newer active state", () => {
    const existing = { status: "active", current_period_end: "2026-12-08T00:00:00Z" };
    const stalePastDue = { status: "past_due", current_period_end: "2026-11-08T00:00:00Z" };
    expect(shouldApplySubscriptionUpdate(existing, stalePastDue)).toBe(false);
  });

  it("applies updates when either side has no period end to compare", () => {
    expect(shouldApplySubscriptionUpdate({ status: "active", current_period_end: null }, { status: "active", current_period_end: "2026-11-08T00:00:00Z" })).toBe(true);
    expect(shouldApplySubscriptionUpdate({ status: "past_due", current_period_end: "2026-11-08T00:00:00Z" }, { status: "active", current_period_end: null })).toBe(true);
  });

  it("rejects a late same-period active event after a cancellation", () => {
    const existing = { status: "canceled", current_period_end: "2026-11-08T00:00:00Z" };
    const lateActive = { status: "active", current_period_end: "2026-11-08T00:00:00Z" };
    expect(shouldApplySubscriptionUpdate(existing, lateActive)).toBe(false);
  });
});
