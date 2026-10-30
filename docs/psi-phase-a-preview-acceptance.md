# Phase A — Preview acceptance (Studio ↔ wf worker)

**Recorded:** 30 October 2026 (UTC)  
**Audit baseline commit:** `176bbd7470a25e1214f9e6d97cc9b05910feb847`  
**Status:** Preview Neon **0034 applied**; deployed tick **configured in this PR**; signed-in browser E2E **not run** (deployment protection + no scripted test account in agent session).

## Purpose

Prove Phase A connection (supervised plan approval → `psi_supervised_wf_links` → `studio_research_pass` worker step → supervised document research pass) in **tested scope** before expanding teams/engineering factories.

## Neon preview branch `br-lively-water-zavqzat5`

| Step | Result |
| ---- | ------ |
| Preflight `neon.branch_id` | `br-lively-water-zavqzat5` |
| Table absent before apply | Yes (catalog-only) |
| Applied `drizzle/migrations/0034_psi_supervised_wf_links.sql` | Yes |
| Post-apply: table present, RLS on, `public` SELECT denied | Yes |
| Index count on `psi_supervised_wf_links` | 5 |
| Re-run migration | Idempotent (notices only) |
| Customer rows read | No |

**Note:** Vercel preview deployments also use **ephemeral** Neon branches (e.g. `preview/feat/phase-a-studio-worker-adapter` → `br-silent-sunset-za3mtwvg`). Those forks may predate 0034 on production; **0034 was also applied** to `br-silent-sunset-za3mtwvg` so the latest Phase A preview DB matches the adapter. The ledger row for `br-lively-water-zavqzat5` remains the canonical named preview branch in `docs/migrations-and-rollback.md`.

## Worker wake (`/api/worker/tick`, `waitUntil`, cron)

| Mechanism | Intended behaviour | Evidence (30 Oct 2026) |
| --------- | ------------------- | ---------------------- |
| **`kickWorker` + `waitUntil`** | After plan approval / bind, worker continues up to ~50s after the HTTP response on Vercel when `waitUntil` is available; otherwise detached promise + lease safety | Code: `src/lib/workforce/worker.server.ts` — **not re-verified on live approve** in this pass |
| **`GET/POST /api/worker/tick`** | Bearer `CRON_SECRET`; 503 if unset; drains wf steps + `drainQueuedResearchPasses` | Before this PR: deployed probe returned **503** “Worker tick is not configured.” (`CRON_SECRET` absent). **This PR adds `CRON_SECRET` to Vercel production + preview** and a **daily** cron in `vercel.json` (`0 5 * * *`, Hobby-safe). Redeploy required for env + cron. |
| **Mission reload drain** | `runQueuedResearchPass` on load when queue persisted | Fixture-covered in `service.test.ts`; same pass invoked from worker adapter |
| **Browser-only completion** | Not required when tick or nudge runs | Honest gap if nudge is cut off and cron has not fired yet |

Tick route also purges expired conversations (bounded) before worker work — see `src/routes/api/worker/tick.ts`.

## Automated journey proof (Neon fixture, not live providers)

**File:** `src/lib/pilot-mission/phase-a-preview-acceptance.integration.test.ts` (**FIXTURE** — local `deliverx_phase1_*` / CI Postgres with migrations through **0034**).

| Step | Verified |
| ---- | -------- |
| Idea / brief → approve plan (`deferResearchPass`) | Queue on supervised record |
| `bindSupervisedResearchWorkerAfterApproval` | Single wf link; idempotent re-bind |
| `bindSupervisedResearchWorkerAfterApproval` + `runQueuedResearchPass` (same fn as `executeSupervisedResearchWorkerStep`) | Supervised queue cleared; wf task `studio_research_pass` pending; **wf `usage_consumed` unchanged**; link stays `queued` until worker commit (worker lease commit covered in `worker.server.test.ts`) |
| Material brief edit after approval | Team approval cleared; `plan.approval_stale` activity |

**Commands (local / CI):**

```bash
npm test -- src/lib/pilot-mission/phase-a-preview-acceptance.integration.test.ts
npm test -- src/lib/pilot-mission/workforce-adapter.test.ts
npm test -- src/lib/pilot-mission/phase-6-release-acceptance.test.ts
```

CI applies `0033` + `0034` in `.github/workflows/ci.yml` before the full suite.

## Live vs fixture (honest)

| Area | Fixture / automated | Live preview / browser |
| ---- | ------------------- | ---------------------- |
| 0034 schema on named preview branch | **Applied** (`br-lively-water-zavqzat5`) | N/A |
| Adapter enqueue + worker step | **Pass** (integration test) | Not exercised signed-in on `/command` |
| Provider research (Tavily/OpenAI) | Simulated / not-configured paths in tests | Not run (minimize billable calls) |
| Reload preserves sources/gaps | Partial — Phase 6 MemoryStore journey | Not run on preview URL |
| Export matches store | Phase 5/6 fixture tests | Not run live |
| Retry / cancel / workspace isolation | `service.test.ts`, reliability integration (when DB URL set) | Not run live |
| `waitUntil` on deployed approve | — | **Unverified** post-deploy |

## Remaining gaps (from audit)

1. **Signed-in Studio walkthrough** on a preview URL with auth trusted origins and optional small provider budget.
2. **`waitUntil` reachability** on TanStack Start server functions after redeploy (fallback: tick cron + reload drain).
3. **Ephemeral preview branches** — new PR branches may need 0034 (or fork after production parent includes it); document in cutover checklist.
4. **Cron frequency** — daily on Hobby; sub-minute recovery needs Pro cron or external scheduler with bearer tick.
5. **Production customer data** — still out of scope; use isolated test accounts only.

## Related docs

- `docs/pilot-mission/studio-workforce-adapter.md`
- `docs/mission-worker.md`
- `docs/migrations-and-rollback.md` (§0034 ledger)
