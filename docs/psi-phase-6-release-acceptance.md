# Phase 6 — Release acceptance

**Branch:** `phase-6-release-acceptance` (based on main after Phase 5 merge)  
**Phase 5 merge on main:** `18e6813cfc6eaf4c19c370fba8ebe7648e616552`  
**Recorded:** 28 October 2026 (UTC)  
**Status:** Local and automated acceptance in **tested scope only**. This is **not** production certification. **Deployment remains a separate founder approval** even after this pull request merges.

## Purpose

Document and automate release acceptance for the six-phase PSI product path: supervised mission from brief submission through human gates, durable return, inspection, decision, and downloadable record — plus billing/allowance boundaries, provider-failure honesty, cancellation, and regression hooks for Quiet Studio / Phases 2–5.

## Journey under test (fixtures)

| Step | Behaviour verified | Primary evidence |
| --- | --- | --- |
| Submit | Mission created from brief; plan gate before evidence | `phase-6-release-acceptance.test.ts`, `vertical-slice.test.ts` |
| Approve | Plan approval runs research pass; compare unlocked | same |
| Leave | Canvas states leave allowed; mission persisted in store | `intelligence-canvas.test.ts`, Phase 6 journey test |
| Recover | Provider failure then retry; no double charge; reload idempotent | `service.test.ts`, Phase 6 recovery test |
| Return | Reload from same `MemoryStore` preserves version and activity | Phase 6 journey test |
| Inspect | Inspection surfaces attention + evidence; no invented dialogue | `mission-inspection.test.ts` |
| Decide | Owner decision binds proposal; briefing pack ready | Phase 6 journey test, `phase-5-briefing-export.test.ts` |
| Download | Export body/PDF, supervised ZIP, authorised snapshot | Phase 6 journey test, `supervised-zip.test.ts` |

All automated steps above use **`MemoryStore` and deterministic generator fixtures**. Files and tests are labelled **FIXTURE** in `phase-6-release-acceptance.test.ts`. No live Tavily, Exa, Brave, OpenAI, Stripe, or signed-in browser runs were performed for this report.

## Commands run (this acceptance pass)

```bash
# Phase 6 suite (new)
npm test -- src/lib/pilot-mission/phase-6-release-acceptance.test.ts
# Result: 6 passed (6) — 28 Oct 2026

# Regression bundle (Phases 1–5 supervised spine + P-paid gates)
npm test -- \
  src/lib/pilot-mission/phase-6-release-acceptance.test.ts \
  src/lib/pilot-mission/vertical-slice.test.ts \
  src/lib/pilot-mission/service.test.ts \
  src/lib/pilot/paid-availability.test.ts \
  src/lib/pilot/activation.test.ts \
  src/lib/pilot-mission/mission-inspection.test.ts \
  src/lib/pilot-mission/phase-5-briefing-export.test.ts \
  src/lib/pilot-mission/investigation-experience.test.ts
# Result: 53 passed (53) — 28 Oct 2026

# Full supervised mission module
npm test -- src/lib/pilot-mission/
# Result: 136 passed, 18 skipped (154) — 28 Oct 2026
# Skipped: reliability.integration.test.ts without PSI_TEST_DATABASE_URL / DATABASE_URL

# Full repository (informational — not merge gate for Phase 6)
npm test
# Result: 598 passed, 97 skipped, 2 failed — 28 Oct 2026
# Failures (pre-existing / environment): neon.integration.test.ts (wf_schema_version),
# auth config test when browser URL unset in local env — outside Phase 6 fixture scope
```

## Mocked vs live

| Area | Automated (fixtures) | Live / unverified |
| --- | --- | --- |
| Mission journey submit → download | **Pass** — MemoryStore + stub generators | Signed-in `/command` browser walkthrough |
| Billing workspace ceiling | **Pass** — `UsageLimitError` on new scope at ceiling | Stripe checkout, webhook, live allowance on Neon |
| Pilot activation allowance | **Pass** — unit tests (`paid-availability`, `activation`, `paid-activation`) | Operator UI on production DB |
| Provider compare | **Pass** — fail/retry/reload fixtures | Budgeted staging smoke with real API key |
| Neon crash / lease serialization | Skipped locally unless `PSI_TEST_DATABASE_URL` | `reliability.integration.test.ts` on disposable DB |
| Reduced motion (Phase 3) | **Pass** — `investigation-experience.test.ts` derivation | OS-level visual check (documented in Phase 3 doc) |
| Email / notify when ready | Preference only | No delivery proof |
| Watchtower runner | Simulated preferences | No scheduler proof |
| Vercel production deploy | N/A | **Separate approval** — not part of this PR |

## Acceptance checklist — six-phase plan

| Phase | Scope (roadmap) | Automated acceptance in tested scope | Gaps / live unverified |
| --- | --- | --- | --- |
| 1 | Customer story, vertical slice, reliability | Vertical slice, service isolation/recovery, canvas, commerce disclosure | Neon E2E, live providers |
| 2 | Public journey pages | Not re-screenshot; no regressions in supervised tests tied to product loop | Manual marketing QA |
| 3 | Pilot continuity, Quiet Studio, investigation UI | Investigation experience derivation; pause via studio meta; leave copy | Browser mandala / reduced-motion visual |
| 4 | Inspection inbox, durable compare | Mission inspection tests; service lease/cancel | Production signed-in inbox |
| 5 | Briefing + downloadable record | Phase 5 export/briefing tests in regression bundle | — |
| 6 | Controlled paid release / allowance gate | Phase 6 suite + P-paid unit tests | Self-service checkout; live Stripe; `PSI_PAYMENTS_LIVE_APPROVED` |

**Overall automated result in tested scope:** **Pass** (Phase 6 suite + regression bundle green).

## Billing and allowance boundaries (verified in fixtures)

- Deterministic compare with `cost: 0` / not-run generator does **not** charge (`chargedUnits: 0`).
- Provider-backed compare with `cost: 1` records one spend; reload of same scope does not double-charge.
- After workspace `usageCeiling` is consumed, a **new** comparison scope throws `UsageLimitError`; mission remains readable; commerce snapshot reports hard stop.
- Investigation start gate blocks when activation `remaining: 0` (`paid-availability.test.ts`).
- Provider research failure → `executionLimited` recommendation (distinct from evidence-substance pause) — `verdict.test.ts`, Phase 6 test.

## Cancellation and accessibility notes

- **Cancel:** After plan approval, pause (`saveStudioMeta.investigationPaused`) then cancel; export on cancelled mission rejected — Phase 6 test; extended in `service.test.ts`.
- **Accessibility:** Reduced-motion behaviour for investigation keywords is event-derived (Phase 3 tests). Honesty posture documents list/keyboard affordances (`honesty-posture.test.ts`). No new automated axe run in this phase.

## Remaining risks for production

1. **Deployment not approved by this PR** — Vercel production promotion, live secrets, and founder sign-off are separate.
2. **Live Stripe** — Products/prices documented; live keys, webhook, and `PSI_PAYMENTS_LIVE_APPROVED` not exercised here; Stripe live prices were not changed.
3. **Signed-in production journey** — No end-to-end browser proof on production Neon + auth in this pass.
4. **CI lint** — Main/PR CI may still report Prettier debt on unrelated files (observed on Phase 5 PR); fix or waive separately from acceptance logic.
5. **Integration tests** — `reliability.integration.test.ts` and `neon.integration.test.ts` require configured database; schema version drift caused one local full-suite failure unrelated to Phase 6 fixtures.
6. **Allowance after crash** — Proven only when integration DB tests run (`docs/psi-phase-one-reliability.md`).

## Rollback notes

- **Application:** Revert the Phase 6 merge commit on `main` (or close without merging). Phase 5 and earlier phases remain on main at `18e6813…` if Phase 6 is not merged.
- **Database:** Phase 6 adds tests and docs only — no new migrations. Pilot activation rollback follows `docs/migrations-and-rollback.md` (ledger entries for applied `psi_*` migrations).
- **Deploy:** Use Vercel rollback to the last known-good production deployment if a prior promotion caused regressions; this acceptance pass does not perform promotion.

## Merge gate for Phase 6 PR

- No **critical unresolved issues** in the **tested local scope** above (Phase 6 + regression bundle + `src/lib/pilot-mission/` green).
- **Does not** authorize production deployment.
- **Does not** merge itself — founder merges when satisfied; deploy is a **separate** step.

## Code references

| Artifact | Path |
| --- | --- |
| Release acceptance tests | `src/lib/pilot-mission/phase-6-release-acceptance.test.ts` |
| Allowance gate narrative | `docs/psi-phase-six-allowance-gate.md` |
| Production readiness backlog | `docs/psi-production-readiness-plan.md` |
| Phase capability matrix (Phase 1) | `docs/psi-phase-1-vertical-slice-capability-matrix.md` |
