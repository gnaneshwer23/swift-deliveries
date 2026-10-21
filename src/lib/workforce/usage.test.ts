import { describe, expect, it } from "vitest";
import { canAfford, chargeUsage, remainingUsage } from "./usage";

describe("usage ceiling", () => {
  it("tracks remaining credits", () => {
    expect(remainingUsage({ ceiling: 100, consumed: 40 })).toBe(60);
  });

  it("charges when under the ceiling", () => {
    const result = chargeUsage({ ceiling: 100, consumed: 90 }, 10);
    expect(result).toEqual({ ok: true, nextConsumed: 100, charged: 10 });
  });

  it("hard-stops when a charge would exceed the ceiling", () => {
    const result = chargeUsage({ ceiling: 100, consumed: 95 }, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("ceiling_reached");
      expect(result.remaining).toBe(5);
    }
    expect(canAfford({ ceiling: 100, consumed: 95 }, 10)).toBe(false);
  });
});
