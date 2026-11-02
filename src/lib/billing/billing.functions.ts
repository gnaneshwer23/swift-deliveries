/**
 * Settings → Billing, server side. Reads the signed-in owner's own activation, then asks
 * Stripe for that customer's subscription and invoices. Nothing is written here: refunds stay
 * a manual owner action in Stripe, and plan changes and cancelling go through Stripe's portal.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { isPilotPlan, type PilotPlan } from "@/lib/pilot/model";
import { offerForPlan } from "@/lib/pilot/psi-catalog";
import { currentRequestHostname, isAllowedReturnUrl } from "@/lib/pilot/return-url";
import type { StripeEnv } from "@/lib/stripe.server";
import {
  refundWindow,
  subscriptionStatusLabel,
  toInvoiceRow,
  type InvoiceRow,
  type RefundWindow,
  type StripeInvoiceLike,
} from "./billing-view";

export type BillingSubscription = {
  status: string;
  statusLabel: string;
  cancelAtPeriodEnd: boolean;
  /** ISO end of the current paid period, when Stripe reports one. */
  periodEnd: string | null;
};

export type BillingView =
  | { state: "unavailable" }
  | { state: "none" }
  | {
      state: "pilot" | "paid";
      plan: PilotPlan;
      planLabel: string;
      amountGbp: number;
      allowance: number;
      consumed: number;
      remaining: number;
      environment: StripeEnv | null;
      hasCustomer: boolean;
      subscription: BillingSubscription | null;
      invoices: InvoiceRow[];
      /** False when the invoice list itself could not be read. */
      invoicesLoaded: boolean;
      refund: RefundWindow;
      /** Set when Stripe could not be read; the saved plan above still shows. */
      stripeError: string | null;
    };

const STRIPE_UNREADABLE =
  "Some invoice or renewal details couldn’t be loaded from Stripe right now.";

type OwnActivation = {
  plan: PilotPlan;
  allowance: number;
  consumed: number;
  paymentTaken: boolean;
  environment: StripeEnv | null;
  customerId: string | null;
  subscriptionId: string | null;
};

async function loadOwnActivation(userId: string): Promise<OwnActivation | null | "error"> {
  try {
    const { neonDb } = await import("@/lib/db/neon.server");
    const db = neonDb();
    // Production has no unique index on owner_id, so an owner can have more than one
    // workspace. Read them all and prefer an activation that took payment.
    const ws = await db.from("wf_workspaces").select("id").eq("owner_id", userId);
    if (ws.error) return "error";
    const ids = ((ws.data ?? []) as { id: string }[]).map((w) => String(w.id));
    if (ids.length === 0) return null;
    const res = await db
      .from("psi_pilot_activations")
      .select(
        "plan, mission_allowance, missions_consumed, payment_taken, payment_environment, stripe_customer_id, stripe_subscription_id",
      )
      .in("workspace_id", ids);
    if (res.error) return "error";
    const rows = (res.data ?? []) as Record<string, unknown>[];
    const row = rows.find((r) => r["payment_taken"] === true) ?? rows[0];
    if (!row) return null;
    const plan = row["plan"];
    if (typeof plan !== "string" || !isPilotPlan(plan)) return null;
    const env = row["payment_environment"];
    const str = (v: unknown) => (typeof v === "string" && v ? v : null);
    return {
      plan,
      allowance: Number(row["mission_allowance"]) || 0,
      consumed: Number(row["missions_consumed"]) || 0,
      paymentTaken: row["payment_taken"] === true,
      environment: env === "live" || env === "sandbox" ? env : null,
      customerId: str(row["stripe_customer_id"]),
      subscriptionId: str(row["stripe_subscription_id"]),
    };
  } catch {
    return "error";
  }
}

export const getMyBilling = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<BillingView> => {
    const own = await loadOwnActivation(context.userId);
    if (own === "error") return { state: "unavailable" };
    if (!own) return { state: "none" };

    const offer = offerForPlan(own.plan);
    const base = {
      plan: own.plan,
      planLabel: offer.label,
      amountGbp: offer.amountGbp,
      allowance: own.allowance,
      consumed: own.consumed,
      remaining: Math.max(0, own.allowance - own.consumed),
      environment: own.environment,
      // Same test openBillingPortal applies, so the button never offers what the portal refuses.
      hasCustomer: own.paymentTaken && Boolean(own.customerId && own.environment),
    };
    const empty = {
      subscription: null,
      invoices: [] as InvoiceRow[],
      invoicesLoaded: false,
      refund: refundWindow([]),
    };
    if (!own.paymentTaken) return { state: "pilot", ...base, ...empty, stripeError: null };
    if (!own.customerId || !own.environment) {
      // Paid, but the Stripe link was not saved: say so rather than call it a pilot.
      return {
        state: "paid",
        ...base,
        ...empty,
        stripeError:
          "Your payment is recorded, but its Stripe details are missing. Email us and we’ll fix it.",
      };
    }

    const logFailure = (what: string, error: unknown) =>
      console.error(
        `billing: Stripe ${what} read failed`,
        error instanceof Error ? error.message : error,
      );
    let stripe;
    try {
      const { createDirectStripeClient } = await import("@/lib/stripe.server");
      stripe = createDirectStripeClient(own.environment);
    } catch (error) {
      logFailure("client", error);
      return { state: "paid", ...base, ...empty, stripeError: STRIPE_UNREADABLE };
    }
    // Read the two independently: a stale subscription id must not hide invoices, and
    // the other way round.
    const subscriptionId = own.subscriptionId;
    const [subRes, invRes] = await Promise.allSettled([
      subscriptionId ? stripe.subscriptions.retrieve(subscriptionId) : Promise.resolve(null),
      stripe.invoices.list({ customer: own.customerId, limit: 12 }),
    ]);
    if (subRes.status === "rejected") logFailure("subscription", subRes.reason);
    if (invRes.status === "rejected") logFailure("invoices", invRes.reason);
    const sub = subRes.status === "fulfilled" ? subRes.value : null;
    const rows =
      invRes.status === "fulfilled"
        ? invRes.value.data
            .map((inv) => toInvoiceRow(inv as StripeInvoiceLike))
            .filter((r): r is InvoiceRow => r !== null)
        : [];
    const periodEnd = sub?.items.data[0]?.current_period_end;
    return {
      state: "paid",
      ...base,
      subscription: sub
        ? {
            status: sub.status,
            statusLabel: subscriptionStatusLabel(sub.status, sub.cancel_at_period_end),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          }
        : null,
      invoices: rows,
      invoicesLoaded: invRes.status === "fulfilled",
      refund: refundWindow(rows),
      stripeError:
        subRes.status === "rejected" || invRes.status === "rejected" ? STRIPE_UNREADABLE : null,
    };
  });

export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ returnUrl: z.string().url() }).parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; url: string } | { ok: false; message: string }> => {
      if (!isAllowedReturnUrl(data.returnUrl, await currentRequestHostname())) {
        return { ok: false, message: "Invalid return URL." };
      }
      const own = await loadOwnActivation(context.userId);
      if (own === "error") return { ok: false, message: "Billing couldn’t be loaded. Try again." };
      if (!own?.paymentTaken || !own.customerId || !own.environment) {
        return { ok: false, message: "There is no paid plan on this account to manage." };
      }
      try {
        const { createDirectStripeClient } = await import("@/lib/stripe.server");
        const session = await createDirectStripeClient(
          own.environment,
        ).billingPortal.sessions.create({ customer: own.customerId, return_url: data.returnUrl });
        return { ok: true, url: session.url };
      } catch (error) {
        console.error("billing: portal failed", error instanceof Error ? error.message : error);
        return {
          ok: false,
          message:
            "The billing portal couldn’t be opened. Email us and we’ll make the change for you.",
        };
      }
    },
  );
