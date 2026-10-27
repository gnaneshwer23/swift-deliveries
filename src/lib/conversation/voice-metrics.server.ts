/**
 * Storage for voice measurements (migration 0031). Timings and counts only.
 * A turn's measurement is linked to its spoken line, so a later correction of
 * that line can be recorded against it; deleting the conversation clears the
 * link and keeps the numbers.
 */
import type { Executor } from "@/lib/db/builder";
import {
  summarise,
  wordChange,
  type VoiceMetric,
  type VoiceMetricKind,
  type VoiceSummary,
} from "./voice-metrics";

export const METRICS_KEPT_DAYS = 180;
export const SUMMARY_DAYS = 30;
/** Event rows (interruptions, drops, reconnects) a workspace may add per hour. */
export const EVENTS_PER_HOUR = 300;
/** Turns read for the timing percentiles: the newest this many in the window. */
export const SUMMARY_TURN_LIMIT = 5000;

export async function voiceMetricsAvailable(query: Executor): Promise<boolean> {
  const [probe] = await query(`select to_regclass('wf_voice_metrics') is not null as ok`, []);
  return Boolean(probe?.["ok"]);
}

/**
 * Records one spoken turn's timings, if the line is this workspace's spoken
 * line. A correction may have reached the server first and created the row;
 * the timings are then filled in once and never overwritten.
 */
export async function recordVoiceTurn(
  query: Executor,
  input: { workspaceId: string; turnId: string; transcriptMs: number; replyMs: number | null },
): Promise<boolean> {
  const rows = await query(
    `insert into wf_voice_metrics (workspace_id, kind, turn_id, transcript_ms, reply_ms)
     select $1::uuid, 'turn', t.id, $3, $4 from wf_conversation_turns t
      where t.id = $2::uuid and t.workspace_id = $1::uuid and t.input = 'speech'
     on conflict (turn_id) where turn_id is not null do update
       set transcript_ms = excluded.transcript_ms, reply_ms = excluded.reply_ms
       where wf_voice_metrics.transcript_ms is null
     returning id`,
    [input.workspaceId, input.turnId, input.transcriptMs, input.replyMs] as never,
  );
  return rows.length > 0;
}

/** Records one event, up to {@link EVENTS_PER_HOUR} per workspace per hour. */
export async function recordVoiceEvent(
  query: Executor,
  workspaceId: string,
  kind: Exclude<VoiceMetricKind, "turn">,
): Promise<boolean> {
  await query(`select pg_advisory_xact_lock(hashtext('voice-metrics:' || $1))`, [
    workspaceId,
  ] as never);
  const rows = await query(
    `insert into wf_voice_metrics (workspace_id, kind)
     select $1::uuid, $2
      where (select count(*) from wf_voice_metrics
              where workspace_id = $1::uuid and kind <> 'turn'
                and created_at > now() - interval '1 hour') < $3
     returning id`,
    [workspaceId, kind, EVENTS_PER_HOUR] as never,
  );
  return rows.length > 0;
}

/**
 * When the founder corrects a spoken line, records that it was corrected and
 * what share of its words changed. Only the first correction of a line counts.
 * The turn's timings are sent separately and may arrive later, so this
 * creates the turn's row when it isn't there yet.
 */
export async function recordCorrection(
  query: Executor,
  input: { workspaceId: string; turnId: string; correctedText: string },
): Promise<boolean> {
  const [heard] = await query(
    `select text from wf_conversation_turns
      where id = $1::uuid and workspace_id = $2::uuid and input = 'speech'`,
    [input.turnId, input.workspaceId] as never,
  );
  if (!heard) return false;
  const rows = await query(
    `insert into wf_voice_metrics (workspace_id, kind, turn_id, corrected, word_change)
     values ($2::uuid, 'turn', $1::uuid, true, $3)
     on conflict (turn_id) where turn_id is not null do update
       set corrected = true, word_change = excluded.word_change
       where not wf_voice_metrics.corrected
     returning id`,
    [
      input.turnId,
      input.workspaceId,
      wordChange(heard["text"] as string, input.correctedText),
    ] as never,
  );
  return rows.length > 0;
}

/** The newest spoken turns in the window, at most {@link SUMMARY_TURN_LIMIT}. */
export async function listVoiceTurns(
  query: Executor,
  workspaceId: string,
  days = SUMMARY_DAYS,
): Promise<VoiceMetric[]> {
  const rows = await query(
    `select kind, transcript_ms, reply_ms, corrected, word_change from wf_voice_metrics
      where workspace_id = $1::uuid and kind = 'turn'
        and created_at > now() - make_interval(days => $2)
      order by created_at desc limit $3`,
    [workspaceId, days, SUMMARY_TURN_LIMIT] as never,
  );
  return rows.map((r) => ({
    kind: r["kind"] as VoiceMetricKind,
    transcriptMs: r["transcript_ms"] == null ? null : Number(r["transcript_ms"]),
    replyMs: r["reply_ms"] == null ? null : Number(r["reply_ms"]),
    corrected: Boolean(r["corrected"]),
    wordChange: r["word_change"] == null ? null : Number(r["word_change"]),
  }));
}

/** The workspace's summary: timings from its newest turns, events counted in full. */
export async function voiceSummary(
  query: Executor,
  workspaceId: string,
  days = SUMMARY_DAYS,
): Promise<VoiceSummary> {
  const counts = await query(
    `select kind, count(*)::int as n from wf_voice_metrics
      where workspace_id = $1::uuid and kind <> 'turn'
        and created_at > now() - make_interval(days => $2)
      group by kind`,
    [workspaceId, days] as never,
  );
  const n = (k: VoiceMetricKind) => Number(counts.find((r) => r["kind"] === k)?.["n"] ?? 0);
  return {
    ...summarise(await listVoiceTurns(query, workspaceId, days)),
    interruptions: n("interruption"),
    drops: n("drop"),
    reconnects: n("reconnect"),
    reconnectsFailed: n("reconnect_failed"),
  };
}

export async function purgeOldVoiceMetrics(query: Executor): Promise<number> {
  if (!(await voiceMetricsAvailable(query))) return 0;
  const rows = await query(
    `delete from wf_voice_metrics where id in (
       select id from wf_voice_metrics
        where created_at < now() - make_interval(days => $1) limit 1000)
     returning id`,
    [METRICS_KEPT_DAYS] as never,
  );
  return rows.length;
}
