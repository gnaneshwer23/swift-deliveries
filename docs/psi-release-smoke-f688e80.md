# Release-candidate smoke — `f688e80`

**Date:** 27 October 2026  
**Git tip / production SHA:** `f688e8051e7e636b0ff176e016a957fd231a970d`  
**Production deploy:** `dpl_E2QW2t1JKfww4rm5YsoEsG4SjfpF` — **READY** · https://www.deliverx.dev  
**Inspector:** https://vercel.com/gnaneshwerjadav-gmailcoms-projects/swift-deliveries/E2QW2t1JKfww4rm5YsoEsG4SjfpF  

This note is a **P0-A smoke gate**, not a production-readiness certification. Full checks in `docs/psi-production-readiness-plan.md` remain outstanding.

---

## Verdict

**Demo-safe for manual pilots** with clear limits. **Not** production-ready. Self-serve billing is not live. Model mode is Simulated until founder configures DXSI_* + keys.

| Lane | Result |
| --- | --- |
| Public marketing honesty | **Green** |
| Auth surfaces (forms present) | **Green** (UI only) |
| Signed-in mission → Tavily → pack | **Red** this run (no signed-in browser session) |
| Second-workspace isolation (live) | **Red** this run (needs two signed-in workspaces) |
| Isolation / activate / allowance (code) | **Green** (unit tests) |
| Env inventory (names only) | **Green** (documented below) |
| Provider posture vs foyer chips | **Green** (Simulated default; matches missing DXSI_*) |
| Manual pricing / pilot copy | **Green** |

Prior Production evidence (earlier tip with `TAVILY_API_KEY`): foyer showed Web research ready · tavily and a signed-in Combined research pass produced cited findings. That evidence is **not re-run** on this exact SHA without a session — treat Tavily path as **env-present + historically green**, not freshly re-proven here.

---

## Checklist

| # | Journey | Evidence | Status |
| --- | --- | --- | --- |
| 1 | Signup form | Cursor browser `https://www.deliverx.dev/signup` — Create account form; copy: account does not activate paid pilot | **Green** |
| 2 | Sign-in form | Cursor browser `/login` — email/password + forgot link | **Green** |
| 3 | Recovery form | Cursor browser `/forgot-password` — Send reset link | **Green** (email delivery not exercised) |
| 4 | Sign-in → onboarding → `/command` mission | No authenticated Cursor browser session; `/command` SSR shows loading shell without session | **Red** |
| 5 | Approve → research (Tavily) → decision → pack | Blocked by #4. Production env has `TAVILY_API_KEY`. Prior live cited-research proof was on an earlier tip after key install | **Red** (this SHA) / prior **Green** noted |
| 6 | Second workspace isolation (browser) | Not run — needs two workspaces | **Red** |
| 7 | Isolation in code | `src/lib/pilot-mission/service.test.ts` — workspace cannot read another mission; exhausted allowance blocks one workspace while another can run. `npx vitest run` → 20/20 pass with `activation.test.ts` | **Green** |
| 8 | Operator activate + allowance exhaustion | Unit: `activation.test.ts` (manual activate, no payment, workspace isolation). Allowance gate: service tests + `reservations.server.ts`. Live `/command/pilot-requests` activate on Production Neon **not** browser-proven this run | **Green** (code) / **Red** (live operator UI) |
| 9 | Pricing / pilot honesty | Live `/pricing` and `/pilot?plan=founder`: “Checkout is not live”, “Activation is manual”, “Request … pilot” (enquiry, not Pay) | **Green** |

---

## Environment name inventory (no values)

Source: `vercel env ls` for project `swift-deliveries` (`prj_KXbLoh586LlAsKD6c8zk2HGDjDr5`), 27 October 2026. Names only.

### Production — present

| Concern | Names observed |
| --- | --- |
| Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` |
| Neon Auth | `NEON_AUTH_URL`, `NEON_AUTH_JWKS_URL`, `VITE_NEON_AUTH_URL` |
| Research | `TAVILY_API_KEY` |
| Legacy Supabase (still listed) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` |

### Production — not observed (relevant to P0/P1)

| Concern | Expected names (from `.env.example`) | Status |
| --- | --- | --- |
| Model mode | `DXSI_MODEL_ENABLED`, `DXSI_PROVIDER`, `DXSI_MODEL`, `DXSI_OPENAI_MODEL`, `DXSI_DECISION_MODEL`, `DXSI_MODEL_ALLOWLIST`, `OPENAI_API_KEY`, `AI_GATEWAY_API_KEY`, `OPENROUTER_API_KEY` | **Absent** → Simulated drafts |
| Voice | `DXSI_VOICE_ENABLED`, `DXSI_VOICE_TRANSCRIBE_MODEL` | **Absent** → Voice not configured |
| Stripe / checkout | `VITE_PAYMENTS_CHECKOUT_ENABLED`, `VITE_PAYMENTS_CLIENT_TOKEN`, `STRIPE_SANDBOX_API_KEY`, `STRIPE_LIVE_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET`, `PAYMENTS_LIVE_WEBHOOK_SECRET`, `LOVABLE_API_KEY` | **Absent** → checkout stays off |
| Operator allow-list | `PSI_OPERATOR_EMAILS` | **Absent** — code falls back to published operator email in `commercial-copy.ts` |

### Preview / Development

Many branch-scoped `DATABASE_URL` / `DATABASE_URL_UNPOOLED` Preview entries; Development has `DATABASE_URL` pair + legacy Supabase client names. **No** Production `DXSI_*` / Stripe names duplicated onto Preview in this inventory.

---

## Second-workspace isolation note

- **Server rule:** missions, activations and reservations are keyed by `workspace_id`; allowance exhaustion is per activation/workspace (`ALLOWANCE_EXHAUSTED_COPY` states another workspace is not affected).
- **Proven in unit tests** on this tip (isolation + cross-workspace allowance).
- **Not proven in a live Production browser** with two real workspaces on `f688e80`. Treat as code-green / live-red until founder runs a dual-workspace check.

---

## What this does **not** claim

- Not production-ready.
- Not a full `psi-production-readiness-plan` pass (backup/restore, alerts, durability drills, live cost reconciliation, forged-identity API tests).
- Not Stripe self-serve (P1).
- Not model-mode conviction until DXSI_* + keys are configured (see `docs/psi-provider-posture.md`).
