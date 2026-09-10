# Honest status, and the plan to reach production ready

## Short answer

No. Not everything from the original repository or the PRDs is built, and the app is not yet production ready in the sense of "a real person can complete the whole journey and pay for it".

## What is built and working

- Public pages: home, how it works, Experience, Launchpad, Professional Workspace, pricing, about, resources, legal pages — all in the Editorial Precision design.
- Sign up, sign in, Google sign-in, sign out.
- Professional Intelligence setup: eight steps, resumable, everything saved as your own statement.
- Contextual Home with journey state A to D, derived from real records only.
- Evidence record and Capability pages, with honest readiness and the "not verified" rule enforced in the database.
- External attestation: request, public confirm link, Verified only from an outside confirmation.
- Coaching evidence: programmes, submissions with files or links, coach review by moderators and admins, one confirmed submission adds one evidence record.
- Organisation (optional), team invitations with expiry, revoke and resend, profile settings.

## What is missing

1. **Experience is a description, not a product.** No simulated organisations, no scenario, no decisions, no artefact capture from simulated work, no AI judgement run. This is the single biggest gap against the journey document.
2. **Launchpad is a description, not a product.** No readiness pack, no evidence portfolio to share, no interview stories, no export.
3. **Professional Workspace is a description, not a product.** No meetings, artefacts, review controls, or consent-led observation.
4. **Payments.** Pricing page exists; no checkout, no plan, no entitlements. Nothing is gated.
5. **Email.** Invitations, attestation requests, and coaching decisions rely on manually shared links. No email is sent.
6. **AI judgement.** The Capability Engine currently scores with a fixed pilot rule, not an explainable model run.
7. **From the original repository**, these were never ported: requirements and user stories, RAID and decisions, meetings and standups, documents, delivery/QA views, product discovery, benefits, PI review, career intelligence, experience planner, GitHub integration, meeting-bot integration, reporting.
8. **Nothing has been tested signed in.** There is no test account, so every signed-in screen is unverified by me. This alone blocks a production claim.

## Plan — in this order

### Step 1: Prove what exists (no new features)
Create a test account, walk the whole signed-in journey end to end, fix what breaks. Then run the security scan and fix findings. Publish only after this.

### Step 2: Emails
Send invitations, attestation requests, and coaching decisions by email, with the shared link as a fallback.

### Step 3: Experience — first playable simulation
One realistic organisation, one scenario, a handful of consequential decisions, artefact capture into the existing evidence record, and one explainable judgement run against `pm-core@2026.1`. Same trust rails: no capability write outside the engine, no silent Verified.

### Step 4: Launchpad — readiness pack
Package judged evidence into a shareable, explainable readiness page with per-claim provenance and an honest "heuristic" label where the score is not explainable.

### Step 5: Payments and entitlements
Checkout, plan record, and gating on Experience and Launchpad.

### Step 6: Professional Workspace depth
Meetings, artefacts, review controls, consent-off-by-default observation.

Everything from the original repository beyond that list (RAID, requirements, delivery views, GitHub and meeting-bot integrations, career intelligence) stays out of scope until you ask for it — the journey document does not require it.

## Technical notes

- Trust rails already enforced in the database: append-only evidence ledger, immutable artefact versions, immutable judgements, generated `verified` column requiring external attestation, owner-scoped RLS, private-by-default storage.
- Steps 3, 4, and 6 each need new tables plus grants and RLS, new server functions, and new authenticated routes.
- AI judgement uses the Lovable AI gateway; no external key needed.
- Email needs a sending domain; payments needs a provider account.

## Recommendation

Approve Step 1 alone first. Verifying the built journey is cheap, and a production claim is not honest without it.
