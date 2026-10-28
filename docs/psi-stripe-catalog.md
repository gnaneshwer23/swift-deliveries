# PSI Stripe catalog (P1 sandbox)

**Date:** 28 October 2026  
**Mode:** Stripe **sandbox** only (isolated sandbox `acct_1UVJJgLTPk6m3Dkt`). Not live cutover (P1-5).  
**Entitlement store:** `psi_pilot_activations` — never career Supabase `subscriptions`.

## Mapping table

| Plan | Published price | Lookup key | Mission allowance | Exhaustion |
| --- | --- | --- | --- | --- |
| Builder | £29 / month | `builder_monthly` | **1** | `block_next_billable_comparison` |
| Founder | £99 / month | `founder_monthly` | **4** | `block_next_billable_comparison` |
| Studio | £299 / month | `studio_monthly` | **12** | `block_next_billable_comparison` |

Allowances match the pricing page “Monthly missions” column. Operator manual activation may still set 1–24; self-serve uses these defaults from Checkout metadata / price metadata.

## Sandbox Product / Price IDs (test)

Created 28 Oct 2026 in sandbox `acct_1UVJJgLTPk6m3Dkt` (claim before expiry; see founder env checklist).

| Plan | Product ID | Price ID | Lookup key |
| --- | --- | --- | --- |
| Builder | `prod_VWN5DVwOXYyCo8` | `price_1UVKLnLTPk6m3DktTFCrxdVv` | `builder_monthly` |
| Founder | `prod_VWN5wmcUpVj2Q3` | `price_1UVKLnLTPk6m3DktpKa239iv` | `founder_monthly` |
| Studio | `prod_VWN6qLJhol1GAJ` | `price_1UVKLoLTPk6m3DkttQK95FMc` | `studio_monthly` |

App resolves prices by **lookup key** (not hardcoded `price_` IDs). Optional env overrides:

- `PSI_STRIPE_PRICE_BUILDER` / `PSI_STRIPE_PRICE_FOUNDER` / `PSI_STRIPE_PRICE_STUDIO` — `price_…` IDs if lookup keys are unavailable.

## Workspace binding

- Checkout requires a signed-in Neon Auth user and their **owned** `wf_workspaces` row.
- One activation per workspace (`workspace_id` unique).
- Metadata on the Checkout Session (and subscription): `userId`, `workspaceId`, `plan`, `missionAllowance`, `lookupKey`, `catalog=psi`.
- Paying again for a workspace that already has an activation does **not** stack allowance (idempotent by `stripe_checkout_session_id`; conflict if a different paid session targets the same workspace).

## Billing shape

- Stripe **subscription** monthly Prices (marketing says monthly).
- Entitlement remains **allowance-shaped** (missions), not automatic renewal top-up in P1.
- Fulfillment: `checkout.session.completed` + `checkout.session.async_payment_succeeded`, only when `payment_status` ≠ `unpaid`.
- Success / return URL does **not** grant access.

## Tax / cancel / refund (stub)

- **Tax:** Stripe Tax / `automatic_tax` **off** until an active UK (or applicable) registration exists.
- **Cancel:** Customer can cancel the Stripe subscription in Dashboard / future portal; activation row is not auto-revoked in P1 (operator may adjust). Document for P1-5.
- **Refund:** Manual operator + Stripe Dashboard; do not invent automatic entitlement clawback in P1.

## Career catalog (do not reuse)

These lookup keys remain career-only and must never map to `psi_pilot_activations`:

`experience_monthly`, `launchpad_monthly`, `complete_journey_monthly`, `complete_journey_yearly`, `career_sprint_pass`.

## Honesty

Until `VITE_PAYMENTS_CHECKOUT_ENABLED=true` **and** sandbox keys + prices resolve, pricing copy stays “Checkout is not live” / manual activation. With the flag on and test keys, UI must say **sandbox**, not live billing.
