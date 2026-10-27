import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { createDb, type ColumnTypes, type Executor } from "@/lib/db/builder";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Isolation tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_isolation_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_workspace_members",
  "wf_projects",
  "wf_missions",
  "wf_mission_plans",
  "wf_mission_tasks",
  "wf_artefacts",
  "wf_approvals",
  "wf_audit_events",
];
const sql = url
  ? postgres(url, { prepare: false, max: 10, connection: { search_path: schema } })
  : null;
let types: ColumnTypes = new Map();
const query: Executor = async (text, params) =>
  (await sql!.unsafe(text, params)) as unknown as Record<string, unknown>[];
const db = createDb(query, async () => types);

// The service-side writes in access.server use neonDb(); point it at the test database.
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

const { ensureWorkspace, loadMissionBundle } = await import("./access.server");

async function seedMission(workspaceId: string, owner: string) {
  const [project] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'Tutor app', ${owner}) returning id`;
  const [mission] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${workspaceId}, ${project!["id"]}, 'investigate', 'Private mission', 'secret request',
            'awaiting_approval', 'execute_internally', ${owner}) returning id`;
  const missionId = mission!["id"] as string;
  await sql!`insert into wf_mission_plans (mission_id, workspace_id, summary, required_permission)
    values (${missionId}, ${workspaceId}, 'plan', 'execute_internally')`;
  const [task] = await sql!`insert into wf_mission_tasks
      (mission_id, workspace_id, sort_order, title, status, permission_required)
    values (${missionId}, ${workspaceId}, 0, 'Frame the problem', 'pending', 'create') returning id`;
  await sql!`insert into wf_artefacts (mission_id, workspace_id, task_id, kind, title, content, content_format)
    values (${missionId}, ${workspaceId}, ${task!["id"]}, 'brief', 'Brief', 'private content', 'markdown')`;
  await sql!`insert into wf_approvals (mission_id, workspace_id, kind, status)
    values (${missionId}, ${workspaceId}, 'plan', 'pending')`;
  await sql!`insert into wf_audit_events (workspace_id, mission_id, actor_id, event_type, entity_type)
    values (${workspaceId}, ${missionId}, ${owner}, 'mission.created', 'mission')`;
  return missionId;
}

describe.skipIf(!url)("workspace isolation against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
    // production has no UNIQUE on owner_id; drop the fixture's so the race test proves the lock
    for (const c of await sql!`select conname from pg_constraint
        where conrelid = ${`${schema}.wf_workspaces`}::regclass and contype = 'u'`)
      await sql!.unsafe(
        `alter table ${schema}.wf_workspaces drop constraint "${c["conname"] as string}"`,
      );
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
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("gives each user their own workspace, and the same one every time", async () => {
    const a = await ensureWorkspace(db, "user-a");
    const b = await ensureWorkspace(db, "user-b");
    expect(a.workspace.id).not.toBe(b.workspace.id);
    expect((await ensureWorkspace(db, "user-a")).workspace.id).toBe(a.workspace.id);
  });

  it("creates one workspace and one membership when first visits race", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => ensureWorkspace(db, "user-race")),
    );
    expect(new Set(results.map((r) => r.workspace.id)).size).toBe(1);
    const [counts] = await sql!`select
        (select count(*) from wf_workspaces where owner_id = 'user-race')::int as workspaces,
        (select count(*) from wf_workspace_members where user_id = 'user-race')::int as members`;
    expect(counts).toEqual({ workspaces: 1, members: 1 });
  });

  it("lets the owner read their mission and refuses it to another workspace", async () => {
    const a = (await ensureWorkspace(db, "user-a")).workspace;
    const b = (await ensureWorkspace(db, "user-b")).workspace;
    const missionId = await seedMission(a.id, "user-a");

    const own = await loadMissionBundle(db, a.id, missionId);
    expect(own.mission.id).toBe(missionId);
    expect(own.plan).not.toBeNull();
    expect([own.tasks.length, own.artefacts.length, own.approvals.length]).toEqual([1, 1, 1]);
    expect(own.auditEvents.length).toBe(1);

    await expect(loadMissionBundle(db, b.id, missionId)).rejects.toThrow("Mission not found.");
  });

  it("never returns rows filed under another workspace, even beneath the owner's mission", async () => {
    const a = (await ensureWorkspace(db, "user-a")).workspace;
    const b = (await ensureWorkspace(db, "user-b")).workspace;
    const missionId = await seedMission(a.id, "user-a");
    await sql!`insert into wf_artefacts (mission_id, workspace_id, kind, title, content, content_format)
      values (${missionId}, ${b.id}, 'note', 'Misfiled', 'belongs to b', 'markdown')`;
    await sql!`insert into wf_mission_tasks (mission_id, workspace_id, sort_order, title, status, permission_required)
      values (${missionId}, ${b.id}, 9, 'Misfiled task', 'pending', 'create')`;

    const own = await loadMissionBundle(db, a.id, missionId);
    expect(own.artefacts.map((x) => x.title)).toEqual(["Brief"]);
    expect(own.tasks.map((x) => x.title)).toEqual(["Frame the problem"]);
  });
});

describe("every mission handler is scoped before it reads or writes", () => {
  const source = readFileSync(new URL("../workforce.functions.ts", import.meta.url), "utf8");
  const handlers = [
    ...source.matchAll(/export const (\w+) = createServerFn[\s\S]*?(?=\nexport const |\n*$)/g),
  ].map((m) => ({ name: m[1]!, body: m[0] }));
  const WRITE =
    /\.(insert|update|delete|upsert)\(|chargeWorkspaceUsage\(|query\(\s*`\s*(insert|update|delete)|(savePlanVersion|approvePlanVersion|approveExternalForPlan|appendEvent|audit)\(/;

  it("finds the handlers it guards", () => {
    expect(handlers.filter((h) => /data\.missionId/.test(h.body)).length).toBeGreaterThanOrEqual(
      10,
    );
  });

  it.each(handlers.filter((h) => /data\.missionId/.test(h.body)).map((h) => [h.name, h.body]))(
    "%s resolves the caller's workspace and reads through it before any write",
    (_name, body) => {
      const ensure = body.indexOf("ensureWorkspace(");
      // the mission bundle, or a read of the target row filtered by the caller's workspace
      const load = body.search(
        /loadMissionBundle\(|lockMission\(query, workspace\.id|from\("wf_\w+"\)\s*\.select[\s\S]{0,200}?\.eq\("workspace_id", workspace\.id\)/,
      );
      const firstWrite = body.search(WRITE);
      expect(ensure).toBeGreaterThan(-1);
      expect(load).toBeGreaterThan(ensure);
      if (firstWrite > -1) expect(load).toBeLessThan(firstWrite);
    },
  );
});
