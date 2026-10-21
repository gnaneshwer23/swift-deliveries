# DeliverX landing positioning — implementation report

**Branch:** `cursor/landing-positioning-929d`  
**Date:** 21 Oct 2026  
**Audit:** `docs/landing-enhancement-audit.md`

## 1. Verdict

Homepage and supporting marketing pages now lead with **Command Centre Stage 1** (supervised AI workforce preview, Wave 1 Available = 12 of 150) while keeping the **career evidence product** (Experience / Launchpad / Prove, £19 / £19 / £29) as an honest secondary path. No claim that the full catalogue is live.

## 2. Positioning decisions

| Claim | Treatment |
| --- | --- |
| Supervised AI labour / Command Centre | Primary hero + primary CTA |
| Wave 1 Available (12) | Explicit on home, how-it-works, workforce cards, FAQ |
| Planned catalogue roles | Labelled Planned; not assignable |
| Career Experience / Launchpad / Prove | Secondary section + existing paid CTAs |
| Career Verified | Unchanged — external attestation only |
| Workforce quality | Agent-reviewed / Automatically tested / … — never bare Verified |

## 3. Pages changed

- `/` — full narrative rebuild (problem, approach, workforce, execution, evidence, preview, use cases, trust, access, FAQ, CTA)
- `/how-it-works` — Path A Command Centre + Path B career method
- `/experience`, `/launchpad`, `/prove` — career positioning banner
- `/professional-workspace` — workspace vs Command Centre banner
- `/pricing` — early-access note + preserved Stripe checkout
- `/resources` — Command Centre path added
- `/signup` — copy/meta for Command Centre entry
- Nav / footer / account menu / `CtaLink` — Command Centre as primary product entry

## 4. CTA map

| Intent | Signed out | Signed in |
| --- | --- | --- |
| Workforce primary | `/signup` → auth → `/command` | `/command` |
| Career plans | `/pricing` (Stripe unchanged) | Checkout dialog |
| Experience | `/signup` or workspace experience | `/workspace/experience` |
| How it works | `/how-it-works` | same |

## 5. Design system

- Reused shipped `--x-*` / `.dxs` Editorial Precision structure (white paper, amber signal, hairline rules).
- Additive CSS only for workforce grid, hero brand mark, positioning banner.
- No purple AI-slop theme; no parallel token layer; no invented testimonials/metrics/logos.

## 6. Registry usage

`WorkforcePreview` reads `listAssignableCapabilities()`, `WAVE1_AVAILABLE_IDS`, and selected Planned showcase IDs from `src/lib/workforce/registry`. Cards show Available vs Planned labels.

## 7. What was preserved

- Auth redirects to `/command` (already present)
- Stripe career checkout IDs and pricing amounts
- Evidence / attestation semantics and honesty copy
- Public URL paths

## 8. Verification

- `bun run test` — 63 passed, 14 skipped
- `bun run build` — success
- Smoke HTTP 200 on `/`, `/how-it-works`, `/experience`, `/launchpad`, `/prove`, `/professional-workspace`, `/pricing`, `/resources`, `/signup`, `/login` via `:43123`
- Repo-wide `bun run lint` still fails on large pre-existing prettier debt; changed core files formatted with Prettier

## 9. Risks / follow-ups

- Career ladder (`JourneyLadder`) remains on career pages; homepage no longer opens with Learn→Advance (intentional for workforce lead).
- Professional Workspace and Command Centre may still confuse some visitors — banners help; a dedicated comparison page could follow.
- Signup still runs PI onboarding before Command Centre for new accounts — product flow, not marketing-only.

## 10. Review artefacts

- Feature branch: `cursor/landing-positioning-929d` (pushed to Origin remote)
- Draft PR: **blocked in this environment** — Origin `pr create` rejects `repoKind=agent_temp`; GitHub remote has no authenticated credentials (no token invented). Open a draft PR from this branch into `main` on https://github.com/gnaneshwer23/swift-deliveries once GitHub auth is available, or promote via the Cursor agents UI if it mirrors the branch.
- Audit: `docs/landing-enhancement-audit.md`
- This report: `docs/landing-enhancement-report.md`
- Dev server: port **43123** (tmux `deliverx-dev`) — left running
