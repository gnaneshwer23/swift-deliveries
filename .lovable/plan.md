# Is it production ready?

Short answer: not yet. The core journey works, but three of the promised products are still partly or fully unbuilt, and there is no billing or email.

## What is working today

- Public pages in the new design: home, how it works, Experience, Launchpad, Professional Workspace, pricing, pilot, about, resources, legal.
- Sign up, sign in, Google sign-in, sign out.
- Professional Intelligence setup: eight resumable steps, saved as the person's own statements.
- Contextual home built from real records, with journey stages.
- Evidence record and Capability pages, with the "not verified unless externally confirmed" rule enforced in the database.
- External attestation: request, public confirmation link, Verified only from an outside confirmation.
- Coaching evidence: submissions with files or links, coach review, one confirmed submission adds one evidence entry.
- Experience simulation: one company (MediFlow), five tasks, private drafts, locked submissions that enter the evidence record.
- Organisation, team invitations with expiry, revoke and resend, profile settings.

## What is missing before it can be called production ready

1. Launchpad is still only a description — no readiness pack, no shareable evidence portfolio, no interview stories, no export.
2. Coach dashboard is a basic queue, not the reviewing surface from the mockups.
3. Professional Workspace is still only a description — no meetings, artefacts, or consent-led observation.
4. No payments: pricing exists, nothing is charged and nothing is gated.
5. No email: invitations, attestation requests and coaching decisions depend on links copied by hand.
6. Capability scoring uses a fixed pilot rule, not an explainable model run.
7. Only one Experience scenario exists, and its later tasks have not been walked end to end by a real person.
8. No error monitoring, no rate limiting on public forms, no legal review of the live copy.

## Plan to reach production ready

### Step 1 — Prove the built journey (no new features)
Walk every signed-in screen as candidate, coach, attestor and invited teammate. Complete the MediFlow simulation to the last task. Fix what breaks. Run the security scan and clear findings.

### Step 2 — Launchpad readiness pack and portfolio
Package judged evidence into an honest readiness page with per-claim provenance, plus a shareable link-based portfolio. Label anything not explainable as heuristic.

### Step 3 — Coach dashboard rebuild
Proper review surface: queue, submission detail, decision history, notes.

### Step 4 — Email
Send invitations, attestation requests and coaching decisions by email, keeping the copyable link as fallback. Needs a sending domain.

### Step 5 — Payments and entitlements
Checkout, plan record, and gating on Experience and Launchpad. Needs a payment provider account.

### Step 6 — Professional Workspace depth
Meetings, artefacts, review controls, observation off by default.

### Step 7 — Launch hardening
Rate limits on public forms, monitoring, second Experience scenario, final copy and legal pass, then publish.

## Technical notes

- Trust rails are already enforced in the database: append-only evidence ledger, immutable artefact versions and judgements, generated `verified` column requiring external attestation, owner-scoped RLS, private-by-default storage.
- Steps 2, 3 and 6 each need new tables with grants and RLS, new server functions, and new authenticated routes.
- Explainable scoring can use the built-in AI gateway; no external key needed.
- Email needs a verified sending domain; payments needs a provider account. Both are external dependencies on you.

## Recommendation

Approve Step 1 on its own first. Verifying what exists is cheap, and no production claim is honest without it.
