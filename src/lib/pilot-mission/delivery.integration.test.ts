/**
 * Begin delivery against a real database: one transaction creates the build mission, its
 * approved plan and the case link; stale, repeated or refused requests leave nothing behind.
 * Skipped without PSI_TEST_DATABASE_URL (disposable deliverx_phase1_* only).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import { createDb, type ColumnTypes, type Executor } from "@/lib/db/builder";
import type { DbTransaction } from "@/lib/db/neon.server";
import {
  cancelCaseAndDelivery,
  deleteCaseFromDashboard,
  startSupervisedDelivery,
} from "./delivery.server";
import { createMissionStore } from "./repository.server";
import { MissionConflictError, SupervisedMissionService } from "./service";
import { holdPublicSchemaLock } from "./test-db-lock";
import { baseMission } from "./test-fixtures";
import type { SupervisedMission } from "./types";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Delivery tests require a disposable local deliverx_phase1_* database.");
}
const sql = url ? postgres(url, { prepare: false, max: 6, types: POSTGRES_TYPES }) : null;

let types: ColumnTypes;
const transact: DbTransaction = async (work) =>
  sql!.begin(async (tx) => {
    const query: Executor = async (text, params) =>
      (await tx.unsafe(text, params)) as unknown as Record<string, unknown>[];
    return work(
      createDb(query, async () => types),
      query,
    );
  }) as unknown as ReturnType<typeof work>;
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

let workspaceId: string;

const decidedCase = (over: Partial<SupervisedMission> = {}): SupervisedMission =>
  baseMission({
    id: crypto.randomUUID(),
    workspaceId,
    ownerUserId: "owner",
    version: 1,
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "s",
      options: [{ id: "o1", title: "Waste log", tradeoff: "Manual entry first", basis: "e1" }],
      generation: {
        ran: false,
        label: "not run",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [],
      },
    },
    ...over,
  });

const seed = async (mission: SupervisedMission) => {
  await createMissionStore(db, transact).save(mission, 0);
  return mission;
};
const begin = (mission: SupervisedMission, expectedVersion = mission.version) =>
  startSupervisedDelivery(
    { workspaceId, id: mission.id, expectedVersion, actorId: "owner", nowMs: 2_000 },
    transact,
  );
const count = async (table: string) =>
  Number((await sql!.unsafe(`select count(*)::int as n from ${table}`))[0]!["n"]);

describe.skipIf(!url).sequential("Begin delivery against a real database", () => {
  let releaseLock: (() => Promise<void>) | null = null;
  beforeAll(async () => {
    // Waits (up to the hook timeout) for any other file holding the lock to finish.
    releaseLock = await holdPublicSchemaLock(url!);
    types = new Map();
    const rows =
      await sql!`select table_name,column_name,udt_name from information_schema.columns where table_schema='public'`;
    for (const row of rows) {
      if (!types.has(row["table_name"])) types.set(row["table_name"], new Map());
      types.get(row["table_name"])!.set(row["column_name"], row["udt_name"]);
    }
  }, 120_000);

  beforeEach(async () => {
    await sql!`truncate psi_supervised_wf_links, psi_supervised_spend, psi_supervised_missions, wf_mission_events, wf_task_runs, wf_mission_tasks, wf_mission_plans, wf_approvals, wf_missions, wf_projects, wf_workspaces cascade`;
    workspaceId = crypto.randomUUID();
    await sql!`insert into wf_workspaces(id,owner_id,usage_ceiling) values(${workspaceId},'test-owner',100)`;
  });

  afterAll(async () => {
    await sql?.end();
    await releaseLock?.();
  });

  it("creates the build mission with an approved plan and links it to the case", async () => {
    const mission = await seed(decidedCase());
    const { mission: after, started } = await begin(mission);
    expect(started).toBe(true);
    expect(after.version).toBe(mission.version + 1);
    const wfId = after.delivery!.wfMissionId;

    const [wf] = await sql!`select intent, status, request_text, clarification_answers
      from wf_missions where id = ${wfId}::uuid and workspace_id = ${workspaceId}::uuid`;
    expect(wf!["intent"]).toBe("build");
    expect(wf!["status"]).toBe("queued");
    expect(wf!["request_text"]).toMatch(/^Build the first version of: Food waste app/);
    expect(wf!["clarification_answers"]).toMatchObject({ users: "Owners", success: "Less waste" });

    const tasks =
      await sql!`select task_key, status from wf_mission_tasks where mission_id = ${wfId}::uuid order by sort_order`;
    expect(tasks).toHaveLength(14);
    expect(tasks.every((t) => t["status"] === "pending")).toBe(true);
    expect(tasks.map((t) => t["task_key"]).filter((k) => String(k).startsWith("gate_"))).toEqual([
      "gate_scope",
      "gate_design",
      "gate_release",
    ]);
    // Gates are never pre-approved: only the plan approval is recorded.
    const approvals =
      await sql!`select kind, status, decided_by from wf_approvals where mission_id = ${wfId}::uuid`;
    expect(approvals.map((a) => [a["kind"], a["status"], a["decided_by"]])).toEqual([
      ["plan", "approved", "owner"],
    ]);

    const stored = await new SupervisedMissionService(createMissionStore(db, transact)).get(
      workspaceId,
      mission.id,
    );
    expect(stored!.delivery).toMatchObject({
      wfMissionId: wfId,
      optionId: "o1",
      approvedBy: "owner",
    });
    expect(stored!.activity.at(-1)?.kind).toBe("delivery.approved");
  });

  it("opens the same delivery on a repeated click and starts nothing new", async () => {
    const mission = await seed(decidedCase());
    const first = await begin(mission);
    const again = await begin(mission);
    expect(again.started).toBe(false);
    expect(again.mission.delivery!.wfMissionId).toBe(first.mission.delivery!.wfMissionId);
    expect(await count("wf_missions")).toBe(1);
  });

  it("rolls everything back on a stale version or a decision not to build", async () => {
    const stale = await seed(decidedCase());
    await expect(begin(stale, stale.version + 5)).rejects.toBeInstanceOf(MissionConflictError);

    const notBuilding = await seed(
      decidedCase({
        approval: { ...baseMission().approval!, choice: "authorise_gather_evidence" },
      }),
    );
    await expect(begin(notBuilding)).rejects.toThrow(/not to build yet/);

    expect(await count("wf_missions")).toBe(0);
    expect(await count("wf_mission_plans")).toBe(0);
    const service = new SupervisedMissionService(createMissionStore(db, transact));
    expect((await service.get(workspaceId, stale.id))!.version).toBe(stale.version);
  });

  it("keeps the brief fixed once delivery runs, and cancelling stops the build", async () => {
    const mission = await seed(decidedCase());
    const { mission: after } = await begin(mission);
    const service = new SupervisedMissionService(createMissionStore(db, transact));
    await expect(
      service.reviseBrief({
        workspaceId,
        id: mission.id,
        brief: { ...after.brief, question: "Something else entirely" },
        nowMs: 3_000,
      }),
    ).rejects.toThrow(/Delivery is building this decision/);

    const wfId = after.delivery!.wfMissionId;
    const cancelled = await cancelCaseAndDelivery(
      {
        workspaceId,
        id: mission.id,
        expectedVersion: after.version,
        actorId: "owner",
        nowMs: 4_000,
      },
      transact,
    );
    expect(cancelled.stage).toBe("cancelled");
    const [wf] = await sql!`select status from wf_missions where id = ${wfId}::uuid`;
    expect(wf!["status"]).toBe("cancelled");
    const events =
      await sql!`select type from wf_mission_events where mission_id = ${wfId}::uuid order by created_at`;
    expect(events.map((e) => e["type"])).toContain("mission.cancelled");
  });

  it("deletes a project in one step: work stops, it is hidden, and a stale click changes nothing", async () => {
    const mission = await seed(decidedCase());
    const { mission: after } = await begin(mission);
    const wfId = after.delivery!.wfMissionId;
    const del = (expectedVersion: number) =>
      deleteCaseFromDashboard(
        { workspaceId, id: mission.id, expectedVersion, actorId: "owner", nowMs: 5_000 },
        transact,
      );

    await expect(del(after.version - 1)).rejects.toThrow(/changed in another session/);
    const [still] = await sql!`select status from wf_missions where id = ${wfId}::uuid`;
    expect(still!["status"]).not.toBe("cancelled");

    const deleted = await del(after.version);
    expect(deleted.stage).toBe("cancelled");
    expect(deleted.studioMeta?.archived).toBe(true);
    const [wf] = await sql!`select status from wf_missions where id = ${wfId}::uuid`;
    expect(wf!["status"]).toBe("cancelled");
  });
});
