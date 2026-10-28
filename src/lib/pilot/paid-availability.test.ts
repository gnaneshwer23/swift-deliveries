import { describe, expect, it } from "vitest";
import {
  assertCanStartInvestigation,
  INVESTIGATION_ALLOWANCE_EXHAUSTED,
  isInvestigationPaidAvailable,
} from "./paid-availability";

describe("P-paid Investigation availability", () => {
  it("treats checkout flag as paid-available", () => {
    expect(isInvestigationPaidAvailable({ VITE_PAYMENTS_CHECKOUT_ENABLED: "true" })).toBe(true);
    expect(isInvestigationPaidAvailable({ VITE_PAYMENTS_CHECKOUT_ENABLED: "false" })).toBe(false);
    expect(isInvestigationPaidAvailable({})).toBe(false);
  });

  it("allows start without an activation (demo workspace)", () => {
    expect(assertCanStartInvestigation(null)).toEqual({ ok: true });
  });

  it("allows start when Investigations remain", () => {
    expect(
      assertCanStartInvestigation({
        remaining: 2,
        missionAllowance: 4,
        missionsConsumed: 2,
      }),
    ).toEqual({ ok: true });
  });

  it("blocks start when Investigation allowance is exhausted", () => {
    const result = assertCanStartInvestigation({
      remaining: 0,
      missionAllowance: 1,
      missionsConsumed: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(INVESTIGATION_ALLOWANCE_EXHAUSTED);
  });
});
