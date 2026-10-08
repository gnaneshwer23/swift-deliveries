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

## QA report follow-up (23 Sep 2026)
- [x] DX-023: public page buttons now open the workspace for signed-in people instead of asking them to create an account
- [x] DX-007: adding the same company and role twice no longer creates a duplicate tracked application
- [x] RG-04: password recovery pages confirmed present (/forgot-password, /reset-password); legacy /login/forgot (and any /login/* path) now redirects to /forgot-password via src/routes/login.$.tsx
- [x] DX-017: interview practice forms already clear after saving

## Publication readiness pass (24 Sep 2026)
- [x] Replaced the deprecated server-function validator API across all 9 function modules (`inputValidator` -> `validator`); server log is now warning-free
- [x] Fixed a launch blocker: the `/login/$` splat route also matched a bare `/login`, so the sign-in page redirected to `/forgot-password` and every protected-route bounce landed on password recovery. Replaced with an explicit `src/routes/login.forgot.tsx`
- [x] Verified 16 public and guarded routes return 200 and land on the right URL, with zero browser console errors
- [x] Head metadata (title, description, canonical, OG, Twitter) present on every content route
- [x] Typecheck clean; build OK; security scan shows no critical or warning findings (2 info notes are the intentionally shared capability rubric tables)
- [x] Published the audited build to deliverx.dev
- [ ] Still open: branded email sending domain for deliverx.dev (auth emails use the default sender until DNS is configured)

## DeliverX Workspace (B2B) track (2 Oct 2026)
Spec: docs/workspace-one-page-spec.md. Rules: AGENTS.md "DeliverX Workspace (B2B) product rules".
- [x] Phase 1: spec stored, product rules recorded, unfreeze criteria tracked
- [x] Phase 2: reposition /professional-workspace (sponsor buyer, four v1 roles, case-to-backlog story)
- [ ] Phase 3: Workspace app — six-stage loop (blocked: unfreeze criteria below)

Unfreeze criteria (all must be true before Phase 3 starts):
- [ ] Candidate pilot: at least 5 of 10 users complete the core loop and at least 3 external attestations
- [ ] One design partner committed (real team, real business case, named sponsor, 8 weeks; Fluent Institute first ask)
- [ ] Candidate product in maintenance mode with no open P0/P1 issues
- [ ] Decision-log entry amending the Build Charter to make Workspace a product, not an alias

## Organisations & Prove implementation (8 Oct 2026)
Source: DeliverX — Organisations & Prove Implementation Plan. Build order: template + Prove first, then organisations two at a time.
- [x] Scenario engine schema: scenario_stakeholders, scenario_phases, event_cards, scenario_event_cards, user_event_draws; experience_scenarios gained sector/entry_level/signature_dilemma/framework_version
- [x] Authoring template: content/organisations/repairline.yaml (one YAML per organisation, no developer needed)
- [x] Prove page (/prove) + nav/footer: four-step ladder, three external references, never-counted-as-proof list
- [x] Event card library v1 seeded: production outage, budget cut, key engineer resigns, dependency deprecation, regulator letter
- [x] Attestation upgrade: eligibility blocks (own domain, DeliverX staff domain, staff/coach emails), three fixed statements + level, 2-year renewal date, optional comment stored separately
- [x] Open Badges 3.0 credential issued on confirmation (credentials table); revocation removes Verified and revokes the credential in one flow
- [x] Tests: 10 attestation-rule tests (statements, levels, eligibility, renewal, credential shape); full suite 51 passing
- [x] Sprint 3: public /verify/$credentialId page — live Verified/Revoked status, credential details, frozen artefact fingerprint (view logs + re-hash button pending artefact checksums)
- [x] Sprint 4: Repairline + Quillbase authored as YAML and loaded into the scenario engine (4 stakeholders, 4 phases, 3 event cards each); generator script at scripts/organisation-yaml-to-sql.ts. Experience screens still render legacy task rows — data-driven rendering pending
- [ ] Sprint 5: PayBridge + ShiftHire; publish pm-core ↔ Gov Digital and Data mapping (labelled as interpretation)
- [ ] Sprint 6: Ledgerly + Meridian Freight; navigation/homepage to nine organisations
- [ ] Product decisions parked: no payment per attestation (default); one attestation for Senior/Lead (default)
