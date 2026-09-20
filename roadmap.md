# Roadmap

Approved plan: adopt mockup design system + build remaining product (phases 1–6).

- [x] Phase 1: mockup design tokens/classes in src/styles.css; reskinned marketing, auth, onboarding, workspace shell
- [x] Phase 2: contextual dashboard with real data
- [x] Phase 3: Experience simulation (MediFlow scenario, five tasks, immutable evidence)
- [x] Phase 4: Launchpad readiness pack + tokenised public portfolio (`/portfolio/$token`, expiring + revocable)
- [x] Phase 5: Coach dashboard rebuild (queue depth, submission detail, decision history)
- [x] Phase 6: Pilot join follow-through + Professional Workspace depth (eight operational areas, AI drafts, immutable submissions, consent-led contribution trail)
- [ ] Emails (blocked: needs a sending domain)
- [x] Built-in payments test environment + Experience, Launchpad, and Complete Journey catalog
- [ ] Enable the checkout feature flag only after live payment readiness passes
- [x] Explainable AI judgement run with evidence citations and immutable score records
- [x] Verify: typecheck, build, linter, security scan, candidate + coach signed-in walkthroughs, semantic page headings

## QA follow-up (14 Sep 2026)
- [x] Loading state for signed-in pages (was a blank screen before hydration)
- [x] Fixed React console error from the workspace sidebar query
- [x] Password recovery: /forgot-password + /reset-password
- [x] Terms and Privacy links on sign-up
- [ ] Not applicable from the 13 Sep report: Settings, Learning, Opportunities/Applications, Baseline/Final assessments, Help, Journey Map, Reviewer queue — these pages do not exist in this app
- [x] Subscription rules: product-specific access; immediate cancellation and failed-payment suspension; immediate prorated upgrades; renewal-time downgrades

## Content and feature gaps vs deliverx.dev (18 Sep 2026)
- [x] Resources hub + two long-form guides; "What we do not promise" on plans
- [x] Interview Lab (`/workspace/interview`) — draft questions from recorded work only, practice answers never become evidence
- [x] Application tracking (`/workspace/applications`) — stages, next steps, portfolio link
- [x] Workspace Inbox (`/workspace/inbox`) and Timeline (`/workspace/timeline`) — read-only, coach vs external verification shown separately
- [x] Performance review (`/workspace/reviews`) — self-assessment, human decision, never lights Verified
- [x] Product pages: application tracking, Inbox and Timeline described; per-page questions and Complete Journey cross-sell
- [ ] Decide whether deliverx.dev points at this app instead of the separate Vercel site
- [ ] Decide the public story: paid plans (£19/£19/£29) or pilot access only

## Production readiness pass (18 Sep 2026)
- [x] Revoked anonymous access to every public table (no policy grants anon; public reads run through token-gated server functions)
- [x] Revoked anon/PUBLIC execute on all privileged database functions
- [x] Experience submissions now store a SHA-256 checksum and human_submitted flag
- [x] Security scan: no active findings
- [x] Trust rail asserted against live data: no Verified claim without external attestation, no judgement without evidence, no contribution event without consent
- [x] All 15 public and 15 signed-in pages checked at 1280px and 375px (candidate + coach accounts)
- [x] /signin redirects to /login for inbound links from older material
- [x] Live payments approved by Stripe; checkout enabled in preview and production builds
- [ ] Sending domain for DeliverX email (only trayakshsinghjadav.com is verified; deliverx.dev not added)
- [ ] Decision: point deliverx.dev at this app instead of the separate Vercel site
- [ ] Known: high-severity js-yaml advisory inside @tanstack/react-start (no fixed release yet)

## Production smoke test (18 Sep 2026)
- [x] 19 public pages load (desktop + 375px), /signin redirects, 404 page works
- [x] 15 signed-in pages load for candidate and coach accounts
- [x] Account creation works; confirmation email is sent; sign-in errors surface clearly
- [x] Trust rail verified in DB: evidence blocked without artefact, ledger append-only, artefact versions immutable, 0 Verified claims without confirmed external attestation, 0 activity events without consent
- [x] Purchase guards: no-subscription user denied; test-mode subscriptions grant test access only, never live
- [x] Live payment form loads on the plans page
- [x] Fixed: live settings file had payment key and checkout switch on one line (checkout would have stayed off in production)
- [ ] Sending domain for deliverx.dev (auth emails currently use the default unbranded sender, rate-limited)
- [ ] deliverx.dev still points at the separate site, not this app

## Brand and launch audit (20 Sep 2026)
- [x] Create and apply a distinctive DeliverX logo and matching favicon
- [ ] Re-audit public, authenticated, coach, trust, payment, and recovery journeys
- [x] Re-run SEO, security, dependency, accessibility, and mobile checks
- [ ] Fix launch-blocking findings and verify deliverx.dev after publication
