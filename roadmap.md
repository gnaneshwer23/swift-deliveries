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
