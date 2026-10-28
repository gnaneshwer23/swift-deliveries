# PSI Phase 1 vertical slice — independent verification

**Date:** 28 October 2026  
**Reviewer:** Independent agent review (Cursor)  
**Baseline reviewed:** `904838ec06335dec4bf642ff4d2a16f815f67e4c` (`main`)  
**Documentation commit reviewed:** `98c0213a0a4c410d54429c49193af9b2aa4753b6`  
**Method:** Read diffs, mission spine code, migrations notes, claimed reports under `docs/psi-phase-1-vertical-slice-*.md`; run local Vitest only (no deploy, no paid provider calls, no production data).

---

## Executive summary

The **A–G supervised decision spine is real domain logic**, not decorative UI: plan approval gates work, research passes append **persisted** `activity` events and evidence on the mission document, recommendations and human paths are recorded, and exports include honesty sections. The team’s **515 / 99 skipped** Vitest claim **reproduces** on this machine.

What is **not** proven here: signed-in browser flow, Neon JSON persistence end-to-end, live Tavily/Exa/Brave retrieval, Stripe allowance on live accounts, Watchtower scheduling, or notifier delivery. Those gaps are **partly acknowledged** in the Phase 1 docs; they must stay explicit in any founder-facing “complete” statement.

**Verdict:** **Accept with listed limitations** for the stated **local / test-backed** scope only. **Changes required** before any production or paid-pilot promise.

---

## 1. Confirmed working capabilities (with evidence)

| Area | Finding | Evidence |
| --- | --- | --- |
| Test baseline | `npm test` → **78 files passed, 8 skipped; 515 passed, 99 skipped** (~4.4s) | Independent run 28 Oct 2026, Node/npm per repo |
| Mission spine subset | `npm test -- src/lib/pilot-mission` → **105 passed, 18 skipped** | Same session |
| A — Plan gate | Evidence/comparison blocked until plan approval; approval runs research pass | `vertical-slice.test.ts` (approve → `research.pass.completed`, evidence length) |
| A — Commitment copy | Pre-start commitment panel derived from brief + allowance posture | `investigation-commitment.test.ts`, `investigation-commitment.ts` |
| B — Durability model | Mission document versioning, cancel blocks export, conflict on stale version | `service.test.ts` (isolation, cancel export, `expectedVersion`) |
| C — Canvas | Nodes/edges tied to activity/evidence; no fake interview theatre | `intelligence-canvas.test.ts`, `intelligence-canvas.ts` header contract |
| C — Research events | `runResearchPass` emits `research.pass.started/completed`, `research.external_gap`, `research.cited` | `research-pass.test.ts`; merged into mission in `service.approvePlan` |
| D — Four recommendations + execution limit | `deriveAgentRecommendation` paths; provider gap → `pause_pending_evidence` + `executionLimited` | `verdict.test.ts` |
| E — PM briefing | Dimensions/SWOT basis from register | `intelligence-canvas.test.ts` (PM pack block) |
| F — Disagreement | `founder_requested_continuation` preserves recommendation text | `learner-lens.test.ts` |
| G — Export | MD sections + PDF `%PDF-` header; sources not bundled | `vertical-slice.test.ts` |
| G — Archives | Executive vs full archive honesty | `executive-pack.test.ts` |
| Sources ↔ options | Deterministic options cite evidence ids; model parser rejects unknown basis | `generate.ts` (`parseModelOptions`, `draftOptions`) |
| Server workspace binding | Supervised server functions resolve workspace from **auth**, not client-supplied workspace id | `pilot-mission.functions.ts` (`workspaceFor` + `requireAuth` on handlers) |
| Workspace isolation (service) | Cross-workspace read/write rejected; row/document workspace mismatch dropped | `service.test.ts` (`missionFromRow` tamper case) |
| Intake draft hygiene | Session draft vs prepared brief merge rules | `mission-intake-draft.test.ts` |
| UI wiring (spot check) | Intelligence Canvas calls `saveSupervisedStudioMeta` / `cancelSupervisedMission` | `intelligence-canvas-panel.tsx` |
| Honesty R9 | Aggregated posture copy | `honesty-posture.test.ts` |

**Research persistence (clarification):** In default unit tests, persistence is **`MemoryStore` + in-memory mission JSON** (including `activity[]`). That is **not simulated theatre** — events are part of the saved mission. **`repository.server.ts`** maps the same document to `psi_supervised_missions`, but **live Neon was not exercised** in this review (`reliability.integration.test.ts` and `neon.integration.test.ts` skip without `PSI_TEST_DATABASE_URL` / `DATABASE_URL`).

**Live provider path (code, not run):** `research-pass.ts` calls `searchWeb` when keys exist; `research-pass.test.ts` proves cited URLs via **injected mock search**, not network.

---

## 2. Misleading or unsupported completion claims

| Claim | Assessment |
| --- | --- |
| “Phase 1 A–G complete for local/test scope” | **Supported** for **service-layer + Vitest** behaviour; **unsupported** if read as browser-verified or Neon-verified. |
| “515 tests passed” | **Supported** (reproduced). **99 skipped** includes all real-DB suites — must be quoted together. |
| “Research events persisted” | **Supported** in mission document model; **unsupported** as “proven on Neon” without integration env. |
| “Live web research / Tavily” | **Unsupported** in this review. Capability matrix correctly marks **Not exercised**. |
| “Portfolio/projects persistence in UI” | **Partially supported** — list/filter logic tested (`portfolio.test.ts`); **no** manual UI or screenshot evidence in repo. |
| “Notify when ready” | **Misleading if implied as delivery** — preference only; docs and `watchtower.test.ts` state runner/notifier not live. |
| “Watchtower monitoring” | **Preferences only** — not operational monitoring. |
| “Production-ready” | **Correctly denied** in verification report; any external message omitting that is misleading. |
| Phase 1 docs vs older `psi-phase-1-customer-story-and-scope.md` | Different artefact (marketing/pilot contract vs vertical slice A–G). Implementation plan acknowledges this; **do not conflate** when selling scope. |

---

## 3. Reproducible defects

| ID | Severity | Description | Reproduce |
| --- | --- | --- | --- |
| R1 | Low | `researchProvider` on mission is set only when `findingsCount > 0` after approve (`service.approvePlan`), so a provider run with **empty results** may leave `researchProvider` null even though `runResearchPass` saw `provider: "tavily"`. Verdict logic still treats empty retrieval via gaps / `webExpectedEmpty`, but UI labels keyed on `researchProvider` may under-report. | Approve plan with mocked empty Tavily results (`research-pass.test.ts` pattern); inspect mission fields after `approvePlan` wrapper. |
| — | — | **No failing Vitest** or blocking functional defect found in the default suite for the A–G spine. | `npm test` |

---

## 4. Security and data-isolation concerns

| Topic | Status | Notes |
| --- | --- | --- |
| Workspace scoping in service | **Good (tested)** | `MemoryStore` + `missionFromRow` mismatch handling in `service.test.ts`. |
| Workspace scoping on server API | **Design good; tests thin** | All reviewed supervised mutations use `requireAuth` + `workspaceFor()`; **no dedicated Vitest** for `pilot-mission.functions.ts` handlers (contrast: `access.server.test.ts` pattern for workforce). |
| Client trust | **Low risk for workspace id** | Handlers do not accept arbitrary `workspaceId` from client for supervised missions. |
| Export content | **Appropriate** | Pack states sources not bundled; includes human/agent paths and simulated generation labels (`decision-pack.ts`). |
| Live DB RLS / Neon | **Not verified here** | Skipped integration tests are the intended proof path. |
| Legacy Supabase | **Process risk** | Known gap in `known-gaps-and-risks.md`; not re-audited in this pass. |

---

## 5. Missing acceptance tests

- End-to-end **browser** journey: sign-in → start mission → approve → decide → export (Playwright or manual script).
- **Server function** contract tests: auth rejection, mission not found, version conflict surfaced to client.
- **Neon persistence**: run `reliability.integration.test.ts` on disposable `deliverx_phase1_*` DB (documented in `docs/psi-one-reliability.md`).
- **Live provider smoke** (founder-approved budget): one supervised mission with real key, assert `[Cited · …]` rows and no invented URLs on provider failure.
- **React Query refresh**: two tabs / reload mid-edit (`useVersionedDraft` stale banner) — logic exists in hook; no automated test tied to supervised route.
- **Portfolio/projects routes** with real list server functions (beyond helper unit tests).

---

## 6. Release-blocking issues (production / paid pilot)

1. No **isolated Neon + Neon Auth** acceptance run attached to this verification.  
2. No **live billing / allowance** reconciliation proof on Stripe-connected workspace.  
3. **Notifier** and **Watchtower runner** absent — features must stay labelled partial.  
4. **Simulated comparison default** without model keys — marketing must keep honesty labels (`executionLimited`, simulated generation).  
5. **Phase 4 runtime verification** called out in customer-story doc for paid pilot — not satisfied by Vitest alone.

---

## 7. Non-blocking improvements

- Set `researchProvider` from pass when provider ran, even if `findingsCount === 0`.  
- Add server-fn Vitest harness mirroring `access.server.test.ts` for supervised exports.  
- Optional: one Playwright smoke on `/command/supervised/$id` with mocked API.  
- Document explicit command for founders to run DB integration suite before staging sign-off.

---

## Comparison to team verification report (`98c0213`)

The team report at `docs/psi-phase-1-vertical-slice-verification-report.md` is **largely accurate** on test counts, mocked-vs-live table, and A–G mapping. This independent review **confirms** the Vitest numbers and core service behaviour, **does not contradict** honesty limits on notify/Watchtower/attachments, and **emphasizes**:

- UI and Neon paths remain **unverified** in both runs.  
- “Complete” must stay scoped to **local test-backed** spine, not pilot delivery.

---

## Commands run (this review)

```bash
npm test
npm test -- src/lib/pilot-mission
git show 904838e --stat
git show 98c0213 --stat
```

---

## Final verdict (exactly one)

**Accept with listed limitations** — for the stated **local / test-backed** Phase 1 vertical slice (A–G) at `904838e`, with Neon, auth UI, live providers, notifier, Watchtower runner, and production readiness **explicitly out of scope** until separately verified.
