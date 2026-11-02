# DeliverX product audit and redesign plan

2 November 2026. This audit covers the landing pages, sign-up and onboarding, the Studio dashboard and production readiness. The reference is the settings walkthrough video the owner shared: Settings with Integrations, API keys, Billing, Compare plans, Security, Audit logs and Retention policy.

It follows the project rules in `AGENTS.md`. Nothing here fabricates customers, logos, testimonials or numbers. "Social proof" means only things that can be checked.

---

## 1. Audit summary

**What already works**

- **One design system.** Palette B ("Ink & Oatmeal"), Inter, shared buttons, cards and chips. The homepage, How it works, Platform, Learn, onboarding, the dashboard and the profile page are all redesigned and consistent.
- **A clear product story.** The six-step strip (Idea → Plan → Research → Decide → Build → Record) now appears on four pages, with the steps that wait for you outlined.
- **Dashboard follows the approved mock.** It has an icon rail, a greeting with one status line, at-a-glance cards, project cards and a "What the team did" feed. The feed reads each project's own saved records.
- **Honest copy.** Pages say what is live, what is planned and what is a sample. Reviews have already removed several overclaims.
- **Security basics.** It has security headers, a request body limit, workspace isolation tests, row-level security on every `wf_*` table, migrations recorded in a ledger, and SEO with robots, sitemap, Open Graph and canonical tags.
- **Legal pages.** Privacy, Terms and Cookies now carry the trading name, the safeguards for data sent outside the UK, and refund terms.

**What makes it feel unfinished (from the video's point of view)**

1. **No Settings area.** The reference product's strongest signal of "real product" is a settings workspace: billing, security, team, integrations and audit log. DeliverX has only `/profile`. Paying users can't see their plan, invoices or usage history. They also can't manage sessions or export their record of decisions in one place.
2. **Billing is invisible after checkout.** Stripe prices and the live webhook exist, but no screen shows the plan, the renewal date, invoices, or how to cancel and get a refund. The 3-day refund promise needs a self-serve path.
3. **No audit view.** Every project keeps a full event log, and the downloadable record includes it. But there is no in-app "Audit log" with filters and export like the video's. This is DeliverX's main trust feature, so it should be the most visible part of the product.
4. **No product analytics, no error alerting.** Client errors are written to `monitoring_events`, but nobody is alerted. There is no funnel data (visit → sign-up → first plan approved), so conversion can't be measured.
5. **Homepage hierarchy is long.** The parts are there, but the order is not hero → features → how it works → proof → pricing → FAQ → CTA. Pricing and FAQ only live on `/pricing`.
6. **Heavy images.** Four 3D renders in `public/assets/3d` are about 0.5 MB each (JPEG). They should be WebP or AVIF with fixed sizes and lazy loading.
7. **Large project page bundle.** `command.supervised.$missionId` is 388 KB. Panels that aren't shown on load (export, meeting notes, watchtower, voice) should load on demand.
8. **Feedback states vary.** Toasts exist (`sonner`) but are used unevenly. Some save actions show inline text and some show nothing. Empty and loading states differ between screens.

---

## 2. Prioritised improvements

Impact: H/M/L. Effort: S (≤½ day), M (1–2 days), L (3+ days).

| #   | Improvement                                                                                                                                                                                               | Area                     | Impact | Effort |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ | ------ |
| 1   | Turn on live payments in Vercel (see §5, owner only)                                                                                                                                                      | Conversion               | H      | S      |
| 2   | **Settings → Billing**: plan card, usage meters, renewal date, invoices, "Manage billing" via the Stripe customer portal, and a refund request within 3 days                                              | Product, trust           | H      | M      |
| 3   | **Settings → Audit log**: one table across projects (who, action, project, when), filters, CSV export, retention note                                                                                     | Trust                    | H      | M      |
| 4   | **Settings shell** in the video's layout: section list on the left with Profile, Workspace, Billing, Security, Audit log, Notifications, Connections                                                      | Information architecture | H      | M      |
| 5   | Privacy-friendly analytics (cookieless, e.g. Vercel Web Analytics) and the funnel events visit → sign-up → onboarding done → plan approved → checkout. Needs owner approval and a privacy-policy line     | Growth                   | H      | S      |
| 6   | Error alerting: daily or instant alert on new `monitoring_events` (email to owner)                                                                                                                        | Reliability              | H      | S      |
| 7   | Homepage reorder: hero → product frame → 3 benefits → how it works → trust → pricing teaser → FAQ → final CTA                                                                                             | Conversion               | H      | M      |
| 8   | Convert the 3D renders to AVIF/WebP and lazy-load them below the fold                                                                                                                                     | Performance              | M      | S      |
| 9   | **Settings → Security**: active sessions with "sign out other sessions", password change, sign-in method; 2FA only if Neon Auth supports it                                                               | Trust                    | M      | M      |
| 10  | One toast pattern for every save, delete or restore; skeletons for dashboard cards; consistent empty states with one action                                                                               | UX polish                | M      | M      |
| 11  | Split the project page bundle: lazy-load secondary panels                                                                                                                                                 | Performance              | M      | M      |
| 12  | **Settings → Connections**: read-only cards for the model provider, research provider, voice and Stripe, with status pills (Connected / Not set up), like the video's integration cards. No secrets shown | Trust                    | M      | S      |
| 13  | **Settings → Notifications**: honest "email when your decision is needed", built only when an email sender is wired; until then the section says it is coming                                             | Retention                | M      | M      |
| 14  | Pricing page: monthly-only plans side by side, "Compare plans" modal reused in Settings, refund line under the buttons                                                                                    | Conversion               | M      | S      |
| 15  | Accessibility pass with the `better-accessibility` skill: focus order, contrast on mustard text, form labels                                                                                              | Accessibility            | M      | M      |

---

## 3. Proposed page structure and user flow

```
Public                                      Signed in
──────                                      ─────────
/            Home                           /command                 Projects (dashboard)
/how-it-works                               /command/supervised/:id  Project room
/psi         Platform                       /command/capabilities    AI team
/ai-agents   Specialists                    /learn                   Lessons
/pricing     Plans + FAQ                    /settings                → Profile (moves from /profile)
/learn                                      /settings/workspace      Name, usage ceiling
/security    Trust                          /settings/billing        Plan, usage, invoices, refunds
/privacy /terms /cookies                    /settings/security       Sessions, password
/login  /signup                             /settings/audit          Audit log + export
                                            /settings/connections    Providers status
                                            /settings/notifications  (honest "coming" until wired)
```

**Primary flow (one action per page)**

1. Home: **Start a project**. The secondary action is "See a sample project".
2. Sign up, one screen: name, email and password, or Google.
3. Onboarding, three short steps with a first-project preview. CTA: **Open my workspace**.
4. Dashboard, first visit: **Describe your idea**, one or two lines.
5. Plan review: **Approve plan**, or Edit.
6. Decision: **Choose an option**.
7. When the free allowance is used up: **Choose a plan**. This opens Compare plans, then Stripe Checkout, then returns to Settings → Billing with a success toast.
8. Settings → Billing: **Manage billing** (Stripe portal). Within 3 days of a payment it also offers **Request a refund**.

---

## 4. Page-by-page recommendations

### Home

- **Hero:** one headline, one line of value ("Describe a product. An AI team researches it and drafts the plan and prototype. You approve every decision that matters."), **Start a project** and a smaller "See a sample". Keep the run strip directly under it.
- **Product frame:** keep the sample workspace illustration, labelled "Sample project · illustration".
- **Three benefits as cards with icons:** "Evidence, not guesses", "You decide, agents draft", "A record you can download".
- **How it works:** three steps with screenshots of the real product. Link to /how-it-works.
- **Trust, instead of logos or testimonials:**
  - human gates;
  - a downloadable company record;
  - workspace isolation;
  - UK data terms;
  - "No customer quotes yet — here is a sample record instead."
  - Add real testimonials only once they are observed.
- **Pricing teaser:** three plan cards, the refund line, and a link to /pricing.
- **FAQ:** 5 questions, using the same component as /pricing.
- **Final CTA band:** "Start a project", in a dark band.

### How it works / Platform / Specialists / Learn

These were done in #100. Next: replace text-only capability lists on Platform with the integration-card pattern from the video (icon, status pill, one line, "Learn more").

### Pricing

- Three cards with equal height, the price, one-line audience, 4 features each and one button.
- Under the buttons: "Cancel any time · full refund within 3 days of a payment".
- A "Compare plans" table under the cards, then the FAQ.

### Sign-up and onboarding

- Sign-up: Google first, then email. Inline password rules. Show errors next to the field.
- Onboarding stays at three steps. Add a skip for team size (with a sensible default) to reduce friction.

### Dashboard

- Keep the current layout.
- Add skeleton cards while the projects load.
- Use toasts for favourite, delete and restore, plus an undo toast after delete.
- The "Usage" card links to Settings → Billing.

### Project room

- A breadcrumb (Projects / Project name).
- A sticky "Next step" bar with the one primary action.
- Lazy-load secondary tabs.

### Settings (new; layout from the video)

- **Billing:** a dark plan card (plan, price, renewal date, features), usage meters (units, projects, specialists), an invoices table (number, date, amount, status, PDF link from Stripe), payment method, and "Manage billing" (Stripe portal).
- **Audit log:**
  - **Table columns:** time, who (You / role / DeliverX), action, project, source.
  - **Filters:** date, who, project.
  - **Export:** CSV export.
  - **Retention note:** "Kept while your account is active."
  - Only real records. No "tamper proof" badge unless it is cryptographically true.
- **Security:** active sessions with device and last seen, "Sign out other sessions", and change password.
- **Connections:** status cards, with no keys shown.

---

## 5. Production-readiness checklist

| Item                                                                        | Status                                     |
| --------------------------------------------------------------------------- | ------------------------------------------ |
| HTTPS, security headers, request size limit                                 | ✅ (#91)                                   |
| Workspace isolation, RLS on `wf_*` tables                                   | ✅                                         |
| Migrations ledger and rollback docs; 0031 applied to production             | ✅ (2 Nov 2026)                            |
| SEO: titles, descriptions, canonical, robots, sitemap, OG image             | ✅                                         |
| 404 and error pages                                                         | ✅ (`__root.tsx`)                          |
| Legal: privacy, terms, cookies, refunds, transfers                          | ✅ (#101)                                  |
| Stripe live prices (Builder £29, Founder £99, Studio £299) and live webhook | ✅ in Stripe                               |
| Live payments switched on in Vercel                                         | ⬜ Owner: set the variables below          |
| Billing page, invoices, refund path                                         | ⬜ Plan step 2                             |
| Product analytics (cookieless)                                              | ⬜ Plan step 3, needs approval             |
| Error alerting                                                              | ⬜ Plan step 3                             |
| Image optimisation                                                          | ⬜ Plan step 4                             |
| Accessibility pass (WCAG 2.2 AA)                                            | ⬜ Plan step 6                             |
| Uptime monitor on `/` and the webhook                                       | ⬜ Owner choice (free tier of any monitor) |
| Backups: Neon point-in-time restore window confirmed                        | ⬜ Owner: check Neon plan                  |
| Cron secret for the worker verified in production                           | ⬜ Owner (`CRON_SECRET`)                   |

**Variables to set in Vercel (production) for live payments.** Names only. The values come from the Stripe dashboard and never pass through this chat.

- `STRIPE_LIVE_API_KEY`: the secret live key.
- `PAYMENTS_LIVE_WEBHOOK_SECRET`: the signing secret of the existing endpoint "DeliverX live payments webhook" (`we_1UVSsY2X2opf83VZ4GHxkknp`).
- `STRIPE_PRICE_BUILDER` = `price_1UGpI02X2opf83VZ9RIaw4Ky` (£29/month).
- `STRIPE_PRICE_FOUNDER` = `price_1UVRjW2X2opf83VZ0E9zN7bi` (£99/month).
- `STRIPE_PRICE_STUDIO` = `price_1UVRjr2X2opf83VZmm3F4UtY` (£299/month).
- `PSI_PAYMENTS_LIVE_APPROVED` and `VITE_PAYMENTS_CHECKOUT_ENABLED`: switch on only when you are ready to take real cards. `PSI_PAYMENTS_KILL_SWITCH` turns checkout off again at once.

---

## 6. Implementation plan (by impact, then effort)

Each step is one PR, merged when CI and review are green.

1. **Settings shell, plus Billing (read-only).**
   - Add `/settings` in the video's layout and move Profile into it.
   - Billing shows the plan, usage and invoices, read from Stripe server-side by the signed-in user's customer id.
   - "Manage billing" opens the Stripe customer portal.
   - Refund request within 3 days: an email to the owner with the payment id. Refunds stay a manual owner action in Stripe.
2. **Settings → Audit log** with filters and CSV export, from saved project events. No migration is needed.
3. **Analytics and error alerting.** Cookieless page and funnel events, plus an owner email on new errors. Needs your approval and a privacy-policy line naming the provider.
4. **Performance quick wins:**
   - AVIF/WebP renders with lazy loading;
   - lazy secondary panels on the project page;
   - measure with Lighthouse before and after.
5. **Homepage reorder:** benefits, trust, pricing teaser, FAQ and final CTA. The shared FAQ is reused on /pricing.
6. **Feedback states and accessibility:** one toast pattern, skeletons, empty states, and a WCAG 2.2 AA pass.
7. **Settings → Security and Connections:** sessions and password, and provider status cards.
8. **Notifications:** only once an email sender is configured.

Owner actions that run in parallel: the Vercel payment variables, choosing the analytics provider, and an uptime monitor.
