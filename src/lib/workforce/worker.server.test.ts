import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import { createDb, type ColumnTypes, type Executor } from "@/lib/db/builder";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Worker tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_worker_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_projects",
  "wf_missions",
  "wf_mission_plans",
  "wf_mission_tasks",
  "wf_artefacts",
  "wf_approvals",
  "wf_audit_events",
  "wf_usage_records",
  "wf_task_runs",
  "wf_mission_events",
];
const sql = url
  ? postgres(url, {
      prepare: false,
      max: 10,
      types: POSTGRES_TYPES,
      connection: { search_path: schema },
    })
  : null;
let types: ColumnTypes = new Map();
const query: Executor = async (text, params) =>
  (await sql!.unsafe(text, params)) as unknown as Record<string, unknown>[];
const db = createDb(query, async () => types);

vi.mock("@/lib/db/neon.server", () => ({
  neonDb: () => db,
  neonTransaction: (work: (tx: typeof db, q: Executor) => Promise<unknown>) =>
    sql!.begin(async (t) => {
      const q: Executor = async (text, params) =>
        (await t.unsafe(text, params)) as unknown as Record<string, unknown>[];
      return work(
        createDb(q, async () => types),
        q,
      );
    }),
}));

// Runs during a step's work, between claim and commit, to simulate what other actors do then.
let duringWork: (() => Promise<void>) | null = null;
// What the next model call returns; null means model mode is off (simulated draft).
let nextGeneration: Record<string, unknown> | null = null;
let lastGenerationInput: Record<string, unknown> | null = null;
vi.mock("./model-runner.server", () => ({
  generateStageContent: async (input: Record<string, unknown>) => {
    lastGenerationInput = input;
    if (duringWork) await duringWork();
    return nextGeneration ?? { content: "", mode: "simulated", note: "test" };
  },
}));

const { savePlanVersion, approvePlanVersion } = await import("./plan-store.server");
const { generateMissionPlan } = await import("./planner");
const { advanceMission, recoverExpiredLeases, runWorkerTick, MAX_ATTEMPTS } =
  await import("./worker.server");

const plan = generateMissionPlan({
  intent: "investigate",
  requestText: "Find out why tutors drop off after the first week of using the app",
  clarificationAnswers: {
    outcome: "Know the top reasons tutors leave",
    audience: "Independent tutors",
    surface: "Web app",
    baseline: "40% leave in week one",
    users: "Tutors",
  },
});

// Build plans call the model for their stage artefacts; the hook tests need that step.
const buildPlan = generateMissionPlan({
  intent: "build",
  requestText: "Build a booking tool for independent tutors",
  clarificationAnswers: { users: "Independent tutors", constraints: "Web only" },
});

async function approvedMission(ceiling = 1000, chosen = plan) {
  const [ws] = await sql!`insert into wf_workspaces (owner_id, usage_ceiling)
    values (${`owner-${Math.random()}`}, ${ceiling}) returning id`;
  const workspaceId = ws!["id"] as string;
  const [project] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'Tutor app', 'owner') returning id`;
  const [mission] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${workspaceId}, ${project!["id"]}, 'investigate', 'M', 'req', 'awaiting_approval',
            'execute_internally', 'owner') returning id`;
  if (chosen !== plan)
    await sql!`update wf_missions set intent = 'build' where id = ${mission!["id"] as string}`;
  const ids = { workspaceId, missionId: mission!["id"] as string };
  await sql!.begin(async (t) => {
    const q: Executor = async (text, params) => (await t.unsafe(text, params)) as never;
    const saved = await savePlanVersion(q, {
      ...ids,
      requestText: "req",
      plan: chosen,
      actorId: "owner",
      reason: "test",
    });
    await approvePlanVersion(q, {
      ...ids,
      planVersion: saved.version,
      planHash: saved.hash,
      actorId: "owner",
      approveExternal: false,
    });
  });
  return ids;
}

const step = (ids: { workspaceId: string; missionId: string }, workerId = "w1") =>
  advanceMission({ ...ids, actor: { kind: "worker", id: workerId }, workerId });

describe.skipIf(!url)("durable mission worker against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
    const rows =
      await sql!`select table_name, column_name, udt_name from information_schema.columns where table_schema = ${schema}`;
    types = new Map();
    for (const r of rows) {
      const table = r["table_name"] as string;
      if (!types.has(table)) types.set(table, new Map());
      const t = r["udt_name"] as string;
      types.get(table)!.set(r["column_name"] as string, t.startsWith("_") ? `${t.slice(1)}[]` : t);
    }
  });
  beforeEach(async () => {
    duringWork = null;
    nextGeneration = null;
    lastGenerationInput = null;
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("runs an approved mission to its end, with one run and one event per step", async () => {
    const ids = await approvedMission();
    await runWorkerTick({ deadline: Date.now() + 60_000, missionId: ids.missionId });

    const [m] = await sql!`select status from wf_missions where id = ${ids.missionId}`;
    expect(["completed", "partially_completed", "blocked"]).toContain(m!["status"]);
    const done = await sql!`select id, actual_usage from wf_mission_tasks
      where mission_id = ${ids.missionId} and status = 'completed'`;
    expect(done.length).toBeGreaterThan(0);
    const runs = await sql!`select status from wf_task_runs where mission_id = ${ids.missionId}`;
    expect(runs.filter((r) => r["status"] === "completed")).toHaveLength(done.length);
    expect(runs.some((r) => r["status"] === "running")).toBe(false);
    const completedEvents = await sql!`select count(*)::int n from wf_mission_events
      where mission_id = ${ids.missionId} and type = 'task.completed'`;
    expect(completedEvents[0]!["n"]).toBe(done.length);
    // Usage charged to the workspace equals what the tasks recorded, no more.
    const [ws] = await sql!`select usage_consumed from wf_workspaces where id = ${ids.workspaceId}`;
    const spent = done.reduce((s, t) => s + Number(t["actual_usage"]), 0);
    expect(ws!["usage_consumed"]).toBe(spent);
    // Events read by cursor return only what came after it, in order.
    const all =
      await sql!`select id from wf_mission_events where mission_id = ${ids.missionId} order by id`;
    const cursor = Number(all[2]!["id"]);
    const after = await db
      .from("wf_mission_events")
      .select("id")
      .eq("mission_id", ids.missionId)
      .gt("id", cursor)
      .order("id", { ascending: true });
    expect((after.data as Array<{ id: number }>).map((r) => Number(r.id))).toEqual(
      all.slice(3).map((r) => Number(r["id"])),
    );
    const leased = await sql!`select count(*)::int n from wf_mission_tasks
      where mission_id = ${ids.missionId} and lease_owner is not null`;
    expect(leased[0]!["n"]).toBe(0);
  });

  it("starts nothing while the workspace is stopped or the mission is paused", async () => {
    const ids = await approvedMission();
    await sql!`update wf_workspaces set stopped_at = now() where id = ${ids.workspaceId}`;
    expect((await step(ids)).note).toMatch(/Workspace stopped/);
    await sql!`update wf_workspaces set stopped_at = null where id = ${ids.workspaceId}`;
    await sql!`update wf_missions set status = 'paused' where id = ${ids.missionId}`;
    expect((await step(ids)).progressed).toBe(false);
    const runs = await sql!`select count(*)::int n from wf_task_runs`;
    expect(runs[0]!["n"]).toBe(0);
  });

  it("refuses to work on a plan without a live approval", async () => {
    const ids = await approvedMission();
    await sql!`update wf_approvals set invalidated_at = now() where mission_id = ${ids.missionId}`;
    expect((await step(ids)).note).toMatch(/no live approval/);
  });

  it("keeps no result when the lease is lost before the commit", async () => {
    expect(buildPlan.tasks.some((t) => t.produces)).toBe(true);
    const ids = await approvedMission(1000, buildPlan);
    duringWork = async () => {
      await sql!`update wf_mission_tasks set lease_owner = 'someone-else' where status = 'running'`;
    };
    // Run until a step that calls the model (a task that produces an artefact) is reached.
    let r = await step(ids);
    for (let i = 0; i < 20 && !/Lease expired/.test(r.note ?? ""); i++) r = await step(ids);
    expect(r.note).toMatch(/Lease expired/);
    const [run] = await sql!`select status, failure_class from wf_task_runs
      where task_id = (select id from wf_mission_tasks where lease_owner = 'someone-else')`;
    expect(run).toMatchObject({ status: "abandoned", failure_class: "lease_lost" });
    const artefacts = await sql!`select count(*)::int n from wf_artefacts a
      join wf_mission_tasks t on t.id = a.task_id where t.lease_owner = 'someone-else'`;
    expect(artefacts[0]!["n"]).toBe(0);
  });

  it("discards a step's result when the mission is cancelled while it works", async () => {
    const ids = await approvedMission(1000, buildPlan);
    duringWork = async () => {
      await sql!`update wf_missions set status = 'cancelled' where id = ${ids.missionId}`;
    };
    let r = await step(ids);
    for (let i = 0; i < 20 && !/cancelled/.test(r.note ?? ""); i++) r = await step(ids);
    expect(r.note).toMatch(/cancelled/);
    const running =
      await sql!`select count(*)::int n from wf_mission_tasks where status = 'running'`;
    expect(running[0]!["n"]).toBe(0);
    const abandoned = await sql!`select count(*)::int n from wf_task_runs
      where failure_class = 'mission_cancelled'`;
    expect(abandoned[0]!["n"]).toBe(1);
  });

  it("holds the workspace to two running tasks and one per specialist", async () => {
    const ids = await approvedMission();
    const other = await approvedMission();
    // Two live tasks elsewhere in the same workspace fill the limit.
    await sql!`update wf_mission_tasks set workspace_id = ${ids.workspaceId}
      where mission_id = ${other.missionId}`;
    const two = await sql!`select id from wf_mission_tasks where mission_id = ${other.missionId}
      order by sort_order limit 2`;
    await sql!`update wf_mission_tasks set status = 'running', lease_until = now() + interval '5 minutes'
      where id in ${sql!(two.map((t) => t["id"] as string))}`;
    expect((await step(ids)).note).toMatch(/limit of tasks/);

    // One live task holding the next task's specialist blocks that task.
    await sql!`update wf_mission_tasks set status = 'pending', lease_until = null
      where id = ${two[1]!["id"] as string}`;
    const next = await sql!`select capability_ids from wf_mission_tasks
      where mission_id = ${ids.missionId} and status = 'pending' and depends_on = '{}'`;
    const caps = next.flatMap((t) => t["capability_ids"] as string[]);
    await sql!`update wf_mission_tasks set capability_ids = ${caps} where id = ${two[0]!["id"] as string}`;
    expect((await step(ids)).note).toMatch(/specialists .* busy/);
  });

  it("requeues an expired lease, and fails the task after the last attempt", async () => {
    const ids = await approvedMission();
    const [task] = await sql!`select id from wf_mission_tasks where mission_id = ${ids.missionId}
      order by sort_order limit 1`;
    const taskId = task!["id"] as string;
    const expire = async (attempt: number) => {
      await sql!`update wf_mission_tasks set status = 'running', attempt = ${attempt},
        lease_owner = 'dead-worker', lease_until = now() - interval '1 second' where id = ${taskId}`;
      await sql!`insert into wf_task_runs (workspace_id, mission_id, task_id, attempt, idempotency_key, worker_id)
        values (${ids.workspaceId}, ${ids.missionId}, ${taskId}, ${attempt}, ${`${taskId}:${attempt}`}, 'dead-worker')`;
      await sql!.begin((t) =>
        recoverExpiredLeases(async (text, params) => (await t.unsafe(text, params)) as never),
      );
      const [row] =
        await sql!`select status, lease_owner from wf_mission_tasks where id = ${taskId}`;
      const [run] = await sql!`select status, failure_class from wf_task_runs
        where idempotency_key = ${`${taskId}:${attempt}`}`;
      return { row, run };
    };
    const first = await expire(1);
    expect(first.row).toMatchObject({ status: "pending", lease_owner: null });
    expect(first.run).toMatchObject({ status: "abandoned", failure_class: "lease_expired" });
    const last = await expire(MAX_ATTEMPTS);
    expect(last.row!["status"]).toBe("failed");
  });

  it("fails a task that has used all its attempts instead of retrying it", async () => {
    const ids = await approvedMission();
    await sql!`update wf_mission_tasks set attempt = ${MAX_ATTEMPTS} where mission_id = ${ids.missionId}`;
    expect((await step(ids)).note).toMatch(/all its attempts/);
    const failed = await sql!`select count(*)::int n from wf_mission_tasks
      where mission_id = ${ids.missionId} and status = 'failed'`;
    expect(failed[0]!["n"]).toBe(1);
    const runs = await sql!`select count(*)::int n from wf_task_runs`;
    expect(runs[0]!["n"]).toBe(0);
  });

  const call = (failure: string | null) => ({
    provider: "fixture-provider",
    model: "fixture-model",
    requestId: "req-1",
    inputTokens: 100,
    outputTokens: 50,
    latencyMs: 10,
    failure,
  });
  const firstTaskRun = async (missionId: string) => {
    const [task] = await sql!`select id, status, attempt from wf_mission_tasks
      where mission_id = ${missionId} order by sort_order limit 1`;
    const [run] = await sql!`select * from wf_task_runs where task_id = ${task!["id"] as string}`;
    return { task: task!, run: run! };
  };

  it("retries a step whose model call failed for a passing reason, keeping nothing", async () => {
    const ids = await approvedMission(1000, buildPlan);
    nextGeneration = {
      content: "",
      mode: "simulated",
      note: "model call timed out",
      failure: { class: "timeout", detail: "model call timed out" },
      calls: [call("timeout")],
      instructionVersion: "DX-001@2",
    };
    expect((await step(ids)).note).toMatch(/tried again/);
    const { task, run } = await firstTaskRun(ids.missionId);
    expect(task).toMatchObject({ status: "pending", attempt: 1 });
    expect(run).toMatchObject({ status: "failed", failure_class: "timeout", model_calls: 1 });
    const kept = await sql!`select (select count(*)::int from wf_artefacts) a,
      (select usage_consumed from wf_workspaces where id = ${ids.workspaceId}) u`;
    expect(kept[0]).toMatchObject({ a: 0, u: 0 });
  });

  it("fails the step, never a simulated draft, when the runner reports failed checks", async () => {
    const ids = await approvedMission(1000, buildPlan);
    nextGeneration = {
      content: "",
      mode: "simulated",
      note: "failed",
      failure: { class: "contract_failed", detail: "output failed its checks after two attempts" },
      calls: [call(null), call(null)],
    };
    expect((await step(ids)).note).toMatch(/could not produce/);
    const { task, run } = await firstTaskRun(ids.missionId);
    expect(task["status"]).toBe("failed");
    expect(run).toMatchObject({
      failure_class: "contract_failed",
      model_calls: 2,
      input_tokens: 200,
    });
    const artefacts = await sql!`select count(*)::int n from wf_artefacts`;
    expect(artefacts[0]!["n"]).toBe(0);
  });

  it("runs the lead role's instructions and records the model call on the run", async () => {
    const { STAGE_FIXTURES } = await import("./registry/eval-fixtures");
    const ids = await approvedMission(1000, buildPlan);
    nextGeneration = {
      content: STAGE_FIXTURES.find((f) => f.stage === "charter")!.good,
      mode: "model",
      model: "fixture-model",
      calls: [call(null)],
      instructionVersion: "DX-001@2",
    };
    await step(ids);
    expect(lastGenerationInput!["extraInstructions"]).toMatch(/DX-001/);
    expect(lastGenerationInput!["instructionVersion"]).toBe("DX-001@2");
    const { task, run } = await firstTaskRun(ids.missionId);
    expect(task["status"]).toBe("completed");
    expect(run).toMatchObject({
      status: "completed",
      provider: "fixture-provider",
      model: "fixture-model",
      request_id: "req-1",
      input_tokens: 100,
      output_tokens: 50,
      model_calls: 1,
      role_id: "DX-001",
      instruction_version: "DX-001@2",
    });
  });

  it("lets only one of two concurrent workers take a task", async () => {
    const ids = await approvedMission();
    await Promise.all([step(ids, "a"), step(ids, "b"), step(ids, "c")]);
    const runs = await sql!`select task_id, attempt from wf_task_runs`;
    const perTask = new Map<string, number>();
    for (const r of runs)
      perTask.set(r["task_id"] as string, (perTask.get(r["task_id"] as string) ?? 0) + 1);
    for (const n of perTask.values()) expect(n).toBe(1);
  });
});
