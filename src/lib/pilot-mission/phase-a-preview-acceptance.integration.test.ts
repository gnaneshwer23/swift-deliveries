/**
 * Phase A preview acceptance — Neon + wf adapter spine (FIXTURE providers).
 * Skipped without PSI_TEST_DATABASE_URL (disposable deliverx_phase1_* only).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import { createDb, type ColumnTypes, type Executor } from "@/lib/db/builder";
import type { DbTransaction } from "@/lib/db/neon.server";
import { createMissionStore } from "./repository.server";
import { SupervisedMissionService } from "./service";
import {
  bindSupervisedResearchWorkerAfterApproval,
  supervisedTeamScopeHash,
} from "./workforce-adapter.server";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Phase A acceptance requires a disposable local deliverx_phase1_* database.");
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
let service: SupervisedMissionService;

describe.skipIf(!url)("Phase A — Studio ↔ wf link (Neon fixture)", () => {
  beforeAll(async () => {
    types = new Map();
    const rows =
      await sql!`select table_name,column_name,udt_name from information_schema.columns where table_schema='public'`;
    for (const row of rows) {
      if (!types.has(row["table_name"])) types.set(row["table_name"], new Map());
      types.get(row["table_name"])!.set(row["column_name"], row["udt_name"]);
    }
  });

  beforeEach(async () => {
    await sql!`truncate psi_supervised_wf_links, psi_supervised_spend, psi_supervised_missions, wf_mission_events, wf_task_runs, wf_mission_tasks, wf_mission_plans, wf_approvals, wf_missions, wf_projects, wf_workspaces cascade`;
    workspaceId = crypto.randomUUID();
    await sql!`insert into wf_workspaces(id,owner_id,usage_ceiling) values(${workspaceId},'test-owner',10)`;
    service = new SupervisedMissionService(createMissionStore(db, transact));
  });

  afterAll(async () => {
    await sql?.end();
  });

  it("approve → bind wf link once → research pass executes without wf usage charge", async () => {
    const created = await service.create({
      id: crypto.randomUUID(),
      workspaceId,
      ownerUserId: "owner",
      brief: {
        question: "Should we launch weekend breakfasts?",
        audience: "Operators",
        outcome: "Go or revise",
        constraints: "",
      },
      usageCeiling: 8,
      nowMs: 1_000,
    });
    const approved = await service.approvePlan({
      workspaceId,
      id: created.id,
      actorId: "owner",
      nowMs: 1_500,
      deferResearchPass: true,
    });
    expect(approved.researchPassQueuedAt).toBeTruthy();
    expect(approved.researchPassCompletedAt).toBeNull();

    const link = await bindSupervisedResearchWorkerAfterApproval({
      workspaceId,
      mission: approved,
      actorId: "owner",
    });
    expect(link?.wfMissionId).toBeTruthy();

    const secondBind = await bindSupervisedResearchWorkerAfterApproval({
      workspaceId,
      mission: approved,
      actorId: "owner",
    });
    expect(secondBind?.wfMissionId).toBe(link!.wfMissionId);

    const wfUsageBefore = Number(
      (await sql!`select usage_consumed from wf_workspaces where id=${workspaceId}`)[0]![
        "usage_consumed"
      ],
    );

    const taskCount =
      await sql!`select count(*)::int as n from wf_mission_tasks where mission_id=${link!.wfMissionId}::uuid and status='pending'`;
    expect(Number(taskCount[0]?.["n"])).toBe(1);

    const afterPass = await service.runQueuedResearchPass({
      workspaceId,
      id: created.id,
      workerId: "phase-a-test",
      nowMs: 2_000,
    });
    expect(afterPass.researchPassCompletedAt).toBeTruthy();
    expect(afterPass.researchPassQueuedAt).toBeNull();

    const reloaded = await service.get(workspaceId, created.id);
    expect(reloaded?.researchPassCompletedAt).toBeTruthy();

    const linkRow =
      await sql!`select status from psi_supervised_wf_links where wf_mission_id=${link!.wfMissionId}::uuid`;
    expect(linkRow[0]?.["status"]).toBe("queued");

    const wfUsageAfter = Number(
      (await sql!`select usage_consumed from wf_workspaces where id=${workspaceId}`)[0]![
        "usage_consumed"
      ],
    );
    expect(wfUsageAfter).toBe(wfUsageBefore);
  });

  it("material brief edit after approval clears team gate and stale worker scope", async () => {
    const created = await service.create({
      id: crypto.randomUUID(),
      workspaceId,
      ownerUserId: "owner",
      brief: {
        question: "Should we launch breakfasts?",
        audience: "Operators",
        outcome: "Go or revise",
        constraints: "",
      },
      usageCeiling: 8,
      nowMs: 1_000,
    });
    const approved = await service.approvePlan({
      workspaceId,
      id: created.id,
      actorId: "owner",
      nowMs: 1_500,
      deferResearchPass: true,
    });
    const hashBefore = supervisedTeamScopeHash(approved);
    await bindSupervisedResearchWorkerAfterApproval({
      workspaceId,
      mission: approved,
      actorId: "owner",
    });

    const revised = await service.reviseBrief({
      workspaceId,
      id: created.id,
      brief: { ...approved.brief, question: "Should we launch lunches instead?" },
      nowMs: 2_000,
    });
    expect(revised.team?.approvedAt).toBeNull();
    expect(supervisedTeamScopeHash(revised)).not.toBe(hashBefore);
    expect(revised.activity.some((e) => e.kind === "plan.approval_stale")).toBe(true);
  });
});
