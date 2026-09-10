# Connect Vercel API to read project and deployment info

## Goal

Let the app display the connected Vercel project's details and recent deployments inside the workspace.

## What we need

1. **Vercel API token** — a custom secret (`VERCEL_API_TOKEN`) added to the project.
2. **Vercel project ID** — the ID of the project to read (also stored as `VERCEL_PROJECT_ID`).
3. **Optional team ID** — if the project lives under a Vercel team, store `VERCEL_TEAM_ID` too.

## Plan

1. **Add configuration secrets**
   - Request `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` through the secure secret form.
   - The token must have permission to read projects and deployments.

2. **Create Vercel API helpers**
   - Add `src/lib/vercel.server.ts` with typed fetch helpers for Vercel's REST API.
   - Endpoints:
     - `GET /v9/projects/{idOrName}` — project info.
     - `GET /v6/deployments` — list deployments filtered by projectId.
   - Handle errors and return plain DTOs.

3. **Create server functions**
   - `getVercelProject()` — returns project name, framework, latest deployment, domains, and created/updated dates.
   - `getVercelDeployments(limit?)` — returns recent deployments with status, URLs, creator, and timestamps.
   - Both functions read secrets inside the handler and are callable from authenticated workspace routes.

4. **Build the workspace UI**
   - Add a new authenticated route `/workspace/integrations/vercel`.
   - Display project card, production domain, and a table of recent deployments.
   - Add a link in the workspace shell navigation under Integrations.

5. **Verify**
   - Run typecheck and build.
   - Use the server-function invocation tool or a Playwright signed-in flow to confirm the Vercel data loads.

## Security notes

- The Vercel token stays server-side; only server functions touch it.
- The new page is under the authenticated layout, so only signed-in users can view it.
- No write operations to Vercel in this phase; read-only scope keeps risk low.
