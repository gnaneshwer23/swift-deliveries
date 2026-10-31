# DeliverX master vision vs repository — audit

**Recorded:** 31 October 2026 (UTC)
**Baseline:** `main` at `07b9989` (after `feat/studio-entry-dashboards`, Studio Screens 1–10)
**Source of truth:** _DeliverX Master Product Vision, End-to-End Experience, and GitHub Audit Brief_ v1.0 (31 Oct 2026), supplied by the founder.
**Related:** `docs/prd-deliverx-product-vision-e2e-brief.md` (earlier gap map, still valid), `docs/psi-phases-and-dashboards-audit.md`, `docs/psi-provider-posture.md`.

**Method:** traced routes, components, server functions, services, database tables, worker and tests in this repository. Ran `tsc`, `eslint` and `vitest` locally. Not done: no signed-in browser walkthrough, no live provider calls, no deployment checks. Vercel environment variables could not be listed (403), so production provider state is taken from `docs/psi-provider-posture.md`, not verified.

---

## 1. Executive summary

**What is truly built.** DeliverX has two engines that do not yet meet:

1. **Studio (front half)** — `/command` → `/command/supervised/$missionId`, stored in `psi_supervised_missions`. Polished Screens 1–10 cover idea → clarifying questions → investigation → PM briefing → discuss & decide → team → mission dashboard → delivery record → export. Real runtime work here is small: **three web searches** (Tavily/Exa/Brave, when a key is set) and **one optional model call** that drafts options. Everything else — team task status, "agents", progress — is **derived from the mission's stage**, not executed by agents.
2. **Workforce engine (back half)** — `wf_*` tables, `src/lib/workforce/*`, surfaced only under _Advanced · specialist planner_ on `/command`. It already has the brief's delivery loop: a DAG of lifecycle stages (charter → market/research/foresight → **PRD** → scope gate → **UX**, **architecture** → design gate → **prototype** → **verify** → **release pack** → release gate → evolution → publish), a durable worker with leases and retries, per-role instructions, handoff contracts, model-call recording, usage hard-stops, product memory and human-only gates.

The two are linked only for the Studio research pass (`psi_supervised_wf_links`, Phase A). **After the user decides in Studio, no delivery work runs**: "Begin delivery" only moves the screen to the dashboard.

**Bottom line:** the brief's front half (Screens 1–7) is largely implemented with honest labelling. The back half (Screens 8–13: team doing real work, iterative delivery, PRD/design/architecture/test outputs, full package) exists **in the workforce engine but is not connected to Studio**. The fastest MVP path is to connect them, not to build new agents.

Production posture (per `docs/psi-provider-posture.md`, not re-verified): **model mode off** (simulated drafts), **web research on** (Tavily), **checkout off**, voice off. The worker cron runs **once a day** (`vercel.json`: `0 5 * * *`).

Checks run on `07b9989`: `tsc` clean; `eslint` 0 errors (9 warnings); `vitest` 723 passed / 5 failed. All 5 failures are two DB integration files colliding when run in parallel on one database; each file passes alone (2/2 and 18/18).

---

## 2. Screen-by-screen status (13-screen map)

Status keys: **Functional** · **Partial** · **UI/sample only** · **Not found** · **Unverifiable** (needs browser/live env).

| #   | Screen                   | Status                               | Evidence                                                                                                                                         | Gap vs brief                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Marketing landing        | **Partial**                          | `src/routes/index.tsx` (hero "From product idea to continuous intelligence", CTA "Start building" → `/onboarding`), `src/components/marketing/*` | Brief headline/CTAs ("Turn an idea into a complete product project", "Start with an idea", "See how it works") not used; no sample project package to inspect.                                                                                                                                                                                                                 |
| 2   | Welcome / onboarding     | **Partial**                          | `studio-welcome-dashboard.tsx`, `/_authenticated/onboarding` (`dx_profiles`)                                                                     | Trust copy present. Two welcomes (onboarding route + Studio welcome) — decide which is canonical.                                                                                                                                                                                                                                                                              |
| 3   | Idea submission          | **Functional**                       | `studio-idea-dashboard.tsx`, `supervised-mission-start.tsx`, `mission-intake-draft.ts` (draft kept in browser)                                   | Example idea is an explicit action (good). Draft saved per browser only, not server.                                                                                                                                                                                                                                                                                           |
| 4   | Clarifying questions     | **Functional**                       | `studio-clarifying-dashboard.tsx`; skipped answers become labelled assumptions                                                                   | Questions are fixed, not chosen by Aria per idea.                                                                                                                                                                                                                                                                                                                              |
| 5   | Product Intelligence Map | **Partial**                          | `product-intelligence-map.ts/.tsx`, `intelligence-canvas.ts`, `research-pass.ts`                                                                 | States come from records (good). Six workstreams are fed by one 3-query search pass; "X% complete" uses invented weights (0.55 / 0.35). Agent nicknames (Scout, Maya, Rex…) are labels, not running agents.                                                                                                                                                                    |
| 6   | PM briefing              | **Partial**                          | `pm-briefing-pack.ts`, `pm-briefing-screen.ts`, `investigation-pm-briefing-stage.tsx`                                                            | Timeline and cost are shown only as bands for the investigation loop (`pm-brief.ts`, "not a money quote or product-build budget"); no estimate for **building** the recommended version and no technology suggestion (brief requires both). Option 1 is always tagged "Aria's recommendation" by position, not by any record. Options are simulated in production (model off). |
| 7   | Discussion with PM       | **Partial**                          | `pm-discussion-screen.tsx`, `decideSupervisedMission`                                                                                            | Quick actions save real decisions (good). **The chat is not about this mission**: `ConversationPanel` is the workforce chat; all 10 suggested prompts on Screens 5/6/7/10 parse as "start a new mission". Sample thread is a fixed food-waste exchange shown for every product.                                                                                                |
| 8   | Team formation           | **UI/sample only** (records-derived) | `team-formation-screen.ts`, `investigation-team-formation.tsx`                                                                                   | Team = continuation-plan role labels or the fixed 13-task pilot plan, mapped onto 14 catalogue nicknames by keyword. **Begin delivery is not a gate and starts nothing** (`onBeginDelivery={() => go(6)}`).                                                                                                                                                                    |
| 9   | Agent workspace          | **UI/sample only** (records-derived) | `agent-workspace-screen.ts`, `agent-workspace-panel.tsx`                                                                                         | Honest empty states; but there is no agent work to show because no specialist runs after the decision.                                                                                                                                                                                                                                                                         |
| 10  | Mission dashboard        | **Partial**                          | `mission-dashboard-screen.ts/.tsx`                                                                                                               | Cards read records. **Stage rail overstates**: an exported case with no prototype/build/QA shows Design, Engineering and QA as done. "Pending approvals" chosen by keyword (lists "Follow-up approved" as pending). PM chat issue as Screen 7.                                                                                                                                 |
| 11  | Timeline / roadmap       | **Partial**                          | `decision-roadmap.ts`; dashboard "Timeline" = last 12 activity events                                                                            | No stage roadmap with owners, dependencies, estimates and versioned changes. (`dependency-view.ts` + lifecycle wheel exist for workforce missions only.)                                                                                                                                                                                                                       |
| 12  | Evidence & decision log  | **Partial**                          | Dashboard "Evidence"/"Decisions" sections, `mission-inspection.ts`, evidence register in export                                                  | No single searchable log; labels are supplied/gap/assumption, not the brief's six (User-provided, Source-backed, Assumption, Sample, Conflicting, Unverified). Workforce engine has conflict detection (Phase 3c) unused by Studio.                                                                                                                                            |
| 13  | Final delivery package   | **Partial**                          | `supervised-zip.ts`, `executive-pack.ts`, `ExportButton`                                                                                         | ZIP has README, decision pack, roadmap, briefing, team collaboration, evidence register, prototype HTML, `project-manifest.json`. Missing PRD, personas/journeys, IA/flows, architecture, schema/API, test plan/results, analytics plan, launch checklist — all of which the workforce lifecycle can produce.                                                                  |

---

## 3. Agent execution matrix

Runtime = code that actually calls a model, search API or deterministic generator during a mission. Catalogue: **150 roles, 8 `available`, 142 `planned`** (`src/lib/workforce/registry`).

| Role / work                                                                                                                         | Where it runs                                                                      | What actually executes                                                                                                           | Output & persistence                                 | Status                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Studio research pass ("Market/Users/Competition" workstreams)                                                                       | `research-pass.ts`, `research-pass-worker.server.ts` via wf link                   | 3 web searches on the brief question; gaps recorded when no provider                                                             | Evidence items on `psi_supervised_missions.document` | **Runtime** (needs `TAVILY/EXA/BRAVE` key)                                                          |
| Studio option drafting ("Product Strategist")                                                                                       | `generate.server.ts` → `model-runner.server.ts`                                    | One JSON model call for options; PII screen; allowlist                                                                           | `mission.proposal` with model id or "not run"        | **Runtime if model mode on**; off in production → simulated                                         |
| Studio specialist tasks (frame, synthesise, challenge, structure, product brief, assemble pack, propose follow-up)                  | `specialist-team.ts › syncTeamWithMission`                                         | **Nothing** — marked `completed` when the stage/flags reach a point                                                              | Team plan in document                                | **Derived labels, not agents**                                                                      |
| Studio prototype ("build_prototype")                                                                                                | `prototype.ts › simulatedPrototypeHtml`                                            | Fixed HTML template + static checks                                                                                              | `mission.prototype`                                  | **Deterministic**; but labelled **"Model · <id>"** whenever option drafting used a model — mislabel |
| Aria (PM)                                                                                                                           | Briefing/discussion builders + `ConversationPanel`                                 | Deterministic synthesis from records; chat is the workforce intent parser                                                        | —                                                    | **No PM agent**; synthesis is template logic                                                        |
| Workforce lifecycle roles (charter, market, research, foresight, PRD, UX, architecture, prototype, verify, release pack, evolution) | `worker.server.ts` → `executor.ts`, `stage-artefacts.ts`, `model-runner.server.ts` | Per-task model call with role guidance, upstream artefacts, evidence and memory; contract-checked; else labelled simulated draft | `wf_artefacts`, `wf_task_runs`, `wf_events`          | **Runtime engine**, not reachable from Studio journey                                               |
| Conversation / voice                                                                                                                | `src/lib/conversation/*`                                                           | Intent parser (no model) + optional transcription                                                                                | `wf_conversation_*`                                  | Runtime for workforce missions only                                                                 |

---

## 4. End-to-end flow and persistence

```
Idea (browser draft) ──► create supervised mission (psi_supervised_missions)
  ──► approve plan ──► wf link → worker tick → research pass (3 searches)   [durable since Phase A; cron daily]
  ──► options (1 model call or "not run") ──► PM briefing (derived)
  ──► decide (saved, version-bound) ──► team formation (derived labels)
  ──► "Begin delivery" (navigation only) ──► dashboard (derived)
  ──► expectation / prototype template / observation / review / follow-up ──► ZIP export
```

Broken or missing handoffs:

1. **Decision → delivery work.** No task, worker job or artefact is created when the user approves a direction or clicks Begin delivery.
2. **Studio ↔ workforce artefacts.** PRD/UX/architecture/test stages exist only in `wf_*`; Studio cannot start, show or export them.
3. **PM chat ↔ mission.** Chat context loads `wf_missions` only; the Studio mission id is dropped (`respond.server.ts › loadContext`).
4. **Background cadence.** Worker cron is daily; approve relies on `waitUntil` (unverified live). "Aria returns with updates" has no notifier.
5. **Draft continuity.** Idea draft lives in browser storage, not the server.

---

## 5. Honesty check (progress, agents, sources, costs)

| Signal                              | Source                                           | Verdict                                                                           |
| ----------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| Map workstream states               | Persisted canvas/activity                        | Honest                                                                            |
| Map "% complete"                    | Weighted guess                                   | Relabel or define denominator                                                     |
| Dashboard stage rail                | Stage flags                                      | **Overstates** (marks unrun stages done after export)                             |
| Team/agent statuses                 | Derived from stage                               | Honest wording ("Planned"/"Not on this path"), but implies agents that do not run |
| "Aria's recommendation" on option 1 | Array position                                   | **Unsupported claim**                                                             |
| Prototype badge "Model · id"        | Option-drafting provenance                       | **Mislabel** — HTML is always the template                                        |
| Citations                           | Search results with URLs; links only for http(s) | Honest                                                                            |
| Usage                               | `usage_consumed/ceiling`, hard stop              | Honest                                                                            |
| Timeline / cost estimates           | Banded estimate for the investigation loop only  | Honest, but no build estimate (brief §6)                                          |

---

## 6. Conflicts to decide (brief §14 plus findings)

1. **Two mission models.** Keep Studio (`psi_supervised_missions`) as the user-facing case and run delivery on `wf_*` through the Phase A adapter (recommended), or migrate Studio onto `wf_missions`. Do not build a third.
2. **Which roles are "the team".** 150 catalogue roles, 8 assignable; Studio shows 14 nicknames. Recommend: team = roles actually assigned to wf tasks for this mission; nicknames only as display names of those roles.
3. **Model mode.** Real briefs, options and stage artefacts need `DXSI_MODEL_ENABLED` plus a provider key, allowlist and spend cap. Until then every artefact is a labelled simulated draft. Founder decision.
4. **Background cadence.** Daily cron cannot support "Aria returns with updates". Options: more frequent cron (plan-dependent), `waitUntil` chaining per step, or a queue.
5. **Code generation scope.** Brief lists frontend/backend code; current engine produces an HTML prototype only. Keep code generation out of MVP (brief non-goal: no production-grade promise) or scope a sandboxed scaffold later.
6. **Landing copy.** Current hero ("continuous intelligence") differs from the brief's. Decide before marketing work.

---

## 7. Prioritised backlog

### P0 — make the shipped journey truthful and connected

| #    | Item                           | Scope                                                                                                                                                                               | Acceptance criteria                                                                                       |
| ---- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0-1 | **Mission-aware PM chat**      | Give `ConversationPanel` a supervised-mission mode: questions answered from the case record (stage, blockers, evidence, decisions); never drafts a new mission from a Studio screen | All 10 Studio suggested prompts return case answers in tests; no `draft_mission` card from Studio screens |
| P0-2 | **Fix overstated status**      | Rail marks a stage done only when its own record exists; drop artefact→engineering; pending approvals from task/gate state, not keywords                                            | Exported case without prototype shows Design/Engineering/QA not done; "Follow-up approved" not pending    |
| P0-3 | **Remove unsupported labels**  | "Aria's recommendation" only when a recorded recommendation names an option; prototype badge from the prototype's own provenance                                                    | Tests for both; template prototype always reads "Simulated prototype"                                     |
| P0-4 | **Begin delivery = real gate** | Recorded user approval that starts phase 1 (see P1-1); button disabled with reason until a decision exists                                                                          | Event `delivery.approved` saved with actor/version; no work starts without it                             |
| P0-5 | **Stable test suite**          | Isolate fixture owners/workspaces in the two DB integration files                                                                                                                   | Full `vitest` green on one local DB, twice in a row                                                       |

### P1 — the MVP loop (idea → decision → team works → package)

| #    | Item                                   | Scope                                                                                                                                                                                                                                   | Acceptance criteria                                                                                        |
| ---- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P1-1 | **Delivery mission from the decision** | On delivery approval, create a linked `wf` product mission seeded from brief, evidence and chosen option (extend `workforce-adapter.server.ts`); stages PRD → UX → architecture → prototype → verify → release pack with existing gates | One approved Studio case produces wf tasks/artefacts in fixture Neon; gates block until approved in Studio |
| P1-2 | **Team = assigned wf roles**           | Team formation and agent workspace read wf tasks, runs, artefacts, handoffs for the linked mission                                                                                                                                      | Each card's tasks/outputs/evidence trace to `wf_*` rows; no catalogue card shows a status                  |
| P1-3 | **Dashboard/timeline from wf state**   | Rail, progress (defined denominator), active agents, pending gates from wf tasks; Screen 11 via `dependency-view.ts`                                                                                                                    | Progress = completed weighted tasks / total, documented; matches worker                                    |
| P1-4 | **Briefing estimates**                 | Extend the existing investigation bands with a build estimate for the recommended version: ranges with stated assumptions and method                                                                                                    | Shown as "Estimate" with basis; never as a commitment                                                      |
| P1-5 | **Full package**                       | Add wf artefacts (PRD, UX, architecture, test/verify report, release pack, decision + activity logs) to the ZIP and manifest with honesty labels                                                                                        | ZIP manifest lists each file's producer (model id / simulated) and approval                                |
| P1-6 | **Background cadence + updates**       | Step chaining after each task (or more frequent tick) and an inbox update when a stage completes                                                                                                                                        | A 6-stage mission completes without waiting for the daily cron; update shown on return                     |

### P2 — depth and reach

- Evidence & decision log page with brief's six labels, search, and Phase 3c conflicts.
- Server-side idea draft; Aria-chosen clarifying questions.
- Landing page aligned to the brief, with an inspectable sample package (labelled Sample).
- Learning pages tied to the user's own artefacts.
- Expand assignable roles beyond 8 as evaluations pass.

---

## 8. Recommended next slice

**P0-1 → P0-3 in one PR** (small, removes the misleading behaviour already in production), then **P1-1** as the first build slice.

Files for P0: `src/components/command/conversation-panel.tsx`, `src/lib/conversation/respond.server.ts`, `src/lib/conversation/interpret.ts`, `src/lib/pilot-mission/mission-dashboard-screen.ts`, `pm-briefing-screen.ts`, `pm-discussion-screen.ts`, `prototype.ts`, and their tests.

Files for P1-1: `src/lib/pilot-mission/workforce-adapter.server.ts`, `src/lib/workforce/lifecycle.ts`, `src/lib/workforce/plan-store.server.ts`, `src/lib/pilot-mission/service.ts › decide`, `src/components/command/investigation-team-formation.tsx`. Likely an additive migration extending `psi_supervised_wf_links.kind` (follow `docs/migrations-and-rollback.md`).

## 9. Verification plan

- `npx tsc --noEmit`, `npm run lint`, `npm test` with `PSI_TEST_DATABASE_URL` (all migrations applied).
- New unit tests per P0 item; fixture Neon test for P1-1 extending `phase-a-preview-acceptance.integration.test.ts`.
- Signed-in preview walkthrough of Screens 3→13 with model mode off (labels say Simulated) and, after founder approval, on.
- Not claimed by this audit: live production behaviour, provider output quality, Vercel env state.
