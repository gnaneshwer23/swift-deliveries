# PI Onboarding and Contextual Home

## Goal
Replace the current three-step, organisation-required setup with the eight-step Professional Intelligence onboarding, and turn the signed-in home into a Contextual Home with a Daily Briefing. Everything captured here is a self-reported Claim: no evidence, no ScoreRun, no capability, no Verified status.

## Current state (verified)
- Setup today has three steps — name/headline, organisation, invites — and the workspace home redirects to setup until an organisation exists. A career switcher with no organisation is currently blocked from the product.
- The home page shows organisation name, member count and role, plus invite/profile/"projects coming soon" cards. There is no journey state, no recommended action, no readiness summary.
- There is no place in the database to store self-reported targets, strengths, evidence posture, or working style, and no reference copy of the journey document in the project.

## What will be built

### Reference document
Save the End-to-End Journey document to `docs/end-to-end-journey.md` so future work can be checked against it.

### Eight-step onboarding
One flow, resumable, each step skippable where the document says so:
1. Welcome — what the platform does and the trust commitment.
2. Identity — name, headline, current role, years of experience.
3. Targets — target role, target level, target domains, timeframe.
4. Strengths (skippable) — self-rated strengths against the pilot framework capabilities.
5. Evidence posture (skippable) — what proof she has today (portfolio, references, none).
6. Working style — preferences such as pace, collaboration, feedback appetite.
7. Review — every answer shown back, each visibly labelled "Self-reported".
8. Recommended path — one recommended next action, with the reason stated.

Rules enforced throughout:
- Organisation becomes optional. A candidate with no organisation completes onboarding and reaches the home; organisation and invites move to an optional step offered later from the workspace, not a gate.
- Every stored answer is a Claim, labelled self-reported wherever it is displayed.
- Completing onboarding writes no ledger entry, no score run, no capability judgement, no claim of verification.

### Contextual Home (Daily Briefing)
The signed-in home becomes the Profile hub:
- Journey state A–D, derived from the record: A pre-experience (no evidence), B evidence building (evidence exists, no capability judgement), C readiness packaging (capability judgements exist), D verified (an externally verified claim exists).
- Recommended next action for the current state, with a one-line reason.
- Honest readiness summary: counts of evidence entries by source, judged capabilities, attested items. Where there is nothing, it says so instead of showing a number.
- No score, percentage, or badge unless the record supports it. Heuristic statements carry a "Heuristic" label.
- Self-reported targets and strengths shown in a clearly separated "Your claims" block, never mixed with evidence.
- Organisation and team cards remain, shown only when an organisation exists.

## Technical details
- One migration adds `self_report_claims` (owner, claim kind, key, value, framework capability where relevant, captured timestamp) and `pi_onboarding_state` (owner, current step, completed flag, skipped steps), both with GRANTs to authenticated, RLS enabled, and owner-scoped policies keyed to `auth.uid()`. No anon access. Claims are separate from `evidence_ledger` and from `snapshot_claims`; nothing in the migration touches the ledger, capability, or Verified logic.
- Onboarding reads/writes through authenticated server functions in `src/lib/onboarding.functions.ts` with Zod validation, plus query options in `src/lib/onboarding-queries.ts`.
- Journey state and briefing are computed in a server function that reads the existing ledger, judgement, claim and attestation tables read-only, so the rule "only the Capability Engine writes capability" is untouched.
- `src/routes/_authenticated/onboarding.tsx` is rewritten as the eight-step flow; `workspace.index.tsx` becomes the Contextual Home; the organisation redirect gate is removed and the organisation/invite path moves into an optional workspace action. Existing organisation, team, evidence, capability and coaching routes keep their behaviour.
- Styling stays with the existing Editorial Precision system and the workspace shell.

## Validation
- Confirm at the database boundary that onboarding writes create no ledger, score-run, judgement, or verified rows, and that one user cannot read another's claims.
- Confirm a brand-new account with no organisation can finish onboarding and land on the home in state A.
- Confirm state transitions A to D reflect the record, and that no score or badge appears without supporting rows.
- Type checks, build, database linting, signed-out access checks, and a signed-in walkthrough if a test account can be minted; otherwise report that signed-in verification is still unverified.
