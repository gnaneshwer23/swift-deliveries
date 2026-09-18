# deliverx.dev vs this app — content and feature comparison

I crawled deliverx.dev and its linked pages (home, how-it-works, experience, launchpad, professional-workspace, resources, resources/pm-portfolio, signup) and compared them with this app's pages and working features.

## Headline

The live site is a **marketing-only** site: eight polished pages, no signed-in product behind them (signup leads to a pilot form, checkout is explicitly "not configured"). This app is the **working product**: the same three propositions, plus real accounts, evidence ledger, coaching review, AI scoring, workspace records and Stripe test checkout.

So the gap runs in both directions: the live site has richer copy and pages we don't have; we have functionality the live site only describes.

## Content the live site has that this app lacks

| Live site | This app |
| --- | --- |
| `/resources` hub with product paths, orientation notes | `/resources` exists — needs comparison of depth |
| `/resources/pm-portfolio` full long-form guide | missing |
| `/resources/star-interview-stories` full long-form guide | missing |
| Home: "Built for" audiences, 5-stage Learning→Delivery ladder, 8-step journey (Discover Yourself → Real Job), 4 example paths (Career Switcher, Graduate, Senior PM, Engineering Manager), 8-question FAQ | partially present |
| How it works: 5 numbered steps with product previews, 5-tier evidence taxonomy (self-reported / imported draft / observed with consent / evidence / externally verified), flow diagrams, 5-question FAQ | shorter version |
| Product pages: per-product feature triads, per-product FAQs, "Complete Journey" cross-sell block on every page | shorter version |
| Explicit honesty statements: no money-back guarantee, no job guarantee, no employer marketplace, Team Copilot is a Workspace alias not a third SKU | not stated |
| `/pricing` framed as **pilot access** with "prices appear only when checkout is configured" | pricing shows £19/£19/£29 tiers with checkout behind a flag |

## Features this app has that the live site only describes

- Accounts, Google OAuth, password recovery, onboarding, contextual home
- Experience simulation writing immutable artefacts and evidence
- Evidence ledger with provenance, capability judgements, external attestation and Verified rules
- Coach review queue with confirm/return decisions
- AI-assisted scoring with written rationale and cited evidence
- Launchpad with tokenised, expiring shareable portfolios
- Professional Workspace: projects, team, tasks, meetings, artefacts, decisions, risks, evidence review, consent gate, AI drafts with approve/edit/dismiss
- Organisations, invitations, team roles
- Stripe subscriptions (test mode) with per-plan access rules

## Notable inconsistencies to resolve

1. **Pricing story conflicts.** Live site says pilot access, no prices until checkout is configured. This app has three £/month tiers built and tested. One message must win.
2. **Two properties, one brand.** deliverx.dev serves the Vercel marketing site; the working app is on the Lovable URL. Visitors who sign up on the live site never reach the product built here.
3. **Journey naming.** Live site's 8-step journey (incl. Performance Review, Interview) is broader than what this app implements; copy would over-promise if ported verbatim.
4. **Missing product surfaces named on the live site:** Inbox, Timeline, Interview Lab, application tracking, Career Intelligence roadmap.

## Proposed next step (pick one, then I plan the build)

- **A. Port the content.** Bring the live site's stronger marketing pages into this app — resources hub, both long-form guides, richer home/how-it-works/product pages, honesty statements — aligned to what this app actually does, keeping the current design system. No backend change.
- **B. Align the story only.** Reconcile pricing/pilot messaging and journey naming across both, minimal page work.
- **C. Close the feature gaps** the live site advertises: Interview Lab, application tracking, workspace Inbox/Timeline, Performance Review.
- **D. Domain and consolidation.** Decide whether deliverx.dev points at this app, then retire or fold in the Vercel site.

## Technical notes

- Crawled content is saved under `/tmp/dxcrawl/`; nothing was written into the project.
- The live site is Next.js on Vercel; this app is TanStack Start + Supabase. Porting means rewriting sections as route components in `src/routes/*` and `src/components/marketing/*`, not copying Next.js files.
- Long-form guides would become new public routes (e.g. `resources.pm-portfolio.tsx`) with their own head metadata.
