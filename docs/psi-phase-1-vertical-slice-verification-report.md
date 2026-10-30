# PSI Phase 1 vertical slice — verification report

**Date:** 28 October 2026  
**Revision:** `904838ec06335dec4bf642ff4d2a16f815f67e4c` (`main`)  
**Environment:** Local developer machine — macOS, Node v25.4.0, npm 11.7.0  
**Authorisation:** Local Phase 1 only — no staging/production deploy performed.

---

## Test commands and results

| Command                             | Result                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm test`                          | **Pass** — 78 files passed, 8 skipped; **515** tests passed, 99 skipped (Vitest 4.1.12, ~5s) |
| `npm test -- src/lib/pilot-mission` | **Pass** — 23 files passed, 1 skipped; **105** tests passed, 18 skipped (~1.7s)              |

**Mocked vs live**

| Area                                                                            | Mode                                                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Mission spine (`MemoryStore` in unit tests)                                     | Mocked in-memory persistence                                                                       |
| Research/comparison generators in tests                                         | Explicit `ran: false` / provider-not-configured fixtures                                           |
| Neon PostgreSQL (`reliability.integration.test.ts`, `neon.integration.test.ts`) | **Skipped** unless `DATABASE_URL` (or project test env) set — live DB **not verified** in this run |
| Tavily/Exa/Brave web research                                                   | **Not exercised** — no approved live provider run in this session                                  |
| Browser UI / auth signup                                                        | **Not run** in this session                                                                        |
| Stripe billing                                                                  | **Not run**                                                                                        |

---

## Screens and routes (code-backed)

| Route                            | Phase 1 role                                                               |
| -------------------------------- | -------------------------------------------------------------------------- |
| `/command`                       | Idea intake via `WorkspaceFoyer` / `SupervisedMissionStart`                |
| `/command/supervised/$missionId` | Intelligence Canvas, PM briefing, path choice, exports, honesty panels     |
| `/command/portfolio`             | Project list, filters, monitoring honesty (R7)                             |
| `/command/projects`              | Product shelf + supervised missions tied to projects                       |
| `/command/missions/$missionId`   | Workforce mission detail (adjacent; supervised case uses supervised route) |

---

## Acceptance criteria (A–G)

| ID  | Criterion                                            | Result          | Evidence                                                           |
| --- | ---------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| A   | Commitment visible before plan approval / spend      | **Pass**        | `investigation-commitment.test.ts`, `supervised-mission-start.tsx` |
| A   | Plan approval gates research                         | **Pass**        | `vertical-slice.test.ts` (blocks evidence until approve)           |
| B   | Durable mission document + job fields                | **Pass (unit)** | `service.ts`, `repository.server.ts`; live Neon **unverified**     |
| B   | Recovery / cancel surfaced                           | **Pass**        | `service.test.ts`, canvas `cancel` control                         |
| C   | Event-backed canvas, no fake interview theatre       | **Pass**        | `intelligence-canvas.test.ts`                                      |
| C   | Notify = preference only                             | **Pass**        | Canvas detail string; no delivery claim                            |
| D   | Four agent recommendations + execution-limited pause | **Pass**        | `verdict.test.ts`                                                  |
| E   | PM briefing dimensions + SWOT basis                  | **Pass**        | `intelligence-canvas.test.ts` (PM pack describe block)             |
| F   | Disagreement preserves recommendation                | **Pass**        | `learner-lens.test.ts`, `verdict.test.ts`                          |
| G   | MD + PDF decision pack                               | **Pass**        | `vertical-slice.test.ts` (`%PDF-` header)                          |
| G   | Portfolio/project persistence in UI                  | **Pass (code)** | `portfolio.test.ts`, routes; **manual UI unverified**              |

---

## Regression themes covered in tests (sample)

- Authority: workspace isolation, approval scope hash (`service.test.ts`)
- Provider absent: deterministic drafts, gaps labelled (`vertical-slice.test.ts`, `verdict.test.ts`)
- Counterevidence: PM pack / canvas nodes from gap statements
- Cancellation: export blocked when cancelled (`service.test.ts`)
- Commerce disclosure sections in pack (`commerce.test.ts`)
- PT-3 executive vs full archive (`executive-pack.test.ts`)

---

## Missing configuration (local demo)

| Variable / setup                                   | Needed for                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Neon `DATABASE_URL` + migrations                   | Persist missions across reload in dev                                            |
| Neon Auth env                                      | Sign-in to `/command`                                                            |
| `TAVILY_API_KEY` (or configured research provider) | Live cited web research — still human-gated                                      |
| Worker cron hitting `/api/worker/tick`             | Long-running workforce jobs (supervised path uses inline approval research pass) |

---

## Risks

1. **Owner-reported vs release-verified gap** — passing unit tests do not prove production isolation or cost reconciliation.
2. **Simulated comparison** — default env produces labelled deterministic options; must not be marketed as live model diligence.
3. **Notify / Watchtower** — preferences persist; delivery and scheduled checks are not live.
4. **Attachments** — intake deferred; paste-into-evidence only.

---

## Rollback

- **Code:** Revert to prior commit on `main` (avoid force-push per Lovable/AGENTS.md).
- **Database:** Mission documents are JSON blobs in `psi_supervised_missions`; rollback is forward-compatible additive schema only — no destructive migration in Phase 1 closure.
- **Docs:** Remove or supersede this report if a later phase invalidates assumptions.

---

## Verdict

**Phase 1 vertical slice (A–G): complete for local, test-backed scope.**  
Not production-ready. Live auth, Neon persistence, and provider-backed research remain separately verifiable.
