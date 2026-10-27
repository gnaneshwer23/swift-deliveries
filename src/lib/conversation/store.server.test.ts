import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { POSTGRES_TYPES } from "@/lib/db/postgres-types";
import type { Executor } from "@/lib/db/builder";
import { appendEvent } from "@/lib/workforce/plan-store.server";
import { respondToFounder } from "./respond.server";
import {
  addTurn,
  conversationsAvailable,
  deleteConversation,
  latestCardKind,
  latestConversation,
  MAX_TURNS,
  purgeExpiredConversations,
  readConversation,
  startConversation,
} from "./store.server";

const url = process.env["PSI_TEST_DATABASE_URL"];
if (url) {
  const target = new URL(url);
  if (
    !["127.0.0.1", "localhost"].includes(target.hostname) ||
    !target.pathname.startsWith("/deliverx_phase1_")
  )
    throw new Error("Conversation tests require a disposable local deliverx_phase1_* database.");
}
// A private schema per run: other database test files truncate the shared tables in parallel.
const schema = `wf_conversation_${process.pid}`;
const TABLES = [
  "wf_workspaces",
  "wf_projects",
  "wf_missions",
  "wf_mission_tasks",
  "wf_mission_events",
  "wf_conversations",
  "wf_conversation_turns",
];
const sql = url
  ? postgres(url, { prepare: false, types: POSTGRES_TYPES, connection: { search_path: schema } })
  : null;
const tx = <T>(work: (q: Executor) => Promise<T>) =>
  sql!.begin((t) =>
    work(async (text, params) => (await t.unsafe(text, params)) as never),
  ) as Promise<T>;

async function workspace(owner = `o-${Math.random()}`) {
  const [ws] = await sql!`insert into wf_workspaces (owner_id) values (${owner}) returning id`;
  const workspaceId = ws!["id"] as string;
  const [p] = await sql!`insert into wf_projects (workspace_id, name, created_by)
    values (${workspaceId}, 'Tutor Booking', ${owner}) returning id`;
  return { workspaceId, projectId: p!["id"] as string, userId: owner };
}

async function mission(
  w: { workspaceId: string; projectId: string },
  title: string,
  status = "running",
) {
  const [m] = await sql!`insert into wf_missions
      (workspace_id, project_id, intent, title, request_text, status, permission_ceiling, created_by)
    values (${w.workspaceId}, ${w.projectId}, 'investigate', ${title}, 'req', ${status},
            'execute_internally', 'o')
    returning id`;
  return m!["id"] as string;
}

describe.skipIf(!url)("conversations against a real database", () => {
  beforeAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade; create schema ${schema}`);
    for (const t of TABLES)
      await sql!.unsafe(`create table ${schema}.${t} (like public.${t} including all)`);
    // `like` copies checks but not foreign keys; deletion relies on this one cascading.
    await sql!.unsafe(`alter table ${schema}.wf_conversation_turns
      add foreign key (conversation_id, workspace_id)
      references ${schema}.wf_conversations (id, workspace_id) on delete cascade`);
  });
  beforeEach(async () => {
    await sql!.unsafe(`truncate ${TABLES.map((t) => `${schema}.${t}`).join(", ")}`);
  });
  afterAll(async () => {
    await sql!.unsafe(`drop schema if exists ${schema} cascade`);
    await sql!.end();
  });

  it("finds the tables", async () => {
    expect(await tx(conversationsAvailable)).toBe(true);
  });

  it("drafts nothing until a click: a spoken brief is stored with its card, and no mission is created", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    const out = await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "Investigate why parents drop off before booking a first lesson on Tutor Booking",
        input: "speech",
      }),
    );
    expect(out.card).toMatchObject({
      kind: "draft_mission",
      product: { match: "named", projectId: w.projectId },
    });
    const read = await tx((q) => readConversation(q, w.workspaceId, w.userId, c.id));
    expect(read!.turns.map((t) => [t.speaker, t.input])).toEqual([
      ["founder", "speech"],
      ["assistant", "assistant"],
    ]);
    expect(read!.turns[1]!.card).toMatchObject({ kind: "draft_mission" });
    const [{ n }] = (await sql!`select count(*)::int as n from wf_missions`) as unknown as [
      { n: number },
    ];
    expect(n).toBe(0);
  });

  it("keeps a correction as a new line and understands it afresh", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 7 }));
    await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "Find out whether thirty tutors would pay for booking",
        input: "speech",
      }),
    );
    const corrected = await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "Find out whether 13 tutors would pay for booking",
        input: "edited",
      }),
    );
    // Typed corrections are already in writing: only the assumed product needs confirming.
    expect(corrected.card).toMatchObject({
      kind: "draft_mission",
      confirm: ["Product: Tutor Booking"],
    });
    const read = await tx((q) => readConversation(q, w.workspaceId, w.userId, c.id));
    expect(read!.turns.filter((t) => t.speaker === "founder").map((t) => t.input)).toEqual([
      "speech",
      "edited",
    ]);
  });

  it("reports status from the event log of the mission in view, and never changes it", async () => {
    const w = await workspace();
    const m = await mission(w, "Tutor discovery");
    await tx((q) =>
      appendEvent(q, {
        workspaceId: w.workspaceId,
        missionId: m,
        type: "mission.created",
        actorKind: "user",
        actorId: w.userId,
      }),
    );
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    const out = await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "how is it going",
        input: "speech",
        currentMissionId: m,
      }),
    );
    expect(out.reply.text).toBe(
      "“Tutor discovery” is running. 0 steps finished so far. Latest in the event log: Mission created.",
    );
    const cancel = await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "cancel it",
        input: "speech",
        currentMissionId: m,
      }),
    );
    expect(cancel.card).toMatchObject({ kind: "cancel", target: { mission: { id: m } } });
    const [row] = await sql!`select status from wf_missions where id = ${m}`;
    expect(row!["status"]).toBe("running");
  });

  it("never treats another workspace's mission as the one in view", async () => {
    const mine = await workspace();
    const theirs = await workspace();
    const other = await mission(theirs, "Their mission");
    const c = await tx((q) => startConversation(q, { ...mine, retentionDays: 30 }));
    const out = await tx((q) =>
      respondToFounder(q, {
        ...mine,
        conversationId: c.id,
        text: "pause it",
        input: "speech",
        currentMissionId: other,
      }),
    );
    expect(out.card).toMatchObject({ kind: "pause", target: { match: "none", candidates: [] } });
  });

  it("keeps each conversation to its founder", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    expect(await tx((q) => readConversation(q, w.workspaceId, "someone-else", c.id))).toBeNull();
    await expect(
      tx((q) =>
        addTurn(q, {
          workspaceId: w.workspaceId,
          userId: "someone-else",
          conversationId: c.id,
          speaker: "founder",
          input: "typed",
          text: "hello",
        }),
      ),
    ).rejects.toThrow(/ended or been deleted/);
    expect(await tx((q) => deleteConversation(q, w.workspaceId, "someone-else", c.id))).toBe(false);
  });

  it("deletes a conversation and its transcript on request", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    await tx((q) =>
      respondToFounder(q, { ...w, conversationId: c.id, text: "status", input: "typed" }),
    );
    expect(await tx((q) => deleteConversation(q, w.workspaceId, w.userId, c.id))).toBe(true);
    const [{ n }] =
      (await sql!`select count(*)::int as n from wf_conversation_turns`) as unknown as [
        { n: number },
      ];
    expect(n).toBe(0);
    const [{ c: left }] = (await sql!`select count(*)::int as c from wf_conversations
      where id = ${c.id}`) as unknown as [{ c: number }];
    expect(left).toBe(0);
    expect(await tx((q) => readConversation(q, w.workspaceId, w.userId, c.id))).toBeNull();
  });

  it("stores a card only on the assistant's lines", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    await expect(
      sql!`insert into wf_conversation_turns (conversation_id, workspace_id, speaker, input, text, card)
        values (${c.id}, ${w.workspaceId}, 'founder', 'typed', 'hi', '{"kind":"stop_speech"}'::jsonb)`,
    ).rejects.toThrow(/card_check/);
    await expect(
      sql!`insert into wf_conversation_turns (conversation_id, workspace_id, speaker, input, text)
        values (${c.id}, ${w.workspaceId}, 'assistant', 'assistant', 'hi')`,
    ).rejects.toThrow(/card_check/);
  });

  it("names the kind of the latest card, only for this founder's live conversation", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    expect(await tx((q) => latestCardKind(q, w.workspaceId, w.userId, c.id))).toBeNull();
    await tx((q) =>
      respondToFounder(q, {
        ...w,
        conversationId: c.id,
        text: "Research how families choose a maths tutor",
        input: "typed",
      }),
    );
    expect(await tx((q) => latestCardKind(q, w.workspaceId, w.userId, c.id))).toBe("draft_mission");
    expect(await tx((q) => latestCardKind(q, w.workspaceId, "someone-else", c.id))).toBeNull();
    // A later line replaces the card that is current.
    await tx((q) =>
      respondToFounder(q, { ...w, conversationId: c.id, text: "stop", input: "typed" }),
    );
    expect(await tx((q) => latestCardKind(q, w.workspaceId, w.userId, c.id))).toBe("stop_speech");
  });

  it("says how many earlier lines are kept but not returned", async () => {
    const w = await workspace();
    const c = await tx((q) => startConversation(q, { ...w, retentionDays: 30 }));
    await sql!`insert into wf_conversation_turns (conversation_id, workspace_id, speaker, input, text)
      select ${c.id}, ${w.workspaceId}, 'founder', 'typed', 'line ' || g
        from generate_series(1, ${MAX_TURNS + 3}) g`;
    const read = await tx((q) => readConversation(q, w.workspaceId, w.userId, c.id));
    expect(read!.turns).toHaveLength(MAX_TURNS);
    expect(read!.earlierTurns).toBe(3);
    expect(read!.turns.at(-1)!.text).toBe(`line ${MAX_TURNS + 3}`);
  });

  it("deletes conversations past their retention date, counted from the last line", async () => {
    const w = await workspace();
    const old = await tx((q) => startConversation(q, { ...w, retentionDays: 1 }));
    const kept = await tx((q) => startConversation(q, { ...w, retentionDays: 1 }));
    await sql!`update wf_conversations set retain_until = now() - interval '1 minute'
      where id = ${old.id}`;
    expect(await tx((q) => readConversation(q, w.workspaceId, w.userId, old.id))).toBeNull();
    expect(await tx((q) => purgeExpiredConversations(q))).toBe(1);
    expect((await tx((q) => latestConversation(q, w.workspaceId, w.userId)))?.id).toBe(kept.id);
    // A new line pushes the date out again by the chosen period.
    await sql!`update wf_conversations set retain_until = now() + interval '1 minute'
      where id = ${kept.id}`;
    await tx((q) =>
      addTurn(q, { ...w, conversationId: kept.id, speaker: "founder", input: "typed", text: "hi" }),
    );
    const [row] = await sql!`select retain_until > now() + interval '23 hours' as ok
      from wf_conversations where id = ${kept.id}`;
    expect(row!["ok"]).toBe(true);
  });

  it("deletes expired conversations a batch at a time", async () => {
    const w = await workspace();
    for (let i = 0; i < 3; i++) {
      const c = await tx((q) => startConversation(q, { ...w, retentionDays: 1 }));
      await sql!`update wf_conversations set retain_until = now() - interval '1 minute'
        where id = ${c.id}`;
    }
    expect(await tx((q) => purgeExpiredConversations(q, 2))).toBe(2);
    expect(await tx((q) => purgeExpiredConversations(q, 2))).toBe(1);
    expect(await tx((q) => purgeExpiredConversations(q, 2))).toBe(0);
  });

  it("refuses a retention period outside the allowed choices", async () => {
    const w = await workspace();
    await expect(
      tx((q) => startConversation(q, { ...w, retentionDays: 365 as never })),
    ).rejects.toThrow();
  });
});
