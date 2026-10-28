# Neon Auth — local and preview setup

DeliverX sign-in uses **Neon Auth** (managed Better Auth). The browser reads **`VITE_NEON_AUTH_URL`**; API routes verify JWTs with **`NEON_AUTH_URL`** (same Auth Base URL). If `VITE_NEON_AUTH_URL` is unset, `/login` shows a configuration error before any network call.

## 1. Enable Neon Auth

1. Open the [Neon console](https://console.neon.tech) → your DeliverX project → **Auth**.
2. Enable Auth (Better Auth) if it is not already on.
3. Copy the **Auth Base URL** (public HTTPS URL for that branch/environment).

## 2. Trusted origins

In Neon Auth settings, allow every origin where you sign in:

| Environment | Typical origin |
| ----------- | -------------- |
| Local dev   | `http://localhost:43123` (see `vite.config.ts`) |
| Vercel preview | Each `https://*.vercel.app` preview URL you use |
| Production  | `https://www.deliverx.dev`, `https://deliverx.dev` |

Preview URLs change per branch; add them when you test a new deployment.

## 3. Local `.env.local`

Create or edit **`.env.local`** at the repo root (never commit it). Set at minimum:

| Variable | Role |
| -------- | ---- |
| `VITE_NEON_AUTH_URL` | Auth Base URL — **required for sign-in UI** |
| `NEON_AUTH_URL` | Same Auth Base URL — **required for server JWT verification** |
| `DATABASE_URL` | Pooled Neon connection string — **required after sign-in** (`/command`, onboarding) |

Optional (only if your Neon project uses them):

- `NEON_AUTH_ISSUER` — JWT issuer (often the Auth service origin; see `docs/psi-preview-setup.md`)
- `NEON_AUTH_AUDIENCE`
- `NEON_AUTH_JWKS_URL`

Restart the dev server after changing env files: `npm run dev` → open `http://localhost:43123/login`.

## 4. Vercel (`swift-deliveries`)

For preview and production deployments on the connected Vercel project, add the same **`VITE_NEON_AUTH_URL`** and **`NEON_AUTH_URL`** (and **`DATABASE_URL`**) under **Project → Settings → Environment Variables** for Development, Preview, and Production as appropriate. Redeploy after adding variables so the build embeds `VITE_*` values.

As of the Neon migration checklist, **`NEON_AUTH_*` / `VITE_NEON_AUTH_URL` may be missing on Vercel even when `DATABASE_URL` is present** — sign-in will fail until both auth URLs are set.

## 5. Verify

1. `npm run dev`
2. Open `/login` — no “not configured” banner.
3. Sign in (or sign up) with a test account.
4. Open `/command` — authenticated route should load (requires `DATABASE_URL` and migrations).

## 6. Accounts

Password hashes from legacy Supabase Auth are not migrated. Use **sign up** with the same email if needed, or reset password via Neon Auth email settings.

Further context: `docs/neon-migration.md`, `docs/psi-preview-setup.md`, variable names in `.env.example`.
