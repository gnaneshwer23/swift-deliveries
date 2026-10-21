/**
 * Deterministic Budget Enforcement Service (non-agent).
 * DX-149 may advise on cost; this module alone applies the hard ceiling.
 */
export type UsageBudget = {
  ceiling: number;
  consumed: number;
};

export type UsageChargeResult =
  | { ok: true; nextConsumed: number; charged: number }
  | { ok: false; reason: "ceiling_reached"; remaining: number; requested: number };

/** Remaining credits before hard stop. */
export function remainingUsage(budget: UsageBudget): number {
  return Math.max(0, budget.ceiling - budget.consumed);
}

/** Charge billable usage; refuses any charge that would exceed the ceiling. */
export function chargeUsage(
  budget: UsageBudget,
  amount: number,
): UsageChargeResult {
  if (amount <= 0) {
    return { ok: true, nextConsumed: budget.consumed, charged: 0 };
  }
  const remaining = remainingUsage(budget);
  if (amount > remaining) {
    return {
      ok: false,
      reason: "ceiling_reached",
      remaining,
      requested: amount,
    };
  }
  return {
    ok: true,
    nextConsumed: budget.consumed + amount,
    charged: amount,
  };
}

/** Whether another billable step of `amount` can run. */
export function canAfford(budget: UsageBudget, amount: number): boolean {
  return chargeUsage(budget, amount).ok;
}
