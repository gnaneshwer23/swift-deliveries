import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import type { Executor } from "@/lib/db/builder";
import { addTurn, deleteConversation, startConversation } from "./store.server";
import {
  listVoiceMetrics,
  purgeOldVoiceMetrics,
  recordCorrection,
  recordVoiceEvent,
  recordVoiceTurn,
  voiceMetricsAvailable,
} from "./voice-metrics.server";
import { summarise } from "./voice-metrics";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Voice metric tests require a disposable local deliverx_phase1_* database.");
}
const schema = `wf_voice_${process.pid}`;
const TABLES = ["wf_workspaces", "wf_conversations", "wf_conversation_turns", "wf_voice_metrics"];
const sql = url
  ? postgres(url, { prepare: false, types: POSTGRES_TYPES, connection: { search_path: schema } })
  : null;
const tx = <T>(work: (q: Executor) => Promise<T>) =>
  sql!.begin((t) =>
    work(async (text, params) => (await t.unsafe(text, params)) as never),
  ) as Promise<T>;

async function spokenLine(text = "find out whether thirty tutors would pay") {
  const owner = `o-${Math.random()}`;
  const [ws] = await sql!`insert into wf_workspaces (owner_id) values (${owner}) returning id`;
  const w = { workspaceId: ws!["id"] as string, userId: owner };
  const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
  const turn = await tx((q) =>
    addTurn(q, { ...w, conversationId: c.id, speaker: "founder", input: "speech", text }),
  );
  return { ...w, conversationId: c.id, turnId: turn.id };
}

describe.skipIf(!url)("voice measurements against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
    // `like` copies checks, not foreign keys; these two carry the behaviour under test.
    await sql!.unsafe(`alter table ${schema}.wf_conversation_turns
      add foreign key (conversation_id, workspace_id)
      references ${schema}.wf_conversations (id, workspace_id) on delete cascade`);
    await sql!.unsafe(`alter table ${schema}.wf_voice_metrics
      add foreign key (turn_id) references ${schema}.wf_conversation_turns (id) on delete set null`);
  });
  beforeEach(async () => {
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("finds the table", async () => {
    expect(await tx(voiceMetricsAvailable)).toBe(true);
  });

  it("records a spoken turn once, and a correction with how many words changed", async () => {
    const l = await spokenLine();
    const turn = { workspaceId: l.workspaceId, turnId: l.turnId, transcriptMs: 900, replyMs: 250 };
    expect(await tx((q) => recordVoiceTurn(q, turn))).toBe(true);
    expect(await tx((q) => recordVoiceTurn(q, turn))).toBe(false);
    await tx((q) =>
      recordCorrection(q, {
        workspaceId: l.workspaceId,
        turnId: l.turnId,
        correctedText: "find out whether 13 tutors would pay",
      }),
    );
    // Only the first correction of a line counts.
    await tx((q) =>
      recordCorrection(q, {
        workspaceId: l.workspaceId,
        turnId: l.turnId,
        correctedText: "something else entirely",
      }),
    );
    const rows = await tx((q) => listVoiceMetrics(q, l.workspaceId));
    expect(rows).toEqual([
      {
        kind: "turn",
        transcriptMs: 900,
        replyMs: 250,
        corrected: true,
        wordChange: expect.closeTo(1 / 7, 5),
      },
    ]);
  });

  it("measures only this workspace's spoken lines", async () => {
    const mine = await spokenLine();
    const theirs = await spokenLine();
    expect(
      await tx((q) =>
        recordVoiceTurn(q, {
          workspaceId: mine.workspaceId,
          turnId: theirs.turnId,
          transcriptMs: 1,
          replyMs: 1,
        }),
      ),
    ).toBe(false);
    const typed = await tx((q) =>
      addTurn(q, { ...mine, speaker: "founder", input: "typed", text: "typed line" }),
    );
    expect(
      await tx((q) =>
        recordVoiceTurn(q, {
          workspaceId: mine.workspaceId,
          turnId: typed.id,
          transcriptMs: 1,
          replyMs: 1,
        }),
      ),
    ).toBe(false);
  });

  it("keeps the numbers when the conversation is deleted, with no link to its text", async () => {
    const l = await spokenLine();
    await tx((q) =>
      recordVoiceTurn(q, {
        workspaceId: l.workspaceId,
        turnId: l.turnId,
        transcriptMs: 700,
        replyMs: 100,
      }),
    );
    await tx((q) => recordVoiceEvent(q, l.workspaceId, "interruption"));
    await tx((q) => deleteConversation(q, l.workspaceId, l.userId, l.conversationId));
    const [row] = await sql!`select turn_id from wf_voice_metrics where kind = 'turn'`;
    expect(row!["turn_id"]).toBeNull();
    expect(summarise(await tx((q) => listVoiceMetrics(q, l.workspaceId)))).toMatchObject({
      turns: 1,
      interruptions: 1,
    });
  });

  it("refuses timings on anything but a turn, and deletes rows past the keeping period", async () => {
    const l = await spokenLine();
    await expect(
      sql!`insert into wf_voice_metrics (workspace_id, kind, transcript_ms)
        values (${l.workspaceId}, 'drop', 5)`,
    ).rejects.toThrow(/check/);
    await tx((q) => recordVoiceEvent(q, l.workspaceId, "drop"));
    await sql!`update wf_voice_metrics set created_at = now() - interval '181 days'`;
    expect(await tx(purgeOldVoiceMetrics)).toBe(1);
  });
});
