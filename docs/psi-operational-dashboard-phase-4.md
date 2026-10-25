# Phase 4 — operational dashboard and specialist contribution

Implemented 25 October 2026, following the shared identity, public journey and onboarding phases.

## Customer experience

The overview opens with saved product questions and their next required actions. Failed comparisons take priority, then owner decisions, in-progress comparisons and ordinary next steps. Cancelled records and already-created follow-ups remain in the activity record but do not occupy the attention queue. Specialist missions awaiting approval, clarification, blocked or failed are surfaced alongside this queue.

The selected Product Brain record displays its intended outcome, recorded generation provenance, owner decision, saved output and whether an owner-supplied observation exists. An export is never counted as an observed outcome. Recent-mission counts describe the returned lists, not an all-time workspace total.

The specialist network retains the approved HTML-inspired architecture. Selecting a task mission exposes an assigned-specialists filter. The task inspector follows persisted input dependencies → acceptance criteria → attached output/provenance/review labels → downstream recipients. Missing links stay missing; legacy sequential tasks without saved dependency edges are not reconstructed as a DAG. Human gates are identified as human gates. Source links open the real mission output section. A mobile inspector shortcut and list view keep the details reachable.

## Boundaries

This is an operational visibility release. No schema, provider, billing, execution-authority or approval changes. All data still passes through authenticated, workspace-scoped server functions. The additional home fields are projections of the same saved mission record. UI helpers also exclude foreign mission/workspace records from contribution links. Capability availability, plan assignment, completed tasks, owner approval and owner-supplied outcomes remain distinct.

The network task inspector is backed by workforce task missions. The supervised decision flow exposes its comparison provenance through the selected product record; it does not invent specialist assignments for a single comparison. No live telemetry, completion ETA or agent performance score is inferred.

## Verification

- TypeScript and production build pass.
- Local tests: 198 passed, 25 environment-dependent tests skipped. CI runs the configured isolated database suite separately.
- Lint: zero errors, nine existing React refresh warnings.
- Added tests cover attention priority, exported-record semantics, missing dependency records, cross-mission/workspace exclusion and explicit generation provenance.
- Signed-in isolated Neon preview: existing brief and exported record show correct objective, provenance, decision and absent observed outcome; changing the product selector updates its destination.
- Created synthetic draft `3314cb17-55ac-410d-a5aa-69799669a818` in the disposable acceptance branch. Four pending tasks, six assigned specialists, zero completed tasks, zero recorded usage, approval still pending. No execution or model call was authorised.
- Confirmed assigned-only filter, role selection, task inspector, explicit absent output/dependency states and link to the persisted mission's output heading.
- Desktop 1440px and mobile 390px reviewed; mobile overview/network/mission-output pages have no horizontal overflow. Inspector shortcut works.

## Remaining release gates

Live provider output, failure recovery under real provider load, session-expiry, second-workspace browser isolation and paid-pilot operational acceptance remain separate checks. This phase does not certify the complete product as production-ready. Existing new-account/email-recovery acceptance gaps from Phase 3 remain open.
