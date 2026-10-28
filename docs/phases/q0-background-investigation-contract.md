# Q0: Quiet investigation reconciliation

Date: 28 October 2026. Status: documentation-only Phase 0 delivered for review.
Inspected baseline: `14aac51` on `gnaneshwer23/swift-deliveries` main.
Q1 through Q6 below are proposals, not implementation or deployment approval.

## Product contract and precedence

The latest founder clarification refines Quiet Studio: one expressive, Mandala-inspired central visual, contextual keywords and meaningful updates, with real background specialists and collaboration inspectable during and after work. It does not restore an activity-heavy dashboard.

Business Case v2.1, its progressive-transparency amendment and existing approval/security rules remain applicable. The latest clarification controls presentation: meaningful motion is welcome, mandatory agent management is not. The reference is inspiration, not permission to copy its assets.

The product promise is: approve a bounded investigation, leave, return to a defensible briefing and inspect its recorded evidence and collaboration. Motion is not proof of execution. No fabricated conversations, percentages, elapsed-work claims or retrospective reasoning histories.

## Repository and change safety

- Stack: TanStack Start/Router, React 19, TypeScript, Vite, Tailwind, Neon PostgreSQL and Neon Auth. npm lockfile and CI use Node 24 with `npm ci --legacy-peer-deps`.
- Read `AGENTS.md`, phase index and migration/rollback guidance. No root `.cursor` directory found in this baseline; local untracked Cursor rules are outside this review.
- Original checkout remains on `fix/paid-launch-phase-2` with three modified tracked files and an untracked `0024_psi_paid_entitlements.sql`. Nothing was reverted or stashed.
- That unfinished patch predates Cursor's Stripe activation model and intentionally permitted demo workspaces. Its migration number collides with `0024_wf_durable_missions.sql`. Do not merge or apply it; reassess any useful logic against current commercial policy.
- Q0 is isolated in a separate checkout. No application, infrastructure, schema or live settings change.
- Existing main merges trigger Vercel production deployment. Do not merge this documentation branch without release approval; branch pushes may also create automatic previews. No explicit deployment command is part of Q0.

## Capability map

All implemented statuses below mean code inspected, runtime unverified in this audit. Existing tests were located, not executed; prior test reports are not fresh verification.

| Capability | Status and evidence | Gap against target |
| --- | --- | --- |
| Authentication | Implemented: `src/lib/auth/middleware.ts`, `verify.server.ts`; server functions verify JWTs | Real sign-in and token refresh not exercised |
| Workspace isolation | Implemented: `src/lib/pilot-mission.functions.ts` resolves owner workspace; `pilot-mission/repository.server.ts` scopes reads | Fresh cross-workspace API/DB acceptance required |
| Case persistence | Implemented: `psi_supervised_missions` document and optimistic versioning in `repository.server.ts` | Research progress is not checkpointed per provider step |
| Research | Partial: `pilot-mission/service.ts` `approvePlan` awaits `runResearchPass`, then saves; `research-pass.ts` records findings or gaps | Request-coupled execution; interruption can lose partial findings; concurrent approvals can retrieve before save conflict |
| Durable execution | Partial for Studio: `workforce/worker.server.ts` has leases, attempts, approvals and commits for `wf_missions` | No inspected integration routes supervised research through this worker |
| Scheduling | Partial: `src/routes/api/worker/tick.ts` checks bearer secret; `vercel.json` has no schedule | External scheduler and deployed wake-up behaviour unverified |
| Budgets | Implemented for comparisons: `pilot-mission/reservations.server.ts`; start policy in `pilot/paid-availability.ts` | Retrieval spend/in-flight limits need explicit authority; workspace units are not automatically currency budgets |
| Collaboration | Partial: `specialist-team.ts`, `case-room.ts`, continuation projections and workforce task infrastructure | Prove actual invocation-to-invocation consumption, not inferred cooperation from role names |
| Recommendations | Implemented with fallback: `verdict.ts`, `generate.ts`, `research-pass.ts` | Fixtures and deterministic drafts are not live diligence; execution failure must remain distinct from evidence-based pause |
| Quiet UI | Implemented: `workspace-foyer.tsx`, `mission-theatre.tsx`, `quiet-status.ts` | Recovering leases currently appear as Investigating; broaden truthful state distinctions |
| Inbox | Partial: `quiet-studio-notifications.tsx` derives rows from missions | Not a persisted notification outbox; only cancelled/follow-up-approved entries filtered out |
| External delivery | Not found in inspected supervised path; `studio-meta.ts` and honesty copy describe preferences | No reliable result-ready email/push delivery demonstrated |
| Exports | Partial: `decision-pack.ts`, `executive-pack.ts`, `supervised-zip.ts`, `decision-roadmap.ts` | Decision ZIP embeds PDF as base64 text; full snapshot/version/date completeness requires acceptance tests |
| Voice | Existing channel code under `src/lib/conversation`, browser input/listening surfaces | Equivalent authority, disconnect and cancellation behaviour unverified here |
| Watchtower | Preferences only: `watchtower.ts` | Scheduled monitoring is not implemented by these preferences |

## Architecture decision: extend, do not replace

Retain Neon, authentication, current routes and the existing worker infrastructure. Do not add Temporal or LangGraph in this slice. Use one execution authority, while preserving the supervised case as the customer-facing domain record.

Q1 must add an explicit link between a supervised case/scope revision and its worker job. The adapter must avoid duplicating ownership, approval or budget authority across `psi_*` and `wf_*`. Define which fields are authoritative before adding schema; do not copy a whole case into a second independently mutable record.

1. An authenticated approval transaction validates workspace, exact scope/version and applicable authority, then persists approval plus a uniquely keyed queued job.
2. The worker claims a lease and checks cancellation, approval, tool permissions and remaining reservations before dispatch.
3. Each provider step records its attempt and persists evidence/output references before dependent steps can run.
4. Retry only known safe work. Unknown provider outcomes require reconciliation or provider-supported idempotency; never promise exactly-once external execution.
5. Persist result readiness and a deduplicated in-app inbox event in one transaction.
6. Browser and voice clients submit commands and read state; neither owns scheduling or advances the mission through polling.

Reuse the existing worker tick, with scheduler activation separately approved. Test lease fencing, expired claims, stop/pause checks and current worker charging before adopting them for investigation. Existing code alone does not establish these guarantees for Studio.

### Proposed record contracts

- Execution: workspace/case/mission IDs, scope and proposition versions, approval ID, task and attempt IDs, lease/fencing value, status, idempotency key, timestamps, reserved usage and disposition.
- Evidence: stable ID, source reference, retrieved/observed timestamps (unknown explicitly null), origin, supported/challenged claims, permitted storage and artefact version.
- Handoff: sender/recipient invocation IDs, input versions, evidence references, uncertainty, requested action, received/used/rejected state, resulting artefact or unresolved reason.
- Decision: immutable recommendation version, concise rationale and limitations, supporting/counterevidence references, human choice, disagreement and separately approved next scope.
- Event: stable ID, workspace/case/task/attempt, event type, occurrence time, concise factual summary and referenced outputs. No hidden model reasoning.
- Inbox/outbox: recipient/workspace, event type, dedupe key, case version, delivery/read status and preference snapshot; do not store secrets in messages.

These are proposed additive contracts, not approved migrations. Choose the next migration number from current main, follow `docs/migrations-and-rollback.md`, and apply only to a disposable DB until explicitly authorised.

## Screen and motion contract

| Surface | Disposition |
| --- | --- |
| Studio command input | Retain; primary idea and instruction entry |
| Central investigation visual | Refine in Q3; one focal visual with contextual keywords and meaningful updates |
| Inbox and projects | Retain/refine; only actionable events belong in attention list |
| Project briefing | Recommendation, strongest support/counterargument, uncertainty, next decision and downloads remain visible |
| Team, evidence, activity and graphs | Retain; on-demand inspection during and after work |
| Agent catalogue/office and legacy planner | Demote, never delete without approval |
| Existing routes and recorded history | Preserve |

Keywords derive from persisted approved scope or task/evidence events; distinguish planned topics from completed findings. Decorative motion may indicate liveness only, never completion. Updates reference event IDs. Never announce a handoff as consumed until consumption is recorded. Show queued, working, awaiting approval/evidence, paused, interrupted, failed, cancelled and complete distinctly. Provide reduced-motion and accessible list alternatives; do not announce every animation frame to assistive technology.

## Export and notification contracts

Exports use one authorised versioned snapshot with export timestamp. Recheck workspace access at download. Include readable PDF/Markdown, manifest, original proposition, timeline, evidence register, material decisions, canonical specialist outputs, recorded handoffs, roadmap, existing verification and outcomes. Include exact versions and file inventory/checksums; report omitted/missing sections explicitly. Source bodies are linked-only unless redistribution is authorised. Sanitize archive paths; exclude secrets, cross-workspace data and private model reasoning. Do not label unproduced files as completed deliverables.

Notify for material clarification, required approval, meaningful failure/budget boundary and result ready. Routine searches, drafts and handoffs remain silent. Deduplicate by recipient/case/event version; maintain read state. External email/push stays off until separately configured and authorised. Monitoring digests are a later phase, not Q1.

## Proposed phases and proof gates

| Phase | Scope | Required proof before merge |
| --- | --- | --- |
| Q0 (this document) | Reconciliation and contracts | File-referenced map, conflicts and bounded next slice reviewed |
| Q1 | One durable investigation plus in-app completion/failure event | Browser disconnect, worker crash/recovery, duplicate retry, ownership and cancel tests |
| Q2 | Recorded specialist collaboration | Finding -> actual handoff consumption -> versioned output -> recommendation trace |
| Q3 | Animated focal experience | Persisted-event mapping, truthful state labels, mobile/desktop and reduced-motion checks |
| Q4 | Inspectable team and actionable inbox | During/after access, deduplication, reload and attention filtering |
| Q5 | Briefing and complete authorised exports | Readable files, consistent snapshot, evidence trace and permission tests |
| Q6 | Release acceptance | Exact candidate passes full journey and authorised live checks; no critical open issues |

These Q labels distinguish this plan from older paid-launch Phase 1/2 and Cursor P/PT phases. Each phase requires separate founder approval. Commit and push focused branches; do not rewrite published history. CI success is not release approval.

## Bounded Q1 proposal

Only idea -> scope approval -> queued investigation -> checkpointed evidence/result -> in-app event -> return to the same project. Small team: coordination, research, evidence review and synthesis; feasibility/commercial analysis only where scoped. No new animation, cloud voice, Watchtower, paid checkout policy or autonomous continuation.

Expected changes: `pilot-mission.functions.ts`, `pilot-mission/service.ts`, `repository.server.ts`, `research-pass.ts`, an adapter under `pilot-mission/`, existing `workforce/worker.server.ts` and its tests, plus additive job-link/event persistence if required. Reuse auth, worker tick and comparison reservation logic where semantically correct. Document any new migration and rollback before applying it locally.

Unresolved release decisions: approved provider/cost ceiling including in-flight work, scheduler environment/frequency, and how paid retrieval relates to the existing Investigation consumption policy. Do not infer these from subscription price. Implement with injected fixtures and zero live provider calls until approved.

## Acceptance checklist and verification record

- [ ] Approval and unique queue insertion are atomic; intake alone does not execute retrieval.
- [ ] Kill a worker after a checkpoint; a new worker resumes without duplicate committed artefacts.
- [ ] A stale lease cannot overwrite a newer result; uncertain billable dispatch is not blindly retried.
- [ ] Close browser/voice, reopen and retrieve the same persisted case; a scheduler, not polling, advances work.
- [ ] Missing credentials/outage produce honest blocked/failed execution, not fabricated evidence or a successful pause verdict.
- [ ] Cancellation stops future dispatch; already in-flight actions and retained outputs are disclosed.
- [ ] Changed scope invalidates authority; unauthenticated and cross-workspace commands/downloads fail.
- [ ] Concurrent tasks cannot exceed the approved reservation ceiling.
- [ ] Completion/failure inbox events are atomic and deduplicated; preferences are respected.
- [ ] Existing supervised and workforce journeys pass regression tests.

Q0 checks actually performed: Git fetch/status/log, source and documentation inspection, relative-link validation, `git diff --check`, and changed-file scope review. No runtime tests, browser demonstrations, live provider calls, production DB queries or deployment verification were performed. Prior verification counts are not asserted for this revision. Phase 0 makes no production-readiness claim.

Q1 verification should use a disposable database and labelled deterministic provider fixtures. Run repository lint, TypeScript, unit/integration tests and build, then a controlled browser/worker recovery test. Record exact revision, commands, results and skipped checks. Live provider validation requires explicit scope and budget.

Rollback for Q0: revert the documentation commit. No data or application rollback is required. Do not resume the outdated local paid-entitlement patch as part of this plan.
