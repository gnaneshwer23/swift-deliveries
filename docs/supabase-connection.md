# Supabase connection (DeliverX)

Project ref: `jibmyxaldetyycmtlxet`  
API URL: `https://jibmyxaldetyycmtlxet.supabase.co`

## What is connected

- Publishable URL + key are in `.env` as `SUPABASE_*`, `VITE_SUPABASE_*`, and `NEXT_PUBLIC_SUPABASE_*`.
- Auth email signup/login works against this project (`mailer_autoconfirm` is on in this project).
- Additive compatibility migrations were applied on the live project so the DeliverX app tables exist alongside the older Delivery-OS schema.

## Schema note

This Supabase project already contained a large legacy schema (`users`, `projects`, PI tables, etc.). The DeliverX app expects a different shape (`profiles`, `organisation_memberships`, `capability_frameworks`, …).

We **did not** drop legacy tables. Compatibility migrations:

- added DeliverX columns on `organisations` (`slug`, `owner_id`, …)
- created `profiles`, `user_roles`, `organisation_memberships`, frameworks, onboarding, `subscriptions`, `portfolio_shares`, `monitoring_events`
- fixed RLS recursion between organisations and memberships

Still missing versus the full app/drizzle catalogue (safe follow-ups, not applied because of conflicts with legacy `artefacts` / `experience_scenarios` shapes):

- DeliverX `evidence_ledger`, coaching tables, scenario engine task tables, interview practice tables, credentials/attestations as defined in `drizzle/migrations` and later `supabase/migrations` files from 20260910

## Secrets still required

| Secret | Needed for |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin writes, webhooks, monitoring sink inserts, portfolio admin paths |
| `STRIPE_SANDBOX_API_KEY` / `STRIPE_LIVE_API_KEY` | Checkout session creation |
| `LOVABLE_API_KEY` | Stripe connector gateway |
| `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET` | Stripe webhook fulfilment |
| Open Badges issuer key (server-only) | Prove credential signing |

Do not invent service-role or Stripe secret values.
