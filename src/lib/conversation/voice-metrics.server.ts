/**
 * Storage for voice measurements (migration 0031). Timings and counts only.
 * A turn's measurement is linked to its spoken line, so a later correction of
 * that line can be recorded against it; deleting the conversation clears the
 * link and keeps the numbers.
 */
import type { Executor } from "@/lib/db/builder";
import { wordChange, type VoiceMetric, type VoiceMetricKind } from "./voice-metrics";

export const METRICS_KEPT_DAYS = 180;
export const SUMMARY_DAYS = 30;

export async function voiceMetricsAvailable(query: Executor): Promise<boolean> {
  const [probe] = await query(`select to_regclass('wf_voice_metrics') is not null as ok`, []);
  return Boolean(probe?.["ok"]);
}

/** Records one spoken turn's timings, if the line is this workspace's spoken line. */
export async function recordVoiceTurn(
  query: Executor,
  input: { workspaceId: string; turnId: string; transcriptMs: number; replyMs: number | null },
): Promise<boolean> {
  const rows = await query(
    `insert into wf_voice_metrics (workspace_id, kind, turn_id, transcript_ms, reply_ms)
     select $1::uuid, 'turn', t.id, $3, $4 from wf_conversation_turns t
      where t.id = $2::uuid and t.workspace_id = $1::uuid and t.input = 'speech'
     on conflict (turn_id) where turn_id is not null do nothing
     returning id`,
    [input.workspaceId, input.turnId, input.transcriptMs, input.replyMs] as never,
  );
  return rows.length > 0;
}

export async function recordVoiceEvent(
  query: Executor,
  workspaceId: string,
  kind: Exclude<VoiceMetricKind, "turn">,
): Promise<void> {
  await query(`insert into wf_voice_metrics (workspace_id, kind) values ($1::uuid, $2)`, [
    workspaceId,
    kind,
  ] as never);
}

/**
 * When the founder corrects a spoken line, records that it was corrected and
 * how many of its words changed. Only the first correction of a line counts.
 */
export async function recordCorrection(
  query: Executor,
  input: { workspaceId: string; turnId: string; correctedText: string },
): Promise<void> {
  const [heard] = await query(
    `select t.text from wf_conversation_turns t
       join wf_voice_metrics m on m.turn_id = t.id and m.workspace_id = t.workspace_id
      where t.id = $1::uuid and t.workspace_id = $2::uuid and t.input = 'speech'
        and not m.corrected`,
    [input.turnId, input.workspaceId] as never,
  );
  if (!heard) return;
  await query(
    `update wf_voice_metrics set corrected = true, word_change = $3
      where turn_id = $1::uuid and workspace_id = $2::uuid`,
    [
      input.turnId,
      input.workspaceId,
      wordChange(heard["text"] as string, input.correctedText),
    ] as never,
  );
}

export async function listVoiceMetrics(
  query: Executor,
  workspaceId: string,
  days = SUMMARY_DAYS,
): Promise<VoiceMetric[]> {
  const rows = await query(
    `select kind, transcript_ms, reply_ms, corrected, word_change from wf_voice_metrics
      where workspace_id = $1::uuid and created_at > now() - make_interval(days => $2)`,
    [workspaceId, days] as never,
  );
  return rows.map((r) => ({
    kind: r["kind"] as VoiceMetricKind,
    transcriptMs: r["transcript_ms"] == null ? null : Number(r["transcript_ms"]),
    replyMs: r["reply_ms"] == null ? null : Number(r["reply_ms"]),
    corrected: Boolean(r["corrected"]),
    wordChange: r["word_change"] == null ? null : Number(r["word_change"]),
  }));
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
