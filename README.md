# Swift Deliveries

DeliverX, the product in this repository, turns realistic product-management work into a record you can defend. Candidates do the work inside simulated organisations, keep provenance-backed evidence, and earn a Verified signal only when someone outside the platform attests to a specific piece of work.

Public product name: **DeliverX**. Repository name: **swift-deliveries**.

## What you can open

- `/` — product story, the six-step record, and plans
- `/experience` — six simulated organisations (Repairline, Quillbase, PayBridge, ShiftHire, Ledgerly, Meridian Freight)
- `/launchpad` — readiness pack and public portfolio
- `/prove` — how external attestation works
- `/pricing` — Experience, Launchpad, and Complete Journey
- `/login` and `/signup` — account access against the connected Supabase project
- `/workspace` — signed-in candidate and coach workspace (requires an account)

## Run locally

You need [Bun](https://bun.sh) (or Node.js 22 with npm).

```sh
bun install
bun run dev
```

The dev server listens on port 43123. Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

With npm:

```sh
npm install
npm run dev
```

The app reads Supabase connection values from `.env` (project `jibmyxaldetyycmtlxet`). Publishable URL and key are set for local/dev. See `docs/supabase-connection.md` for the live schema bridge and remaining gaps.

Server-only secrets are **not** in this repository and must be supplied in the host environment when you need them:

- `SUPABASE_SERVICE_ROLE_KEY` — admin/service paths
- `STRIPE_SANDBOX_API_KEY` or `STRIPE_LIVE_API_KEY`, plus `LOVABLE_API_KEY` — checkout
- `PAYMENTS_*_WEBHOOK_SECRET` — Stripe webhook fulfilment

Until those are present, public pages, signup/login, and workspace bootstrap against the publishable key still work. Checkout stays disabled (`VITE_PAYMENTS_CHECKOUT_ENABLED=false` in `.env.development`).

`.env.production` is for published builds and is not loaded by `bun run dev`.

## Checks

```sh
bun run test
bun run lint
bun run build
```
