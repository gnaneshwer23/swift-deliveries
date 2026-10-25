import { describe, expect, it } from "vitest";
import { orderAttention, attentionLabel } from "./workspace-attention";
describe("workspace attention", () => {
  it("puts failures and owner decisions ahead of newer ordinary work without mutating records", () => {
    const records = [
      { next: { id: "evidence" }, updatedAt: "2026-10-25" },
      { next: { id: "cancelled" }, updatedAt: "2026-10-26" },
      { next: { id: "decide" }, updatedAt: "2026-10-23" },
      { next: { id: "retry" }, updatedAt: "2026-10-22" },
    ];
    expect(orderAttention(records).map((r) => r.next.id)).toEqual([
      "retry",
      "decide",
      "evidence",
      "cancelled",
    ]);
    expect(records[0]?.next.id).toBe("evidence");
  });
  it("does not call an exported mission a completed outcome", () => {
    expect(attentionLabel("observation")).toBe("Next step");
    expect(attentionLabel("approve_follow_up")).toBe("Your decision");
  });
});
