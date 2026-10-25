# PSI Phase 6 — allowance gate

Phase 6 connects the manual paid-pilot activation record to the supervised comparison path.

When a workspace has an operator-recorded Builder, Founder, or Studio activation, a provider-backed comparison now checks the activation allowance immediately before dispatch. Once the allowance is exhausted, the server refuses the next billable comparison with the published exhaustion message. Deterministic comparisons that do not call a provider remain available and do not consume the allowance.

After a successful provider-backed comparison, consumption advances through the activation repository's optimistic workspace update. The mission remains readable if the allowance record is unavailable; the existing workspace usage ceiling and provider reservation still apply. No checkout, Stripe charge, or automatic activation is introduced.

The activation table migration remains an explicit deployment prerequisite. The live-provider acceptance test is still deferred until an isolated provider key and spend cap are supplied.
