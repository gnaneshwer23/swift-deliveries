# Migrate DeliverX into this Lovable project

## Goal

Recreate the DeliverX application (currently a Next.js 16 + Supabase project at `https://github.com/gnaneshwer23/deliverx`) as a TanStack Start application backed by Lovable Cloud, preserving the core product-management workspace experience.

## Current state

- Source repo inspected: 1,888 files, 100+ Supabase migrations, 100+ routes.
- Stack: Next.js 16 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Supabase Auth/Postgres, Stripe, Anthropic/OpenAI/Minimax, Recall, Resend, GitHub webhooks, Vercel analytics.
- Target project: TanStack Start v1 template with Tailwind v4 and shadcn/ui. No backend connected yet.
- GitHub sync is not connected; this migration rebuilds the app in the target project rather than syncing the existing repo.

## Migration approach

Phased rebuild. Each phase produces a working preview before moving on. The full app is too large for one pass; phases are ordered by dependency (foundation first, advanced features last).

### Phase 1 — Foundation

1. Enable Lovable Cloud for the target project.
2. Port the core Supabase schema from the source migrations, starting with the smallest set needed for auth and organisations:
   - `organisations`, `users`, `workspace_members`, `invitations`, `invite_tokens`
   - Auth handled by Lovable Cloud / Supabase Auth; keep exported user rows as profiles.
3. Set up authentication flow (sign up, login, logout, password reset, email verification) using Lovable Cloud auth.
4. Port global design tokens, Tailwind config, and the shared shadcn/ui primitives from `src/components/ui`.
5. Recreate the root layout, navigation shell, and footer.
6. Port marketing/public pages:
   - `/` (home)
   - `/about`, `/pricing`, `/solutions`, `/how-it-works`, `/team-copilot`, `/professional-workspace`
   - `/privacy`, `/terms`, `/cookie`, `/cookies`
7. Add SEO `head()` metadata to every public route.
8. Verify the build and public routes.

### Phase 2 — Workspace shell + projects

1. Create the authenticated layout (`_authenticated`) and redirect unauthenticated users to `/login`.
2. Port onboarding flow: organisation, profile, role, team, invite.
3. Port the workspace dashboard shell and navigation policy.
4. Port the core project module:
   - `/project/new`
   - `/project/[id]` overview
   - `/project/[id]/charter`
   - Project settings and members
5. Port supporting tables: `projects`, `charters`, `stakeholders`, `milestones`, `workstreams`, `tasks`.
6. Verify create/read/update/delete flows for organisations, projects, charters, tasks.

### Phase 3 — Core project modules

Port the remaining high-traffic project sub-pages in dependency order:

1. Requirements + user stories + traceability
2. RAID, decisions, changes, reports
3. Meetings, standups, documents
4. Delivery + engineering + QA + scrum assistant views
5. Product discovery and benefits

Each module includes its route, UI components, server functions, and the Supabase tables/policies it needs.

### Phase 4 — Advanced features

1. AI orchestration (assistant, recommendations, summaries, structure-project) using Lovable AI Gateway.
2. Billing and entitlements with Stripe.
3. Email (Resend) for invites and reports.
4. GitHub integration webhooks and external task links.
5. Recall meeting bot integration.
6. PI review, verified portfolio, career intelligence, experience planner, and other specialised modules.
7. Analytics and observability (replace Vercel Analytics with Lovable-native or omit if unavailable).

### Phase 5 — Verification and cutover

1. Run build and typecheck.
2. Reproduce the smoke path from the source README: auth → project → charter → tasks → meeting → traceability → standup.
3. Request CSV/JSON record exports from the original Supabase project and import existing data (auth credential tables excluded).
4. Document remaining provider credentials and cutover steps.

## Technical details

- **Framework migration**: Next.js App Router routes become TanStack Start file routes under `src/routes/`. Next.js API routes become `createServerFn` modules or `src/routes/api/*` server routes.
- **Auth migration**: Source uses `@supabase/ssr` cookie sessions. Target uses Lovable Cloud Supabase Auth with the generated client and `requireSupabaseAuth` middleware.
- **Database migration**: Source migrations are ported to Lovable Cloud migrations. Tables follow the public-schema GRANT rules and RLS policies. The source has many migrations; we will consolidate the minimal required schema per phase rather than copy every historical migration verbatim.
- **Server code**: Next.js server components/route handlers become `createServerFn` (internal) or TanStack API routes (webhooks/public endpoints). No Supabase Edge Functions.
- **Styling**: Tailwind v4 and shadcn/ui are already present; port source tokens and component variants into the existing `src/styles.css` and component files.
- **Assets**: Copy required public assets (favicon, images, fonts) from `public/`.
- **Tests**: Source has Vitest and Playwright tests. Port critical smoke tests; full test suite is out of scope for the initial migration.
- **Environment variables**: Required secrets (Supabase service role, AI keys, Stripe, Resend, Recall) will be requested via Lovable's secure secret flow when their phase is reached. Internal signing keys will be generated with `generate_secret`.

## Limitations and decisions

- Vercel-specific features (`@vercel/analytics`, `@vercel/speed-insights`, `vercel.json`) will be omitted or replaced with Lovable-native equivalents.
- Next.js middleware becomes TanStack Start auth middleware in `src/start.ts`.
- The full source test suite and every advanced module will not be ported in Phase 1.
- Existing user data is not migrated until Phase 5; the user will need to export CSV/JSON from the original Supabase project.

## First deliverable

Phase 1: a working TanStack Start app with Lovable Cloud auth, the shared design system, and all public marketing pages. This gives a visible foundation before committing to the full workspace rebuild.
