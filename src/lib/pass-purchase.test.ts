import { describe, expect, it } from "vitest";
import { buildPassRow, PASS_DURATION_MS } from "./pass-purchase";

const session = {
  id: "cs_test_1",
  mode: "payment",
  customer: "cus_1",
  metadata: { userId: "u1", priceId: "career_sprint_pass", productId: "prod_cj" },
};

describe("buildPassRow", () => {
  it("records a Career Sprint purchase as an active pass ending in 90 days", () => {
    const now = new Date("2026-10-06T12:00:00Z");
    const row = buildPassRow(session, "sandbox", now)!;
    expect(row).toMatchObject({
      user_id: "u1",
      price_id: "career_sprint_pass",
      status: "active",
      environment: "sandbox",
      stripe_subscription_id: "cs_test_1",
    });
    expect(new Date(row.current_period_end).getTime() - now.getTime()).toBe(PASS_DURATION_MS);
    expect(row.current_period_end).toBe("2027-01-04T12:00:00.000Z");
  });

  it("ignores subscription checkouts such as Journey Annual (saved by subscription events)", () => {
    expect(
      buildPassRow({ ...session, mode: "subscription", metadata: { userId: "u1", priceId: "complete_journey_yearly" } }, "live"),
    ).toBeNull();
  });

  it("ignores unknown prices and missing users", () => {
    expect(buildPassRow({ ...session, metadata: { userId: "u1", priceId: "other" } }, "live")).toBeNull();
    expect(buildPassRow({ ...session, metadata: { priceId: "career_sprint_pass" } }, "live")).toBeNull();
  });
});
