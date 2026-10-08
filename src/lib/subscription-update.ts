// Pure guard for subscription webhook updates, shared by the payments webhook and tests.
// Stripe does not guarantee event ordering: a stale "active" event can arrive after a
// newer "canceled" one. Without a guard, the late event would restore access.

export type SubscriptionState = {
  status: string;
  current_period_end: string | null;
};

/**
 * Returns true when an incoming webhook update should be applied over the stored row.
 * An update is stale — and must be skipped — when its period end is earlier than the
 * period end already stored: the stored row reflects a newer state of the subscription.
 * Rows without a stored period end (or incoming events without one) are always applied,
 * since there is no ordering signal to compare.
 */
export function shouldApplySubscriptionUpdate(
  existing: SubscriptionState | null,
  incoming: SubscriptionState,
): boolean {
  if (!existing) return true;
  if (!existing.current_period_end || !incoming.current_period_end) return true;
  return new Date(incoming.current_period_end).getTime() >= new Date(existing.current_period_end).getTime();
}
