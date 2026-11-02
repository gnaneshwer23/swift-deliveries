/**
 * Settings → Billing: what the page shows, built only from the saved activation and what
 * Stripe returns. Nothing here is estimated: a missing value shows as missing.
 */

/** Terms: "If you cancel within 3 days of a payment, we refund that payment in full." */
export const REFUND_WINDOW_DAYS = 3;
const DAY_MS = 86_400_000;

export type InvoiceRow = {
  id: string;
  number: string | null;
  /** ISO time the invoice was created. */
  createdAt: string;
  /** ISO time it was paid, or null if unpaid. */
  paidAt: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
};

/** The parts of a Stripe invoice this page reads. */
export type StripeInvoiceLike = {
  id?: string | null;
  number?: string | null;
  created: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  status_transitions?: { paid_at?: number | null } | null;
};

const iso = (seconds: number) => new Date(seconds * 1000).toISOString();

export function toInvoiceRow(inv: StripeInvoiceLike): InvoiceRow | null {
  if (!inv.id) return null;
  const paidAt = inv.status_transitions?.paid_at ?? null;
  return {
    id: inv.id,
    number: inv.number ?? null,
    createdAt: iso(inv.created),
    paidAt: paidAt ? iso(paidAt) : null,
    amountMinor: inv.status === "paid" ? inv.amount_paid : inv.amount_due,
    currency: inv.currency,
    status: inv.status ?? "unknown",
    hostedUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
  };
}

/** The most recent paid invoice with money taken, if any. */
export function latestPayment(rows: readonly InvoiceRow[]): InvoiceRow | null {
  let best: InvoiceRow | null = null;
  for (const r of rows) {
    if (r.status !== "paid" || !r.paidAt || r.amountMinor <= 0) continue;
    if (!best || Date.parse(r.paidAt) > Date.parse(best.paidAt!)) best = r;
  }
  return best;
}

export type RefundWindow =
  | { open: true; payment: InvoiceRow; closesAt: string }
  | { open: false; payment: InvoiceRow | null; closedAt: string | null };

/** Whether the latest payment is still inside the 3-day full-refund window. */
export function refundWindow(rows: readonly InvoiceRow[], now = Date.now()): RefundWindow {
  const payment = latestPayment(rows);
  if (!payment?.paidAt) return { open: false, payment: null, closedAt: null };
  const closes = Date.parse(payment.paidAt) + REFUND_WINDOW_DAYS * DAY_MS;
  const closesAt = new Date(closes).toISOString();
  return now < closes
    ? { open: true, payment, closesAt }
    : { open: false, payment, closedAt: closesAt };
}

export function formatMoney(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function formatDate(at: string): string {
  return new Date(at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * A refund request is an email the customer sends from their own mail app, so they keep a
 * copy. Refunds are made by hand in Stripe; this only gathers what the owner needs to find
 * the payment.
 */
export function refundRequestMailto(input: {
  to: string;
  accountEmail: string;
  planLabel: string;
  payment: InvoiceRow;
}): string {
  const { payment } = input;
  const subject = `Refund request: ${input.planLabel}${payment.number ? `, invoice ${payment.number}` : ""}`;
  const body = [
    "Hello,",
    "",
    `I'd like to cancel and get a refund under the ${REFUND_WINDOW_DAYS}-day refund terms.`,
    "",
    `Account email: ${input.accountEmail}`,
    `Plan: ${input.planLabel}`,
    `Invoice: ${payment.number ?? payment.id}`,
    `Paid: ${payment.paidAt ? formatDate(payment.paidAt) : "unknown"}`,
    `Amount: ${formatMoney(payment.amountMinor, payment.currency)}`,
    "",
    "Thank you.",
  ].join("\n");
  return `mailto:${input.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Stripe subscription statuses in plain words. */
export function subscriptionStatusLabel(status: string, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd && (status === "active" || status === "trialing")) {
    return "Cancels at period end";
  }
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Payment overdue";
    case "unpaid":
      return "Unpaid";
    case "canceled":
      return "Cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "Payment not completed";
    case "paused":
      return "Paused";
    default:
      return status;
  }
}
