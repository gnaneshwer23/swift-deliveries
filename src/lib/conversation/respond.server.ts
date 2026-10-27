/**
 * One exchange: records what the founder said or typed, works out what it
 * meant against their own products and missions, and records the assistant's
 * reply with its card. Runs in the caller's transaction. Nothing here changes
 * a mission: every action on the card needs an on-screen click.
 */
import type { Executor } from "@/lib/db/builder";
import { mapMissionEvent } from "@/lib/workforce/access.server";
import type { MissionStatus } from "@/lib/workforce/types";
import {
  interpret,
  replyFor,
  type ConversationContext,
  type TurnInput,
  type UnderstoodCard,
} from "./interpret";
import { spokenStatus } from "./status";
import { addTurn } from "./store.server";
import type { ConversationTurn } from "./types";

const CONTEXT_MISSIONS = 50;
const STATUS_EVENTS = 200;

export async function loadContext(
  query: Executor,
  workspaceId: string,
  currentMissionId: string | null,
): Promise<ConversationContext> {
  const projects = await query(
    `select id, name from wf_projects where workspace_id = $1::uuid order by created_at`,
    [workspaceId] as never,
  );
  const missions = await query(
    `select id, title, status, project_id from wf_missions
      where workspace_id = $1::uuid order by created_at desc limit ${CONTEXT_MISSIONS}`,
    [workspaceId] as never,
  );
  return {
    projects: projects.map((p) => ({ id: p["id"] as string, name: p["name"] as string })),
    missions: missions.map((m) => ({
      id: m["id"] as string,
      title: m["title"] as string,
      status: m["status"] as MissionStatus,
      projectId: m["project_id"] as string,
    })),
    // Only a mission of this workspace can be "the one in view".
    currentMissionId: missions.some((m) => m["id"] === currentMissionId) ? currentMissionId : null,
  };
}

async function statusText(
  query: Executor,
  workspaceId: string,
  card: Extract<UnderstoodCard, { kind: "status" }>,
): Promise<string | null> {
  if (!("mission" in card.target)) return null;
  const { mission } = card.target;
  const events = await query(
    `select * from (
       select * from wf_mission_events where workspace_id = $1::uuid and mission_id = $2::uuid
        order by id desc limit ${STATUS_EVENTS}) e
      order by id`,
    [workspaceId, mission.id] as never,
  );
  const tasks = await query(
    `select id, title from wf_mission_tasks where mission_id = $1::uuid and workspace_id = $2::uuid`,
    [mission.id, workspaceId] as never,
  );
  return spokenStatus(
    mission,
    events.map(mapMissionEvent),
    new Map(tasks.map((t) => [t["id"] as string, t["title"] as string])),
  );
}

export async function respondToFounder(
  query: Executor,
  input: {
    workspaceId: string;
    userId: string;
    conversationId: string;
    text: string;
    input: TurnInput;
    currentMissionId?: string | null;
  },
): Promise<{ said: ConversationTurn; reply: ConversationTurn; card: UnderstoodCard }> {
  const said = await addTurn(query, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    conversationId: input.conversationId,
    speaker: "founder",
    input: input.input,
    text: input.text,
  });
  const ctx = await loadContext(query, input.workspaceId, input.currentMissionId ?? null);
  const card = interpret(said.text, input.input, ctx);
  const text =
    (card.kind === "status" ? await statusText(query, input.workspaceId, card) : null) ??
    replyFor(card);
  const reply = await addTurn(query, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    conversationId: input.conversationId,
    speaker: "assistant",
    input: "assistant",
    text,
    card,
  });
  return { said, reply, card };
}
