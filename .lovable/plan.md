# Verify connections and current state

## What we already know

I ran read-only checks against the workspace. Here are the facts:

### Supabase / Lovable Cloud backend
- Status: connected.
- Public tables present: `profiles`, `user_roles`, `organisations`, `organisation_memberships`, `invitations`.
- All tables have RLS enabled and the expected policies.
- Row counts are zero across the board: no users, profiles, organisations, memberships, roles, or invitations yet.
- This is the foundation schema built during the workspace-foundation phase.

### Vercel / API connection
- I do not see a Vercel connector or any Vercel-related secrets in the workspace.
- Available workspace connections are only Google Calendar and Google Search Console.
- If you connected a Vercel project, it may be through a different path (e.g., a custom secret, a different account/workspace, or the Lovable deployment layer). From the app's point of view, no Vercel API credentials are currently reachable.

### Application code
- Public marketing pages, login/signup, and a basic authenticated workspace shell exist.
- Authenticated routes: workspace overview, onboarding, profile, organisation settings, team management, plus a public invite-accept route.
- No projects, tasks, charters, or other DeliverX modules have been ported yet.

## Plan

1. **Confirm Vercel access**
   - Ask you where the Vercel connection lives (connector, custom secret, or deployment integration) so I can read or test it.
   - If it should be a connector, list and link the correct Vercel connector.
   - If it is a custom secret, verify the secret name and scope.

2. **Decide the data strategy**
   - Option A: start from the empty schema and build features incrementally.
   - Option B: import existing DeliverX data/schema from the connected sources (only possible once the Vercel/Supabase link is confirmed and the source schema is readable).

3. **Pick the next feature phase**
   - Continue workspace foundation (dashboard widgets, navigation polish).
   - Begin Phase 2: projects, charters, and tasks.
   - Or focus on a specific area you name.

## Technical notes

- The database is managed through Lovable Cloud migrations. Any schema change must go through the migration tool.
- Server functions use `createServerFn` and `requireSupabaseAuth`; no Edge Functions are needed.
- No payment or external API secrets are currently configured except the managed `LOVABLE_API_KEY` and `LOVABLE_CRON_SECRET`.
