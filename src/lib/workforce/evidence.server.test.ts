import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import type { Executor } from "@/lib/db/builder";
import { readFile, readNote } from "./evidence";
import { addEvidence, listEvidence, removeEvidence } from "./evidence.server";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Evidence tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_evidence_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_projects",
  "wf_missions",
  "wf_mission_events",
  "wf_mission_evidence",
];
const sql = url
  ? postgres(url, { prepare: false, types: POSTGRES_TYPES, connection: { search_path: schema } })
  : null;

/** Runs `work` in a transaction, as the server functions do. */
const tx = <T>(work: (q: Executor) => Promise<T>) =>
  sql!.begin((t) =>
    work(async (text, params) => (await t.unsafe(text, params)) as never),
  ) as Promise<T>;

async function mission(status = "queued") {
  const [ws] = await sql!`insert into wf_workspaces (owner_id) values (${`o-${Math.random()}`})
    returning id`;
  const workspaceId = ws!["id"] as string;
  const [p] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'P', 'o') returning id`;
  const [m] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${workspaceId}, ${p!["id"] as string}, 'investigate', 'M', 'req', ${status},
            'execute_internally', 'o')
    returning id`;
  return { workspaceId, missionId: m!["id"] as string };
}

const note = (ids: { workspaceId: string; missionId: string }, title: string, text: string) =>
  tx((q) =>
    addEvidence(q, { ...ids, actorId: "owner", kind: "note", title, reading: readNote(text) }),
  );

describe.skipIf(!url)("mission evidence against a real database", () => {
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

  it("stores readable and unreadable evidence with who supplied it, and logs each", async () => {
    const ids = await mission();
    const saved = await note(ids, "Call notes", "Tutors reschedule on Sunday nights.");
    expect(saved).toMatchObject({
      status: "readable",
      suppliedBy: "owner",
      contentSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    await tx((q) =>
      addEvidence(q, {
        ...ids,
        actorId: "owner",
        kind: "file",
        title: "Survey scan",
        reading: readFile({
          fileName: "scan.pdf",
          mediaType: "application/pdf",
          byteSize: 4,
          bytes: new Uint8Array([37, 80, 68, 70]),
        }),
        file: { name: "scan.pdf", mediaType: "application/pdf", byteSize: 4 },
      }),
    );
    const list = await tx((q) => listEvidence(q, ids.workspaceId, ids.missionId));
    expect(list.available).toBe(true);
    expect(list.items.map((e) => [e.title, e.status, e.content !== null])).toEqual([
      ["Call notes", "readable", true],
      ["Survey scan", "unreadable", false],
    ]);
    expect(list.items[1]!.unreadableReason).toMatch(/can't be read yet/);
    const events = await sql!`select data from wf_mission_events
      where mission_id = ${ids.missionId} and type = 'evidence.added' order by id`;
    expect(events.map((e) => (e["data"] as { status: string }).status)).toEqual([
      "readable",
      "unreadable",
    ]);
  });

  it("flags evidence that may hold identifiers, in its text or its title", async () => {
    const ids = await mission();
    const inText = await note(ids, "Clinic list", "Patient 943 476 5919 prefers evenings");
    const inTitle = await note(ids, "Patient 943 476 5919", "Prefers evenings");
    expect([inText.containsIdentifiers, inTitle.containsIdentifiers]).toEqual([true, true]);
    const events = await sql!`select data from wf_mission_events
      where mission_id = ${ids.missionId} and type = 'evidence.added' order by id`;
    expect(
      events.map((e) => (e["data"] as { withheldFromModel?: boolean }).withheldFromModel),
    ).toEqual([true, true]);
  });

  it("counts title length as the database does, in characters", async () => {
    const ids = await mission();
    await expect(note(ids, "😀a", "x")).rejects.toThrow(/between 3 and 120/);
    await expect(note(ids, "😀".repeat(120), "x")).resolves.toMatchObject({ status: "readable" });
  });

  it("refuses a duplicate title, since titles are how roles cite evidence", async () => {
    const ids = await mission();
    await note(ids, "Call notes", "one");
    await expect(note(ids, "call  NOTES", "two")).rejects.toThrow(/already has this title/);
  });

  it("removes evidence from the mission but keeps the record", async () => {
    const ids = await mission();
    const saved = await note(ids, "Call notes", "one");
    await tx((q) => removeEvidence(q, { ...ids, evidenceId: saved.id, actorId: "owner" }));
    expect((await tx((q) => listEvidence(q, ids.workspaceId, ids.missionId))).items).toEqual([]);
    const [row] = await sql!`select removed_by, content from wf_mission_evidence
      where id = ${saved.id}`;
    expect(row).toMatchObject({ removed_by: "owner", content: "one" });
    const [removed] = await sql!`select actor_id, data from wf_mission_events
      where mission_id = ${ids.missionId} and type = 'evidence.removed'`;
    expect(removed).toMatchObject({
      actor_id: "owner",
      data: { evidenceId: saved.id, title: "Call notes" },
    });
    // The title is free again once the old item is removed.
    await expect(note(ids, "Call notes", "replacement")).resolves.toMatchObject({
      title: "Call notes",
    });
  });

  it("never reads or writes another workspace's mission", async () => {
    const mine = await mission();
    const theirs = await mission();
    const saved = await note(theirs, "Their notes", "private");
    const crossed = { workspaceId: mine.workspaceId, missionId: theirs.missionId };
    expect(
      (await tx((q) => listEvidence(q, crossed.workspaceId, crossed.missionId))).items,
    ).toEqual([]);
    await expect(note(crossed, "Sneaky", "x")).rejects.toThrow(/Mission not found/);
    await expect(
      tx((q) => removeEvidence(q, { ...crossed, evidenceId: saved.id, actorId: "x" })),
    ).rejects.toThrow(/Mission not found/);
  });

  it("keeps a finished mission's evidence as its record", async () => {
    const ids = await mission();
    const saved = await note(ids, "Call notes", "one");
    await sql!`update wf_missions set status = 'completed' where id = ${ids.missionId}`;
    await expect(note(ids, "Late", "x")).rejects.toThrow(/finished/);
    await expect(
      tx((q) => removeEvidence(q, { ...ids, evidenceId: saved.id, actorId: "owner" })),
    ).rejects.toThrow(/finished/);
  });

  it("reports evidence as unavailable before its table exists", async () => {
    const ids = await mission();
    await sql!.unsafe(`alter table ${schema}.wf_mission_evidence rename to wf_mission_evidence_x`);
    try {
      expect(await tx((q) => listEvidence(q, ids.workspaceId, ids.missionId))).toEqual({
        available: false,
        items: [],
      });
    } finally {
      await sql!.unsafe(
        `alter table ${schema}.wf_mission_evidence_x rename to wf_mission_evidence`,
      );
    }
  });
});
