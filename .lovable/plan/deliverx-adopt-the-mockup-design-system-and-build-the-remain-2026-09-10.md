# DeliverX — adopt the mockup design system and build the remaining product

The uploaded zip (`deliverx-site`) contains 16 static HTML mockups covering the full
product: landing, how-it-works, onboarding, dashboard, Experience simulation,
Launchpad readiness, portfolio, coach dashboard, Professional Workspace, pilot join
page, plus a shared stylesheet (paper/ink base, teal live accent, amber highlight,
monospace labels, panel-based layouts).

This plan adopts that design system across the app and builds the missing product
surfaces, in phases, on top of the trust rails already in the database (append-only
evidence ledger, versioned frameworks, Capability-Engine-only capability writes,
Verified = external attestation + externally verified evidence).

## Phase 1 — Design system adoption (whole app)

- Port `_shared.css` tokens into `src/styles.css` as semantic tokens: paper/ink
  surfaces, teal "live" accent, amber highlight, monospace label style, panel +
  record-row patterns. Keep existing shadcn component wiring; map new tokens onto
  the semantic system (no hardcoded colors in components).
- Reskin in this order: marketing pages (index, how-it-works, experience,
  launchpad, professional-workspace, pricing, legal), then auth, onboarding,
  workspace shell, evidence, capability, coaching, team/settings.
- Match mockup composition: live record strip on the landing page, numbered
  five-step grid, dark trust-model band, three product cards.
- Update onboarding to mirror the mockup's exact question sequence and copy
  (who you are → target → experience → strengths → evidence posture → working
  style → review → ready), keeping the existing backend tables and resumable state.

## Phase 2 — Dashboard (Contextual Home upgrade)

- Rebuild workspace home to match `dashboard.html`: journey state, record strip of
  recent evidence, readiness summary, next action, streak/activity where honest.
- All data real (from evidence ledger, score runs, journey state) — no invented
  metrics. Empty states per mockup.

## Phase 3 — Experience simulation (first playable sim)

- Schema: `simulation_scenarios`, `simulation_sessions`, task submissions as
  immutable `artefact_versions`, evidence ledger entries with source `experience`
  (reusing existing rails — no new capability write path).
- One scenario from the mockup ("MediFlow Technologies", multi-day structure):
  three-panel layout — left company/navigation, centre task workspace with
  sectioned editor and checklist, right guidance + live evidence preview.
- Submission flow: save draft → submit → artefact version + evidence entry →
  available to existing scoring (Capability Engine) unchanged.

## Phase 4 — Launchpad + Portfolio

- Launchpad app (`launchpad-app.html`): readiness picture panels — judged
  capabilities vs framework target, evidence coverage, gaps, honest "not yet"
  labels. Read-only derivations from existing tables.
- Portfolio (`portfolio.html`): public, tokenised read-only page
  (`/portfolio.$token`) a person can share — shows only attested/verified items
  and what the owner chose to publish. Owner controls visibility per claim.

## Phase 5 — Coach dashboard

- Rebuild coaching review surface per `coach-dashboard.html`: queue with
  programme/exercise context, submission viewer, review notes, confirm/reject —
  wired to the existing review RPCs (no change to the provenance rules).

## Phase 6 — Pilot join page + workspace polish

- `pilot.html` join flow (build the record → create account) as the public entry,
  wired into existing signup with a pilot flag.
- Professional Workspace page content per `workspace.html` copy (move work
  forward, assistance without loss of control, nothing becomes a commitment by
  accident).

## Out of scope (unchanged charter rails)

- No new capability write paths; scoring stays with the existing engine.
- No Verified promotion without external attestation + externally verified
  evidence.
- No payments/billing, email sending, marketplace, or standalone coaching SKU.
- GitHub repo's full feature set remains a later phase; this covers everything
  represented in the mockups plus PRD surfaces already discussed.

## Verification

- Typecheck + build after each phase.
- Playwright walkthroughs with the existing test accounts: candidate does a sim
  task end to end → evidence appears → scoring → Launchpad readiness updates →
  portfolio link → attestor confirms → coach dashboard review flow.
- Security linter after new tables/policies.

## Technical notes

- All new routes under `src/routes/` (public marketing + `_authenticated/*` for
  app surfaces, `portfolio.$token` public read-only).
- Server logic via `createServerFn` in `src/lib/*.functions.ts`; queries in
  `*-queries.ts`; new tables get GRANTs + owner-scoped RLS in the same migration.
- Mockup CSS tokens ported into `src/styles.css` `@theme` (Tailwind v4), fonts via
  `<link>` in `__root.tsx`.
