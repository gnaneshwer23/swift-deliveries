# DeliverX — next build roadmap (audit-plan)

**Date:** 27 October 2026  
**Tip audited:** `f688e80` (Studio D1–D4 on `main`) · Live: https://www.deliverx.dev  
**Mode:** Plan + **P0 shipped** + **P1-1…P1-4 sandbox** (founder approved P1; stop before P1-5 live). Catalog: `docs/psi-stripe-catalog.md`. Smoke: `docs/psi-release-smoke-f688e80.md`. Provider posture: `docs/psi-provider-posture.md`.  
**Related:** `docs/roadmap.md`, `docs/psi-production-readiness-plan.md`, `docs/psi-design-foundation.md`, `docs/paid-launch-phase-1.md`, `docs/roadmap-studio-dashboard-ux.md`, `docs/roadmap-product-building-agents.md`

---

## 1. Brief audit — solid vs weak at `f688e80`

### Solid (shipped spine you can demo)

| Area | Evidence |
| --- | --- |
| **Product loop** | One-liner → PM brief → human plan gate → research/work → options → decision → pack → outcome/follow-up; Acts theatre; sequential build beats + HTML prototype beat (P1–P5 + close-out). |
| **Studio UX** | D1–D4 Direction B: editorial foyer, quiet shell, theatre presence, side-room foyer language. Primary surface is `/command` (Studio). |
| **Honesty / policy** | Human gates, usage ceilings, simulated vs model labels, no invented web when research unconfigured; Tavily Path B live on Production with cited findings verified. |
| **Pilot ops (manual)** | Enquiry → operator follow-up → manual Builder/Founder/Studio activation + mission allowance on `psi_pilot_activations`; comparison reservations + reconciliation suite exists (`0020`–`0023` applied to Neon per `docs/roadmap.md`). |
| **Research provider** | `TAVILY_API_KEY` present on **production** (Vercel env name inventory). |

### Weak / open (do not claim production-ready)

| Area | Gap |
| --- | --- |
| **Production readiness** | Release checks in `docs/psi-production-readiness-plan.md` have **not** been run on this tip. No production-readiness claim. Outstanding: full signed-in journey/recovery on the release candidate, two-workspace isolation proof, backup/restore rehearsal, alerts/rollback, bounded live-provider cost reconciliation. |
| **Billing / Stripe** | **No Stripe / payments env names** observed on the Vercel project inventory used for this audit (only `TAVILY_API_KEY` among production interest keys returned). Checkout flag / keys not wired. Pricing still says **manual activation**. Legacy checkout (`experience_monthly`, `launchpad_monthly`, …) writes **Supabase `subscriptions`** — **not** Builder/Founder/Studio → `psi_pilot_activations`. |
| **Model / Voice** | Optional. Foyer can show “Simulated drafts” / “Voice not configured”. `DXSI_MODEL_ENABLED` + `OPENAI_API_KEY` / allowlist / voice vars may still be missing on production — paid or demo conviction stays stub-first until configured. |
| **Ops durability** | Comparison path is awaited request + leases/reservations, not a proven unattended worker across process death. Currency-cost reconciliation still open. |
| **UX residual** | Cold load blank canvas; side rooms quieter but not a full brand redesign; agents “build in sequence” is believable on theatre but still lighter than a shipped product workshop. |
| **Career residue** | Old Stripe webhook + price IDs remain; must not be reused for PSI entitlements. |

**Verdict:** Product + Studio theatre are **demo-solid**. Revenue is **manual-only**. Ops readiness and self-serve billing are the two open company-level tracks. Taking live card payments before a thin smoke gate + entitlement correctness would outrun evidence.

---

## 2. Prioritized next build steps

### P0 — Blockers before live money or “production-ready”

#### P0-A — Release-candidate smoke checklist (ops / docs, light code only if broken) — **done (partial greens)**

| | |
| --- | --- |
| **Goal** | Know whether this tip is safe to invite a paying pilot — without claiming full readiness certification. |
| **Deliverables** | Written checklist run on **exact** deploy SHA: signup/sign-in/recovery; onboarding → one supervised mission → approve → research (Tavily) → decision → pack; second workspace isolation; operator activate + allowance exhaustion; env name inventory (DB, Auth, Tavily, model, Stripe) per environment. Record pass/fail in a short evidence note (e.g. `docs/release-smoke-f688e80.md` when run). |
| **Deps / secrets** | Existing Neon Auth + `DATABASE_URL`; Production Tavily; test accounts. **Do not** put secrets in git. |
| **Demo criterion** | Founder can open the evidence note and see green/red on each journey — not “deployment Ready” alone. |
| **Risk** | Treating smoke as full `psi-production-readiness-plan` certification; skipping two-workspace or recovery. |
| **Shipped** | Evidence: `docs/psi-release-smoke-f688e80.md` on Production SHA `f688e80`. Public auth forms + pricing honesty + env inventory + unit isolation/activate greens; **signed-in mission/Tavily/pack and live dual-workspace remain red** until a session re-run. |

#### P0-B — Provider posture decision (config, not a feature) — **done (Simulated default)**

| | |
| --- | --- |
| **Goal** | Decide what a paid/demo pilot **actually receives**: simulated drafts vs opt-in model mode. |
| **Deliverables** | Founder decision + (if enabling) Production/Preview: `DXSI_MODEL_ENABLED`, `DXSI_PROVIDER`, keys, `DXSI_MODEL` / allowlist; optional voice pair. Foyer readiness chips must match reality. |
| **Deps / secrets** | OpenAI (or gateway) key; spend cap; allowlist IDs confirmed on the account. |
| **Demo criterion** | Same mission shows **Model · \<id\>** on an artefact when enabled, or honest **Simulated draft** when not — no silent swap. |
| **Risk** | Enabling model mode without ceiling / reservation discipline; PII-looking brief text into models. |
| **Shipped** | Decision recorded in `docs/psi-provider-posture.md`: **Simulated until DXSI_* + keys**. Production inventory has no model/voice env names; foyer chips already match. Founder configure list in that doc — no keys invented. |

#### P0-C — Keep manual pilot path healthy (no Stripe yet) — **done (copy + code)**

| | |
| --- | --- |
| **Goal** | Continue closing revenue with operator activation while self-serve is built. |
| **Deliverables** | Confirm `/command/pilot-requests` activate → allowance gate still works on production Neon; pricing copy stays accurate (“manual” until Stripe ships). |
| **Deps / secrets** | `PSI_OPERATOR_EMAILS` (or published operator). |
| **Demo criterion** | Operator activates Founder plan for a test workspace; billable comparison stops after allowance. |
| **Risk** | Marketing implies self-serve while activation is still manual. |
| **Shipped** | Live `/pricing` + `/pilot`: “Checkout is not live” / manual activation / Request pilot (no Pay). Unit tests cover activate + allowance isolation. Live operator activate UI on Production still needs a signed-in operator pass. |

---

### P1 — Revenue: Stripe self-serve → `psi_pilot_activations`

Stripe Cursor plugin is authenticated. **Do not create Stripe products in this planning pass.** When building, follow Stripe best practices mentally:

- Prefer **Checkout Sessions** (hosted or embedded) for Builder/Founder/Studio.
- **Webhooks required** — fulfill on `checkout.session.completed` **and** `checkout.session.async_payment_succeeded`, only when `payment_status` is not `unpaid`; verify signatures.
- Omit `payment_method_types` (dynamic payment methods).
- Use a **sandbox** (prefer separate Stripe sandbox) + restricted keys before live.
- Entitlements land on **`psi_pilot_activations`** (plan + `mission_allowance` + workspace), **not** career plan IDs / Supabase `subscriptions`.

#### P1-1 — Commercial + Stripe catalog design (no live products until approve)

| | |
| --- | --- |
| **Goal** | Map Builder £29 / Founder £99 / Studio £299 → Stripe Price lookup keys + default mission allowances. |
| **Deliverables** | Design note: lookup keys (e.g. `builder_monthly`, `founder_monthly`, `studio_monthly`), allowance defaults, workspace binding rules, cancel/refund policy stub, tax decision (Stripe Tax only with active registration). |
| **Deps / secrets** | Stripe Dashboard access (plugin OK); founder price confirmation. |
| **Demo criterion** | Founder signs the mapping table before any Product/Price create. |
| **Risk** | Reusing career lookup keys; ambiguous multi-workspace entitlements. |

#### P1-2 — Checkout Sessions for PSI plans (sandbox)

| | |
| --- | --- |
| **Goal** | Signed-in user can start Checkout for Builder/Founder/Studio when flag enabled. |
| **Deliverables** | New PSI price IDs in server allowlist; Checkout Session create with `metadata` (`userId`, `workspaceId`, `plan`, intended allowance); pricing/pilot UI “Pay” only when `VITE_PAYMENTS_CHECKOUT_ENABLED=true` + sandbox key present; **do not** mount career plans. |
| **Deps / secrets** | `STRIPE_SANDBOX_API_KEY` (RAK preferred), publishable client token, checkout flag; Neon Auth session (replace any Supabase-auth assumption on the new path). |
| **Demo criterion** | Sandbox card completes Checkout; success page does **not** alone grant access. |
| **Risk** | Entitlement only on return URL; Lovable gateway coupling if still required by old client. |

#### P1-3 — Webhook → entitlement on `psi_pilot_activations`

| | |
| --- | --- |
| **Goal** | Payment fulfillment creates/updates activation the same shape as manual operator activation (`payment` marked taken). |
| **Deliverables** | Dedicated PSI webhook handler (or clearly branched path): verify signature; idempotent upsert by Stripe session/subscription id; set plan + allowance + workspace; ignore career price IDs; handle async success/failure; tests for replay and unpaid. |
| **Deps / secrets** | `PAYMENTS_SANDBOX_WEBHOOK_SECRET`; Vercel webhook URL; additive migration if Stripe ids need columns on `psi_pilot_activations` (follow `docs/migrations-and-rollback.md`, owner approval for production). |
| **Demo criterion** | Sandbox purchase → row in `psi_pilot_activations` → billable comparison consumes allowance; replay does not double-grant. |
| **Risk** | Writing to legacy Supabase `subscriptions`; granting before `payment_status` paid; cross-workspace grant. |

#### P1-4 — Customer-visible paid state + exhaustion

| | |
| --- | --- |
| **Goal** | Studio shows plan/allowance remaining; exhaustion copy matches commercial copy. |
| **Deliverables** | Account/foyer footnote: plan + missions left; pricing page flips from “manual only” when self-serve is actually live (sandbox vs live labelled). |
| **Deps / secrets** | P1-3. |
| **Demo criterion** | After sandbox pay, Studio shows activation; after N comparisons, next billable step blocked with published message. |
| **Risk** | Implying live billing while only sandbox is wired. |

#### P1-5 — Live mode cutover (after smoke + sandbox proof)

| | |
| --- | --- |
| **Goal** | Accept real cards only after sandbox entitlement proof + P0-A greens. |
| **Deliverables** | Live restricted key + live webhook secret; live Prices; runbook; kill switch (`VITE_PAYMENTS_CHECKOUT_ENABLED` / key removal). |
| **Deps / secrets** | Live Stripe; tax registration if `automatic_tax`; founder go-live approve. |
| **Demo criterion** | One real low-risk purchase (or Stripe live test policy as chosen) grants activation; stop-switch demonstrated. |
| **Risk** | Skipping webhook in live; no rollback story for mistaken entitlement. |

---

### P2 — Polish / conviction (after P1 sandbox or in parallel thin slices)

| Step | Goal | Deliverables | Deps | Demo criterion | Risk |
| --- | --- | --- | --- | --- | --- |
| **P2-A Cold load** | Remove blank foyer wait feel | Skeleton/stage paint before data | — | First paint shows Studio stage frame &lt; perceived blank | Layout shift |
| **P2-B Model conviction demo** | Paid path feels agent-built when keys on | Scripted demo mission with Model badges + Tavily citations | P0-B | Founder watches one end-to-end with Model · id | Cost overrun |
| **P2-C Voice (optional)** | Oral brief when typed path solid | `DXSI_VOICE_*` + foyer honesty | OpenAI realtime | Talk mic works or “not configured” | Scope creep |
| **P2-D Durability increment** | Background recovery evidence | Worker/lease crash drills per readiness plan | Release time | Kill mid-compare → no double charge; recoverable | Large eng |
| **P2-E Full readiness cert** | Claim production-ready only then | Full `psi-production-readiness-plan` on pinned SHA | P0-A + ops | Founder signs evidence pack | Premature claim |

---

## 3. First build to approve (recommendation)

**Approve first: P1 Stripe self-serve (sandbox) for Builder / Founder / Studio → Checkout Sessions → webhook entitlements on `psi_pilot_activations`.**

**Why this over a full readiness-checklist programme as the first *build*:**

1. **Product/UX spine is already demoable** (theatre, Tavily Production, D1–D4). Manual activation already sells pilots one-by-one — the scaling gap is **self-serve**, not another foyer pass.
2. **Published pricing still cannot be bought.** Legacy Stripe code is the wrong catalog and the wrong entitlement store; greenfield PSI checkout is real product work, and the Stripe plugin is now ready.
3. **Full readiness certification** remains mandatory before **live** charges and before any “production-ready” claim — that is **P0-A + P1-5**, not a reason to postpone sandbox entitlement engineering.
4. **Model keys** are optional for sandbox payment plumbing; decide P0-B before inviting customers who expect model-quality artefacts.

**Order to speak in chat when ready:**

1. `build P1-1 catalog mapping` (no Stripe objects until you confirm the table)  
2. then `build P1-2 + P1-3 sandbox checkout + webhook entitlements`  
3. run **P0-A smoke** before `build P1-5 live cutover`

If founder priority is “zero card risk until journeys are proven,” swap to **`build P0-A smoke checklist`** first; keep Stripe as immediate next build.

---

## 4. Open decisions for founder

1. **First track:** Confirm **Stripe sandbox self-serve (recommended)** vs **P0-A smoke-first**.  
2. **Allowance defaults** per plan (e.g. Builder 2 / Founder 6 / Studio 12?) — today operator picks 1–24.  
3. **Subscription vs one-time** for £29/£99/£299 — marketing says monthly; entitlement code today is allowance-shaped, not renewal-shaped.  
4. **Tax:** enable Stripe Tax only with active UK/applicable registration; otherwise disclose tax handling.  
5. **Model mode for paying pilots:** require configured provider before self-serve goes live, or allow paid + simulated with clear labels?  
6. **Workspace binding:** pay from which workspace; can one customer activate multiple workspaces?  
7. **Career Stripe path:** leave dormant, or explicitly disable in UI/API to avoid wrong-plan checkout?  
8. **Voice:** stay optional footnote, or schedule P2-C after typed demo conviction?

---

## 5. Binding

- **P0 approved and shipped** (smoke note + provider posture + manual-path honesty). Next product build awaits founder `build P1-…` (or a named subset).  
- **Do not create Stripe Products/Prices** until P1-1 mapping is approved.  
- **Do not** force-push / rewrite published Lovable history.  
- **Do not** claim production-ready without checks on the exact release candidate (P0-A is smoke, not full certification).  
- Manual pilot activation remains the supported revenue path until P1-3 is proven in sandbox.

---

## Appendix — tip inventory (for this audit)

| Item | Status at plan time |
| --- | --- |
| Git tip | `f688e80` — Studio D3–D4 ship |
| Product spine / theatre / close-out | Shipped (see product-building + studio UX roadmaps) |
| Tavily Production | Env present; cited research verified earlier |
| Stripe on Vercel | Not observed in env name inventory; manual pilot only |
| Stripe Cursor plugin | Authenticated (founder context) |
| Model / Voice env | Likely missing / optional — foyer honesty path exists |
| `psi_*` migrations 0020–0023 | Applied to production Neon per `docs/roadmap.md` |
| Production-ready | **No** |
