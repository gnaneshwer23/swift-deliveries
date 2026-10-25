/** Attention order is derived from saved next actions, never an inferred completion score. */
export function attentionPriority(nextId: string): number {
  if (nextId === "retry") return 0;
  if (nextId === "decide" || nextId === "approve_follow_up") return 1;
  if (nextId === "recover") return 2;
  if (nextId === "cancelled" || nextId === "follow_up_approved") return 4;
  return 3;
}
export function attentionLabel(nextId: string): string {
  if (nextId === "retry") return "Needs attention";
  if (nextId === "decide" || nextId === "approve_follow_up") return "Your decision";
  if (nextId === "recover") return "Comparison in progress";
  if (nextId === "cancelled") return "Cancelled";
  if (nextId === "follow_up_approved") return "Follow-up created";
  return "Next step";
}
export function orderAttention<T extends { id: string; next: { id: string }; updatedAt: string }>(
  records: T[],
): T[] {
  return [...records].sort(
    (a, b) =>
      attentionPriority(a.next.id) - attentionPriority(b.next.id) ||
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.id.localeCompare(b.id),
  );
}
