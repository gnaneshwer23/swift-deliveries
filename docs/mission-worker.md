# Mission worker

Approved missions run on the server, not in the browser. Code: `src/lib/workforce/worker.server.ts`.

## How a step runs

1. **Claim** (one transaction, mission and workspace rows locked):
   - Re-checks that the workspace is not stopped, the mission is queued, running or blocked, and the current plan version has a live approval.
   - Applies the limits: at most 2 running tasks per workspace, and at most 1 running task per specialist.
   - Leases the task to the worker for 5 minutes, increments `attempt`, opens a `wf_task_runs` row keyed `taskId:attempt`, and records `task.started`.
2. **Work** (no transaction): the model call, if any, and the executor.
3. **Commit** (one transaction), only while the worker still holds the lease:
   - Charges usage atomically against the ceiling.
   - Saves the artefact.
   - Closes the task and the run, recording the model, the mode (model or simulated) and the latency.
   - Records the event.
   - If the lease was lost or the mission was cancelled in the meantime, nothing is kept and the run is marked `abandoned`.

## Recovery and cost

- When a lease expires, the task goes back to the queue. After 3 attempts it is failed instead. The run is marked `abandoned`.
- Tasks left `running` by builds from before leases existed count as expired after 30 minutes.
- A model call whose result is discarded (lost lease, cancel, ceiling) is not charged to the workspace. The provider may still bill for it.

## What wakes the worker

- **A nudge.** Approving a plan or its outside actions, resuming a mission, deciding a gate, and lifting a workspace stop all start the worker for that mission or workspace. On Vercel it keeps running after the response through the platform's `waitUntil`, for up to 50 seconds.
- **The tick endpoint.** `GET /api/worker/tick` with `Authorization: Bearer $CRON_SECRET` recovers expired leases, then runs steps for up to 50 seconds. It returns 503 if `CRON_SECRET` is not set and 401 for a wrong token.
- **The "Run next step" button** still works. It goes through the same claim and commit.

## Setup still needed

- Set `CRON_SECRET` in the Vercel project (production and preview). The tick returns **503** when it is missing.
- **Cron:** `vercel.json` schedules `GET /api/worker/tick` every 5 minutes (`*/5 * * * *`), which needs Vercel **Pro** (Hobby allows daily crons only). Vercel sends the bearer secret when `CRON_SECRET` is set; without it the route answers 503 and nothing runs. Each tick spends at most about 50s on mission steps and 50s on queued research passes, so ticks never overlap. An idle tick costs a few database reads; model calls happen only for runnable work and stop at usage ceilings.
- Until a tick runs, a mission whose nudge was cut off (for example, a function timeout during a long model call) resumes on the next nudge, **mission reload** (supervised research drain), or button press. Leases expire safely.

## Preview verification (30 Oct 2026)

- **`/api/worker/tick` on deployed swift-deliveries:** returned **503** before `CRON_SECRET` was added; see `docs/psi-phase-a-preview-acceptance.md`.
- **`waitUntil` on TanStack Start server functions:** still **not observed** on a live approve in this pass — code falls back to detached work; tick + reload remain the recovery paths.
- **Studio ↔ wf link:** integration proof in `phase-a-preview-acceptance.integration.test.ts` (fixture DB, migration **0034**).

## What the owner sees

- **Mission page.** The Activity panel reads the mission's event log by cursor (`getMissionEvents`). It polls every 3 seconds only while the mission is queued or running, and refreshes the mission when new events arrive. It never advances the mission; the worker does that.
- **Command Centre.** An emergency stop above the agents office stops all work in the workspace, with an optional reason. While stopped, a banner says so and offers "Let work continue". Missions keep their status.
- **Agents office.** "Latest activity" shows the newest workspace events (`getRecentWorkspaceEvents`), refreshes every 5 seconds while a mission is queued or running, and refreshes the office when something new happens.
