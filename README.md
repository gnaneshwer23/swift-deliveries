# DeliverX

**Supervised AI Workforce Platform** (Stage 1) — commission Investigate / Prototype / Improve missions from a Command Centre, with plans, human approval, a permission ladder, usage ceilings, and labelled artefacts.

Public product name: **DeliverX**. Repository name: **swift-deliveries**.

The legacy career / Experience / Prove product remains available under `/workspace`. Product direction and Stage 1 decisions: [`docs/prd-deliverx-supervised-ai-workforce.md`](docs/prd-deliverx-supervised-ai-workforce.md). Gap analysis vs the prior product: [`docs/prd-gap-analysis.md`](docs/prd-gap-analysis.md).

## What you can open

### Command Centre (Stage 1 slice)

- `/command` — mission intake (Investigate / Prototype / Improve)
- `/command/projects` — create and list projects
- `/command/missions/$missionId` — clarify → plan → approve → run → delivery report

Signed-in users land on `/command` after login.

### Legacy career surfaces

- `/` — marketing story
- `/experience`, `/launchpad`, `/prove`, `/pricing`
- `/login` and `/signup`
- `/workspace` — candidate / coach Professional Intelligence workspace

## Run locally

You need [Bun](https://bun.sh) (or Node.js 22 with npm).

```sh
bun install
bun run dev
```

The dev server listens on port **43123**. Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

With npm:

```sh
npm install
npm run dev
```

### Exercise the Stage 1 flow

1. Sign in at `/login` (or create an account at `/signup`).
2. Open `/command`.
3. Create a project (or use the first-project prompt).
4. Choose **Investigate**, **Prototype**, or **Improve**, describe the outcome, and start the mission.
5. Answer clarification questions if prompted.
6. Review the plan (usage estimate + permission ladder), approve, and watch tasks run.
7. Open artefacts (brief / HTML prototype / memo) and the delivery report.

AI providers are optional. Without model keys, a deterministic planner/executor stub still produces tangible artefacts. Stripe and service-role keys are **not** required for this slice.

## Data

Supabase project `jibmyxaldetyycmtlxet` (publishable URL/key in `.env`).

Stage 1 tables (additive, RLS workspace-isolated):

`wf_workspaces`, `wf_workspace_members`, `wf_projects`, `wf_missions`, `wf_mission_plans`, `wf_mission_tasks`, `wf_artefacts`, `wf_approvals`, `wf_usage_records`, `wf_audit_events`

Migration: `supabase/migrations/20261021200000_workforce_command_centre.sql` (also applied via Supabase MCP as `workforce_command_centre`). Legacy Delivery-OS tables (`projects`, `tasks`, `artefacts`, …) are untouched.

Server-only secrets (not required for Command Centre Stage 1):

- `SUPABASE_SERVICE_ROLE_KEY`
- Stripe / Lovable payment keys

## Checks

```sh
bun run test
bun run lint
```

Workforce unit tests cover planner, permissions, usage ceiling, and executor behaviour under `src/lib/workforce/`.
