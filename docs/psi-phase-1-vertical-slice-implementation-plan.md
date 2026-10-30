# PSI Phase 1 vertical slice — implementation plan

**Status:** Complete for local Phase 1 scope (28 Oct 2026).  
**Baseline commit:** `904838ec06335dec4bf642ff4d2a16f815f67e4c` (R1–R9 + honesty limits).  
**Parent case:** `docs/business-case-deliverx-psi-v2.md` (v2.1) + `docs/business-case-deliverx-psi-v2.2-progressive-transparency.md`  
**Out of scope:** Phase 2–5 depth, production deploy, live billing policy, Watchtower runner, notifier delivery, file attachments on intake.

---

## Objective

Deliver a calm, evidence-grounded journey:

**Idea → commitment → background investigation → Intelligence Canvas → PM briefing → human next path → continuation outline → persistent project/portfolio → decision-pack export.**

Phase 1 here means the **product spine A–G** under progressive transparency, not the older marketing-only `docs/psi-phase-1-customer-story-and-scope.md`.

---

## Repository confirmation (pre-work)

| Item            | Finding                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Remote          | `origin` → `https://github.com/gnaneshwer23/swift-deliveries`                                                                   |
| Branch          | `main` (tracking `origin/main`)                                                                                                 |
| Uncommitted     | Only untracked `.cursor/` (excluded from commits)                                                                               |
| Framework       | TanStack Start + React 19 + Vite                                                                                                |
| Package manager | npm                                                                                                                             |
| Runtime         | Node v25.4.0 (local verification run)                                                                                           |
| Database        | Neon PostgreSQL via `@neondatabase/serverless` / `postgres`; missions in `psi_supervised_missions` when migrated                |
| Auth            | Neon Auth (`@neondatabase/auth`) + session hooks                                                                                |
| Primary routes  | `/command`, `/command/supervised/$missionId`, `/command/portfolio`, `/command/projects`, `/command/missions/$missionId`         |
| Background jobs | `/api/worker/tick` (workforce); supervised research pass runs on plan approval / worker paths — not a separate “fake chat” loop |
| Providers       | Tavily/Exa/Brave optional via env; deterministic stubs when absent                                                              |
| Tests           | `npm test` → Vitest under `src/`                                                                                                |

---

## Scope conflicts and blockers

| Topic                                            | Resolution                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| PT-1…PT-6 already shipped                        | Phase 1 audit **closes gaps against A–G**, does not rewrite PT work             |
| v2.2 labels attachments/notifier/runner deferred | UI and `honesty-posture` / canvas copy state limits explicitly                  |
| Phase 2 “project room depth”                     | Existing PT-2 nav is **used**, not expanded in this phase                       |
| Production readiness                             | Explicitly **not** claimed; local + unit/integration tests only                 |
| Live provider proof                              | Requires approved credentials/budget — marked unverified in verification report |

**Blockers for production (not Phase 1):** isolated Neon acceptance, notifier infra, Watchtower runner, paid allowance reconciliation on live Stripe.

---

## Bounded Phase 1 plan (executed)

### A — Idea intake + commitment before execution

- **Shipped:** `SupervisedMissionStart` + `buildInvestigationCommitment` (interpretation, scope, sources, limits, allowance line, attachments note).
- **Gate:** Specialist plan approval before evidence/research (`service.approvePlan`).

### B — Durable background investigation

- **Shipped:** `SupervisedMissionService` + `createMissionStore` (Neon JSON document); job lease fields; leave/return copy on canvas; recovery/cancel tests in `service.test.ts`.
- **Limit:** Full PostgreSQL recovery suite skipped unless `DATABASE_URL` set (`reliability.integration.test.ts`).

### C — Intelligence Canvas

- **Shipped:** `buildIntelligenceCanvas` + `IntelligenceCanvasPanel`; event-backed nodes; controls (background, notify preference, inspect, pause, cancel) with honest notify copy.

### D — Four recommendations

- **Shipped:** `verdict.ts` — `proceed_bounded_test`, `revise_proposition`, `pause_pending_evidence`, `do_not_pursue`; execution-limited pause when provider fails.

### E — PM briefing sections

- **Shipped:** `buildPmBriefingPack` + `PmBriefingPanel` — feasibility, demand, proposition, next investment; SWOT with basis; role disclosure.

### F — Human choice + disagreement

- **Shipped:** `decide` with `HumanNextPath`; `founder_requested_continuation`; recommendation preserved (`learner-lens.test.ts`, `verdict.test.ts`).

### G — Portfolio/projects + export

- **Shipped:** `command.portfolio`, `command.projects` + shelf; `exportMission` → MD + PDF (`decision-pack.ts`, `vertical-slice.test.ts`); PT-3 executive/full archive on same spine.

---

## Proposed file/schema changes (actual)

**No new migrations required for Phase 1 closure.** Recent additive fields use mission JSON (`studioMeta`, commitment surfaced in UI only).

| Area              | Files (representative)                                                                  |
| ----------------- | --------------------------------------------------------------------------------------- |
| Intake/commitment | `investigation-commitment.ts`, `supervised-mission-start.tsx`                           |
| Canvas/briefing   | `intelligence-canvas.ts`, `pm-briefing-pack.ts`, panels under `src/components/command/` |
| Honesty R9        | `honesty-posture.ts`, `honesty-posture-panel.tsx`                                       |
| Path artefacts R4 | `path-artefacts.ts`, `path-artefacts-panel.tsx`                                         |
| Portfolio R7      | `portfolio.ts`, `command.portfolio.tsx`                                                 |
| Server API        | `pilot-mission.functions.ts`, `service.ts`                                              |
| Tests             | `*.test.ts` under `src/lib/pilot-mission/`                                              |

---

## Verification approach

1. `npm test` — full Vitest suite (515 passed, 99 skipped at time of report).
2. Targeted `npm test -- src/lib/pilot-mission` — mission spine regressions.
3. Manual local demo — `docs/psi-phase-1-vertical-slice-local-demo.md`.
4. Live browser/auth/provider — **not** part of Phase 1 sign-off without env.

---

## Phase boundary

**Stop here.** Phase 2+ (deeper project room, archive at scale, monitoring runner, portfolio intelligence digests) requires separate founder approval per `docs/business-case-approval-standard.md`.
