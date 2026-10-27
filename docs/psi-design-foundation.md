# PSI Phase 1 — shared identity and current baseline

25 October 2026. Baseline: main `677e4b9` (PR #24). This phase consolidates identity and records release gates; it does not certify the full product for production. No auth, data, provider, billing, route or permission behaviour changes.

## Design decision

Retain the approved illustrated identity. White and cool off-white surfaces, charcoal primary actions, indigo interactive states, pale lavender illustrations. Green means success/approval, amber means attention/pending and red means failure/destructive action; text labels must communicate the state as well. Do not use crimson/forest as a competing brand palette.

Canonical tokens live in `src/styles/psi-foundation.css`. Existing `--dx-*`, `--mkt-*`, utility-control and workspace tokens reference this foundation. Maintained homepage, platform, footer and handoff styles consume shared text/surface values. Asset pigments remain unchanged. Bespoke diagrams retain local colour values where they distinguish visual objects; migrating every historical CSS declaration is not required to establish the foundation.

| Role                          | Token/value                                      | Application                                  |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Canvas / surface              | `--psi-canvas` #F7F8FC / `--psi-surface` #FFFFFF | Quiet workspace and white cards              |
| Heading / action              | `--psi-ink` #202B43 / `--psi-action` #171923     | Readable headings / primary calls to action  |
| Body / supporting copy        | `--psi-text` #4E5B73 / `--psi-muted` #647089     | Body text and secondary labels               |
| Interaction                   | `--psi-indigo` #4C56C9                           | Selection, links, focus and directional flow |
| Selected surface              | `--psi-indigo-soft` #EEF0FF                      | Selected controls, never success indication  |
| Illustration tint             | `--psi-lavender` #F2EFFB                         | Explanatory imagery, not dense tables        |
| Success / attention / failure | #16724E / #8B570B / #B42318                      | Semantic state with a written label          |

Inter remains the interface family. Primary actions use charcoal; task selections and active navigation use indigo. Focus is a visible 3px indigo outline with 4px offset across marketing, onboarding and the workspace. Preserve keyboard semantics, browser zoom and reduced-motion behaviour. No new decorative animation.

## Current route and claim matrix

| Surface                                                                         | Purpose and boundary                                                                                    | Next acceptance work                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/`                                                                             | Introduce connected evidence, judgement, delivery and feedback through approved illustrative scenes     | Phase 2: full link/content/accessibility inventory             |
| `/psi`                                                                          | Explain architecture and shared record; examples do not prove a completed mission                       | Phase 2: clarify unique page purpose, avoid repetition         |
| `/how-it-works`                                                                 | Inspect one hypothetical mission and example documents                                                  | Phase 2: verify all handoffs/downloads                         |
| `/ai-agents`                                                                    | 150 catalogue roles across 15 registry departments; availability differs from live execution/evaluation | Phases 2/4: inspect directory and actual participation         |
| `/product-brain`                                                                | Explain traceability and current record; complete knowledge graph remains roadmap                       | Phases 2/5: validate evidence/version boundaries               |
| `/solutions`                                                                    | Starting points for relevant product questions                                                          | Phase 2: preserve edited starter briefs                        |
| `/security`                                                                     | Explain implemented safeguards without certification claims                                             | Phases 2/6: match claims to retained test/operational evidence |
| `/pricing`, `/pilot`, `/resources`                                              | Paid scope, enquiry and editable brief; account creation does not activate paid access                  | Phases 2/6: journey and selected billing path                  |
| `/login`, `/signup`, `/login/forgot`, `/onboarding`                             | Auth and resumable first-mission context                                                                | Phase 3: recovery, refresh, error and continuation acceptance  |
| `/command`, `/command/capabilities`, `/command/projects`, `/command/programmes` | Authenticated work, specialist catalogue and records                                                    | Phase 4: status provenance and next-action audit               |
| `/command/supervised/$missionId`, mission/programme detail                      | Owner decisions, artefacts, supplied outcome and follow-up                                              | Phase 5: full accepted journey and failures                    |
| `/about`, legal pages                                                           | Company positioning and policy information                                                              | Phase 2/6: policy/product consistency                          |
| `/experience`, `/launchpad`, `/professional-workspace`                          | Retired career URLs redirect to resources/how-it-works                                                  | Keep intentional redirects; preserve historical data           |

Shared product language already exists in `src/lib/psi-journey.ts`: Evidence & memory / Judgement / Delivery / Feedback loop. Global SEO fallback now uses Product Super Intelligence and the bounded product workflow, replacing career positioning. Route-specific metadata remains authoritative.

## Branch consolidation inventory

Read-only comparison after fetch against `677e4b9`. Counts are commits unique to each remote branch, not a claim that old branch behaviour is approved.

| Remote branch                                        | Unique commits | Disposition                                                                                      |
| ---------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `origin/cursor/fix-login-929d`                       | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/cursor/landing-positioning-929d`             | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/context-handoff-redesign`               | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/homepage-product-story`                 | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/marketing-brand-footer`                 | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/mission-record-reader`                  | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/neon-migration`                         | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/pricing-pilot-redesign`                 | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-clear-customer-journey`             | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-context-and-lifecycle`              | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-example-mission-experience`         | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-illustrated-journeys`               | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-journey-alignment`                  | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-mission-learning-trust`             | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-phase-one-reliability`              | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-platform-redesign`                  | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-production-foundation`              | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-secondary-page-journeys`            | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/psi-section-explorers`                  | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feat/resources-brief-builder-design`         | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/feature/openai-dxsi-provider`                | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/fix/restore-mission-illustrations`           | 0              | Already contained in main; retain, no remerge.                                                   |
| `origin/redesign/premium-enterprise-saas`            | 7              | PR #4: conflicting historical refresh; extract useful principles only after current-code review. |
| `origin/ux/deliverx-command-centre-redesign-2026-10` | 0              | Already contained in main; retain, no remerge.                                                   |

No remote branch was merged, deleted or rewritten as part of this inventory. PR #4 uses outdated career guidance and an initials-regex regression was flagged; its design document is not current product authority. Its focus, hierarchy and consistent-control principles are incorporated without importing the historical shell.

## Production acceptance still open

Historical documents are snapshots, not live status dashboards. In particular, `psi-prd-implementation-status.md` predates outcome/follow-up work and must not be used to claim those features are wholly absent today. `psi-production-readiness-plan.md` predates merged Neon/provider changes. Both now carry a historical notice.

Use `psi-phase-one-reliability.md` for reliability implementation and retained acceptance gaps; `psi-dashboard-landing-alignment.md` for shared journey implementation; the newer page-specific design documents for approved public work. Historical test counts are not fresh candidate verification.

Outstanding release acceptance: complete signed-in journey/recovery and two-workspace checks; bounded provider evaluation and currency-cost reconciliation; unattended dispatch/recovery where promised; current production schema inventory/dry run; actual backup/restore, alerts, reconciliation and rollback; selected paid-pilot billing/entitlement path. Do not infer these pass from successful visual deployment.

## Phase 1 verification

Representative surfaces: homepage problem section, authenticated specialist workspace and sign-in. Verify shared tokens, selected states, focus, existing mobile navigation and no horizontal overflow at 390/768/1440px. Automated candidate checks: lint, TypeScript, test suite and production build. Record actual results in the PR, including skipped tests; no claim of full authenticated business-flow acceptance in this visual phase.

Local candidate checks: TypeScript and production build pass; lint has zero errors and nine pre-existing warnings. Local test suite: 183 passed, 25 skipped (environment-dependent checks are not counted as passed). CI must independently run its isolated database suite before merge. Shared palette contrast checks range from 4.69:1 (supporting text on canvas) to 17.50:1 (primary action text). Browser checks cover the signed-in specialist explorer at desktop/mobile, public comparison at desktop/tablet/mobile, mobile menu open/close and signed-out authentication keyboard focus; no mission, approval, credential or customer record was changed.
