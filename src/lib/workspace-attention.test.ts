import { describe, expect, it } from "vitest";
import { orderAttention, attentionLabel, pickCurrentMission } from "./workspace-attention";
describe("workspace attention", () => {
  it("puts failures and owner decisions ahead of newer ordinary work without mutating records", () => {
    const records = [
      { id: "a", next: { id: "evidence" }, updatedAt: "2026-10-25" },
      { id: "b", next: { id: "cancelled" }, updatedAt: "2026-10-26" },
      { id: "c", next: { id: "decide" }, updatedAt: "2026-10-23" },
      { id: "d", next: { id: "retry" }, updatedAt: "2026-10-22" },
    ];
    expect(orderAttention(records).map((r) => r.next.id)).toEqual([
      "retry",
      "decide",
      "evidence",
      "cancelled",
    ]);
    expect(records[0]?.next.id).toBe("evidence");
  });
  it("breaks equal priority and timestamp ties by record ID", () => {
    const records = ["b", "a"].map((id) => ({
      id,
      next: { id: "evidence" },
      updatedAt: "2026-10-25",
    }));
    expect(orderAttention(records).map((record) => record.id)).toEqual(["a", "b"]);
  });
  it("keeps observation, active comparison and follow-up action labels distinct", () => {
    expect(attentionLabel("recover")).toBe("Comparison in progress");
    expect(attentionLabel("follow_up_approved")).toBe("Follow-up created");
    expect(attentionLabel("observation")).toBe("Next step");
    expect(attentionLabel("approve_follow_up")).toBe("Your decision");
  });
  it("picks the most recently updated open mission as current", () => {
    const records = [
      { id: "old-decide", next: { id: "decide" }, updatedAt: "2026-10-20" },
      { id: "fresh", next: { id: "evidence" }, updatedAt: "2026-10-27" },
      { id: "done", next: { id: "follow_up_approved" }, updatedAt: "2026-10-28" },
    ];
    expect(pickCurrentMission(records)?.id).toBe("fresh");
    expect(
      pickCurrentMission([{ id: "x", next: { id: "cancelled" }, updatedAt: "2026-10-28" }]),
    ).toBeNull();
  });
});
