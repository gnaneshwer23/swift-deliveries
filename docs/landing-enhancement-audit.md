# Landing enhancement audit — DeliverX positioning

**Date:** 21 Oct 2026 · **Branch:** `cursor/landing-positioning-929d`  
**Live reference:** https://deliverx.dev/ · **Repo:** TanStack Start + Vite + Supabase

## 1. Classification

| Layer | Status | Notes |
| --- | --- | --- |
| Career product (Experience / Launchpad / Prove / Workspace) | **Shipped** | Paid £19 / £19 / £29; evidence ledger + external attestation semantics live |
| Marketing site (Editorial Precision + Learn→Advance ladder) | **Shipped (career-framed)** | White + amber (`--x-*`) tokens; homepage sells career journey only |
| Command Centre Stage 1 (`/command`) | **Shipped (early product / preview)** | Authenticated; Investigate / Prototype / Improve; deterministic planner/executor |
| Wave 1 capabilities (12 of 150) | **Available (preview)** | DX-001, 002, 011, 012, 018, 020, 021, 023, 035, 041, 049, 071 — assignable only |
| Full 150-role AI workforce | **Vision / Planned** | Catalogue in registry; must never be presented as live |
| Supervised-workforce public positioning | **In PR #1 (unmerged / undeployed)** | Live https://deliverx.dev/ still career-first; workforce homepage lives on `cursor/landing-positioning-929d` only until merge + host republish |
| Dual-product CTA / nav coherence | **Proposed (this brief)** | Primary workforce → `/command` (or signup→command); career CTAs stay on plans |

## 2. Route inventory (public marketing)

| Route | Role today | Positioning change needed |
| --- | --- | --- |
| `/` | Career hero + ladder + Evidence/Launchpad/Workspace | Lead with supervised workforce; keep career as second product |
| `/how-it-works` | Six-step career evidence method | Add Command Centre loop; keep career method |
| `/experience` | Paid simulation product | Frame as career product alongside workforce |
| `/launchpad` | Portfolio / readiness | Same — secondary product framing |
| `/prove` | Attestation ladder | Preserve Verified semantics; clarify vs workforce quality labels |
| `/professional-workspace` | Org delivery workspace | Distinguish from Command Centre |
| `/pricing` | Career Stripe checkout | Keep checkout; add early-access note for Command Centre |
| `/resources*` | Career guides | Mention workforce preview where relevant |
| `/signup` `/login` | Auth → already routes to `/command` | Messaging should mention both products |
| `/command*` | Authenticated Stage 1 | Not public marketing; primary product CTA target |

## 3. CTA / checkout baseline

- **Career:** `CtaLink` → `/signup` (signed-out) or `/workspace*` (signed-in); pricing uses Stripe embedded checkout (`experience_monthly`, `launchpad_monthly`, `complete_journey_monthly`).
- **Auth post-login:** `/login` and `/auth/callback` already navigate to `/command`.
- **Gap:** Homepage primary CTA still says “Get started” → career workspace path via `CtaLink` to `/workspace`. Must add workforce primary CTA targeting `/command` without breaking career checkout.

## 4. Design inconsistencies

- Design plans diverge: **Editorial Precision** (green, 2026-09-10) vs **white + amber Learn→Advance** (2026-09-19). **Shipped live** matches white/amber `dxs` / `--x-*` tokens.
- Older `--mkt-*` / green mesh utilities remain in `styles.css` but marketing pages use `dxs`.
- Decision for this pass: **reconcile with shipped `--x-*` Editorial-precision-structure** (hairline rules, compact radii, amber signal). Do not invent a parallel palette or purple AI-slop theme.

## 5. Messaging risks to avoid

- Do **not** claim “150 agents live” or “full AI workforce ready”.
- Do **not** reuse career **Verified** for workforce artefacts (use Agent-reviewed / Automatically tested / Human-reviewed / Externally attested).
- Do **not** invent logos, testimonials, or fake metrics.
- Label registry cards **Available** vs **Planned** honestly.

## 6. Files to change (implementation plan)

| Area | Files |
| --- | --- |
| Audit | `docs/landing-enhancement-audit.md` (this file) |
| Nav / footer / CTA | `marketing-nav.tsx`, `marketing-footer.tsx`, `cta-link.tsx`, `account-menu.tsx` |
| Homepage | `src/routes/index.tsx` + new marketing section components |
| Workforce marketing | New: `workforce-preview.tsx` (registry-driven cards) |
| Supporting pages | `how-it-works.tsx`, `experience.tsx`, `launchpad.tsx`, `prove.tsx`, `professional-workspace.tsx`, `pricing.tsx`, `resources*.tsx` |
| Styles | Minimal additive CSS under `.dxs` for new sections — reuse tokens |
| SEO | Update `head()` / JSON-LD on `/` for dual-product honesty |

## 7. Success criteria

Visitor understands in ~15 seconds: DeliverX is a **command centre for supervised AI work** (early preview), with a separate **career evidence product** still available. Wave 1 Available count is explicit. Career checkout and attestation rules unchanged.
