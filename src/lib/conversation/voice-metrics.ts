/**
 * Voice measurements (Phase 4c), kept apart from the founder's conversations:
 * no text is stored, only timings and counts. Recognition is measured from the
 * founder's own corrections, so it says what was observed and labels what is
 * assumed (an uncorrected line is counted as recognised correctly).
 */

export const VOICE_METRIC_KINDS = [
  "turn",
  "interruption",
  "drop",
  "reconnect",
  "reconnect_failed",
] as const;
export type VoiceMetricKind = (typeof VOICE_METRIC_KINDS)[number];

/** What the browser reports: one spoken turn's timings, or one event. */
export type VoiceMeasurementInput =
  | { kind: "turn"; turnId: string; transcriptMs: number; replyMs: number | null }
  | { kind: Exclude<VoiceMetricKind, "turn"> };

export type VoiceMetric = {
  kind: VoiceMetricKind;
  /** Send → final transcript, for a turn. */
  transcriptMs: number | null;
  /** Final transcript → reply on screen, for a turn. */
  replyMs: number | null;
  /** The founder later corrected this spoken line. */
  corrected: boolean;
  /** Share of words changed by the correction (0–1), when corrected. */
  wordChange: number | null;
};

const words = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%£$€' ]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Word-level edit distance between what was heard and what the founder
 * corrected it to, as a share of the words heard (capped at 1).
 */
export function wordChange(heard: string, corrected: string): number {
  const a = words(heard);
  const b = words(corrected);
  if (!a.length) return b.length ? 1 : 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(
        prev[j]! + 1,
        row[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = row;
  }
  return Math.min(1, prev[b.length]! / a.length);
}

/** The nearest-rank percentile of a list of numbers, or null when there are none. */
export function percentile(values: readonly number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1]!;
}

export type VoiceSummary = {
  turns: number;
  transcriptMs: { median: number | null; p95: number | null };
  replyMs: { median: number | null; p95: number | null };
  /** Share of spoken lines the founder corrected. */
  correctedShare: number | null;
  /** Mean share of words changed, over corrected lines only. */
  wordChangeWhenCorrected: number | null;
  interruptions: number;
  drops: number;
  reconnects: number;
  reconnectsFailed: number;
};

export function summarise(rows: readonly VoiceMetric[]): VoiceSummary {
  const turns = rows.filter((r) => r.kind === "turn");
  const nums = (pick: (r: VoiceMetric) => number | null) =>
    turns.map(pick).filter((v): v is number => typeof v === "number" && v >= 0);
  const transcript = nums((r) => r.transcriptMs);
  const reply = nums((r) => r.replyMs);
  const corrected = turns.filter((r) => r.corrected);
  const changes = corrected.map((r) => r.wordChange).filter((v): v is number => v !== null);
  const count = (k: VoiceMetricKind) => rows.filter((r) => r.kind === k).length;
  return {
    turns: turns.length,
    transcriptMs: { median: percentile(transcript, 50), p95: percentile(transcript, 95) },
    replyMs: { median: percentile(reply, 50), p95: percentile(reply, 95) },
    correctedShare: turns.length ? corrected.length / turns.length : null,
    wordChangeWhenCorrected: changes.length
      ? changes.reduce((s, v) => s + v, 0) / changes.length
      : null,
    interruptions: count("interruption"),
    drops: count("drop"),
    reconnects: count("reconnect"),
    reconnectsFailed: count("reconnect_failed"),
  };
}
