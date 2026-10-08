# Publication-readiness: fix the public-site audit + run the logged-in test script

Source: the uploaded audit of deliverx.dev (5 critical, 8 high, medium/low items, 20-test logged-in script). Verified against current code first — several items (Prove in nav, six organisations on Experience, Launchpad canonical/og:url) are already fixed in code but not yet published; the rest are real.

## Decisions applied
- Checkout: enable Stripe for real (embedded checkout, products synced on publish).
- Workspace pricing: two tiers — a lighter individual workspace tier inside the £29 Complete Journey; the £750/project sponsor tier stays B2B on the Workspace page.
- Legal pages: use gnaneshwer.jadav@gmail.com as the data-contact email; no company name/address supplied, so pages will state the trading name "DeliverX" and the contact email, with a note that a registered entity should be added before taking money.
- Scope: public fixes + publish + the full 20-test logged-in script.

## 1. Payments (critical 1)
- Create Stripe products/prices (test env, synced to live on publish): Experience £19/mo, Launchpad £19/mo, Complete Journey £29/mo, Career Sprint £69 one-time, Journey Annual £290/yr. Tax code txcd_10103001 (SaaS).
- Wire the existing embedded-checkout component into /pricing plan buttons; remove "Checkout is temporarily unavailable".
- Verify webhook path (subscriptions table upsert, duplicate/out-of-order guards already built and tested) with a sandbox purchase using the 4242 test card.
- Add the test-mode banner component to the checkout surface.

## 2. Pricing & product-story consistency (critical 2, 3; high 8, 9, 10)
- Two-tier Workspace story: £29 Complete Journey includes the individual workspace (live work, evidence discipline); the Workspace page keeps the sponsor/delivery-lead tier from £750/project/month. Rewrite the plan description and homepage tile so the distinction is explicit.
- Signup: add a stated free tier (first Experience scenario free, as already described in the plan) on /pricing and reflect it in the signup button copy, or change the button — recommend stating the free tier.
- Reconcile step counts: one canonical "six steps" story across homepage, How it works, and Prove's four-step ladder (label the ladder as steps within Prove, not the journey).
- Launchpad: align its feature list with homepage/pricing (interview practice + application tracking), shared footer, remove "Join the pilot"/"Team Copilot" remnants.

## 3. Prove page honesty (critical 4, 5)
- Verify each claim against what is built: Open Badges 3.0 issuance (built), revocation in the same transaction (built), staff/coach/own-domain rejection (built in attestation.ts), attester sees artefact + checksum + rubric, never the score (built). Keep claims that tests confirm; soften any that fail to "coming soon".
- Rewrite How-it-works attestation copy: attester reviews the frozen artefact and rubric (matches Prove), removing the "capability they've witnessed" wording.

## 4. Legal pages (high 11, 12, 13)
- Privacy: add data-contact email, lawful bases, named processors (hosting, AI provider, payment provider), international transfers, retention periods, ICO complaint right, attester data handling, and how deletion interacts with the immutable ledger (anonymisation of owner identity, ledger entries persist).
- Terms: trading name, governing law (England & Wales), attester terms.
- Cookies: verify a real consent gate exists before analytics loads; add one if missing.
- Cancellation wording: align with UK digital-content cancellation rights; flag for solicitor review.

## 5. Medium/low copy fixes
- Fix "the versioned capability framework for this framework" and "Consent-off observation by default".
- Standardise on "attester" everywhere.
- Resources: point "What Verified means" at /prove, not /about.
- One share-link description ("private, expiring, revocable") across Resources, Prove, Pricing.
- About page: add founder name/story (will ask for the text or draft from what exists).
- noindex on forgot-password; distinct share images per main page where cheap.

## 6. Publish, then run the logged-in test script
- Publish to deliverx.dev so the already-fixed items (nav, six organisations, Launchpad metadata) go live.
- Run the audit's 20 tests with two test accounts plus a same-domain account, prioritising 6, 7 and 15 (RLS: cross-user reads return nothing, direct Verified writes rejected, artefact updates rejected).
- Report pass/fail per test; fix any trust-rail failure before declaring go-live.

## Technical notes
- Payments via Lovable's built-in Stripe (createStripeClient gateway utility, embedded checkout, ui_mode: embedded_page). No BYOK.
- Products created in test env only; they sync to live on publish.
- RLS tests run via Playwright in the preview with minted sessions plus browser-console fetch calls using the publishable key.
- Legal pages will carry "DeliverX" + the contact email; a registered company name/address is still needed before real money is taken — noted as a launch blocker in the final report.
