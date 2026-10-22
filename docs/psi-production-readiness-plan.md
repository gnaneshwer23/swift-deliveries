# DeliverX PSI production readiness plan

22 October 2026. Status: implementation plan, not a production certification.

## Product decision

DeliverX is an AI product company. A user brings an idea or product problem and works with a selected specialist team to produce evidence-grounded decisions and useful product artefacts. Students learn in this same environment through participation and explanations. Career readiness, recruitment, CV packaging and professional credentials are retired product directions.

The supplied PSI Master Product Building Guide v3 informs this plan. Its description of the old public website is superseded by the current live homepage and the founder's instruction in this chat. Its proposed role catalogue and future capabilities require reconciliation with code; they are not evidence of operational agents.

First production target: objective → supplied evidence → alternatives → human decision → reviewable artefact → expected outcome → observed result → proposed next mission. Runtime builds and previews are a later gated increment. An HTML prototype, static validation and release plan must retain those exact labels.

## Ground truth established

- Local main: 99c3a0d. Repository fetched again during this audit.
- Open PR #5, `feature/openai-dxsi-provider`, head 909e87f: direct OpenAI Chat Completions adapter, OpenAI-first credential selection, default `gpt-4.1`, opt-in model mode and provider-selection tests. Documentation is in `docs/dxsi-implementation-plan.md`, not a separate API guide. This is unmerged work to reuse, not reimplement.
- `feat/neon-migration`, head b6a8227: database/query/auth migration and `docs/neon-migration.md`. It excludes the career schema. Its document says Auth enablement is pending; the live database now contains `neon_auth` tables. Their presence does not establish working sign-in, JWKS configuration or recovery.
- Read-only Neon inspection found `dx_profiles`, monitoring, workforce, mission, programme and audit tables. No application rows or private auth records were inspected. Prior database connection test succeeded.
- Vercel reports production deployment dpl_9CdhiKfSGrq614xKeH31t34KNYRP ready, aliased to both deliverx.dev and www.deliverx.dev. This is deployment status, not end-to-end readiness.
- Vercel environment-name inventory contains Supabase and POSTGRES variables. It did not list DATABASE_URL, NEON_AUTH_URL, VITE_NEON_AUTH_URL, OPENAI_API_KEY or DXSI_MODEL_ENABLED. Values were not read. The proposed migration/provider configurations are therefore not established by this audit.
- Main's application integrations still use Supabase. Existing Neon tables do not mean production has cut over.
- Main's programme persistence updates state and then separately inserts records (`programme.functions.ts`, `persist`). This creates a partial-write risk requiring a transaction and failure testing.
- CI currently runs lint, TypeScript, tests and build with Node 22; inspected Vercel settings use Node 24. Align and validate the runtime before release.
- No application test suite or signed-in production mission was run during planning. Existing documentation's historical test claims are not fresh verification.

## Ordered implementation backlog

| Order | Work package | Primary ownership boundaries | Acceptance gate |
| --- | --- | --- | --- |
| 1 | Consolidate the baseline | Neon migration branch, OpenAI PR #5, auth/db modules, deployment config | Review both diffs against current main; integrate on an isolated branch without rewriting published history. Preview sign-up, sign-in, recovery, onboarding and mission persistence work. Pin commit and migration versions. |
| 2 | Retire career surfaces | routes, marketing components, sitemap, resources, README, roadmap and AGENTS.md | Remove career navigation and unused screens; archive superseded docs with a superseded notice. Old URLs receive intentional redirects or retirement responses. Product links and mobile navigation have no dead ends. Keep historical migrations and user records. |
| 3 | Connect onboarding to first value | dx-profile, onboarding, auth redirects, programme intake, Command Centre | Capture objective, product stage, experience, participation preference, constraints and first idea. Preserve intended destination and partial progress. Prefill intake and choose the appropriate first task. Student guidance changes explanation and involvement, not evidence standards. |
| 4 | Harden the agent runtime | model runner, registry, contracts, usage, executor, server APIs | Explicit provider selection and model allowlist; validated typed outputs; bounded timeout/retry; refusal, truncation and cancellation handling; request IDs and token usage retained; no secrets in browser/logs. No successful real mission silently replaced by a simulation. |
| 5 | Make execution durable | scheduler, worker, database transactions, task leases and outbox | Runs continue with the browser closed; crash recovery, lease expiry and duplicate delivery are tested. State, artefacts, audit and usage commit atomically. Cancellation and limits prevent new dispatch. |
| 6 | Complete the PSI loop | Product Brain schema, evidence, decision and outcome services | Version sources, claims, hypotheses, decisions and artefacts. Preserve contradictions. Record expected metric, baseline, observation window and actual supplied result. Missing results produce a measurement request. Follow-up missions require approval. |
| 7 | Make the dashboard operational | command and programme views | Product objective, next action, running/blocked work, approvals, budget, deliverables and outcome status are visible. Each status links to its source record. No invented progress or unsupported assurance labels. |
| 8 | Verify and release the pilot | CI, observability, runbooks and preview | All release checks below pass on the exact candidate; backup restore and rollback rehearsed; founder reviews release evidence before production cutover. |
| 9 | Add controlled engineering | isolated worker, repository adapter, tests, preview integration | Approved branch changes execute in a resource-limited sandbox; actual tests retain logs; previews require approval bound to commit and target. No production deployment authority is implied. |

Sequence: 1 precedes application changes to prevent competing auth/data implementations. Work packages 2–4 can be delivered as small reviewed increments after the baseline is settled. Package 5 precedes unattended execution. Packages 6–8 define a credible first pilot. Package 9 extends that pilot into working software delivery.

## Agent implementation decisions

Keep workflow authority in deterministic server code. Models propose content and options; they do not grant permissions, set their own budgets or pass human gates. Select only the roles needed by a mission. The 150-role catalogue is not a reason to run 150 model sessions.

Reconcile existing DX IDs and 15 departments with the guide's provisional PSI IDs and 12 lifecycle sectors using a versioned mapping. Do not renumber stored history. Distinguish availability, execution mode and evaluation status. Promote roles only after a named evaluation suite passes.

Reuse PR #5 as the initial direct-provider adapter. Review its shared DXSI_MODEL setting for incompatible gateway model IDs when OpenAI credentials are present. Add explicit provider/model validation before dispatch. Keep a Responses API adapter as an evaluated option rather than combining an API rewrite with the first cutover.

Record provider, model, prompt/contract version, source and input fingerprints, output version, attempts, latency, request ID, token usage and failure classification per run. Reserve budget before dispatch, reconcile actual usage, and retain estimated cost when final usage is unavailable. Fixed demo credits alone do not establish a real spending ceiling.

Use strict structured schemas where supported, followed by application validation of citations, permissions and acceptance criteria. Independently handle malformed responses, refusals and incomplete output. Synthetic demonstrations remain available only as an explicit mode with clear labels.

## Data and deployment decisions

Use the existing Neon migration as the candidate baseline. Verify its pooled connection, server-only access, JWT issuer/audience/JWKS handling, session refresh and explicit workspace filters. Direct PostgreSQL access must not accidentally inherit assumptions from Supabase RLS. Exercise forged identity and cross-workspace read/write/export cases. Use a least-privilege runtime role, with migrations run under a separate role.

Use isolated preview data and authentication configuration. Inventory required environment variable names per environment; do not copy production secrets into previews. Verify Auth trusted origins, email delivery and recovery before cutover. Existing user migration/reset behaviour must be assessed against current data rather than relying on the migration document's old counts.

Database credentials supplied in chat should be rotated through the owner's normal secret-management flow before production cutover. This plan neither changes credentials nor requests posting new secrets in chat. Configure keys through the hosting secret store.

Before migration: schema inventory, backup, restore rehearsal, additive migration dry run and reconciliation report. Record the exact application/database pair and rollback boundaries. A code rollback must not strand users or writes in another auth/data backend. Retire Supabase settings only after all active dependencies, billing webhooks and public data links are accounted for.

## Release evidence required

- Reproducible install, lint, TypeScript, unit/integration tests and production build on the chosen runtime. Review dependency findings and document resolutions.
- Desktop and mobile browser journeys: signup, confirmation if enabled, sign-in, recovery, resumable onboarding, first mission, review, approval, cancellation, export and sign-out.
- API fixtures: 401, 429, 5xx, timeout, malformed JSON, refusal, truncation and retry exhaustion. One explicitly budgeted real-provider staging smoke test after secure key configuration.
- Isolation tests across two workspaces, including source retrieval, artefacts, exports, background dispatch and operator-only changes.
- Concurrent dispatch, duplicate messages, expired leases, process death, partial database failure, approval payload mutation and budget exhaustion. Prove no duplicate committed artefacts/charges and no unrecorded state transition.
- Evidence checks: invented citations rejected, conflicting sources retained, user assertions labelled, no observed-result claims without recorded observations.
- Accessible headings, labels, keyboard navigation, focus, readable contrast, responsive tables and clear loading/error/empty states.
- Correlated application/worker/model logs, redaction, error alerts, health checks, queue lag and stalled-run visibility. Document incident response, stop switches, backups and rollback.
- First pilot excludes automatic production deployment. Sandbox/preview capabilities remain unavailable until exercised with retained execution evidence.

## First implementation increment

Prepare one integration branch combining reviewed Neon/auth changes and PR #5, repair the malformed literal-newline paragraph in that PR's implementation document, and add configuration validation plus mocked provider-failure tests. Produce a preview and evidence report before any production traffic change. Then retire the career routes and connect the three-step onboarding to product-specific first actions.

No merge, schema mutation, provider activation, credential change or production deployment was performed as part of this planning task.

## References

- PR #5: https://github.com/gnaneshwer23/swift-deliveries/pull/5
- Neon branch guide: https://github.com/gnaneshwer23/swift-deliveries/blob/feat/neon-migration/docs/neon-migration.md
- OpenAI production guidance: https://developers.openai.com/api/docs/guides/production-best-practices
- Structured output guidance: https://developers.openai.com/api/docs/guides/structured-outputs
