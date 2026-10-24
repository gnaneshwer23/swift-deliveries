# DeliverX public website specification

Updated 24 October 2026 after Phase 2. The Phase 1 customer-story document defines positioning and first pilot scope. The public website and authenticated /command workspace share a design system but have different jobs.

## Navigation

Header: Product (/psi), Example mission (/how-it-works), Pricing & Pilot (/pricing), Sign in and Prepare your brief (/resources#brief-builder). Authenticated users retain their workspace entry. Footer and contextual links expose Specialists, Product Brain, Use cases, Trust, Resources, About and legal. Existing /product-brain URLs permanently redirect to /psi#product-brain; the redirect is excluded from the sitemap.

## Page ownership

| Page | Distinct purpose | Useful next step |
| --- | --- | --- |
| Home | Audience, handoff problem, flagship interactive scene and useful first outputs | Example mission or brief builder |
| Product | Product record, specialist handoffs and human controls; expandable lifecycle/learning | Inspect linked sample records |
| Example mission | One hypothetical onboarding journey and inspectable sample documents | Prepare own brief |
| Specialists | Searchable catalogue; role foundations with stub limitations versus planned roles | Understand contribution in example |
| Use cases | Different inputs/work/outputs for founders, product teams and students | Open corresponding editable starter brief |
| Trust | Action authority, permission/spend boundaries, evidence labels and verification gaps | Review sample decision or product scope |
| Pricing | Three scoped pilot offers with availability and commercial limits | Plan-specific preparation, not a purchase/request submission |
| Resources | Editable starter or blank brief, download and evidence/decision/experiment templates | Keep downloaded work and compare offers |

## Illustration and interaction rules

Preserve the approved isometric layered scenes and real HTML labels. Home holds the flagship scene and context comparison; Product contains deeper record/team/trust scenes and expandable lifecycle/planned learning. Example mission has one illustrated mission stepper. Use cases and Trust use readable directional input/action/output flows rather than repeating general system scenes. Resources uses document motifs, not another platform tutorial.

Every diagram must make direction and handoff meaning understandable without motion. Preserve keyboard/touch controls, visible focus, reduced-motion behaviour and explicit human gates. Sample approval changes no real workspace state. Sample documents are hypothetical and do not represent real customer observations. No weighted vote is presented as outcome probability.

## Capability and commercial boundaries

The directory defaults to role foundations. Registry lifecycle status is not execution certification; available entries have deterministic-stub limitations. Counts derive from the registry; 12 browsing groups do not mean 12 operational teams. Live provider execution, authenticated isolation, durable runtime and the complete outcome loop require later release verification.

Builder £29, Founder £99 and Studio £299 monthly are proposed paid pilot offers. Quotas/allowances are not active enforced entitlements. The pilot enquiry stores a request and returns a reference. It does not take payment or activate the offer. Account creation is free and does not activate paid access. Auth verification, billing and runtime proof remain later phases. Do not claim that a paid pilot is free. No price/market or margin validation is established by this specification.

## Brief starters and public data handling

/resources?useCase=founder|team|student opens the corresponding editable hypothetical starter. Invalid values fall back to a blank brief. These public identifiers contain no user-entered brief text. Entered fields are kept in this browser and copied into a pilot enquiry only when that form is submitted. They are not placed in the URL. Switching starters replaces the browser draft. Downloading does not submit the enquiry.

## Acceptance

TypeScript, lint and production build; inspect desktop/mobile direction and overflow; compose catalogue filters and zero-results/reset; verify all three use-case starters, edits and downloaded Markdown; verify legacy Brain redirect, truthful pricing preparation and accessible footer paths. Passing public checks does not establish authenticated production readiness.
