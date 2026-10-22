> Superseded on 22 October 2026. Historical context only; DeliverX now focuses on an AI product company.

# DeliverX landing positioning — implementation report

**Branch:** `cursor/landing-positioning-929d`  
**Date:** 21 Oct 2026  
**Audit:** `docs/landing-enhancement-audit.md`

## 1. Verdict

Homepage and supporting marketing pages now lead with **Command Centre Stage 1** (supervised AI workforce preview, Wave 1 Available = 12 of 150) while keeping the **career evidence product** (Experience / Launchpad / Prove, £19 / £19 / £29) as an honest secondary path. No claim that the full catalogue is live.

## 2. Live vs GitHub deploy gap (diagnosis)

| Source                                      | Homepage lead                                                                   | Notes                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Live** https://deliverx.dev/              | Career-first — “Don't just learn the job…”                                      | Still serving the older Lovable / career marketing build            |
| **GitHub `main`**                           | Pre-landing commits (`2ba3428`) — Command Centre product code, career marketing | Landing PR **not merged**                                           |
| **PR #1** `cursor/landing-positioning-929d` | Workforce-first dual-product marketing                                          | Open draft: https://github.com/gnaneshwer23/swift-deliveries/pull/1 |

**Root cause:** Live deliverx.dev is **stale relative to the landing PR**. The workforce homepage exists on the PR branch and has never been merged to `main` or redeployed. Merging PR #1 alone may not update deliverx.dev if production still points at a Lovable (or other) host rather than this GitHub `main`.

**How to deploy to deliverx.dev**

1. Merge PR #1 into `main` on GitHub.
2. Confirm where the custom domain is attached:
   - If **Lovable**: publish/sync from the connected GitHub repo (or paste the merged build) in the Lovable project that owns `deliverx.dev`.
   - If **Vercel / Cloudflare / other**: trigger a production deploy from `main` and ensure the domain CNAME/A records still point at that project.
3. Smoke-check the live homepage for the hero line _“AI work that follows a plan. You stay in control.”_ and primary CTA **Open Command Centre**.

## 3. Homepage structure (§4 strategy)

1. **Hero** — “AI work that follows a plan. You stay in control.” + labelled Command Centre UI composition
2. **Mission types** — Investigate / Prototype / Improve
3. **How it works** — Mission → Plan → Approve → Execute → Deliver
4. **Meet the workforce** — registry-driven Available vs Planned (not “150 live”)
5. **Control and governance** — permissions, usage ceilings, approvals, audit
6. **Inspect deliverables** — Stage 1 artefacts / evidence labels
7. **What happens next** — honest roadmap (no false connectors/autonomy)
8. **Existing DeliverX products** — Experience / Launchpad / Prove as secondary path
9. **Final CTA + FAQs** → signup / Command Centre

## 4. Positioning decisions

| Claim                                 | Treatment                                                       |
| ------------------------------------- | --------------------------------------------------------------- |
| Supervised AI labour / Command Centre | Primary hero + primary CTA                                      |
| Wave 1 Available (12)                 | Explicit on home, how-it-works, workforce cards, FAQ            |
| Planned catalogue roles               | Labelled Planned; not assignable                                |
| Career Experience / Launchpad / Prove | Secondary section + existing paid CTAs                          |
| Career Verified                       | Unchanged — external attestation only                           |
| Workforce quality                     | Agent-reviewed / Automatically tested / … — never bare Verified |

## 5. Pages changed

- `/` — section-4 narrative rebuild + Command Centre composition
- `/how-it-works` — Path A Command Centre primary; Path B career method
- `/experience`, `/launchpad`, `/prove` — career positioning banner
- `/professional-workspace` — workspace vs Command Centre banner
- `/pricing` — early-access note + preserved Stripe checkout; copy clarifies separation
- `/resources` — Command Centre path added
- `/signup` — copy/meta for Command Centre entry
- Nav / footer / account menu / `CtaLink` — Command Centre as primary product entry

## 6. CTA map

| Intent            | Signed out                        | Signed in               |
| ----------------- | --------------------------------- | ----------------------- |
| Workforce primary | `/signup` → auth → `/command`     | `/command`              |
| Career plans      | `/pricing` (Stripe unchanged)     | Checkout dialog         |
| Experience        | `/signup` or workspace experience | `/workspace/experience` |
| How it works      | `/how-it-works`                   | same                    |

## 7. Design system

- Reused shipped `--x-*` / `.dxs` Editorial Precision structure (white paper, amber signal, hairline rules, compact radii).
- Additive CSS for workforce grid, brand-first hero split, Command Centre composition.
- No purple AI-slop theme; no parallel token layer; no invented testimonials/metrics/logos.

## 8. Registry usage

`WorkforcePreview` reads `listAssignableCapabilities()`, `WAVE1_AVAILABLE_IDS`, and selected Planned showcase IDs from `src/lib/workforce/registry`. Cards show Available vs Planned labels.

## 9. What was preserved

- Auth redirects to `/command` (already present)
- Stripe career checkout IDs and pricing amounts
- Evidence / attestation semantics and honesty copy
- Public URL paths for career products

## 10. Verification

- Run `bun run test` and smoke `:43123` after this pass (see latest agent session notes)
- Repo-wide `bun run lint` may still fail on large pre-existing prettier debt; format changed files with Prettier

## 11. Risks / follow-ups

- **Deploy gap** remains until PR #1 is merged **and** the host behind deliverx.dev is republished.
- Career ladder (`JourneyLadder`) remains on career pages; homepage no longer opens with Learn→Advance (intentional).
- Signup still runs PI onboarding before Command Centre for new accounts — product flow, not marketing-only.
