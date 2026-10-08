# Close the second-audit gaps and publish

The follow-up audit checked the live site. Most of its "unchanged" items (Terms cancellation, How-it-works wording, Prove in nav, Launchpad metadata, privacy rewrite) are already fixed in code — the live site is serving an older build, so a publish resolves them. Five issues are real in the current code and need edits first.

## Real code fixes

1. **Workspace naming contradiction**
   - professional-workspace.tsx line 212: "The Complete Journey plan includes all three" — rewrite so the £29 Complete Journey includes the individual workspace, and the sponsor/delivery-lead workspace stays a separate B2B product from £750/project.
   - index.tsx line 95: the £29 plan description says "Professional Workspace" — rename to the individual workspace wording used on Pricing.

2. **Individual Workspace has no page**
   - Add a short "Individual Workspace" section to the Professional Workspace page (what the £29 buyer gets: live work, evidence discipline, their own record) with a clear divider before the sponsor tier, so a £29 buyer clicking "Workspace" sees their product first.

3. **Free tier limits undefined**
   - State the limit in one line on Pricing (and the homepage plan cards): the free tier covers the first scenario's first phase; Assessed feedback and attestation requests require a paid plan.

4. **Stale Pricing meta description**
   - Update to mention starting free, the monthly plans, Career Sprint £69 one-off and Journey Annual £290/year.

5. **Terms: new plans + entity**
   - Terms already cover cancellation-to-end-of-period and one-off purchases (verified in code) — the auditor saw the old build. Add one line naming Career Sprint and Journey Annual explicitly. The registered-entity note stays as the known pre-revenue blocker.

## Then

6. **Publish** to deliverx.dev — this is what clears the auditor's "unchanged" list (Terms cancellation, How-it-works "witnessed" + typo, Prove in nav on all pages, Launchpad badge/metadata, privacy date, step counts).
7. **Verify the live site** after publish: fetch deliverx.dev pages and confirm the new wording is served (not cached).
8. **Checkout**: already enabled in code and verified in test mode; it goes live with the publish. Still needs one manual 4242 test purchase (Stripe's embedded form can't be automated) and Stripe go-live in settings before real money.

## Out of scope
- Logged-in tests 9–15 beyond the trust-rail gate (tests 6, 7, 15 already passed via RLS simulation).
- Paid honoraria / two-attestation decisions — still open product questions.
