# Website, Landing Pages & UX/UI Design Specification

Companion chapter for the DeliverX master development guide. Public marketing and the authenticated `/command` application share brand foundations but have separate navigation and purposes.

## Required public order

Home → PSI Platform → How It Works → 150 AI Agents → Product Brain → Solutions → Security & Trust → Pricing & Pilot. Authenticated users have a persistent Launch PSI Workspace entry. Resources and About remain in secondary navigation. Retired career routes retain their existing redirects.

| Page | Purpose and sections | Primary destination |
| --- | --- | --- |
| Home `/` | Hero and illustrative product interface; disconnected context problem; Product Brain; specialist workforce; lifecycle; example judgement handoffs; learning; governance; paid pilot conversion | Platform and example mission |
| PSI `/psi` | Shared context; orchestration and task contracts; human governance; interactive judgement sequence | Example mission and pricing |
| How `/how-it-works` | Concrete onboarding mission; named specialist handoffs; six-step walkthrough; responsibilities and deliverable limits | Product brief and workspace |
| Agents `/ai-agents` | Interactive department wheel; text search; department and status filters; capability details and limitations | Directory exploration |
| Brain `/product-brain` | Source → decision → versioned artefact; observed feedback → next hypothesis | Mission and pilot |
| Solutions `/solutions` | Founder/startup validation; PM/team improvement; student/builder learning; inputs, mission and outputs for each | Example mission and pilot |
| Trust `/security` | Human approvals; server ownership checks; permissions and budget limits; evidence and review labels | Inspect safeguards and pilot |
| Pricing `/pricing` | Three paid monthly offers; included scope; GBP model allowances; pause rules and billing availability | Plan-specific pilot preparation |

## Visual rules

Interface previews carry the core product explanation; realistic illustrations support the corresponding concept. Every illustration has an HTML title, numbered handoff labels and explicit direction. The example judgement flow names senders, recipients, outputs and escalation rules. Do not use unreadable labels baked into raster artwork. Do not imply a concept image is a live screenshot.

The 150-role directory uses the current generated capability registry. Twelve public browsing groups merge strategy/orchestration, trust/finance governance and growth/commercial from the existing fifteen execution departments. This does not change execution taxonomy. Foresight and analytics remain explicit groups. Search, wheel and status filters compose and have a reset and zero-results state. Catalogue availability is not runtime certification.

## Paid pilot commercial assumptions

Builder £29/month: one owner, one product, one bounded mission, up to £5 model cost. Founder £99/month: three collaborators/products, four missions, up to £20 model cost. Studio £299/month: ten collaborators/products, twelve missions, up to £60 model cost. Scope, seats and access are pilot offers to be confirmed before billing; they are not yet automatically enforced subscription entitlements. No automatic overage billing. Applicable taxes excluded; no annual commitment advertised.

These are positioning hypotheses, not validated willingness-to-pay or proven margins. Benchmarking on 22 October 2026: Taskade lists $10/$25/$100 monthly equivalents billed annually; Lindy lists $49.99/month with 5,000 credits and higher usage options; Relevance AI's current pricing emphasises custom enterprise actions and vendor credits. Sources: https://www.taskade.com/pricing , https://www.lindy.ai/pricing , https://relevanceai.com/pricing . Do not compare GBP offers to USD prices as currency equivalents. Allowances cap included model costs to roughly 17–20% of revenue; hosting, support, payment fees and acquisition costs still need measured unit economics. No claim of unlimited execution.

## Responsive, accessibility and SEO criteria

- Desktop navigation follows the specified order. At smaller widths use the same ordered mobile menu and avoid horizontal overflow.
- Department wheel becomes a readable button grid on phones. All controls have visible names, keyboard focus and pressed state. Search and filters have labels; result counts announce updates.
- Art labels remain real text, wrap on mobile and have sufficient contrast. Images have meaningful alt text and responsive WebP sources. Reduced-motion preference disables decorative movement.
- Example handoff controls update the named receiving team, output and escalation rule. Never silently advance a real mission or a human gate.
- Each page has its own title, description and canonical URL; all public product pages appear in sitemap.xml. No invented testimonials or customer outcomes.
- Plans show GBP, billing period, scope, included usage and availability together. Pilot preparation must preserve the chosen plan and must not imply a request was submitted or a payment made.

## Release limits

Pilot preparation currently links to brief creation and account setup; automated request submission, checkout, paid entitlement enforcement and pilot approval are not implemented. The page discloses this. Workspace auth and production agent execution require separate verification. Connected outcome collection, a full interactive knowledge graph and autonomous learning remain planned.
