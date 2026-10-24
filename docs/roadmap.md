# DeliverX PSI roadmap

24 October 2026. This is the phase plan for the current product: a product question, supplied evidence, a human decision and reviewable work. It replaces the retired career roadmap in `docs/archive/career/`.

Status is what this repository can show today. It is not a production-readiness claim. Release checks still have to pass on the exact candidate, as described in `docs/psi-production-readiness-plan.md`.

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Customer story, first pilot contract, capability labels and page ownership | Complete in `docs/psi-phase-1-customer-story-and-scope.md`. On `origin/main` at `69e61ea` (pull request #12 also contains this document). |
| 2 | Public pages: Home, Product, Example mission, Specialists, Use cases, Trust, Pricing and Resources | Complete in `docs/psi-phase-2-journey-verification.md`. Merged as pull requests #11 and #12, `69e61ea`. Header links are Product, Example mission and Pricing & Pilot. Public website only. |
| 3 | Pilot enquiry, plan and brief continuity, account wording, adapted onboarding and command surfaces, operator follow-up | Implemented in this repository. `psi_pilot_requests` was created on the Neon project named deliverx. Production stores a request only when `DATABASE_URL` points at that database. Signed-in browser proof, billing and provider execution are not part of this phase. |
| 4 | Make the bounded pilot contract true at runtime: durable mission execution, handoff contracts, human gates, persisted evidence and a reviewable decision pack | Not started. The paid pilot must not be promised as a working service until this phase has evidence. |
| 5 | Outcome review: expected result, supplied observation, comparison and a human-approved next mission | Not started. Learning scenes stay labelled planned until this is implemented and checked. |
| 6 | Release readiness on one candidate: isolated preview, auth and recovery, workspace isolation, cost reconciliation, backup and rollback, and founder review of the evidence | Not started. No production certification is implied by earlier phases. |

## Phase 3 boundary

A pilot enquiry validates the offer, contact details, product question and explicit consent. Abuse protection is a hidden field, an in-memory network limit and a stored per-email limit. Success returns a reference. Failure says the request was not confirmed. No reply-time promise is made.

The chosen offer is a public plan id. The brief stays in browser storage and, once submitted, in the enquiry record. Private brief text is not put in URLs. Creating an account is free and does not activate a paid pilot.

An authorised operator can read requests at `/command/pilot-requests` and save a follow-up status. That save does not send email or any other message, and it does not start billing. Operators are addresses in `PSI_OPERATOR_EMAILS`. When that variable is unset, the published operator address `gnaneshwer.jadav@gmail.com` is used, along with any admin or moderator role already stored.

## Still outside these phases

Checkout, automatic entitlements, customer interviews run by agents, production deployment and unattended learning remain out of the first promise. Books, publishing and regulated healthcare stay out of scope.
