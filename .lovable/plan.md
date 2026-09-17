# DeliverX P0 Professional Workspace depth

Build the first concrete PRD v4 slice inside the existing TanStack application. Preserve the working Experience, Launchpad, coaching, evidence, organisation, and authentication flows; add the operational Professional Workspace rather than replacing them.

The PRD names eight workspace modules despite referring to “all 12 modules.” This phase implements the eight explicitly specified modules only: Overview, Team, Tasks, Meetings, Artefacts, Decisions, Risks, and Evidence Review. No unnamed modules will be invented.

## 1. Establish a real workspace project

- Add an authenticated **Professional Workspace** area linked from the existing sidebar.
- Let a user activate a workspace from an existing Experience enrolment, beginning with the existing MediFlow context, or create a real project with their own title and purpose.
- Keep projects owner-scoped for this P0 slice. Human team accounts remain Phase 2; the Team module initially contains the project owner and AI colleague personas.
- Add a compact project switcher and preserve the existing fixed sidebar and navigation patterns.
- Use meaningful empty states with clear actions; do not seed fake progress, percentages, tasks, or outcomes.

## 2. Implement the eight named modules

- **Overview:** project purpose, current work, recent human-approved activity, open risks, and decisions requiring attention.
- **Team:** the user plus role-based AI colleagues derived from the project context; show role, remit, and current context without pretending AI colleagues are people.
- **Tasks:** create, assign, prioritise, update, and complete work; every state transition is explicit.
- **Meetings:** create meeting records, prepare agendas, record notes, and connect outcomes to tasks.
- **Artefacts:** create editable working artefacts with immutable submitted versions and provenance.
- **Decisions:** capture options, record the human-selected decision, rationale, owner, and linked work.
- **Risks:** record probability, impact, mitigation, owner, and status; AI may suggest risks but never activate them automatically.
- **Evidence Review:** show only submitted, provenance-backed work that is eligible for the Professional Intelligence Ledger; draft and unapproved work remain excluded.

## 3. Add AI colleagues and suggestion workflows

- Add server-side AI generation for meeting agendas, artefact drafts, decision options, and risk flags using the existing Lovable AI gateway pattern.
- Give each AI colleague a stable role persona and project-scoped memory drawn only from approved project records and prior accepted decisions.
- Run generation without freezing the page: create a request, keep the workspace usable, and update the suggestion when ready.
- Every generated item is visibly labelled **AI draft** and offers **Approve**, **Edit**, and **Dismiss** actions.
- Approval never submits work. An approved suggestion becomes editable user-owned working content; submission remains a separate explicit action.
- Record provider failures safely and show a recoverable message without exposing raw service details.

## 4. Enforce consent and the contribution trail

- Add a per-user, per-project observation preference defaulting to **off**.
- Put the control where it is visible in the workspace and explain exactly what changes when enabled.
- Store required operational records such as drafts and explicit approvals independently from optional observation data.
- Write contribution-trail events only when consent is currently on: `AI_draft → user_edit → user_approved → submitted → outcome`.
- Enforce the consent check on the server and in the database write path, not only in the interface.
- Turning consent off stops future observation immediately; it does not rewrite immutable ledger history.

## 5. Preserve and extend the Trust Rail

- Reuse the current immutable artefact versions and append-only evidence ledger rather than creating a competing ledger.
- Add SHA-256 fingerprints to submitted Professional Workspace artefact versions and preserve the exact content cited by evidence.
- Require explicit human submission before any workspace content can enter the ledger.
- Keep ScoreRuns unable to set either verification tier.
- Keep current external attestation intact. Coach-confirmed evidence and externally verified claims will display as distinct labels; this slice will not silently reinterpret existing external verification records.
- Do not add a generic `verification_events` table merely to mirror the document wording; use the existing coaching review and attestation rails unless a later migration is needed to unify badge projections.

## 6. Data and security model

Add narrowly scoped backend records for:

- workspace projects and owner access
- tasks, meetings, decisions, and risks
- working artefacts and submitted version links
- AI colleagues, generation requests, and AI drafts
- observation preferences and consent-gated contribution events

For every new public table:

- grant only the privileges required by authenticated users and trusted server operations
- enable row-level security
- scope reads and writes to the owning user/project
- prevent direct browser writes to immutable submissions, contribution events, and ledger-linked records
- validate state transitions in server functions or database functions so drafts cannot skip approval/submission gates

Schema changes will be applied through Lovable Cloud migrations. Existing generated integration files will remain untouched.

## 7. Interface and design

- Apply the uploaded PRD palette as the canonical workspace theme: obsidian/navy surfaces, teal interactions, exact role accents, 4px controls, and 8px panels.
- Load JetBrains Mono for technical labels and retain Inter for body text.
- Keep the existing editorial public site unless a shared token must change; this is an authenticated product enhancement, not a marketing redesign.
- Use the existing design-system controls, visible teal focus states, keyboard navigation, reduced-motion support, and layouts verified from 375px through wide desktop.
- Use one restrained page-load sequence at most; no scroll-triggered animation system.

## 8. Validation

- Add focused tests for consent-off behavior, allowed state transitions, owner isolation, immutable submission records, evidence fingerprints, and AI draft approval boundaries.
- Verify that an AI draft cannot become a submission or ledger entry without separate human actions.
- Verify all eight modules with a signed-in candidate and confirm coach/reviewer access remains unchanged.
- Check desktop and mobile layouts, keyboard focus, build output, runtime errors, backend security checks, and the existing Experience → evidence → scoring flow.

## Deferred after this slice

- Stripe will support both offers later: subscriptions for Experience/Launchpad/Complete Journey, plus the £499 course, £50 coaching hour, and free 15-minute intro call.
- Launchpad GA depth, payments, coach email/SLA escalation, Performance Review, GDPR tooling, Phase 2 role dashboards, Charter Alignment, Employer API, and human team accounts are not part of this first build.

## Technical notes

- Keep TanStack Start, React 19, Tailwind v4, and the existing Lovable Cloud backend.
- Use authenticated `createServerFn` functions for project operations and a server-only AI helper for generation.
- Extend the existing workspace shell with nested Professional Workspace routes and query-backed loading/error states.
- Preserve the existing evidence, coaching, scoring, attestation, and organisation contracts; migrate conflicting PRD terminology onto those trusted structures rather than duplicating them.
