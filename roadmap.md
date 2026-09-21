# Roadmap

Approved plan: adopt mockup design system + build remaining product (phases 1–6).

- [x] Phase 1: mockup design tokens/classes in src/styles.css; reskinned marketing, auth, onboarding, workspace shell
- [x] Phase 2: contextual dashboard with real data
- [x] Phase 3: Experience simulation (MediFlow scenario, five tasks, immutable evidence)
- [x] Phase 4: Launchpad readiness pack + tokenised public portfolio (`/portfolio/$token`, expiring + revocable)
- [x] Phase 5: Coach dashboard rebuild (queue depth, submission detail, decision history)
- [x] Phase 6: Pilot join follow-through + Professional Workspace depth (eight operational areas, AI drafts, immutable submissions, consent-led contribution trail)
- [ ] Branded emails (blocked: deliverx.dev has not been configured as a sending domain)
- [x] Built-in payments test environment + Experience, Launchpad, and Complete Journey catalog
- [x] Live payment readiness passed and checkout is enabled
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
- [x] deliverx.dev points at this app and www redirects to it
- [x] Public story uses the production paid plans (£19/£19/£29)

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
- [x] deliverx.dev and www.deliverx.dev are connected to this published app
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
- [x] deliverx.dev is the primary connected domain for this app

## Brand and launch audit (20 Sep 2026)
- [x] Create and apply a distinctive DeliverX logo and matching favicon
- [x] Re-audit public, authenticated, coach, trust, payment, and recovery journeys
- [x] Re-run SEO, security, dependency, accessibility, and mobile checks
- [x] Fix code-level launch findings; updated sitemap and metadata are ready for the next publish
- [ ] Configure and verify deliverx.dev as the branded email sending domain
- [ ] Publish this audited build, then verify the updated live sitemap and metadata

## Production monitoring (21 Sep 2026)
- [x] Append-only `monitoring_events` table (admin/coach read only, no updates or deletes)
- [x] `/api/public/monitoring/health` uptime probe (200 ok / 503 degraded, records failures)
- [x] Scheduled health check every 5 minutes via pg_cron + pg_net against the production URL
- [x] `/api/public/monitoring/uptime` cron-authenticated journey probe (home, pricing, experience, launchpad, login, health)
- [x] Broken-journey + critical browser error capture (error boundary, window errors, unhandled rejections; deduped and capped)
- [x] Server error capture in the request middleware
- [x] Payment failure capture: webhook failures, failed invoices, checkout session errors
- [x] `/workspace/monitoring` admin view: last uptime check, volume by type, event log
- [ ] Optional: external third-party uptime alerting (email/SMS) pointed at /api/public/monitoring/health
