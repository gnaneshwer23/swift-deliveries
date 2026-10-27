import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import type { Executor } from "@/lib/db/builder";
import { planHash } from "./plan-hash";
import { generateMissionPlan } from "./planner";
import {
  approveExternalForPlan,
  approvePlanVersion,
  hasLivePlanApproval,
  savePlanVersion,
} from "./plan-store.server";

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

describe("planHash", () => {
  it("is built from a plan that has tasks", () => expect(plan.tasks.length).toBeGreaterThan(0));

  it("is stable for the same plan and request", () => {
    const a = planHash({ requestText: "x", plan });
    expect(planHash({ requestText: "x", plan: structuredClone(plan) })).toBe(a);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("changes when anything the owner approves changes", () => {
    const base = planHash({ requestText: "x", plan });
    expect(planHash({ requestText: "y", plan })).not.toBe(base);
    expect(planHash({ requestText: "x", plan: { ...plan, estimatedUsage: 1 } })).not.toBe(base);
    const tasks = plan.tasks.map((t, i) => (i === 0 ? { ...t, isExternal: !t.isExternal } : t));
    expect(planHash({ requestText: "x", plan: { ...plan, tasks } })).not.toBe(base);
    const sections = plan.tasks.map((t, i) =>
      i === 0 ? { ...t, requiredSections: [...(t.requiredSections ?? []), "Extra"] } : t,
    );
    expect(planHash({ requestText: "x", plan: { ...plan, tasks: sections } })).not.toBe(base);
    expect(
      planHash({ requestText: "x", plan: { ...plan, acceptanceCriteria: ["Something else"] } }),
    ).not.toBe(base);
  });
});

describe("hasLivePlanApproval", () => {
  const approval = {
    kind: "plan",
    status: "approved",
    planVersion: 2,
    payloadHash: "sha256:b",
    invalidatedAt: null,
  };
  it("accepts only an approval bound to the current version and fingerprint", () => {
    expect(hasLivePlanApproval({ version: 2, planHash: "sha256:b" }, [approval])).toBe(true);
    expect(hasLivePlanApproval({ version: 3, planHash: "sha256:c" }, [approval])).toBe(false);
    expect(
      hasLivePlanApproval({ version: 2, planHash: "sha256:b" }, [
        { ...approval, invalidatedAt: "2026-10-01T00:00:00Z" },
      ]),
    ).toBe(false);
    expect(hasLivePlanApproval(null, [approval])).toBe(false);
  });
  it("keeps plans saved before fingerprints working with their legacy approvals", () => {
    const legacy = { ...approval, planVersion: null, payloadHash: null };
    expect(hasLivePlanApproval({ version: 1, planHash: null }, [legacy])).toBe(true);
    expect(hasLivePlanApproval({ version: 1, planHash: "sha256:b" }, [legacy])).toBe(false);
  });
});

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Plan store tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_plan_store_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_projects",
  "wf_missions",
  "wf_mission_plans",
  "wf_mission_tasks",
  "wf_approvals",
  "wf_mission_events",
];
const sql = url
  ? postgres(url, { prepare: false, max: 4, connection: { search_path: schema } })
  : null;
const inTx = <T>(work: (q: Executor) => Promise<T>) =>
  sql!.begin((t) =>
    work(async (text, params) => (await t.unsafe(text, params)) as never),
  ) as Promise<T>;

async function seed() {
  const [ws] =
    await sql!`insert into wf_workspaces (owner_id, name) values ('owner', 'W') returning id`;
  const workspaceId = ws!["id"] as string;
  const [project] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'Tutor app', 'owner') returning id`;
  const [mission] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${workspaceId}, ${project!["id"]}, 'investigate', 'M', 'req', 'awaiting_approval',
            'execute_internally', 'owner') returning id`;
  return { workspaceId, missionId: mission!["id"] as string };
}

const save = (ids: { workspaceId: string; missionId: string }, requestText: string) =>
  inTx((q) => savePlanVersion(q, { ...ids, requestText, plan, actorId: "owner", reason: "test" }));

describe.skipIf(!url)("plan versions and bound approvals against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
    await sql!
      .unsafe(`create trigger append_only before update or delete on ${schema}.wf_mission_events
      for each row execute function public.wf_mission_events_append_only()`);
    await sql!.unsafe(`alter table ${schema}.wf_mission_events add foreign key (mission_id)
      references ${schema}.wf_missions (id) on delete cascade`);
  });
  beforeEach(async () => {
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("bumps the version on each save and invalidates, never deletes, earlier approvals", async () => {
    const ids = await seed();
    const first = await save(ids, "first request");
    const second = await save(ids, "revised request");
    expect([first.version, second.version]).toEqual([1, 2]);
    expect(second.hash).not.toBe(first.hash);

    const approvals = await sql!`select plan_version, payload_hash, status, invalidated_at
      from wf_approvals where mission_id = ${ids.missionId} order by created_at, plan_version`;
    expect(approvals).toHaveLength(2);
    const old = approvals.find((a) => a["plan_version"] === 1)!;
    const live = approvals.find((a) => a["plan_version"] === 2)!;
    expect(old["invalidated_at"]).not.toBeNull();
    expect(live).toMatchObject({
      status: "pending",
      payload_hash: second.hash,
      invalidated_at: null,
    });

    const tasks = await sql!`select task_key, depends_on, capability_ids from wf_mission_tasks
      where mission_id = ${ids.missionId} order by sort_order`;
    expect(tasks.map((t) => t["task_key"])).toEqual(plan.tasks.map((t) => t.key));
    expect(tasks[0]!["capability_ids"]).toEqual(plan.tasks[0]!.capabilityIds);
  });

  it("refuses to approve a plan version the owner did not see", async () => {
    const ids = await seed();
    const first = await save(ids, "first request");
    await save(ids, "revised request");
    await expect(
      inTx((q) =>
        approvePlanVersion(q, {
          ...ids,
          planVersion: first.version,
          planHash: first.hash,
          actorId: "owner",
          approveExternal: false,
        }),
      ),
    ).rejects.toThrow(/plan changed/);
    const [m] = await sql!`select status from wf_missions where id = ${ids.missionId}`;
    expect(m!["status"]).toBe("awaiting_approval");
  });

  it("approves the current version, queues the mission and records the event", async () => {
    const ids = await seed();
    const saved = await save(ids, "first request");
    await inTx((q) =>
      approvePlanVersion(q, {
        ...ids,
        planVersion: saved.version,
        planHash: saved.hash,
        actorId: "owner",
        approveExternal: false,
      }),
    );
    const [m] =
      await sql!`select status, external_actions_approved from wf_missions where id = ${ids.missionId}`;
    expect(m).toMatchObject({ status: "queued", external_actions_approved: false });
    const events =
      await sql!`select type from wf_mission_events where mission_id = ${ids.missionId} order by id`;
    expect(events.map((e) => e["type"])).toEqual(["plan.proposed", "plan.approved"]);

    // The same approval cannot be used twice.
    await expect(
      inTx((q) =>
        approvePlanVersion(q, {
          ...ids,
          planVersion: saved.version,
          planHash: saved.hash,
          actorId: "owner",
          approveExternal: false,
        }),
      ),
    ).rejects.toThrow(/expired or was replaced/);
  });

  it("refuses an expired approval", async () => {
    const ids = await seed();
    const saved = await save(ids, "first request");
    await sql!`update wf_approvals set expires_at = now() - interval '1 minute' where mission_id = ${ids.missionId}`;
    await expect(
      inTx((q) =>
        approvePlanVersion(q, {
          ...ids,
          planVersion: saved.version,
          planHash: saved.hash,
          actorId: "owner",
          approveExternal: false,
        }),
      ),
    ).rejects.toThrow(/expired or was replaced/);
  });

  it("approves a legacy plan that has no fingerprint through its legacy approval", async () => {
    const ids = await seed();
    await sql!`insert into wf_mission_plans (mission_id, workspace_id, summary, required_permission)
      values (${ids.missionId}, ${ids.workspaceId}, 'old plan', 'execute_internally')`;
    await sql!`insert into wf_approvals (mission_id, workspace_id, kind, status)
      values (${ids.missionId}, ${ids.workspaceId}, 'plan', 'pending')`;
    await inTx((q) =>
      approvePlanVersion(q, {
        ...ids,
        planVersion: 1,
        planHash: null,
        actorId: "owner",
        approveExternal: false,
      }),
    );
    const [a] = await sql!`select status from wf_approvals where mission_id = ${ids.missionId}`;
    expect(a!["status"]).toBe("approved");
  });

  it("approves outside actions only after the plan itself is approved", async () => {
    const ids = await seed();
    const saved = await save(ids, "first request");
    const ext = () =>
      inTx((q) =>
        approveExternalForPlan(q, {
          ...ids,
          planVersion: saved.version,
          planHash: saved.hash,
          actorId: "owner",
        }),
      );
    await expect(ext()).rejects.toThrow(/Approve the plan/);
    await inTx((q) =>
      approvePlanVersion(q, {
        ...ids,
        planVersion: saved.version,
        planHash: saved.hash,
        actorId: "owner",
        approveExternal: false,
      }),
    );
    await ext();
    const [row] = await sql!`select plan_version, payload_hash from wf_approvals
      where mission_id = ${ids.missionId} and kind = 'external_action'`;
    expect(row).toMatchObject({ plan_version: saved.version, payload_hash: saved.hash });
  });

  it("keeps the event log append-only", async () => {
    const ids = await seed();
    await save(ids, "first request");
    await expect(sql!`update wf_mission_events set type = 'edited'`).rejects.toThrow(/append-only/);
    await expect(sql!`delete from wf_mission_events`).rejects.toThrow(/append-only/);
    // Deleting the mission itself still cascades to its events.
    await sql!`delete from wf_mission_tasks where mission_id = ${ids.missionId}`;
    await sql!`delete from wf_approvals where mission_id = ${ids.missionId}`;
    await sql!`delete from wf_mission_plans where mission_id = ${ids.missionId}`;
    await sql!`delete from wf_missions where id = ${ids.missionId}`;
    const [left] = await sql!`select count(*)::int n from wf_mission_events`;
    expect(left!["n"]).toBe(0);
  });
});
