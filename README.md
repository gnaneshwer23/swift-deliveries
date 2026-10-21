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

The app reads Supabase connection values from `.env`. Those values are the publishable project URL and key, which the browser is expected to hold. Server-only secrets (the Supabase service role and Stripe secret keys) are not in this repository. Checkout, webhooks, and admin database writes stay unavailable until those secrets are supplied in the host environment.

`.env.development` turns on the Stripe test checkout client. `.env.production` is for published builds and is not loaded by `bun run dev`.

## Checks

```sh
bun run test
bun run lint
bun run build
```
