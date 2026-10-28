# Supabase → Neon migration

**Status (22 Oct 2026):** code migrated on branch `feat/neon-migration`; Neon schema applied; awaiting Neon Auth enablement and Vercel environment variables before cutover.

## What moved

| Concern             | Before                          | After                                                                                |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| Database (DeliverX) | Supabase Postgres via PostgREST | Neon Postgres via `postgres` driver (`src/lib/db/neon.server.ts`)                    |
| Query layer         | `supabase.from(...)`            | `src/lib/db/builder.ts` — same call shape, parameterised SQL with explicit casts     |
| Auth                | Supabase Auth                   | Neon Auth (managed Better Auth) — `src/lib/auth/client.ts`                           |
| Server auth         | Supabase JWT via `getClaims`    | Neon Auth JWT verified against JWKS (`src/lib/auth/verify.server.ts`, `requireAuth`) |
| Onboarding profile  | `user_metadata.dx_profile`      | `dx_profiles` table                                                                  |
| Monitoring events   | Supabase `monitoring_events`    | Neon `monitoring_events`                                                             |

Schema: `db/neon/0001_deliverx_core.sql` (applied). Tables: `wf_*` workforce, missions and programmes, `dx_profiles`, `monitoring_events`; `wf_schema_version()` = 3.

Not moved (by decision): the career suite and its ~200 legacy tables. That code still references Supabase and stays behind `VITE_CAREER_SUITE_ENABLED` (off). The Stripe career webhook is unchanged.

Data: Supabase held 19 auth users, 3 empty workspaces, 0 missions, 0 programmes. Password hashes cannot be moved into Neon Auth, so existing users create a new account (same email). Empty workspaces are recreated automatically on first visit.

## Cutover checklist

1. **Neon console → Auth (Better Auth) → Enable.** Copy the Auth Base URL.
2. **Trusted domains:** `https://www.deliverx.dev`, `https://deliverx.dev`, `http://localhost:43123`.
3. **Email:** confirm password-reset emails send (and choose whether email verification is required).
4. **Rotate the Neon database password** (it was shared in chat).
5. **Vercel env (Production, Preview, Development):**
   - `DATABASE_URL` — pooled Neon connection string (new password) — Sensitive
   - `VITE_NEON_AUTH_URL` — Auth Base URL
   - `NEON_AUTH_URL` — same Auth Base URL (server JWT verification)
   - optional `NEON_AUTH_JWKS_URL` if keys are not at `/.well-known/jwks.json` or `/jwks`

   Step-by-step for local `.env.local` and trusted origins: **`docs/neon-auth-local-setup.md`**.
6. Verify on the preview deployment of `feat/neon-migration`: sign up, onboarding, Command Centre, a programme run, password reset, sign out.
7. Merge to `main`.
8. Afterwards: remove Supabase variables once the career-suite decision is made.

## Verification done

- Builder unit tests (parameterisation, identifier safety, unfiltered write refusal, array/json serialisation).
- Live Neon integration test: inserts, jsonb and text[] round-trips, upsert on conflict, race-safe conditional updates, count, rpc, append-only trigger, cascade cleanup.
