# PSI roadmap Phase 1 — reliability implementation and acceptance evidence

24 October 2026. Baseline: `1090804`. Working branch: `feat/psi-phase-one-reliability`.

**Status: implementation and isolated checks completed for the fixes below; Phase 1 release acceptance remains pending.** This is the first phase of the forward PSI roadmap, not a claim that earlier marketing work was undone.

## Changes

- Edited browser briefs restore before starter defaults. The chosen plan is carried into the brief's enquiry link. Clear removes the saved brief. Storage denial/quota failures do not stop editing; the page warns when persistence is unavailable.
- The six-contribution public walkthrough identifies itself before interaction as a simulation with no model calls or real mission approvals. Its local example download choice does not authorise spending, contact or deployment.
- The authenticated comparison requires consent to provider use for the current input scope. A changed brief/evidence snapshot rejects a stale request. The owner decision on alternatives remains separate from this generation consent; downloading the owner's artefacts is not represented as a separate privileged deployment action.
- Provider-bound comparisons reserve one workspace unit and, where activated, one pilot comparison allowance in the same database transaction before dispatch. All missions in the same workspace contend on the same workspace-row lock.
- A unique mission/scope ledger records the requester, scope, consent time and provider result. A retained completed result can be reused after a mission-state save failure, without another provider call or allowance increment.
- An interrupted/failed provider attempt retains its allowance reservation for reconciliation. It is not automatically retried or refunded: a missing response does not prove that the provider did not bill. Explicit no-dispatch results release both counters transactionally. A completed/released result remains replayable.
- Legacy spend-marker insertion and workspace-counter updates commit or roll back together.
- Parent approval and follow-up mission insertion commit atomically. Version conflicts/duplicate child inserts roll back the whole transaction. Cancellation blocks export, and output from an older input scope cannot be attached to changed evidence.
- CI provisions a disposable PostgreSQL 18 service and runs the reliability integration tests against it. It never points these tests at Neon or production.

These reservations are comparison **units**, not measured GBP spend. Token/currency reconciliation, operator handling of uncertain attempts and fully durable background dispatch still need release work. No new autonomous tool authority or live provider activation is introduced.

## Database inventory and safe migration work

Production branch inspected: `br-fancy-breeze-zatt9ocp`, project `spring-wind-48457918` (`deliverx`). A read-only information-schema query found `wf_workspaces` and `psi_pilot_requests`; it did not find the supervised mission/spend/activation/reservation tables. This is a table-presence observation, not a complete migration-ledger or data audit. No customer records were read and no production DDL/DML was run.

Created schema-only acceptance branch `psi-phase1-acceptance-20261024`, id `br-holy-meadow-zasru9wn`. No parent data was copied. Neon confirmed one-day auto-deletion on 25 October 2026 (18:24 UTC, 18:24 Europe/London after the clock change).

Applied migrations 0020, 0021 and 0022 on that isolated branch in one transaction. A follow-up schema query returned all four expected tables. Branch Auth and a signed-in acceptance environment are not configured by this migration. Any browser credential storage or creation of Auth access requires the pending explicit approval.

New production deployment must wait for an agreed migration/rollback plan and release acceptance. Do not merge and enable a provider assuming the reservation table already exists there.

## Verification performed

- Full suite with the isolated local PostgreSQL database enabled: **190 passed, 16 skipped**. The skipped tests require the separate full application environment; they were not represented as passed.
- Real SQL transaction tests: two missions competing for one activated allowance; competing for the final workspace unit; unknown attempt held and duplicate dispatch blocked; persisted result replay; explicit no-dispatch refund; rollback of spend marker/counter on injected failure; parent/child rollback; workspace-scoped reads; complete persisted decision → export → supplied outcome → review → one child under concurrent approval.
- Regression tests: changed evidence during generation cannot inherit an old result; cancelled mission cannot export; storage denial and draft removal.
- TypeScript and production build pass. Lint: no errors, nine existing warnings.
- Browser: an edited founder-starter question survives reload with a restored-draft notice; specialist simulation label appears before interaction and example export is initially disabled.
- Local PostgreSQL fixture backup/restoration was exercised separately. This contains synthetic test records and a reduced workspace fixture; it is not a production backup/restore rehearsal.
- Neon PostgreSQL 18: isolated DDL transaction and four-table schema verification only. No live model invocation or signed-in application operation was performed on that branch.

## Repeat local reliability checks

Use a new disposable local database whose name starts with `deliverx_phase1_`. The test suite rejects non-local URLs and other database names. Never set `PSI_TEST_DATABASE_URL` to a customer database. Tests truncate only the fixture tables in that explicitly selected disposable database.

```sh
createdb -h 127.0.0.1 deliverx_phase1_example
psql postgresql://127.0.0.1/deliverx_phase1_example -v ON_ERROR_STOP=1 \
  -f scripts/psi-phase-one-test-schema.sql \
  -f drizzle/migrations/0019_psi_pilot_requests.sql \
  -f drizzle/migrations/0020_psi_supervised_missions.sql \
  -f drizzle/migrations/0021_psi_pilot_activations.sql \
  -f drizzle/migrations/0022_psi_comparison_reservations.sql
PSI_TEST_DATABASE_URL=postgresql://127.0.0.1/deliverx_phase1_example npm test
```

The fixture is deliberately isolated and reduced; it must not be used as a production workforce schema migration.

## Acceptance work still required

1. With explicit approval, configure the isolated acceptance database/Auth/local trusted origin and securely save its connection configuration in an ignored local file. Do not paste credentials in chat.
2. Prove enquiry → reference → same account → onboarding → saved brief → authenticated mission → decision/export → supplied outcome → follow-up, including recovery, a second workspace and failures.
3. Run a bounded configured-provider evaluation with retained provider usage/request evidence and validated costs; no configured key exists in this local environment.
4. Prove background dispatch and worker termination recovery. Generation currently remains an awaited request; leases plus fail-closed reservations are not a durable background worker. Unknown provider attempts require reconciliation, not blind retry.
5. Exercise operator reconciliation, operational alerts, actual environment backup/restore and rollout/rollback before any paid-release acceptance.

## Approval semantics

A provider-use request covers comparison of a specific saved brief/evidence snapshot within its declared allowance. A decision accepts an option or requests more evidence for that proposal's version/scope. Neither grants external-contact or deployment permission. Public demonstration controls change browser-local example state only. Do not reintroduce “six working agents” or “finished task” claims without an actual run record.
