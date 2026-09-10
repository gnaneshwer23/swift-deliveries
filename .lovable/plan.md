# Signed-in workspace foundation

## What exists today

- 16 public pages (home, product pages, pricing, legal) — all static content.
- Sign in and sign up work with email/password and Google.
- Four tables in the backend: organisations, memberships, profiles, user roles. All empty.
- Nothing signed-in: no dashboard, no onboarding, no team management. The header still says "Sign in" after signing in, and no page reads or writes those tables.

## What this adds

### 1. The header reflects who you are

Once signed in, the site header shows your name and an account menu with links to your workspace and a sign-out option, instead of "Sign in".

### 2. Onboarding

A first-run flow for anyone signed in without an organisation:

- Your name and job headline.
- Create your organisation (name, short description, optional website) — a web address handle is generated from the name.
- Optionally invite teammates by email straight away, or skip.

Once complete, you land on your workspace home.

### 3. Workspace area

A new signed-in section, gated so visitors are sent to sign in:

- **Workspace home** — greeting, your organisation, member count, and clear prompts to invite people or set up your profile. Empty by design, no sample data.
- **Team** — list of members with their role, pending invitations, invite by email, change a member's role, remove a member. Owners and admins only for the management actions.
- **Profile settings** — name, display name, headline, and (later) an avatar.
- **Organisation settings** — name, description, website; owners and admins only.

### 4. Invitations

- Invite by email with a role (admin or member).
- Invitation link takes the person to sign up or sign in, then joins them to the organisation automatically.
- Invitations expire after 14 days and can be revoked or resent.
- Note: invitation emails are not sent yet — the invite link is shown so it can be copied and shared. Sending real email needs an email provider, which is a later step.

### 5. Backend fix

The current rule that decides which organisations you can see has a flaw that stops members (as opposed to owners) from seeing their own organisation. This corrects it.

## Technical notes

- New `invitations` table: organisation, email, role, token, invited_by, status (pending/accepted/revoked), expires_at, timestamps. Grants for authenticated + service_role, RLS so only organisation owners/admins can manage rows, plus a private helper to look up an invitation by token.
- New `private.is_org_member(uid, org)` / `private.org_role(uid, org)` security-definer helpers so policies avoid recursion.
- Fix the `organisations` SELECT and UPDATE policies — the membership subqueries currently compare `organisation_memberships.organisation_id` to `organisation_memberships.id` instead of `organisations.id`.
- Membership row for the creator is inserted as `owner` when an organisation is created.
- Routes: `src/routes/_authenticated/route.tsx` gate (`ssr: false`, redirect to `/login`), then `workspace.tsx` (home), `workspace/team.tsx`, `workspace/settings.tsx` (profile), `workspace/organisation.tsx`. Public `onboarding` lives under the gate; `invite.$token.tsx` stays public.
- Data access via `createServerFn` with `requireSupabaseAuth` for all workspace reads/writes; invite-token lookup uses a public server fn that returns only organisation name and inviter name.
- TanStack Query for reads (`ensureQueryData` in loaders under the gate, `useSuspenseQuery` in components); sonner toasts for mutation feedback; existing shadcn form/dialog/table primitives.
- Root route gains a single `onAuthStateChange` subscriber filtered to SIGNED_IN / SIGNED_OUT / USER_UPDATED that invalidates the router and query cache.
- Sign-out clears the query cache and replaces history, per the auth hygiene rules.
- Marketing pages keep their existing look; workspace pages reuse the `--dx-*` tokens already in `src/styles.css`.
