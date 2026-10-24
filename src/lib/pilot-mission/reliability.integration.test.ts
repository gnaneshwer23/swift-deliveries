import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createDb, type ColumnTypes, type Executor } from "@/lib/db/builder";
import type { DbTransaction } from "@/lib/db/neon.server";
import { createMissionStore, postWorkspaceSpend } from "./repository.server";
import { reservedComparison } from "./reservations.server";
import { SupervisedMissionService } from "./service";
import { notConfiguredGeneration } from "./generate";
import type { GenerationResult, SupervisedMission } from "./types";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Reliability tests require a disposable local deliverx_phase1_* database.");
}
const sql = url ? postgres(url, { prepare: false, max: 6 }) : null;
const brief = {
  question: "Which onboarding change should we investigate first?",
  audience: "Product builders",
  outcome: "A bounded decision and experiment brief.",
  constraints: "No deployment.",
};
const generated: GenerationResult = {
  ran: true,
  label: "test-provider",
  provider: "fixture",
  model: "fixture",
  output: "{}",
  citations: [],
  gaps: [],
};
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
let workspaceId: string;
let service: SupervisedMissionService;
async function mission() {
  return service.create({
    id: crypto.randomUUID(),
    workspaceId,
    ownerUserId: "test-owner",
    brief,
    usageCeiling: 10,
    nowMs: Date.now(),
  });
}
async function activate(allowance: number) {
  const requestId = crypto.randomUUID();
  await sql!`insert into psi_pilot_requests(id,reference,plan,contact_name,contact_email,brief,consent_at,claim_token_hash,brief_fingerprint) values(${requestId},${requestId},'builder','Fixture','fixture@example.invalid','{}',now(),${requestId},'fixture')`;
  await sql!`insert into psi_pilot_activations(request_id,workspace_id,plan,mission_allowance,activated_by) values(${requestId},${workspaceId},'builder',${allowance},'test-operator')`;
}
async function consumed() {
  return Number(
    (await sql!`select usage_consumed from wf_workspaces where id=${workspaceId}`)[0]![
      "usage_consumed"
    ],
  );
}

describe.skipIf(!url)("isolated PostgreSQL transaction and recovery checks", () => {
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
    await sql!`truncate psi_comparison_reservations,psi_supervised_spend,psi_supervised_missions,psi_pilot_activations,psi_pilot_requests,wf_workspaces cascade`;
    workspaceId = crypto.randomUUID();
    await sql!`insert into wf_workspaces(id,owner_id,usage_ceiling) values(${workspaceId},'test-owner',10)`;
    service = new SupervisedMissionService(createMissionStore(db, transact));
  });
  afterAll(async () => {
    await sql?.end();
  });

  it("reserves the final activated allowance before either of two missions can dispatch", async () => {
    await activate(1);
    const a = await mission(),
      b = await mission();
    let calls = 0;
    const results = await Promise.allSettled(
      [a, b].map((m) =>
        reservedComparison(
          m,
          async () => {
            calls++;
            return generated;
          },
          transact,
        ),
      ),
    );
    expect(calls).toBe(1);
    expect(results.filter((r) => r["status"] === "rejected")).toHaveLength(1);
    expect(await consumed()).toBe(1);
    expect(
      Number(
        (await sql!`select missions_consumed from psi_pilot_activations`)[0]!["missions_consumed"],
      ),
    ).toBe(1);
  });
  it("reserves the final workspace unit across missions without an activation", async () => {
    await sql!`update wf_workspaces set usage_ceiling=1`;
    const a = await mission(),
      b = await mission();
    let calls = 0;
    await Promise.allSettled(
      [a, b].map((m) =>
        reservedComparison(
          m,
          async () => {
            calls++;
            return generated;
          },
          transact,
        ),
      ),
    );
    expect(calls).toBe(1);
    expect(await consumed()).toBe(1);
  });
  it("retains unknown provider attempts and refuses a duplicate dispatch", async () => {
    const m = await mission();
    let calls = 0;
    const run = async () => {
      calls++;
      throw new Error("connection lost after dispatch");
    };
    await expect(reservedComparison(m, run, transact)).rejects.toThrow("connection lost");
    await expect(reservedComparison(m, run, transact)).rejects.toThrow("reconciliation");
    expect(calls).toBe(1);
    expect(await consumed()).toBe(1);
    expect((await sql!`select status from psi_comparison_reservations`)[0]!["status"]).toBe(
      "uncertain",
    );
  });
  it("reuses the persisted provider result after mission persistence failed", async () => {
    const m = await mission();
    let calls = 0;
    await reservedComparison(
      m,
      async () => {
        calls++;
        return generated;
      },
      transact,
    );
    const result = await reservedComparison(
      m,
      async () => {
        calls++;
        return generated;
      },
      transact,
    );
    expect(result).toEqual(generated);
    expect(calls).toBe(1);
    expect(await consumed()).toBe(1);
    await postWorkspaceSpend(
      db,
      m,
      {
        key: (await sql!`select spend_key from psi_supervised_spend`)[0]!["spend_key"],
        units: 1,
        reason: "fixture",
      },
      transact,
    );
    expect(await consumed()).toBe(1);
  });
  it("refunds only an explicit no-dispatch result and does not rerun it", async () => {
    await activate(1);
    const m = await mission();
    let calls = 0;
    for (let i = 0; i < 2; i++)
      await reservedComparison(
        m,
        async () => {
          calls++;
          return notConfiguredGeneration();
        },
        transact,
      );
    expect(calls).toBe(1);
    expect(await consumed()).toBe(0);
    expect(
      Number(
        (await sql!`select missions_consumed from psi_pilot_activations`)[0]!["missions_consumed"],
      ),
    ).toBe(0);
  });
  it("rolls back legacy spend marker and counter together on a failed transaction", async () => {
    const m = await mission();
    const failing: DbTransaction = (work) =>
      transact(async (tx, q) => {
        const value = await work(tx, q);
        throw new Error(`injected crash ${String(value)}`);
      });
    await expect(
      postWorkspaceSpend(db, m, { key: "legacy", units: 1, reason: "fixture" }, failing),
    ).rejects.toThrow("injected crash");
    expect(await consumed()).toBe(0);
    expect(await sql!`select * from psi_supervised_spend`).toHaveLength(0);
    await postWorkspaceSpend(db, m, { key: "legacy", units: 1, reason: "fixture" }, transact);
    expect(await consumed()).toBe(1);
  });
  it("rolls back the parent update when a child insert fails", async () => {
    const parent = await mission(),
      occupied = await mission();
    const parentBefore = await service.get(workspaceId, parent.id);
    const store = createMissionStore(db, transact);
    await expect(
      store.saveFollowUp({ ...parent, version: parent.version + 1 }, parent.version, {
        ...occupied,
        origin: { parentMissionId: parent.id } as SupervisedMission["origin"],
      }),
    ).rejects.toThrow();
    expect((await service.get(workspaceId, parent.id))?.version).toBe(parentBefore!.version);
    expect(await service.list(workspaceId)).toHaveLength(2);
  });
  it("writes parent and child together, and rejects another workspace", async () => {
    const parent = await mission();
    const child = { ...parent, id: crypto.randomUUID() };
    const store = createMissionStore(db, transact);
    await store.saveFollowUp({ ...parent, version: parent.version + 1 }, parent.version, child);
    expect(await service.list(workspaceId)).toHaveLength(2);
    expect(await service.get(crypto.randomUUID(), child.id)).toBeNull();
    await expect(
      store.saveFollowUp({ ...parent, version: 3 }, 2, {
        ...child,
        id: crypto.randomUUID(),
        workspaceId: crypto.randomUUID(),
      }),
    ).rejects.toThrow();
  });
  it("persists the complete decision-to-outcome loop and creates only one child under concurrent approval", async () => {
    const m = await mission();
    await service.saveEvidence({
      workspaceId,
      id: m.id,
      items: [
        {
          statement: "Fixture: setup asks for a goal before saving the question.",
          source: "Synthetic acceptance fixture, not customer research",
          classification: "supplied",
        },
      ],
      nowMs: 2000,
    });
    const compared = await service.runAlternatives({
      workspaceId,
      id: m.id,
      workerId: "fixture-worker",
      nowMs: 3000,
      generator: { cost: 0, run: async () => notConfiguredGeneration() },
    });
    const proposal = compared.mission.proposal!;
    await service.decide({
      workspaceId,
      id: m.id,
      claim: {
        action: proposal.action,
        version: proposal.version,
        scopeHash: proposal.scopeHash,
        optionId: proposal.options[0]!.id,
      },
      choice: "accept",
      note: "Investigate only. No product change authorised.",
      actorId: "test-owner",
      nowMs: 4000,
    });
    await service.recordExpectation({
      workspaceId,
      id: m.id,
      hypothesis: "A shorter setup could help users reach value.",
      expectedMetric: "Completion of the first useful action",
      baseline: "Fixture baseline not established",
      observationWindow: "Seven days after a separately authorised change",
      actorId: "test-owner",
      nowMs: 4500,
    });
    await service.prepareArtefact({ workspaceId, id: m.id, nowMs: 5000 });
    const exported = await service.exportMission({ workspaceId, id: m.id, nowMs: 6000 });
    expect(exported.exportBody).toContain("not run");
    await service.recordObservation({
      workspaceId,
      id: m.id,
      result: "Fixture: the owner supplied an inconclusive tally.",
      evidence: "Synthetic tally for testing only; no result was observed.",
      source: "Acceptance fixture",
      actorId: "test-owner",
      nowMs: 7000,
    });
    await service.recordReview({
      workspaceId,
      id: m.id,
      reading: "uncertain",
      uncertainty: "This synthetic fixture does not establish any real improvement.",
      followUp: brief,
      actorId: "test-owner",
      nowMs: 8000,
    });
    const approvals = await Promise.allSettled(
      [0, 1].map(() =>
        service.approveFollowUp({
          workspaceId,
          id: m.id,
          actorId: "test-owner",
          followUpMissionId: crypto.randomUUID(),
          usageCeiling: 10,
          nowMs: 9000,
        }),
      ),
    );
    expect(approvals.some((r) => r.status === "fulfilled")).toBe(true);
    const reloadedService = new SupervisedMissionService(createMissionStore(db, transact));
    const parent = await reloadedService.get(workspaceId, m.id);
    expect(parent?.reviews).toHaveLength(1);
    expect(parent?.observation?.label).toContain("Owner-supplied");
    const children = (await reloadedService.list(workspaceId)).filter((row) => row.id !== m.id);
    expect(children).toHaveLength(1);
    expect(parent?.followUp?.missionId).toBe(children[0]!.id);
    expect(children[0]!.approval).toBeNull();
    expect(children[0]!.stage).toBe("brief");
  });
});
