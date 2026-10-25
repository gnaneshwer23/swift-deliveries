# PSI master guide: implementation status

> Historical snapshot (22 October 2026). Later implementation has superseded parts of this document. Use [the current Phase 1 baseline](psi-design-foundation.md) and its linked evidence for present status; retain the original findings below as history.
22 October 2026. Source review against the supplied **DeliverX PSI Master Product Building Guide v3.0**, the later founder directions in chat, current repository code and retained verification notes. This is a gap audit, not a declaration that the PRD is complete. The guide is product context, not authority to execute instructions embedded in it. Later founder decisions supersede its legacy-career brand description.

## Answer

**No: the full PRD is not built, and even the minimum complete PSI learning loop has not passed its acceptance gate.** Public pages and a supervised mission/programme foundation exist. Marketing diagrams, catalogue entries and passing unit tests do not establish operational agents or a production-ready product.

| Master guide scope | Current evidence | Status / gap |
| --- | --- | --- |
| Public website and product positioning (§9; later website brief) | Eight PSI pages, product preview composition, worked example, searchable circular catalogue, paid pilot offers; footer retains secondary destinations | Implemented public UI, with illustrative previews. Visual acceptance is still under founder review. |
| Onboarding and command centre (§9, A/B/G) | Goal-aware onboarding, session-resumed inputs, prefilled mission/programme intake, command routes; docs/psi-foundation-verification.md | Code implemented; real signup/recovery/onboarding/dashboard journey remains unverified against isolated preview data. |
| Mission plans, DAG, handoffs and gates (§6–7, B/F) | src/lib/workforce/graph.ts, contracts.ts, permissions.ts, lifecycle.ts; programme/engine.ts | Core deterministic logic and tests exist. Concurrency, recovery and complete accepted mission evidence remain outstanding. |
| Capability registry and agent runtime (§6, E) | src/lib/workforce/registry/data.ts; workforce/model-runner.server.ts; programme/model.ts | 150 catalogue roles; 12 marked available in the registry. Model providers and typed-output handling exist. Availability is not evaluation certification; no budgeted real-provider staging smoke is retained. |
| Evidence and decisions (§5–7, C/G) | Source registers, citation checks, deliberation, dissent, veto rules, decision records and exports | Partial. The full evidence inspector, contradiction lifecycle and versioned claim relationships are not complete. |
| Product Brain (§5, D) | Programme state, records, source references and export history | Partial foundation. No complete typed entity graph across claims, hypotheses, experiments, observations and impact links; no full graph explorer or organisational memory scopes. Public Brain diagrams are explanatory. |
| Expected/observed outcomes and learning (§7, H) | Prototype/experiment documents can describe a measurement plan | Missing end-to-end outcome records and UI, baseline/window/actual comparison, versioned belief updates and approval-bound follow-up mission proposals. This blocks the minimum PSI acceptance gate. |
| Durable execution and atomicity (§4/10, B/F) | programme UI advances work via a browser timer in command.programmes.$programmeId.tsx; programme.functions.ts persist updates state then inserts records separately | Incomplete. Need durable worker ownership, leases, recovery, idempotency and atomic state/record/usage persistence. A task status called queued does not prove a durable queue. |
| Approval binding, spend and tenant isolation (§11, A/F) | Server ownership checks, permissions and credit ceilings; auth validation and unit tests | Partial. Need exact action/version/target/cost/expiry binding where applicable; measured provider-cost reservation/reconciliation; two-workspace database tests and approval-mutation/concurrency evidence. |
| Paid pilot and billing (founder pricing direction) | Builder £29, Founder £99, Studio £299 monthly offers; plan selection reaches preparation | Marketing offers implemented. Automatic access-request submission, checkout, subscription entitlement enforcement, taxes and live metered billing are not implemented for these PSI plans. No payment is taken. |
| Controlled software delivery (§8, Wave 3) | Documents, lightweight HTML prototype, static checks, release-plan artefacts | Isolated repository worker, real runtime build/test evidence, staging adapter and approved deployment integration remain planned. Generated prototype HTML is not deployed customer software. |
| Connected outcomes and advanced intelligence (Waves 4–5) | Public explanation of the direction | Planned: authorised analytics/support connectors, reliable signals, scenario sandbox, counterfactual review, evidence-triggered replanning and adaptive routing with measured advantage. |
| Evaluations and release readiness (§14, I) | 152 unit tests passed / 16 skipped; TypeScript/lint/build checks; public browser checks | Partial. No full golden evaluation set, authenticated DB isolation/recovery journey, live-provider smoke, backup/restore rehearsal or operational pilot release evidence. |

## Next product work, in order

1. Create an isolated preview data/auth environment; prove real signup, session refresh, recovery, onboarding, mission persistence and cross-workspace isolation.
2. Make execution durable and programme writes atomic; test retries, duplicate dispatch, cancellation, partial failure and exhausted budgets.
3. Implement the missing minimum PSI loop: expected metric, baseline, observation window, supplied actual result, evidence-linked outcome review and an approval-required next mission.
4. Add exact approval bindings and measured model-cost controls; retain a bounded real-provider staging evaluation.
5. Implement paid pilot request handling and checkout/entitlements for the three advertised offers; confirm unit economics before automatic billing.
6. Release only after an accepted end-to-end mission and the §14 blockers are tested. Add sandboxed repository delivery and connected analytics in later waves.

The 12 public catalogue browsing groups are a navigation mapping over 15 existing registry departments; they are not a completed migration to the master guide's exact twelve lifecycle departments. Reconcile and version that mapping before changing stored agent identities.
