import { describe, expect, it } from "vitest";
import {
  latestPayment,
  refundRequestMailto,
  refundWindow,
  subscriptionStatusLabel,
  toInvoiceRow,
  type InvoiceRow,
} from "./billing-view";

const PAID_AT = Date.parse("2026-11-01T10:00:00Z") / 1000;

function paid(id: string, paidAtSec: number, amount = 2900): InvoiceRow {
  return toInvoiceRow({
    id,
    number: `DX-${id}`,
    created: paidAtSec - 60,
    amount_paid: amount,
    amount_due: amount,
    currency: "gbp",
    status: "paid",
    status_transitions: { paid_at: paidAtSec },
  })!;
}

describe("billing view", () => {
  it("maps a Stripe invoice and skips one with no id", () => {
    expect(paid("in_1", PAID_AT)).toMatchObject({
      number: "DX-in_1",
      paidAt: "2026-11-01T10:00:00.000Z",
      amountMinor: 2900,
      status: "paid",
    });
    expect(toInvoiceRow({ created: 1, amount_paid: 0, amount_due: 0, currency: "gbp" })).toBe(null);
  });

  it("shows the amount due for an unpaid invoice", () => {
    const row = toInvoiceRow({
      id: "in_open",
      created: PAID_AT,
      amount_paid: 0,
      amount_due: 9900,
      currency: "gbp",
      status: "open",
    })!;
    expect(row.amountMinor).toBe(9900);
    expect(row.paidAt).toBe(null);
  });

  it("takes the latest paid invoice with money taken", () => {
    const rows = [paid("a", PAID_AT - 86_400 * 30), paid("b", PAID_AT), paid("z", PAID_AT + 5, 0)];
    expect(latestPayment(rows)?.id).toBe("b");
  });

  it("keeps the refund window open for 3 days after payment and no longer", () => {
    const rows = [paid("b", PAID_AT)];
    const paidMs = PAID_AT * 1000;
    const inside = refundWindow(rows, paidMs + 3 * 86_400_000 - 1);
    expect(inside.open).toBe(true);
    if (inside.open) expect(inside.closesAt).toBe("2026-11-04T10:00:00.000Z");
    expect(refundWindow(rows, paidMs + 3 * 86_400_000).open).toBe(false);
    expect(refundWindow([], paidMs)).toEqual({ open: false, payment: null, closedAt: null });
  });

  it("builds a refund email with the invoice and amount", () => {
    const href = refundRequestMailto({
      to: "owner@example.com",
      accountEmail: "me@example.com",
      planLabel: "Builder · £29/month",
      payment: paid("b", PAID_AT),
    });
    expect(href.startsWith("mailto:owner@example.com?subject=")).toBe(true);
    const body = decodeURIComponent(href.split("&body=")[1]!);
    expect(body).toContain("Invoice: DX-b");
    expect(body).toContain("Amount: £29.00");
    expect(body).toContain("Account email: me@example.com");
  });

  it("names subscription states in plain words", () => {
    expect(subscriptionStatusLabel("active", false)).toBe("Active");
    expect(subscriptionStatusLabel("active", true)).toBe("Cancels at period end");
    expect(subscriptionStatusLabel("past_due", false)).toBe("Payment overdue");
  });
});
