# Production roadmap Phase 2 — public understanding and conversion

25 October 2026. Baseline: Phase 1 merged at `07f1984` (PR #25). This is the public-journey phase of the production roadmap, distinct from the historical secondary-page Phase 2.

## Result

Retain the approved homepage, PSI architecture, example mission, pricing and brief-builder illustrations. Restructure discovery rather than redraw every approved screen. Product is a compact disclosure containing PSI Platform, Specialists, Product Brain and Use cases; How it works and Pricing & Pilot remain direct header destinations. Mobile exposes grouped Product and Explore/get-started destinations. Footer and header share a destination inventory. Product Brain links target `/psi#product-brain`; its historical route remains an intentional redirect rather than becoming a duplicate page.

The menu uses native buttons and links, an expanded state, Escape with focus return, outside-click/blur dismissal and a scrollable mobile panel. A visible-on-focus skip link targets the main landmark. It is a navigation disclosure, not an ARIA application menu requiring arrow-key navigation.

## One job per public destination

| Destination | Visitor question | Forward path |
| --- | --- | --- |
| Home | Why keep product reasoning connected? | Inspect an example or prepare a brief |
| PSI Platform | How do the layers and shared record connect? | Inspect scope, roles or choose a starting brief |
| How it works | What moves through one mission? | Inspect hypothetical documents, then prepare a brief |
| Specialists | Which disciplines contribute, and what is available? | Explore six contributions and search the catalogue |
| Product Brain section | How do sources, decisions and artefacts retain context? | Inspect the sample record |
| Use cases | Which product question should I start with? | Select an editable starter |
| Security & Trust | Where do authority, access and usage boundaries sit? | Inspect safeguards and the pending sample decision |
| Pricing & Pilot | Which paid scope fits, and what is agreed? | Select Builder/Founder/Studio and request review |
| Resources | How do I prepare useful input? | Edit/keep a local brief, then optionally send an enquiry |
| About | What company and product direction are we building? | Explore the product workflow |

Use cases now selects between idea validation, product improvement and learning by building in one illustrated workspace. Each exposes input → specialist contributions → owner decision → proposed takeaway. It replaces three long repeated sections while preserving the existing starter contracts and draft precedence. Existing drafts win until the user explicitly loads a new starter.

Security & Trust now explains proposal → review boundary → owner decision, followed by expandable access, usage, action and data boundaries. Review labels remain distinct from generation provenance. Its former claim that public brief text existed only in the page was incorrect: browser-local draft storage is now disclosed. No new security guarantee or certification is claimed.

The Specialists example now consistently calls its download permission a local example choice, not a real owner decision. Its artwork and interaction remain; no model, external action or mission approval runs there. The directory introduction points visitors toward availability and role search rather than duplicating the entire platform explanation.

PSI's audience overview links to editable use-case starters. This short conceptual overview remains intentional; detailed starter preparation belongs on Use cases/Resources. Consistent terms across pages are retained rather than treated as unwanted duplication.

## Metadata and indexing

Marketing canonical URLs, homepage structured data, sitemap and robots sitemap location now use the served `https://www.deliverx.dev` host. Shared page heads also supply Twitter title and description. Retired redirects stay outside the sitemap. Account pages are not added to it. Existing route-specific metadata and auth behaviour remain intact.

## Verification

- TypeScript and production build pass.
- ESLint has zero errors and nine existing warnings.
- Local suite: 183 passed, 25 environment-dependent skips. CI independently exercises its isolated PostgreSQL tests before merge.
- Browser route audit: Home, PSI, How it works, Specialists, Use cases, Security, Pricing, Resources, About and Login. One H1 per page; no missing same-page anchor targets or failed loaded images. Nine marketing canonicals match the selected host; Login retains its account-specific metadata.
- All ten routes checked at 390/768/1440px: no document-level horizontal overflow. This does not claim a complete site-wide accessibility certification.
- Desktop Product disclosure opens; Escape closes it and returns focus. Mobile grouped menu opens and links Product Brain directly to the existing section. Historical `/product-brain` redirect also verified.
- Three starter selections update their brief destinations. Clean learning starter reaches Resources and carries its six fields into the pilot form. Existing saved draft remains intact when a different use case is selected. Selected Studio offer survives the return to brief preparation. No enquiry submitted and no billing/activation triggered.
- Native trust disclosures expand to show data boundaries. Existing illustration assets retained.

## Release boundaries

No schema, authentication, billing, provider or permission changes. No customer results, agent activity or paid entitlements invented. Legal-policy/commercial verification, signed-in onboarding acceptance and operational production gates remain in later phases. This public release improves understanding and navigation; it does not certify full PSI production readiness.
