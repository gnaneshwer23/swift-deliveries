# WHAT I NEED FROM YOU — PSI live payments cutover (P1-5)

**Date:** 28 October 2026  
**Code path:** shipped in repo (see `docs/psi-stripe-catalog.md`). Live charges stay **off** until you complete every item below and set the Production env vars.  
**Honesty:** This is the Stripe live cutover path — **not** a full `psi-production-readiness-plan` certification. Signed-in smoke remains **red** until you run it.

---

## 1. Confirm prices (reply yes / change)

| Plan | Amount | Interval | Lookup key | Mission allowance |
| --- | --- | --- | --- | --- |
| Builder | **£29** | month | `builder_monthly` | 1 |
| Founder | **£99** | month | `founder_monthly` | 4 |
| Studio | **£299** | month | `studio_monthly` | 12 |

Reply **“prices confirmed”** or send revised GBP amounts / allowances before creating live Prices.

---

## 2. Neon migration 0032 — **explicit approval required**

**File:** `drizzle/migrations/0032_psi_pilot_activations_stripe.sql`  
**Production Neon branch:** `br-fancy-breeze-zatt9ocp` (project `spring-wind-48457918`)  
**Ledger status today:** **Not applied** — needs owner approval (`docs/migrations-and-rollback.md`).

**What it does (additive, re-runnable):**

- Drops `payment_taken = false`-only check so paid activations can store `payment_taken = true`
- Makes `request_id` nullable (self-serve Checkout without a prior enquiry)
- Adds Stripe columns + unique index on `stripe_checkout_session_id`

**Ask:** Reply exactly **“Approve apply 0032 to production Neon `br-fancy-breeze-zatt9ocp`”** (and optionally Preview `br-lively-water-zavqzat5`).  
I will **not** apply 0032 until that sentence appears in chat. Safe path after approval: snapshot/branch if you want, then run the SQL once against the production pooled URL under your migration role; update the ledger date.

Without 0032, live webhooks that insert paid activations will fail.

---

## 3. Stripe Dashboard — live Products / Prices

**Account (live):** `acct_1S6BMU2X2opf83VZ` (Gnaneshwerjadav).  
MCP could authenticate **read** on this account but **could not write** Products (403). Create manually:

1. Open [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products) — ensure toggle is **Live** (not Test).
2. For each plan, **Create product**:
   - Name: `DeliverX Builder` / `DeliverX Founder` / `DeliverX Studio`
   - Description: PSI pilot; mission allowance 1 / 4 / 12
   - Metadata: `catalog=psi`, `plan=builder|founder|studio`, `missionAllowance=1|4|12`
3. Pricing: **Recurring · Monthly · GBP · 29 / 99 / 299**
4. **More pricing options → Lookup key:** `builder_monthly` / `founder_monthly` / `studio_monthly` (exact strings)
5. Save. Paste Product ID + Price ID back into chat (or into `docs/psi-stripe-catalog.md`).

Optional: set Vercel `PSI_STRIPE_PRICE_*` to the three `price_…` IDs as overrides.

---

## 4. Stripe secrets (paste into Vercel Production only — never into git/chat)

Prefer **restricted API keys (RAK)** (`rk_live_…`) over unrestricted `sk_live_…` ([Stripe keys](https://dashboard.stripe.com/apikeys)).

| Vercel env name | Value source | Exact action |
| --- | --- | --- |
| `STRIPE_LIVE_API_KEY` | Dashboard → Developers → API keys → Create restricted key (live) | Permissions at least: Checkout Sessions write, Prices/Products read, Customers write, Subscriptions read |
| `VITE_PAYMENTS_CLIENT_TOKEN` | Publishable key `pk_live_…` for `acct_1S6BMU2X2opf83VZ` | Must be **live** publishable once live-approved |
| `PAYMENTS_LIVE_WEBHOOK_SECRET` | Webhook signing secret `whsec_…` (step 5) | Live endpoint only |
| `PSI_PAYMENTS_LIVE_APPROVED` | literal `true` | Flip **last**, after webhook + 0032 + prices |
| `VITE_PAYMENTS_CHECKOUT_ENABLED` | literal `true` | Shows Pay on `/pricing`; unset to stop UI |
| `PSI_PAYMENTS_KILL_SWITCH` | leave unset / `false` | Set `true` to refuse all new Checkout |
| `PSI_STRIPE_PRICE_BUILDER` | optional `price_…` | Only if lookup keys fail |
| `PSI_STRIPE_PRICE_FOUNDER` | optional `price_…` | |
| `PSI_STRIPE_PRICE_STUDIO` | optional `price_…` | |

Sandbox vars (`STRIPE_SANDBOX_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `pk_test_…`) are for Preview/dev — **do not** set them as Production’s active path once `PSI_PAYMENTS_LIVE_APPROVED=true`.

---

## 5. Stripe webhook (live) — Dashboard clicks

1. [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) — **Live** mode.
2. **Add endpoint**
3. Endpoint URL (exact):

   `https://www.deliverx.dev/api/public/payments/webhook?env=live`

4. Events to send:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Reveal **Signing secret** → set `PAYMENTS_LIVE_WEBHOOK_SECRET` on Vercel Production.
6. After deploy, send a test event or complete one low-risk live purchase and confirm a row in `psi_pilot_activations` with `payment_environment = 'live'`.

---

## 6. Vercel Production — full env checklist (names)

Set / verify these on project `swift-deliveries` (`prj_KXbLoh586LlAsKD6c8zk2HGDjDr5`), target **Production**, then redeploy:

### Required for live Pay

- `DATABASE_URL` (Neon pooled — already expected)
- `NEON_AUTH_URL`, `VITE_NEON_AUTH_URL` (+ JWKS/issuer/audience if you use them)
- `VITE_PAYMENTS_CHECKOUT_ENABLED=true`
- `VITE_PAYMENTS_CLIENT_TOKEN=pk_live_…`
- `STRIPE_LIVE_API_KEY=rk_live_…` (or `sk_live_…`)
- `PAYMENTS_LIVE_WEBHOOK_SECRET=whsec_…`
- `PSI_PAYMENTS_LIVE_APPROVED=true` (**last**)
- Leave `PSI_PAYMENTS_KILL_SWITCH` unset until you need an emergency stop

### Strongly recommended (product, not Stripe)

- `PSI_OPERATOR_EMAILS` (comma-separated; else falls back to published operator email)
- `TAVILY_API_KEY` (research)
- Model mode only if you want Model drafts: `DXSI_MODEL_ENABLED`, `DXSI_PROVIDER`, `DXSI_MODEL`, `DXSI_MODEL_ALLOWLIST`, provider key (`OPENAI_API_KEY` / gateway / OpenRouter)

### Optional price overrides

- `PSI_STRIPE_PRICE_BUILDER`, `PSI_STRIPE_PRICE_FOUNDER`, `PSI_STRIPE_PRICE_STUDIO`

### Kill switch demo

- Set `PSI_PAYMENTS_KILL_SWITCH=true` **or** unset `VITE_PAYMENTS_CHECKOUT_ENABLED` and redeploy → Pay must refuse / disappear.

---

## 7. One real (or policy-approved) live smoke after flip

1. Sign in on https://www.deliverx.dev  
2. `/pricing` → Pay Founder (or Builder) with a real card you control  
3. Confirm webhook delivered; Studio shows plan · missions left · paid  
4. Confirm return URL alone did **not** grant access before webhook  
5. Optional: flip kill switch and confirm new Checkout refuses  

---

## Still blocked until you act

| Blocker | Why |
| --- | --- |
| Live Products/Prices | MCP write 403 — Dashboard create required |
| Migration 0032 | Needs your explicit Neon approval sentence |
| Live keys + webhook secret | Not in git; you set Vercel |
| `PSI_PAYMENTS_LIVE_APPROVED` | Must be your deliberate flip |
| Signed-in P0-A smoke | Remains **red** without your browser session — not certified production-ready overall |

## Stripe MCP re-consent (optional)

If you want agents to create live Products next time: open the Stripe MCP reconsent URL from the Stripe plugin and grant **live write** for `acct_1S6BMU2X2opf83VZ`.
