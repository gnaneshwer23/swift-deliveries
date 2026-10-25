# PSI mission loop — Phase 5

Phase 5 hardens the supervised mission loop so a product question can move from evidence to a decision, a reviewable pack, an owner supplied outcome, and a bounded follow-up without losing its provenance.

## What changed

- **Versioned writes.** Mission editors carry the record version they loaded. Mutations reject stale versions instead of overwriting a newer brief, evidence set, decision, measurement plan, observation, or review. The UI keeps an unsaved draft visible and offers an explicit reload path.
- **Scope checked at dispatch.** Comparison requests bind to both the mission version and the brief/evidence scope hash immediately before provider work is leased. A changed scope cannot receive a result from an older request.
- **Decision-pack history.** When a prepared pack is superseded by a revised measurement plan, the prior pack is retained with its record version, timestamp, and reason. The current record can therefore show what was previously prepared and why it changed.
- **Outcome binding.** A follow-up can only be approved from the latest review of the current owner-supplied observation and current artefact. Its parent version is checked in the same atomic write as the child mission.
- **Recovery semantics.** Provider comparison leases, idempotency keys, failed attempts, usage records, and reconciliation warnings remain explicit. A failed or uncertain attempt is not silently presented as a completed comparison.

## Acceptance evidence

The unit suite covers workspace isolation, stale-editor rejection, scope changes during generation, cancellation, prepared-pack archival, decision binding, owner-supplied observation labelling, review versioning, follow-up atomicity, lease recovery, and usage limits. The existing database integration suite remains opt-in through `PSI_TEST_DATABASE_URL` and uses only an isolated fixture database.

The live-provider acceptance test is intentionally deferred until an isolated provider configuration and spend cap are supplied. No production provider call is made by this phase.

## Phase 5 exit criteria

1. A complete isolated journey leaves evidence, options, a human decision, an artefact version, a measurement plan, an owner observation, a review, and an optional approved follow-up.
2. Two workspaces cannot read or mutate one another's missions.
3. Stale approvals and stale editor submissions fail without mutation.
4. Duplicate comparison dispatches do not double charge the mission.
5. Leases, failures, and uncertain usage remain recoverable and visible.
