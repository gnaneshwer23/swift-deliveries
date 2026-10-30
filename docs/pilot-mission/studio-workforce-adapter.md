# Studio ↔ workforce adapter (Phase A1)

**Status:** Implemented in code; migration `0034_psi_supervised_wf_links.sql` applied to production Neon `br-fancy-breeze-zatt9ocp` and preview Neon `br-lively-water-zavqzat5` on 30 Oct 2026 (ledger: `docs/migrations-and-rollback.md`). Automated enqueue → worker proof: `docs/psi-phase-a-preview-acceptance.md`.

## Authoritative ownership

| Concern | Authoritative store | Worker (`wf_*`) role |
| ------- | ------------------- | -------------------- |
| Customer brief, evidence, stages | `psi_supervised_missions.document` | Read-only via adapter during research pass |
| Specialist **plan approval** (human gate) | `document.team.approvedAt` / `approvedBy` | Mirrored into `wf_approvals` only as a **technical** enqueue binding; no second human gate in UI |
| Compare / decision approvals | `document.proposal` / `document.approval` | Not duplicated |
| Usage ceiling for investigation | `document.usageCeiling` + `psi_supervised_spend` / reservations | Linked wf mission uses **0** estimated usage; worker does not charge `wf_workspaces` for `studio_research_pass` |
| Research pass execution lease | `document.job` + `runQueuedResearchPass` | `wf_mission_tasks` lease + `wf_task_runs` for the same pass when link exists |
| Progress events (customer canvas) | `document.activity` | Selected kinds mirrored to `wf_mission_events` for inspectability |

## Link record

Table `psi_supervised_wf_links` connects one supervised mission scope revision to one `wf_missions` row:

- **`team_scope_hash`** — hash of brief/evidence scope plus team approval timestamp (invalidates on material brief edit).
- **`idempotency_key`** — `research_pass:{supervisedMissionId}:{team_scope_hash}`.
- **`status`** — `queued` → `running` → `completed` | `failed` | `cancelled`.

Code: `src/lib/pilot-mission/workforce-adapter.server.ts`.

## Runtime flow (A2)

1. Owner approves plan in Studio → `approveSupervisedPlan` persists queue on the supervised document and enqueues wf job (when DB link table exists).
2. `kickWorker` / `/api/worker/tick` claims `studio_research_pass` → adapter calls `runQueuedResearchPass` (same logic as mission reload drain).
3. Findings/gaps land on the supervised document → briefing/export paths unchanged.
4. Missing link table or provider keys → honest gaps on the document; wf task may fail or complete with gap-only evidence — never silent success with invented sources.

## Rollback

Prefer code rollback: stop calling the adapter; supervised missions and wf missions remain in DB. To drop the link table only, see rollback section for 0034 in `docs/migrations-and-rollback.md` (add when production applies).
