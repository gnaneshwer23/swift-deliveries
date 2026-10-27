/**
 * Storage for conversations (migration 0030). Text only: there is nowhere to
 * put audio. Every read and write is scoped to the workspace and to the
 * founder who started the conversation, and expired conversations are deleted
 * before anything is read.
 */
import type { Executor } from "@/lib/db/builder";
import type { TurnInput, UnderstoodCard } from "./interpret";
import type { Conversation, ConversationTurn, RetentionDays } from "./types";

export const MAX_TURN_CHARS = 4000;
/** Lines returned for display; older ones are kept until the conversation expires. */
export const MAX_TURNS = 200;

/** True once 0030 is applied. Checked rather than caught, so a caller's transaction survives. */
export async function conversationsAvailable(query: Executor): Promise<boolean> {
  const [probe] = await query(`select to_regclass('wf_conversation_turns') is not null as ok`, []);
  return Boolean(probe?.["ok"]);
}

const iso = (v: unknown) => new Date(v as string).toISOString();

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row["id"] as string,
    retentionDays: Number(row["retention_days"]) as RetentionDays,
    createdAt: iso(row["created_at"]),
    lastTurnAt: iso(row["last_turn_at"]),
    retainUntil: iso(row["retain_until"]),
  };
}

function mapTurn(row: Record<string, unknown>): ConversationTurn {
  const base = {
    id: row["id"] as string,
    text: row["text"] as string,
    createdAt: iso(row["created_at"]),
  };
  return row["speaker"] === "assistant"
    ? { ...base, speaker: "assistant", input: "assistant", card: row["card"] as UnderstoodCard }
    : { ...base, speaker: "founder", input: row["input"] as TurnInput, card: null };
}

const PURGE_BATCH = 500;

/**
 * Deletes conversations past their retention date, with their lines, up to
 * `limit` at a time so one call stays short however large the backlog is.
 * Returns how many were deleted.
 */
export async function purgeExpiredConversations(
  query: Executor,
  limit = PURGE_BATCH,
): Promise<number> {
  if (!(await conversationsAvailable(query))) return 0;
  const rows = await query(
    `delete from wf_conversations where id in (
       select id from wf_conversations where retain_until <= now()
        order by retain_until limit $1
        for update skip locked)
     returning id`,
    [limit] as never,
  );
  return rows.length;
}

export async function startConversation(
  query: Executor,
  input: { workspaceId: string; userId: string; retentionDays: RetentionDays },
): Promise<Conversation> {
  const rows = await query(
    `insert into wf_conversations (workspace_id, user_id, retention_days, retain_until)
     values ($1::uuid, $2, $3, now() + make_interval(days => $3))
     returning *`,
    [input.workspaceId, input.userId, input.retentionDays] as never,
  );
  return mapConversation(rows[0]!);
}

/** The founder's most recent conversation that has not expired, if any. */
export async function latestConversation(
  query: Executor,
  workspaceId: string,
  userId: string,
): Promise<Conversation | null> {
  const rows = await query(
    `select * from wf_conversations
      where workspace_id = $1::uuid and user_id = $2 and retain_until > now()
      order by last_turn_at desc limit 1`,
    [workspaceId, userId] as never,
  );
  return rows[0] ? mapConversation(rows[0]) : null;
}

/** A conversation and its lines, oldest first; null if it is not this founder's or has expired. */
export async function readConversation(
  query: Executor,
  workspaceId: string,
  userId: string,
  conversationId: string,
): Promise<{ conversation: Conversation; turns: ConversationTurn[]; earlierTurns: number } | null> {
  const found = await query(
    `select * from wf_conversations
      where id = $1::uuid and workspace_id = $2::uuid and user_id = $3 and retain_until > now()`,
    [conversationId, workspaceId, userId] as never,
  );
  if (!found[0]) return null;
  const turns = await query(
    `select * from (
       select * from wf_conversation_turns
        where conversation_id = $1::uuid and workspace_id = $2::uuid
        order by seq desc limit ${MAX_TURNS}) t
      order by seq`,
    [conversationId, workspaceId] as never,
  );
  // Lines beyond the window are kept, and the founder is told how many are not shown.
  const [total] = await query(
    `select count(*)::int as n from wf_conversation_turns
      where conversation_id = $1::uuid and workspace_id = $2::uuid`,
    [conversationId, workspaceId] as never,
  );
  return {
    conversation: mapConversation(found[0]),
    turns: turns.map(mapTurn),
    earlierTurns: Math.max(0, Number(total?.["n"] ?? 0) - turns.length),
  };
}

/**
 * Adds a line and pushes the retention date out from it. Refuses a conversation
 * that is not this founder's or has expired.
 */
export async function addTurn(
  query: Executor,
  input: { workspaceId: string; userId: string; conversationId: string; text: string } & (
    | { speaker: "founder"; input: TurnInput }
    | { speaker: "assistant"; input: "assistant"; card: UnderstoodCard }
  ),
): Promise<ConversationTurn> {
  const text = input.text.trim().slice(0, MAX_TURN_CHARS);
  if (!text) throw new Error("Nothing to add.");
  const touched = await query(
    `update wf_conversations
        set last_turn_at = now(), retain_until = now() + make_interval(days => retention_days)
      where id = $1::uuid and workspace_id = $2::uuid and user_id = $3 and retain_until > now()
      returning id`,
    [input.conversationId, input.workspaceId, input.userId] as never,
  );
  if (!touched[0]) throw new Error("This conversation has ended or been deleted. Start a new one.");
  const rows = await query(
    `insert into wf_conversation_turns (conversation_id, workspace_id, speaker, input, text, card)
     values ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb)
     returning *`,
    [
      input.conversationId,
      input.workspaceId,
      input.speaker,
      input.input,
      text,
      input.speaker === "assistant" ? JSON.stringify(input.card) : null,
    ] as never,
  );
  return mapTurn(rows[0]!);
}

/** Deletes a conversation and all its lines now. Returns false if there was nothing to delete. */
export async function deleteConversation(
  query: Executor,
  workspaceId: string,
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const rows = await query(
    `delete from wf_conversations
      where id = $1::uuid and workspace_id = $2::uuid and user_id = $3
      returning id`,
    [conversationId, workspaceId, userId] as never,
  );
  return rows.length > 0;
}

/**
 * The kind of card on the latest assistant line of this founder's live
 * conversation, or null. Lets an action confirm it came from the current card.
 */
export async function latestCardKind(
  query: Executor,
  workspaceId: string,
  userId: string,
  conversationId: string,
): Promise<UnderstoodCard["kind"] | null> {
  if (!(await conversationsAvailable(query))) return null;
  const rows = await query(
    `select t.card ->> 'kind' as kind
       from wf_conversation_turns t
       join wf_conversations c on c.id = t.conversation_id and c.workspace_id = t.workspace_id
      where c.id = $1::uuid and c.workspace_id = $2::uuid and c.user_id = $3
        and c.retain_until > now() and t.speaker = 'assistant'
      order by t.seq desc limit 1`,
    [conversationId, workspaceId, userId] as never,
  );
  return (rows[0]?.["kind"] as UnderstoodCard["kind"] | undefined) ?? null;
}
