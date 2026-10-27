import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import type { Executor } from "@/lib/db/builder";
import { readNote } from "./evidence";
import { addEvidence, removeEvidence } from "./evidence.server";
import { listProductMemory, recordMemory } from "./product-memory.server";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Memory tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_memory_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_projects",
  "wf_missions",
  "wf_mission_events",
  "wf_mission_evidence",
  "wf_product_memory",
];
const sql = url
  ? postgres(url, { prepare: false, types: POSTGRES_TYPES, connection: { search_path: schema } })
  : null;
const tx = <T>(work: (q: Executor) => Promise<T>) =>
  sql!.begin((t) =>
    work(async (text, params) => (await t.unsafe(text, params)) as never),
  ) as Promise<T>;

async function workspace() {
  const [ws] = await sql!`insert into wf_workspaces (owner_id) values (${`o-${Math.random()}`})
    returning id`;
  const workspaceId = ws!["id"] as string;
  const [p] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'Tutor app', 'o') returning id`;
  return { workspaceId, projectId: p!["id"] as string };
}

async function mission(w: { workspaceId: string; projectId: string }) {
  const [m] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${w.workspaceId}, ${w.projectId}, 'investigate', 'M', 'req', 'queued',
            'execute_internally', 'o')
    returning id`;
  return { ...w, missionId: m!["id"] as string };
}

const fact = (statement: string) => ({
  kind: "inference" as const,
  statement,
  citation: null,
  refKey: null,
});

describe.skipIf(!url)("product memory against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
  });
  beforeEach(async () => {
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("remembers an entry once and marks it seen again when a later mission repeats it", async () => {
    const w = await workspace();
    const first = await mission(w);
    const second = await mission(w);
    const origin = (m: typeof first) => ({
      ...m,
      originKind: "artefact" as const,
      originId: crypto.randomUUID(),
    });
    expect(await tx((q) => recordMemory(q, origin(first), [fact("Tutors lose bookings.")]))).toBe(
      1,
    );
    expect(await tx((q) => recordMemory(q, origin(second), [fact("tutors   lose bookings")]))).toBe(
      0,
    );
    const { entries } = await tx((q) => listProductMemory(q, w.workspaceId, w.projectId));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      statement: "Tutors lose bookings.",
      timesSeen: 2,
      firstMissionId: first.missionId,
      lastMissionId: second.missionId,
    });
  });

  it("keeps founder evidence as a source, and retires it only when no mission still has it", async () => {
    const w = await workspace();
    const a = await mission(w);
    const b = await mission(w);
    const add = (m: typeof a, title: string, text: string) =>
      tx((q) =>
        addEvidence(q, { ...m, actorId: "o", kind: "note", title, reading: readNote(text) }),
      );
    const inA = await add(a, "Call notes", "Tutors reschedule on Sundays.");
    const inB = await add(b, "Call notes", "Tutors reschedule on Sundays.");
    // Evidence that may hold identifiers is never a source.
    await add(a, "Patient list", "NHS 943 476 5919");
    const sources = async () =>
      (await tx((q) => listProductMemory(q, w.workspaceId, w.projectId))).entries.filter(
        (e) => e.kind === "source",
      );
    expect((await sources()).map((s) => [s.statement, s.retiredAt])).toEqual([
      ["Call notes", null],
    ]);

    await tx((q) => removeEvidence(q, { ...a, evidenceId: inA.id, actorId: "o" }));
    expect((await sources())[0]!.retiredAt).toBeNull();
    await tx((q) => removeEvidence(q, { ...b, evidenceId: inB.id, actorId: "o" }));
    expect((await sources())[0]).toMatchObject({ retiredReason: "evidence removed" });
  });

  it("never lists another workspace's memory", async () => {
    const mine = await workspace();
    const theirs = await mission(await workspace());
    await tx((q) =>
      recordMemory(q, { ...theirs, originKind: "artefact", originId: "x" }, [fact("Private.")]),
    );
    const crossed = await tx((q) => listProductMemory(q, mine.workspaceId, theirs.projectId));
    expect(crossed.entries).toEqual([]);
  });

  it("reports memory as unavailable, and records nothing, before its table exists", async () => {
    const m = await mission(await workspace());
    await sql!.unsafe(`alter table ${schema}.wf_product_memory rename to wf_product_memory_x`);
    try {
      expect(await tx((q) => listProductMemory(q, m.workspaceId, m.projectId))).toEqual({
        available: false,
        entries: [],
      });
      expect(
        await tx((q) => recordMemory(q, { ...m, originKind: "gate", originId: "g" }, [fact("x")])),
      ).toBe(0);
    } finally {
      await sql!.unsafe(`alter table ${schema}.wf_product_memory_x rename to wf_product_memory`);
    }
  });

  it("holds evidence and memory to their mission's and project's workspace", async () => {
    // Checked on the public schema, where the migrations ran; the test copies have no foreign keys.
    const constraints = await sql!`select conname from pg_constraint
      where connamespace = 'public'::regnamespace and (conname in ('wf_mission_evidence_mission_workspace_fkey', 'wf_mission_evidence_hash_check')
         or (conrelid = 'public.wf_product_memory'::regclass and contype = 'f'
             and array_length(conkey, 1) = 2))
      order by conname`;
    expect(constraints.map((c) => c["conname"])).toEqual([
      "wf_mission_evidence_hash_check",
      "wf_mission_evidence_mission_workspace_fkey",
      "wf_product_memory_first_mission_fkey",
      "wf_product_memory_last_mission_fkey",
      "wf_product_memory_project_id_workspace_id_fkey",
    ]);
  });
});
