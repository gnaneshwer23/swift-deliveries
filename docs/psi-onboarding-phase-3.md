# Production roadmap Phase 3 — account entry and first saved brief

25 October 2026. Baseline: Phase 2 at `e91ceb2`. Status: implementation and the checks below completed; new-account/email-recovery acceptance remains open. This is not full production certification.

## Experience

Login, signup, recovery and reset share a responsive illustrated entry frame, the Product Super Intelligence identity and explicit account-versus-paid-pilot boundaries. Browser-local brief/offer continuity is visible without copying private brief text into the address. Loading actions have readable labels; recovery errors are alerts. Reset starts in a checking state, hides its form for missing/expired links, removes a reset token from the address and retains the sanitised workspace destination through recovery and sign-in. The legacy recovery alias preserves safe destinations too.

Setup is three stages: context (name, role, team), direction (goal and optional question), review and entry. The review shows the actual answers, edit controls, prepared-brief availability, selected offer and the next action. Learning guidance uses the same evidence standard as other product work. Completing setup saves a profile, not an agent run or a paid activation.

## Continuity and save handling

Restoration completes before editing starts. A completed profile wins; otherwise a whole browser/account snapshot wins by its available timestamp. Legacy browser drafts remain supported. A deliberately cleared value is not refilled from an older draft. A prepared question is used only when no setup snapshot exists. Invalid enums/steps and corrupt storage are rejected. Restoration is bounded by a deadline and reports fallback rather than silently pretending the account draft loaded.

Next and Finish are serialized within a mounted form; fields are disabled during a save. Account draft failures leave the answers visible and report the limitation. Browser storage failures are disclosed. Completed profiles are not partially rewritten by Next; profile updates occur on Finish. Optional auth display-name synchronisation does not block entry after the profile saves. Forms are keyed by user identity to avoid carrying component state between accounts. This is not a claim of cross-tab revision conflict resolution; that remains a separate concurrency concern.

Mission intake restores an account-keyed tab draft before prepared defaults. A matching prepared question brings audience, objective and constraints with it. An unrelated edited profile question does not inherit another question's context. Explicit Use prepared brief replaces displayed intake fields. Evidence is added and classified after saving, not silently transformed into research. The full public draft remains available. Audience intake is bounded to the existing server limit, with a visible overlength warning rather than silent truncation. Workspace readiness and field validity gate Save; saving creates a brief only.

## Verification retained

- TypeScript and production build pass. Lint: zero errors, nine existing warnings.
- Local suite: 194 passed, 25 environment-dependent skips. Eleven new regression cases cover snapshot precedence, cleared values, corrupt storage/enums, invalid steps, completed-profile priority, matching versus unrelated brief context and private redirect fields. CI independently exercises its isolated database suite.
- Browser: login/signup/recovery/reset at 390/768/1440px, one H1 each and no horizontal overflow; signed-in setup stages at mobile/tablet/desktop, name validation, goal guidance, review editing and heading focus.
- Recovery links retain `/command/capabilities`. An unsafe legacy recovery destination resolves to `/command`. An expired reset URL exposes no password fields and retains a route to request another link. No reset email was sent and no password was changed.
- Existing isolated acceptance account: reviewed unchanged profile answers, saved setup and reached `/command#supervised-brief`. A synthetic intake retained its four fields through refresh and saved to mission `ef02ba83-d898-461e-88e8-41b521cb445b` on the previously authorised disposable Neon branch. The record shows Brief stage, zero attempts and zero usage. No provider, external action, approval or billing activation ran. No production profile or customer record was edited for browser testing.

## Remaining release acceptance

A fresh account through confirmation, actual reset-email delivery/password change, session expiry during save, and a separate second-workspace browser journey still require owner-assisted acceptance in an isolated environment. The current test account was already completed; pure regression fixtures exercise unfinished-draft restoration, but do not substitute for that fresh-account browser acceptance. Do not call these checks passed based on the redesigned screens.

No schema migration, provider activation, new permissions or credentials were introduced. Existing server ownership checks and final validators remain authoritative. The selected pilot remains an offer until separately agreed and activated. Other runtime/billing/operational gates remain in Phases 5–7.
