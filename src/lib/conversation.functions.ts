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
        /** For a correction: the line it corrects, so a corrected spoken line is measured. */
        correctsTurnId: z.string().uuid().nullish(),
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
      const reply = await s.neonTransaction(async (_tx, query) => {
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
      // Best effort, after the conversation has committed: a failure here never loses the line.
      if (data.input === "edited" && data.correctsTurnId) {
        const correctsTurnId = data.correctsTurnId;
        await s
          .neonTransaction(async (_tx, query) => {
            const m = await import("@/lib/conversation/voice-metrics.server");
            if (await m.voiceMetricsAvailable(query))
              await m.recordCorrection(query, {
                workspaceId: workspace.id,
                turnId: correctsTurnId,
                correctedText: data.text,
              });
          })
          .catch((error: unknown) => console.error("Voice correction measurement failed", error));
      }
      return reply;
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

export type TtsAvailability = {
  enabled: boolean;
  problem: string | null;
  voiceId: string;
};

/** Whether ElevenLabs listen is configured (browser speech always remains a fallback). */
export const getTtsAvailability = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<TtsAvailability> => {
    const { ttsConfig } = await import("@/lib/conversation/tts.server");
    const config = ttsConfig();
    return {
      enabled: config.enabled,
      problem: config.enabled ? null : config.problem,
      voiceId: config.voiceId,
    };
  });

export type SynthesizeSpeechResult =
  | { ok: true; contentType: string; base64: string; voiceId: string; provider: "elevenlabs" }
  | { ok: false; problem: string; voiceId: string };

/** Synthesize the same on-screen text for Listen. Never approves or mutates a mission. */
export const synthesizeSpeechFn = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ text: z.string().min(1).max(4000) }).parse(data),
  )
  .handler(async ({ data }): Promise<SynthesizeSpeechResult> => {
    const { ttsConfig, synthesizeSpeech } = await import("@/lib/conversation/tts.server");
    const config = ttsConfig();
    if (!config.enabled) {
      return {
        ok: false,
        problem: config.problem ?? "Listen provider is not configured.",
        voiceId: config.voiceId,
      };
    }
    const audio = await synthesizeSpeech(data.text, config);
    return {
      ok: true,
      contentType: audio.contentType,
      base64: audio.base64,
      voiceId: audio.voiceId,
      provider: audio.provider,
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

/**
 * Records one voice measurement: a spoken turn's timings, or an interruption,
 * drop or reconnect. Timings and counts only. Silently does nothing before 0031.
 */
export const recordVoiceMeasurement = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .discriminatedUnion("kind", [
        z.object({
          kind: z.literal("turn"),
          turnId: z.string().uuid(),
          transcriptMs: z.number().int().min(0).max(600_000),
          replyMs: z.number().int().min(0).max(600_000).nullable(),
        }),
        z.object({ kind: z.enum(["interruption", "drop", "reconnect", "reconnect_failed"]) }),
      ])
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ recorded: boolean }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const m = await import("@/lib/conversation/voice-metrics.server");
    const recorded = await neonTransaction(async (_tx, query) => {
      if (!(await m.voiceMetricsAvailable(query))) return false;
      if (data.kind === "turn")
        return m.recordVoiceTurn(query, {
          workspaceId: workspace.id,
          turnId: data.turnId,
          transcriptMs: data.transcriptMs,
          replyMs: data.replyMs,
        });
      return m.recordVoiceEvent(query, workspace.id, data.kind);
    });
    return { recorded };
  });

export type VoiceMeasurements = {
  available: boolean;
  days: number;
  summary: import("@/lib/conversation/voice-metrics").VoiceSummary | null;
};

/** The workspace's voice measurements over the last 30 days. */
export const getVoiceMeasurements = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<VoiceMeasurements> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const m = await import("@/lib/conversation/voice-metrics.server");
    return neonTransaction(async (_tx, query) => {
      if (!(await m.voiceMetricsAvailable(query)))
        return { available: false, days: m.SUMMARY_DAYS, summary: null };
      return {
        available: true,
        days: m.SUMMARY_DAYS,
        summary: await m.voiceSummary(query, workspace.id),
      };
    });
  });
