# Paid launch phase 1: comparison accounting and recovery

The reservation transaction is the sole owner of workspace and pilot comparison counters. Completing a mission does not charge the activation again. The production handler uses `runAccountedComparison`, also exercised by the PostgreSQL integration suite. Cached reservation results are checked before new-dispatch limits, so exhausted allowance does not prevent recovery after a mission save failure.

## Operator reconciliation

The existing Pilot requests page now includes unresolved provider attempts, visible only to authorised pilot operators. Both list and mutation server functions enforce the existing operator policy independently of the page.

- Check provider request/billing records and retain a reference in the evidence note.
- For a confirmed dispatch or charge, retain the reserved units. Missing output does not authorise another provider call for the same scope.
- Release units only when provider evidence confirms no dispatch. Both counters, the spend marker, the retained no-dispatch result and the operator record change in one transaction.
- Attempts must be at least ten minutes old, beyond the current 300-second production invocation limit. An active mission lease also blocks reconciliation.
- Concurrent or repeated identical resolutions have one effect. Conflicting resolutions are rejected. Completed attempts cannot be refunded through this workflow.
- A released attempt is replayed as an explicitly labelled no-dispatch result, without calling the provider. Confirmed charges without a result remain blocked; this operation does not fabricate output.

The record retains the operator identity, decision, evidence note, timestamp and exact mission/scope key. This is allowance accounting, not a Stripe refund or currency-cost reconciliation. It does not automatically repair historical double charges; any historical correction needs separate ledger evidence.

## Rollout

1. Apply additive migration `drizzle/migrations/0023_psi_comparison_reconciliation.sql` after migrations 0019 through 0022. It has been tested only against a disposable local database during this implementation.
2. Deploy the application. Without 0023, operator reviews show an unavailable state; the existing reservation transaction continues to enforce comparison limits.
3. Verify operator access and the full comparison/recovery journey with isolated test accounts before enabling paid provider execution.

No production schema change, provider activation or billing change is part of this implementation. Phase 2 still owns requiring a paid entitlement before any new provider dispatch.

## Verification

The PostgreSQL suite includes the combined production orchestration: one charge on success/retry, exhausted-allowance result recovery after an injected save failure, concurrent final-unit use, same-mission retries during generation, reservation commit rollback, unauthorised reconciliation, recent/wrong-workspace rejection, concurrent exactly-once release, retained confirmed charges and rollback when the operator audit insert fails. Existing scope, isolation, cancellation and outcome-loop tests remain in place.

Run against a disposable localhost database named `deliverx_phase1_*` using `PSI_TEST_DATABASE_URL`. CI creates an isolated PostgreSQL service and applies the reconciliation migration before tests. Never run the truncating reliability suite against production.
