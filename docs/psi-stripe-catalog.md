# PSI Stripe catalog (P1-5 live cutover path)

**Date:** 28 October 2026  
**Mode:** Code supports **live** Checkout when `PSI_PAYMENTS_LIVE_APPROVED=true` + live keys. Sandbox remains for Preview/dev only — once live is approved, Production must not fall back to sandbox.  
**Entitlement store:** `psi_pilot_activations` — never career Supabase `subscriptions`.  
**Founder actions:** [psi-live-cutover-needs.md](./psi-live-cutover-needs.md).

## Founder confirmations (28 Oct 2026)

| Item | Status |
| --- | --- |
| Prices + allowances (Builder £29 / 1, Founder £99 / 4, Studio £299 / 12) | **Confirmed** by founder |
| Neon migration 0032 on production `br-fancy-breeze-zatt9ocp` | **Applied** 28 Oct 2026 (file blob `8f5178636508c0e06df99ec32a7ee70e546b301b`; see `docs/migrations-and-rollback.md`) |
| Live Products / Prices (IDs below) | **Read from live** `acct_1S6BMU2X2opf83VZ` 28 Oct 2026 |
| Vercel `PSI_STRIPE_PRICE_*` (Production) | **Set** to live `price_…` IDs below |
| Live keys, webhook, `PSI_PAYMENTS_LIVE_APPROVED` | **Still required** — not set by agents; see needs list |

## Mapping table

| Plan | Published price | Lookup key | Mission allowance | Exhaustion |
| --- | --- | --- | --- | --- |
| Builder | £29 / month (**confirmed**) | `builder_monthly` | **1** | `block_next_billable_comparison` |
| Founder | £99 / month (**confirmed**) | `founder_monthly` | **4** | `block_next_billable_comparison` |
| Studio | £299 / month (**confirmed**) | `studio_monthly` | **12** | `block_next_billable_comparison` |

Allowances match the pricing page “Monthly missions” column. Operator manual activation may still set 1–24; self-serve uses these defaults from Checkout metadata / price metadata.

## Live Product / Price IDs

**Account:** `acct_1S6BMU2X2opf83VZ` (livemode). Read via Stripe MCP 28 Oct 2026. MCP **cannot write** Prices (403 upscope) — lookup keys below are **as observed**; founder should fix in Dashboard if relying on lookup (Production uses env price overrides).

App resolves prices by **lookup key** when env overrides are absent. Production overrides:

- `PSI_STRIPE_PRICE_BUILDER` / `PSI_STRIPE_PRICE_FOUNDER` / `PSI_STRIPE_PRICE_STUDIO`

| Plan | Product ID | Product name (Stripe) | Price ID | Amount | Lookup key (observed) | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Builder | `prod_VHO45CEWLNQ3qF` | `builder_monthly` | `price_1UGpI02X2opf83VZ9RIaw4Ky` | £29 / month | **`experience_monthly`** (wrong — career key) | No `default_price` on product; metadata still has Lovable career tags |
| Founder | `prod_VWUi8xEiee1ACW` | `founder_monthly` | `price_1UVRjW2X2opf83VZ0E9zN7bi` | £99 / month | *(null)* | Inferred as Founder from £99 |
| Studio | `prod_VWUj2JF7yL89go` | `studio_monthly` | `price_1UVRjr2X2opf83VZmm3F4UtY` | £299 / month | *(null)* | Matches founder label `studio_monthly` |

**Dashboard fix (optional but recommended):** set Price lookup keys to `builder_monthly` / `founder_monthly` / `studio_monthly`, set Builder product default price to `price_1UGpI02X2opf83VZ9RIaw4Ky`, and clear career `experience_monthly` from the Builder price so career fulfillment never collides.

## Sandbox Product / Price IDs (test — P1 proof only)

Created 28 Oct 2026 in sandbox `acct_1UVJJgLTPk6m3Dkt` (claim before expiry).

| Plan | Product ID | Price ID | Lookup key |
| --- | --- | --- | --- |
| Builder | `prod_VWN5DVwOXYyCo8` | `price_1UVKLnLTPk6m3DktTFCrxdVv` | `builder_monthly` |
| Founder | `prod_VWN5wmcUpVj2Q3` | `price_1UVKLnLTPk6m3DktpKa239iv` | `founder_monthly` |
| Studio | `prod_VWN6qLJhol1GAJ` | `price_1UVKLoLTPk6m3DkttQK95FMc` | `studio_monthly` |

Do **not** put these sandbox `price_…` IDs on Production `PSI_STRIPE_PRICE_*`. Preview may keep lookup keys against sandbox; live price env overrides stay Production-only.

## Environment gates (P1-5)

| Condition | Behaviour |
| --- | --- |
| `PSI_PAYMENTS_KILL_SWITCH=true` | Refuse all new Checkout Sessions |
| `VITE_PAYMENTS_CHECKOUT_ENABLED` ≠ `true` | No Pay UI; server refuses (“Checkout is not live.”) |
| `PSI_PAYMENTS_LIVE_APPROVED=true` | **Require** `pk_live_` + `STRIPE_LIVE_API_KEY`; webhook `?env=live`; pricing copy says live |
| Live approved missing | Sandbox path only (`pk_test_` + `STRIPE_SANDBOX_API_KEY`); never charge live |
| Live approved + only sandbox keys | **Refuse** — no silent sandbox fallback on Production |

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
- Webhook URL (Production): `https://www.deliverx.dev/api/public/payments/webhook?env=live`

## Tax / cancel / refund

- **Tax:** Stripe Tax / `automatic_tax` **off** until an active UK (or applicable) registration exists.
- **Cancel:** Customer can cancel the Stripe subscription in Dashboard / Customer Portal; activation row is not auto-revoked in P1 (operator may adjust).
- **Refund:** Manual operator + Stripe Dashboard; do not invent automatic entitlement clawback in P1.

## Kill switch (demonstrate stop)

1. Set `PSI_PAYMENTS_KILL_SWITCH=true` on Vercel Production (or unset `VITE_PAYMENTS_CHECKOUT_ENABLED` and redeploy), **or**
2. Remove / rotate `STRIPE_LIVE_API_KEY` and unset `PSI_PAYMENTS_LIVE_APPROVED`.

New Checkout must refuse; existing activations are unchanged.

## Career catalog (do not reuse)

These lookup keys remain career-only and must never map to `psi_pilot_activations`:

`experience_monthly`, `launchpad_monthly`, `complete_journey_monthly`, `complete_journey_yearly`, `career_sprint_pass`.

**Collision note:** live Builder price currently still carries lookup key `experience_monthly`. Until Dashboard fix, rely on `PSI_STRIPE_PRICE_BUILDER` + Checkout metadata `catalog=psi` / `lookupKey=builder_monthly` for PSI; do not treat that price’s Stripe lookup key as a PSI signal.

## Honesty

- Without checkout flag → “Checkout is not live.”
- With flag + `pk_test_` → sandbox copy only.
- With flag + `pk_live_` + server `PSI_PAYMENTS_LIVE_APPROVED=true` → live copy. Never imply live while sandbox keys are the active path.
