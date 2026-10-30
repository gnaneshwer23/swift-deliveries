# DeliverX PSI roadmap

24 October 2026. This is the phase plan for the current product: a product question, supplied evidence, a human decision and reviewable work. It replaces the retired career roadmap in `docs/archive/career/`.

Status is what this repository can show today. It is not a production-readiness claim. Release checks still have to pass on the exact candidate, as described in `docs/psi-production-readiness-plan.md`.

| Phase | Scope                                                                                                                                                                 | Status                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Customer story, first pilot contract, capability labels and page ownership                                                                                            | Complete in `docs/psi-phase-1-customer-story-and-scope.md`. On `origin/main` at `69e61ea` (pull request #12 also contains this document).                                                                                                                              |
| 2     | Public pages: Home, Product, Example mission, Specialists, Use cases, Trust, Pricing and Resources                                                                    | Complete in `docs/psi-phase-2-journey-verification.md`. Merged as pull requests #11 and #12, `69e61ea`. Header links are Product, Example mission and Pricing & Pilot. Public website only.                                                                            |
| 3     | Pilot enquiry, plan and brief continuity, account wording, adapted onboarding and command surfaces, operator follow-up                                                | Implemented in this repository. `psi_pilot_requests` was created on the Neon project named deliverx. Production stores a request only when `DATABASE_URL` points at that database. Signed-in browser proof, billing and provider execution are not part of this phase. |
| 4     | Prove one reliable supervised mission: saved brief, supplied evidence, compared options, an owner decision, a decision and experiment brief, and an export            | Implemented in this repository. See the Phase 4 boundary. It is not a paid-pilot launch and it is not production certification.                                                                                                                                        |
| 5     | Outcome review: expected result, supplied observation, comparison and a human-approved next mission                                                                   | Implemented in this repository on the supervised mission. See the Phase 5 boundary. It is not connected analytics, automatic approval, or production certification.                                                                                                    |
| 6     | Controlled paid release: manual activation of one scoped plan, an explicit mission allowance, and a block on the next billable comparison when that allowance is used | Implemented in this repository. See the Phase 6 boundary. Self-service checkout is not live. This is not production certification.                                                                                                                                     |

## Live database: migrations applied

26 October 2026. Migrations `0020`–`0023` (supervised missions and spend, pilot activations, comparison reservations, comparison reconciliations) were applied to the production Neon branch in one transaction, after `0020`–`0023` were applied to the preview branch. Row-level security was also enabled on `psi_pilot_requests`. All six `psi_*` tables are owned by the server role, have no client grants, and have row-level security on. The notes below that say a migration is unapplied describe the state when each phase landed. A signed-in run on production and the release checks in `docs/psi-production-readiness-plan.md` have still not been run, so no production-readiness claim is made.

28 October 2026. Migration `0032_psi_pilot_activations_stripe.sql` (file blob `8f5178636508c0e06df99ec32a7ee70e546b301b`, commit `c7d4bb1`) was applied to production Neon `br-fancy-breeze-zatt9ocp` with owner approval. Catalog verify: Stripe session/customer/subscription/lookup/environment columns, session unique index, `payment_taken = false`-only check removed, `request_id` nullable. Founder also confirmed published prices Builder £29 / Founder £99 / Studio £299 with allowances 1 / 4 / 12. Live Stripe Products/Prices, Vercel live secrets, webhook, and `PSI_PAYMENTS_LIVE_APPROVED` remain founder-owned and are **not** set. Ledger: `docs/migrations-and-rollback.md`.

## Forward PSI roadmap: Phase 1 acceptance

The newer illustrated-product roadmap begins with reliability, not another website redesign. See `docs/psi-phase-one-reliability.md` for implemented fixes and exact verification. Code implementation, isolated environment verification and release acceptance are separate statuses. Existing phases 3–6 below are implementation history, not production acceptance.

## Phase 4 boundary

The accepted path is a supervised mission in the product workspace: save a brief, add evidence, compare options, record an owner decision, prepare the pack, and export it. State is stored per workspace in `psi_supervised_missions`. A comparison is owned by a worker lease, can be cancelled, and can be retried after a failure or an expired lease. Reloading a completed comparison does not add a second usage record. An approval matches the proposal action `compare_options`, its version and its scope. Changing the brief or evidence clears that approval. Two workspaces cannot read each other's mission through the mission store. The workspace usage ceiling is checked on the server before a billable comparison.

When a provider is already configured, that comparison uses the existing bounded generator. The generator may make one corrective call if the first output is invalid, and it does not call the catalogue of roles. A successful comparison stores one usage record. When no provider is configured, the stored generation label is `not run — provider not configured`, and the options are a deterministic draft from the supplied evidence. The export states that no baseline has been observed.

Migration `drizzle/migrations/0020_psi_supervised_missions.sql` is committed and has not been applied to the live database. A configured-provider run, signed-in browser proof, continuation after the browser process exits, and atomic workspace-usage posting across a crash are not proven. The older programme and mission screens no longer advance themselves on a browser timer. They still take one explicit server step per request and are not this pilot path.

## Phase 5 boundary

The learning loop is on the same supervised mission. Before the pack is prepared, the owner can record a hypothesis, an expected metric, a baseline and an observation window. Those fields are stored on the mission and quoted in the experiment brief. They are a hypothesis. After the pack is exported, the owner can supply one observed result, the evidence for it, and where they saw it. The stored label is `Owner-supplied. DeliverX did not measure this result.` There is no analytics connector.

A review places the expected metric beside that supplied result, keeps the owner's uncertainty in words, and refuses a bare confidence score. Saving another review appends a version. The earlier version stays on the mission. Each version cites the decision binding and the artefact title. The same save proposes one follow-up brief. That proposal has no mission id until the owner approves it. Approval creates a separate mission at the brief stage, linked back to the review, and does not approve a comparison or any later step. A second save of an already approved follow-up does not open another mission. Another workspace cannot read the mission, so it cannot read the review.

Command lists the chain as decision, observation, review and proposed next mission. The public Product Brain page lists the same order and does not add a knowledge graph. Migrations `0019` and `0020` are still not applied by this change. The review is stored in the mission document, so no new SQL was added. A signed-in browser run, a live-database run, and an atomic parent-and-follow-up write across a crash are not proven.

## Phase 3 boundary

A pilot enquiry validates the offer, contact details, product question and explicit consent. Abuse protection is a hidden field, an in-memory network limit and a stored per-email limit. Success returns a reference. Failure says the request was not confirmed. No reply-time promise is made.

The chosen offer is a public plan id. The brief stays in browser storage and, once submitted, in the enquiry record. Private brief text is not put in URLs. Creating an account is free and does not activate a paid pilot.

An authorised operator can read requests at `/command/pilot-requests` and save a follow-up status. That save does not send email or any other message, and it does not start billing or activate a pilot. Operators are addresses in `PSI_OPERATOR_EMAILS`. When that variable is unset, the published operator address `gnaneshwer.jadav@gmail.com` is used, along with any admin or moderator role already stored. Manual activation is a separate action, described in the Phase 6 boundary.

## Phase 6 boundary

Manual activation is on `/command/pilot-requests`, behind the same operator gate as follow-up. The operator records one of Builder, Founder or Studio, one workspace id, and an explicit mission allowance from 1 to 24. The stored record sets payment as not taken. It does not create a Stripe charge, a subscription, or a checkout session.

When that workspace has used the allowance, the next billable comparison is refused. The mission stays readable. Work is not deleted. A comparison that does not call a provider is not counted. Reloading a completed comparison does not consume another unit. Another workspace has its own allowance. A workspace with no activation still uses the existing workspace usage ceiling.

Creating an account stays free and does not activate a paid pilot. The pricing page keeps the three proposed offers, says activation is manual, and points to the published operator email. There is no promised reply time. No purchase button was added.

Self-service checkout is not live for these offers. The older checkout code still names `experience_monthly`, `launchpad_monthly`, `complete_journey_monthly`, `complete_journey_yearly` and `career_sprint_pass`. Builder, Founder and Studio are not among them. The server opens a checkout session only when `VITE_PAYMENTS_CHECKOUT_ENABLED` is exactly `true` and a `STRIPE_SANDBOX_API_KEY` or `STRIPE_LIVE_API_KEY` is present with `LOVABLE_API_KEY`. Webhook checks use `PAYMENTS_SANDBOX_WEBHOOK_SECRET` or `PAYMENTS_LIVE_WEBHOOK_SECRET`. The client publishable key name is `VITE_PAYMENTS_CLIENT_TOKEN`. This change does not set those variables and does not mount a checkout form.

Migration `drizzle/migrations/0021_psi_pilot_activations.sql` is committed and has not been applied to the live database. Migrations `0019` and `0020` are still unapplied. Until `0021` is applied, an activation save reports that it was not stored. The allowance count after a successful comparison is not proven across a crash. Release checks in `docs/psi-production-readiness-plan.md` have not been run on this candidate. No production-readiness claim is made.

## Founder vertical slice (supervised decision loop)

Shipped on `origin/main` as the first end-to-end pilot path for Command Centre, then refined toward the founder “agent-staffed build” feel:

### Product loop name: **One-liner → PM brief → research scene**

1. Founder gives **one business-case statement** (not a multi-field interview). Optional details stay collapsed. Homepage / `dx-psi-brief` one-liner continues post-auth into `/command#supervised-brief`.
2. An initiating PM / problem-framing agent drafts a **PM brief**: restated problem, what will happen, rough cost, rough time, team/staffing band — before heavy execution.
3. Typed Talk-to-DeliverX can start that supervised case (default path); advanced workforce drafts remain an explicit card choice.
4. **Banded Available staffing (Phase D):** complexity S/M/L/XL proposes **4 / 6 / 8 / 8** Wave 1 roles (deterministic subset; catalogue intent ranges labelled; not all 150). Count + band appear in the PM brief before approve.
5. Plan / PM-brief approval is a human gate. **After approve (Phases C+E):** a research/work pass auto-advances — persisted `task.*` / `research.pass.*` events, actor chips, findings/gaps in the work scene (no fake timer theatre).
6. **Research-first default (Combined):** pass writes cited findings when EXA/Tavily/Brave is configured; otherwise marks honest external gaps and continues with provided/soft-seeded evidence. Soft-seed keeps compare unblocked on a questionnaire. No invented web retrieval.
7. Decision pack export: Markdown + PDF with honesty labels, evidence register, assumptions/gaps, options, approval history, experiment brief, follow-up proposal that does not auto-start.

Default `/command` view is this supervised loop (Talk + overview + supervised start). Agents office is nested under advanced planner — not primary.

Strategy detail: `docs/roadmap-one-liner-pm-brief.md` (Phases B–E shipped; F deferred).

### Deferred (explicitly out of this slice)

- Agents office as the primary Command surface
- Enabling the full 150-role catalogue / Planned roles beyond Available Wave 1
- Voice / oral PM brief (Phase F — typed path first; voice remains Phase 4b infra)
- Full programme ZIP export
- Claiming live web research without EXA / Tavily / Brave configured _(Production has Tavily; Combined live verify showed real citations — still never invent when unconfigured)_
- Invented customer evidence or interviews
- Rich illustrated “movie” art beyond the event-driven work scene
- Programme Lab Acts language (P6) — Lab stays frozen; no KPI dashboard revival
- Deeper Project shelf + propose follow-up — **shipped** (see `docs/roadmap-product-building-agents.md`)

## Still outside these phases

Self-service checkout, automatic entitlements, customer interviews run by agents, production deployment and unattended learning remain outside this release. Books, publishing and regulated healthcare stay out of scope.
