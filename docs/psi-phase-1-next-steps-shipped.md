# PSI Phase 1 — post-verification next steps (shipped slice)

**Date:** 28 October 2026  
**Authority:** Founder message “build next steps” after independent review  
**Baseline:** `904838e` (Phase 1 vertical slice)  
**Review input:** [psi-phase-1-independent-verification.md](./psi-phase-1-independent-verification.md)  
**Scope:** Local-safe fixes and tests only — no deploy, no paid providers, no Stripe policy changes.

---

## What shipped in this slice

| Item                                 | Change                                                                                                                                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1 — empty retrieval attribution** | `SupervisedMissionService.approvePlan` now sets `researchProvider` from the research pass whenever a provider ran (`pass.provider`), including zero-hit Tavily/Exa/Brave runs — not only when `findingsCount > 0`.             |
| **Service tests**                    | Regression for empty-provider attribution; **pause vs cancel** (paused blocks `runAlternatives`; cancel remains allowed; studio meta blocked after cancel).                                                                    |
| **Server-fn guards**                 | `src/lib/pilot-mission.functions.test.ts` — static checks that every supervised handler uses `requireAuth`, resolves `workspaceFor(context…)`, scopes mutations with `workspace.id`, and validators omit client `workspaceId`. |
| **Phase 2 residual audit**           | P-B continuation plan, P-C case room, and PT-2 project room IA are **already marked shipped** in [phases/README.md](./phases/README.md) (28 Oct 2026). No case-room or continuation rewrites in this slice.                    |

---

## Tests run (this slice)

```bash
npm test -- src/lib/pilot-mission src/lib/pilot-mission.functions.test.ts
npm test
```

**28 Oct 2026 run:** focused `src/lib/pilot-mission` + functions guards → **154 passed, 18 skipped** (24 files); full `npm test` → **564 passed, 99 skipped** (79 files). Prior independent baseline was 515 passed.

**Paid provider usage in tests:** none — Tavily/Exa paths use injected `search` mocks only.

---

## Remaining limitations (unchanged)

| Gap                                                           | Status                                                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Signed-in browser journey (start → approve → decide → export) | No Playwright in repo — **documented gap**, not introduced here                                                                 |
| Neon JSON persistence end-to-end                              | Run `reliability.integration.test.ts` / `neon.integration.test.ts` with disposable `deliverx_phase1_*` DB when founder approves |
| Live Tavily/Exa/Brave smoke                                   | Founder-approved budget only                                                                                                    |
| Stripe allowance on live workspace                            | Out of scope                                                                                                                    |
| Notifier delivery / Watchtower scheduled runner               | Preferences only — out of scope for this slice                                                                                  |
| Staging or production deploy                                  | **Requires founder approval**                                                                                                   |

---

## Founder approval still required before

1. **Neon + Neon Auth** acceptance on an isolated database
2. **Staging / production** promotion
3. **Paid pilot** (live billing reconciliation, live research smoke)
4. **Notifier** and **Watchtower runner** delivery
5. **Playwright** (or equivalent) supervised route smoke, if desired

---

## Related docs

- [psi-phase-1-independent-verification.md](./psi-phase-1-independent-verification.md) — verdict and defect R1
- [phases/README.md](./phases/README.md) — P-B / P-C / PT-2 shipped status
- [psi-phase-1-vertical-slice-known-gaps-and-risks.md](./psi-phase-1-vertical-slice-known-gaps-and-risks.md)
