# DeliverX Premium Enterprise SaaS — Design Concept

Status: design direction approved for implementation in this branch. This document is the concept checkpoint; it does not claim that every planned page or capability already exists.

## Design objective

Make the existing DeliverX public website and authenticated Command Centre feel like one coherent, trustworthy, premium enterprise product. Keep the current product truth: the Command Centre supports bounded Investigate, Prototype, and Improve missions, a capability registry with 12 Wave 1 roles available out of 150 catalogue roles, plans and human approvals, usage ceilings, labelled artefacts, and a deterministic simulated fallback when model keys are absent. Preserve the legacy career surfaces and their routes.

## Visual direction

- Calm enterprise SaaS: warm-white canvas, ink/navy typography, cool slate surfaces, restrained blue accent, subtle teal for successful states, amber for attention, red only for errors or destructive states.
- Strong hierarchy: one page title, one supporting sentence, one primary action per context; reduce competing badges and over-decorated cards.
- Layout: 12-column responsive grid, consistent max-width, generous vertical rhythm, thin borders, restrained shadows, 12–16px radii, predictable alignment.
- Typography: readable system sans stack, compact labels, clear headings, tabular numerals for usage and counts. Avoid oversized gradients as the primary visual device.
- Motion: short and purposeful; honor prefers-reduced-motion. No motion that implies actual execution when the state is only illustrative.
- Components: consistent buttons, inputs, status chips, panels, empty/loading/error states, tables and mobile navigation. Maintain visible focus states and semantic controls.

## Page concepts

### Public website

1. **Homepage** — communicate the value in one sentence; show a calm, product-led preview of the current supervised mission lifecycle; explain evidence, approvals and portability; CTA to start a mission. State that only Wave 1 capabilities are operational and distinguish simulated outputs from model-backed work. Keep existing links to the legacy Experience journey where appropriate without allowing it to dominate the primary product story.
2. **How it works** — a clear seven-phase lifecycle, approval gates, agent/capability maturity, evidence provenance, and an honest description of what can be executed today.
3. **About** — explain DeliverX Super Intelligence and the supervised-workforce direction; avoid claims that future technology monitoring, real customer interviews, full code execution, or 150 operational agents are already live unless the repository verifies them.
4. **Pricing / pilot access** — preserve truthful pilot/checkout status. Never display purchasable prices unless checkout is configured.
5. **Experience, Launchpad, Professional Workspace** — preserve legacy career product routes and working content; align visual language without silently removing or repurposing them.
6. **Login / signup / onboarding** — reduce friction, keep clear labels and error feedback, retain auth behavior.

### Authenticated application

1. **Command Centre** — mission intake, project selector, usage ceiling, human-supervision queue, completed/active missions and available capability count. Make the current status and next action obvious. Use real query data only.
2. **Programmes and projects** — readable list/table with search/filter affordances only where functional, clear empty states, progress and ownership/status from actual records.
3. **Mission detail** — one consistent lifecycle header, clear plan, approval checkpoint, task execution status, artefact list and delivery report. Make blocked, simulated, failed and completed states visually distinct.
4. **Capability catalogue** — clear operational vs planned status; never imply all 150 roles can be assigned.
5. **Shared application shell** — responsive sidebar, compact header, predictable active navigation, usage meter and user controls. On mobile, nav must be operable and not obscure page content.

## Shared tokens

- Canvas: #F7F9FC; surface: #FFFFFF; subtle surface: #F1F5F9.
- Primary ink: #17243A; secondary text: #526176; muted: #6B778A.
- Border: #E1E7EF; primary accent: #315FCE; accent soft: #EEF4FF.
- Success: #147D64 on #E8F7F1; warning: #946200 on #FFF5D9; error: #B42318 on #FEF0EF.
- Focus: 2px visible outline with offset; body text contrast should meet WCAG AA.
- Spacing: 4px base scale; content widths and breakpoints follow existing layout conventions where possible.

## Non-negotiable behavior and trust rules

- Do not replace route logic, queries, mutations, auth, permissions, approvals, or feature flags with mock implementations.
- Do not fabricate metrics, live agents, real interviews, meetings, research, test results, or completed work.
- Keep simulated mode clearly labelled when model keys are unavailable.
- Keep current product boundaries: bounded mission intents; only Wave 1 capabilities assignable; explicit human approval before execution; external actions are not silently performed.
- Preserve legacy career routes and existing accessible semantics.
- All changes must pass repository tests, lint, and production build where the environment permits. Verify responsive states and route behavior before claiming validation.

## Implementation sequence

1. Design concept checkpoint (this document).
2. Shared visual tokens and layout refinements for the public marketing shell and authenticated Command Centre shell.
3. Page-level refinements on homepage and Command Centre, then align related public/app routes.
4. Run tests, lint and build; inspect the diff for unintended product behavior changes.
5. Open a pull request; do not merge or deploy automatically.
