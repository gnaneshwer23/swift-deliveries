# Coaching evidence: first trusted vertical slice

## Goal
Add the coaching submission pathway inside the existing Professional Workspace. A candidate submits a versioned artefact to an enabled programme exercise; a moderator or admin reviews it; only confirmation creates an immutable `coaching_submission` ledger entry.

This slice deliberately does **not** add capability writes, Verified promotion, AI scoring, capstone companies, billing, notifications, exports, cohorts, or a separate coaching product.

## What will be built

### Candidate pathway
- Add a **Coaching** view inside the signed-in workspace, hidden unless at least one programme is enabled.
- Show enabled programmes and their exercises, mapped to the existing `pm-core@2026.1` framework capabilities.
- Accept an in-app structured response, an external artefact link with captured content hash, or a private uploaded file.
- Allow an optional confidence self-assessment, stored and labelled only as self-report.
- On submit, create an immutable artefact version and a pending coaching submission. No evidence-ledger entry is created yet.
- Show pending, confirmed, rejected, and superseded attempts. Rejected work may be resubmitted as a new attempt; prior history remains intact.

### Coach pathway
- Reuse the existing `moderator` and `admin` roles for coach access.
- Add an embedded review queue inside the workspace, visible only to those roles.
- Show the locked submission, framework criterion, provenance, and previous attempt context.
- Allow confirm or reject. Confirmation requires a coach note; rejection requires a reason.
- Keep score adjustment and AI draft assessment out of this slice because no approved scoring output exists yet.

### Database-enforced trust rules
- Extend `evidence_source` with `coaching_submission`.
- Add `coaching_programmes`, `coaching_exercises`, `coaching_submissions`, and immutable `coach_reviews`, with explicit grants and row-level access rules.
- Programme enablement is database-controlled per programme and defaults to OFF.
- Candidates can submit only to enabled programmes and only against their own immutable artefact versions.
- Only moderators/admins can review; they cannot review their own submissions.
- A database confirmation function will atomically create one confirmed review and one ledger entry. Direct client insertion of coaching ledger evidence will be rejected.
- The ledger entry will require the artefact version, programme/exercise, coach identity, confirmation timestamp, note, attempt number, and framework version in provenance.
- Coaching evidence will use `assessed` strength, never `externally_verified`; the existing Verified rule remains unchanged.
- Rejections create no ledger evidence. Confirmed submissions and reviews cannot be edited or deleted.

### Seed and rollout state
- Seed disabled programme records for **PM Foundations**, **PM Advanced**, **BA Essentials**, and **Project Delivery** without inventing exercise content.
- No programme will be visible until a founder enables it and supplies approved exercises.
- Add safe empty states explaining that coaching intake is not currently enabled.

## Technical details
- Implement schema changes as one approved Lovable Cloud migration, including every grant, policy, index, trigger, and security-definer function.
- Keep privileged confirmation in an authenticated server function that verifies the reviewer role, then calls the narrow database function; ordinary reads continue to respect row-level access.
- Store uploads in a private coaching artefacts bucket with candidate/coach-scoped access; persist file metadata and checksum in artefact-version content rather than exposing public URLs.
- Add focused server functions and query definitions for programme catalogue, candidate submissions, coach queue, submission, confirmation, and rejection.
- Extend the existing evidence overview labels so confirmed coaching entries visibly show **Coaching · Coach confirmed**, framework version, and coach note.
- Preserve the current Editorial Precision design, protected-route gate, bearer-token middleware, append-only ledger, and external-attestation logic.

## Validation
- Prove at the database boundary that pending/rejected submissions cannot create ledger entries, ordinary users cannot confirm, reviewers cannot self-confirm, and duplicate confirmation cannot duplicate evidence.
- Verify a confirmed review atomically creates exactly one immutable ledger entry with complete provenance and `assessed` strength.
- Verify coaching evidence alone cannot set `externally_verified`, `externally_attested`, or `verified`.
- Run type checks, build checks, database linting, and signed-out access checks.
- Exercise candidate and coach flows in the browser when test accounts with the required roles are available; otherwise report that authenticated visual verification remains blocked.
