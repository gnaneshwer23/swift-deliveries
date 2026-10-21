# Plan: Organisations & Prove Implementation

Source: uploaded "DeliverX — Organisations & Prove Implementation Plan" (Oct 8, 2026). Build order per the doc: authoring template + Prove first, then organisations two at a time.

## Current state (verified)
- Three organisations live (LearnFlow, GreenGrid, MediFlow) with hard-coded scenario content.
- Attestation exists in basic form (`/attest/$token`, evidence.functions.ts); Verified is already attestation-gated.
- No Prove page, no public `/verify/[token]` page, no Open Badges credentials, no scenario engine, no event cards.

## Sprint 1–2: Scenario engine + Prove foundation
1. **Schema**: tables `organisations`, `stakeholders`, `phases`, `event_cards`, `organisation_event_cards`, `user_event_draws` with RLS; owner-scoped draws, admin-managed content.
2. **Authoring template**: one structured YAML file per organisation (id, sector, stage, entry_level, brief, stakeholders with wants/trust, phases with artefact type + rubric dimensions + unlock order, signature dilemma, event cards, framework_version `pm-core@2026.1`). Admin import creates rows; no developer needed for new orgs.
3. **Render from data**: Experience offer, phases and task screens read from these tables; confirm the three existing orgs still work unchanged.
4. **Prove page + nav item** next to Experience/Launchpad/Workspace: four-step ladder (Submitted → Assessed → Coach-confirmed → Verified), three external references (Government Digital and Data Capability Framework, Open Badges 3.0, external attesters), and the "never counted as proof" list (course completion, AI score alone, self-reported claims, staff/paid-coach attestations).

## Sprint 2: Attestation flow (upgrade existing)
5. "Request attestation" button on any Assessed or Coach-confirmed artefact; email invite to a named attester.
6. Attester signs in with verified work email or LinkedIn, states relationship, sees the frozen artefact + checksum + scenario brief + rubric (not the score), picks one of three fixed statements and a level.
7. Tables `attestation_requests`, `attesters`, `attestations`; DB constraints: only an attestations row can set Verified; DeliverX staff, coaches and the candidate's own email domain are rejected. Tests that try to light Verified by every other path.

## Sprint 3: Public verification + credentials
8. Public `/verify/[token]` page, no login: shared entries with ladder step, framework mapping, rubric level, checksum with re-hash button, "Simulated organisation" label, attester details on Verified entries. Candidates create, revoke and see view logs for their links.
9. Open Badges 3.0 credential issued as signed JSON on attestation (issuer key held server-side only); revocation marks the credential revoked and removes Verified in one transaction, within one hour. Renewal prompt after two years.
10. Invariants test suite: no path except signed attestation lights Verified; revocation removes Verified; checksum mismatch flags tampering.

## Sprint 4: Repairline + Quillbase (first four event cards)
11. Author Repairline (council housing repairs, PM, alpha→beta, hard legal deadline) and Quillbase (B2B SaaS AI assistant, Senior PM, evaluation budget, EU AI Act constraints) via the template.
12. Event card library v1: production outage, budget cut, key engineer resigns, dependency deprecation (the dropped Relay API scenario).

## Sprint 5: PayBridge + ShiftHire
13. PayBridge (UK–India remittances, Senior PM) and ShiftHire (shift-work marketplace, PM — replaces StagePass); remaining event cards; publish the pm-core ↔ Government Digital and Data framework mapping, labelled as DeliverX's interpretation, not government endorsement.

## Sprint 6: Ledgerly + Meridian Freight
14. Ledgerly (Indian MSME bookkeeping, PM — replaces Fieldnote) and Meridian Freight (logistics enterprise, Lead PM); update navigation and homepage to nine organisations.

## Technical details
- Server logic via `createServerFn`; public verify page via token-gated server function (no anon table policies).
- Issuer key stored as a secret, never in code; rotation plan documented in AGENTS.md.
- AI judgement, coach review and attestation stay separate; practice/interview data never feeds Prove states.
- Memory: save the Prove rules (ladder, never-counted list, attestation eligibility, two-year renewal) to project memory.
- Open questions from the doc left as product decisions, not built: paid honoraria for reviewers (default: never pay per attestation), whether Senior/Lead Verified needs two attestations (default: one).

## Out of scope
- Workspace (B2B) app code — still frozen per the four unfreeze criteria.
