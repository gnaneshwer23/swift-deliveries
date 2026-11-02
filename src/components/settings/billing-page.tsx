/**
 * Settings → Billing: your plan, what you've used, invoices from Stripe, the Stripe billing
 * portal for card, plan and cancelling, and the 3-day refund request. Every value is read from
 * your saved activation or from Stripe; if Stripe can't be reached, the page says so.
 */
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink, FileText, Mail, RefreshCw } from "lucide-react";
import { useState } from "react";
import { PUBLISHED_OPERATOR_EMAIL } from "@/lib/pilot/commercial-copy";
import {
  REFUND_WINDOW_DAYS,
  formatDate,
  formatMoney,
  refundRequestMailto,
} from "@/lib/billing/billing-view";
import { getMyBilling, openBillingPortal, type BillingView } from "@/lib/billing/billing.functions";

const STATUS_TONE: Record<string, "ok" | "warn" | "muted"> = {
  active: "ok",
  trialing: "ok",
  past_due: "warn",
  unpaid: "warn",
  incomplete: "warn",
};

function Skeleton() {
  return (
    <div className="st-skeleton" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

export function BillingPage({ accountEmail }: { accountEmail: string }) {
  const billing = useQuery({ queryKey: ["billing", "mine"], queryFn: () => getMyBilling() });

  return (
    <div className="pf-body">
      <header className="st-head">
        <h1>Billing</h1>
        <p>Your plan, what you’ve used, and your invoices.</p>
      </header>
      {billing.isLoading ? (
        <>
          <p className="prj-sr" role="status">
            Loading billing…
          </p>
          <Skeleton />
        </>
      ) : billing.isError || !billing.data || billing.data.state === "unavailable" ? (
        <section className="pf-card" role="alert">
          <h2>Billing couldn’t be loaded</h2>
          <p className="pf-muted">Nothing has changed on your account. Try again in a moment.</p>
          <div className="pf-actions st-actions-left">
            <button type="button" className="pf-btn" onClick={() => void billing.refetch()}>
              <RefreshCw size={14} aria-hidden="true" /> Try again
            </button>
          </div>
        </section>
      ) : billing.data.state === "none" ? (
        <section className="pf-card st-empty" aria-labelledby="st-noplan">
          <h2 id="st-noplan">You’re not on a paid plan</h2>
          <p className="pf-muted">
            Your first project is free to start. When you need more Investigations, pick a plan.
          </p>
          <div className="pf-actions st-actions-left">
            <Link to="/pricing" className="pf-btn pf-btn-primary">
              Compare plans <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <PlanDetails view={billing.data} accountEmail={accountEmail} />
      )}
    </div>
  );
}

function PlanDetails({
  view,
  accountEmail,
}: {
  view: Extract<BillingView, { state: "pilot" | "paid" }>;
  accountEmail: string;
}) {
  const [portalError, setPortalError] = useState<string | null>(null);
  const portal = useMutation({
    mutationFn: () => openBillingPortal({ data: { returnUrl: window.location.href } }),
    onSuccess: (res) => {
      if (res.ok) window.location.assign(res.url);
      else setPortalError(res.message);
    },
    onError: () => setPortalError("The billing portal couldn’t be opened. Try again."),
  });

  const sub = view.subscription;
  const usedPct = view.allowance > 0 ? Math.min(100, (view.consumed / view.allowance) * 100) : 0;
  const tone = sub ? (STATUS_TONE[sub.status] ?? "muted") : "muted";
  const refund = view.refund;

  return (
    <>
      <section className="st-plan" aria-labelledby="st-plan-name">
        <div className="st-plan-top">
          <div>
            <p className="pf-eyebrow">Current plan</p>
            <h2 id="st-plan-name">{view.planLabel}</h2>
          </div>
          <p className="st-pills">
            {sub ? (
              <span className="st-pill" data-tone={tone}>
                {sub.statusLabel}
              </span>
            ) : view.state === "pilot" ? (
              <span className="st-pill" data-tone="muted">
                Pilot, no card payment
              </span>
            ) : null}
            {view.environment === "sandbox" ? (
              <span className="st-pill" data-tone="warn">
                Test mode
              </span>
            ) : null}
          </p>
        </div>
        {sub?.periodEnd ? (
          <p className="st-plan-line">
            {sub.cancelAtPeriodEnd || sub.status === "canceled" ? "Access ends" : "Renews"} on{" "}
            {formatDate(sub.periodEnd)}
          </p>
        ) : null}
        <div className="st-meter">
          <p>
            <span>Investigations used</span>
            <b>
              {view.consumed} of {view.allowance}
            </b>
          </p>
          <div
            className="st-meter-bar"
            role="progressbar"
            aria-label="Investigations used"
            aria-valuemin={0}
            aria-valuemax={view.allowance}
            aria-valuenow={view.consumed}
          >
            <span style={{ width: `${usedPct}%` }} />
          </div>
        </div>
        {view.hasCustomer && view.state === "paid" ? (
          <div className="st-plan-actions">
            <button
              type="button"
              className="st-btn-light"
              disabled={portal.isPending}
              onClick={() => {
                setPortalError(null);
                portal.mutate();
              }}
            >
              {portal.isPending ? "Opening…" : "Manage billing"}{" "}
              <ExternalLink size={14} aria-hidden="true" />
            </button>
            <span>Change card or plan, or cancel, on Stripe’s secure page.</span>
          </div>
        ) : null}
      </section>
      {portalError ? (
        <p className="pf-error" role="alert">
          {portalError}{" "}
          <a className="pf-link" href={`mailto:${PUBLISHED_OPERATOR_EMAIL}`}>
            {PUBLISHED_OPERATOR_EMAIL}
          </a>
        </p>
      ) : null}
      {view.stripeError ? (
        <p className="pf-muted" role="status">
          {view.stripeError}
        </p>
      ) : null}

      {refund.open ? (
        <section className="pf-card st-refund" aria-labelledby="st-refund">
          <h2 id="st-refund">Changed your mind?</h2>
          <p>
            You paid {formatMoney(refund.payment.amountMinor, refund.payment.currency)} on{" "}
            {formatDate(refund.payment.paidAt!)}. Until {formatDate(refund.closesAt)} you can ask
            for a full refund. We refund to the card you paid with, and the paid access that payment
            bought ends when the refund is made.
          </p>
          <div className="pf-actions st-actions-left">
            <a
              className="pf-btn pf-btn-primary"
              href={refundRequestMailto({
                to: PUBLISHED_OPERATOR_EMAIL,
                accountEmail,
                planLabel: view.planLabel,
                payment: refund.payment,
              })}
            >
              <Mail size={14} aria-hidden="true" /> Request a refund
            </a>
          </div>
          <p className="pf-muted">
            This opens an email with your invoice details filled in, so you keep a copy.
          </p>
        </section>
      ) : refund.payment && refund.closedAt ? (
        <p className="pf-muted">
          The {REFUND_WINDOW_DAYS}-day full refund for your last payment ended on{" "}
          {formatDate(refund.closedAt)}. Consumer cancellation rights in our{" "}
          <Link to="/terms" className="pf-link">
            Terms
          </Link>{" "}
          still apply.
        </p>
      ) : null}

      {view.state === "paid" && !view.stripeError ? (
        <section className="pf-card" aria-labelledby="st-invoices">
          <h2 id="st-invoices">Invoices</h2>
          {view.invoices.length === 0 ? (
            <p className="pf-muted">No invoices yet.</p>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Date</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="prj-sr">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {view.invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.number ?? "Draft"}</td>
                      <td>{formatDate(inv.paidAt ?? inv.createdAt)}</td>
                      <td>{formatMoney(inv.amountMinor, inv.currency)}</td>
                      <td>
                        <span
                          className="st-pill"
                          data-tone={
                            inv.status === "paid" ? "ok" : inv.status === "open" ? "warn" : "muted"
                          }
                        >
                          {inv.status === "paid"
                            ? "Paid"
                            : inv.status === "open"
                              ? "Due"
                              : inv.status}
                        </span>
                      </td>
                      <td>
                        {(inv.pdfUrl ?? inv.hostedUrl) ? (
                          <a
                            className="pf-link st-inv-link"
                            href={(inv.pdfUrl ?? inv.hostedUrl)!}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FileText size={14} aria-hidden="true" />
                            {inv.pdfUrl ? "PDF" : "View"}
                            <span className="prj-sr"> invoice {inv.number ?? ""}</span>
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
