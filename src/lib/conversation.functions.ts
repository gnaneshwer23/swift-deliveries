import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { ensureWorkspace } from "@/lib/workforce/access.server";
import type { UnderstoodCard } from "@/lib/conversation/interpret";
import {
  DEFAULT_RETENTION_DAYS,
  RETENTION_DAYS,
  type Conversation,
  type ConversationTurn,
  type RetentionDays,
} from "@/lib/conversation/types";

export type ConversationState = {
  /** False until migration 0030 is applied; the panel then says conversations are not available. */
  available: boolean;
  conversation: Conversation | null;
  turns: ConversationTurn[];
  /** Older lines kept but not returned, so the panel can say they exist. */
  earlierTurns: number;
};

const retentionSchema = z
  .number()
  .int()
  .refine((d): d is RetentionDays => (RETENTION_DAYS as readonly number[]).includes(d), {
    message: "Choose 1, 7, 30 or 90 days.",
  });

async function store() {
  const { neonTransaction } = await import("@/lib/db/neon.server");
  const s = await import("@/lib/conversation/store.server");
  return { neonTransaction, ...s };
}

/** The founder's current conversation, after deleting every expired one. */
export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ConversationState> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const s = await store();
    return s.neonTransaction(async (_tx, query) => {
      if (!(await s.conversationsAvailable(query)))
        return { available: false, conversation: null, turns: [], earlierTurns: 0 };
      await s.purgeExpiredConversations(query);
      const latest = await s.latestConversation(query, workspace.id, userId);
      if (!latest) return { available: true, conversation: null, turns: [], earlierTurns: 0 };
      const read = await s.readConversation(query, workspace.id, userId, latest.id);
      return {
        available: true,
        conversation: read?.conversation ?? null,
        turns: read?.turns ?? [],
        earlierTurns: read?.earlierTurns ?? 0,
      };
    });
  });

export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ retentionDays: retentionSchema.default(DEFAULT_RETENTION_DAYS) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<ConversationState> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const s = await store();
    return s.neonTransaction(async (_tx, query) => {
      if (!(await s.conversationsAvailable(query)))
        throw new Error("Conversations need a database update that has not been applied yet.");
      const conversation = await s.startConversation(query, {
        workspaceId: workspace.id,
        userId,
        retentionDays: data.retentionDays as RetentionDays,
      });
      return { available: true, conversation, turns: [], earlierTurns: 0 };
    });
  });

/**
 * Records what the founder typed or said and replies with what was understood.
 * The reply's card offers actions; none of them runs from here.
 */
export const sayToAssistant = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        text: z.string().trim().min(1).max(4000),
        input: z.enum(["typed", "speech", "edited"]),
        currentMissionId: z.string().uuid().nullish(),
      })
      .parse(data),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{ said: ConversationTurn; reply: ConversationTurn; card: UnderstoodCard }> => {
      const { supabase, userId } = context;
      const { workspace } = await ensureWorkspace(supabase, userId);
      const s = await store();
      const { respondToFounder } = await import("@/lib/conversation/respond.server");
      return s.neonTransaction(async (_tx, query) => {
        if (!(await s.conversationsAvailable(query)))
          throw new Error("Conversations need a database update that has not been applied yet.");
        return respondToFounder(query, {
          workspaceId: workspace.id,
          userId,
          conversationId: data.conversationId,
          text: data.text,
          input: data.input,
          currentMissionId: data.currentMissionId ?? null,
        });
      });
    },
  );

/** Deletes a conversation and every line of it now. */
export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ deleted: boolean }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const s = await store();
    const deleted = await s.neonTransaction(async (_tx, query) =>
      (await s.conversationsAvailable(query))
        ? s.deleteConversation(query, workspace.id, userId, data.conversationId)
        : false,
    );
    return { deleted };
  });

export type VoiceAvailability = {
  enabled: boolean;
  /** Why voice is switched on but cannot run, if it is. Never a secret. */
  problem: string | null;
  /** Seconds a minted session token stays valid for starting a session. */
  secretSeconds: number;
};

/** Whether voice can be offered. Typing always works whatever this says. */
export const getVoiceAvailability = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<VoiceAvailability> => {
    const { voiceConfig, VOICE_SECRET_SECONDS } = await import("@/lib/conversation/voice.server");
    const config = voiceConfig();
    return {
      enabled: config.enabled,
      problem: config.enabled ? null : config.problem,
      secretSeconds: VOICE_SECRET_SECONDS,
    };
  });

/** Session tokens a workspace may mint in the window below. */
export const VOICE_SESSIONS_PER_WINDOW = 20;
const VOICE_WINDOW_MINUTES = 10;

/**
 * Mints a short-lived token for one transcription-only voice session. The
 * browser connects with it directly; the API key never leaves the server.
 * Each mint is audited and the rate is capped per workspace.
 */
export const startVoiceSession = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<{ value: string; expiresAt: number }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const { voiceConfig, mintVoiceSecret } = await import("@/lib/conversation/voice.server");
    const config = voiceConfig();
    if (!config.enabled) throw new Error(config.problem ?? "Voice is not switched on here.");
    const { neonTransaction } = await import("@/lib/db/neon.server");
    // Admission is reserved under a per-workspace lock before anything is minted, so
    // simultaneous requests cannot all pass the count. A reservation counts even if
    // the provider then refuses: the cap fails closed.
    const admitted = await neonTransaction(async (_tx, query) => {
      await query(`select pg_advisory_xact_lock(hashtext('voice:' || $1))`, [
        workspace.id,
      ] as never);
      const [row] = await query(
        `select count(*)::int as n from wf_audit_events
          where workspace_id = $1::uuid and event_type = 'voice.session_requested'
            and created_at > now() - make_interval(mins => $2)`,
        [workspace.id, VOICE_WINDOW_MINUTES] as never,
      );
      if (Number(row?.["n"] ?? 0) >= VOICE_SESSIONS_PER_WINDOW) return false;
      await query(
        `insert into wf_audit_events (workspace_id, actor_id, event_type, entity_type, metadata)
         values ($1::uuid, $2, 'voice.session_requested', 'voice_session', $3::jsonb)`,
        [
          workspace.id,
          userId,
          JSON.stringify({ model: config.model, mode: "transcription" }),
        ] as never,
      );
      return true;
    });
    if (!admitted)
      throw new Error("Too many voice sessions just now. Wait a few minutes, or type instead.");
    const secret = await mintVoiceSecret(config, userId);
    return secret;
  });
