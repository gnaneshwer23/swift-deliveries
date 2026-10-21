// Pure helpers for evidence-grounded interview practice, shared by server functions and tests.
// Everything here is practice-level: nothing in interview practice writes evidence,
// capability judgements, score runs or Verified state.

export const CLAIM_STATUSES = ["supported", "partial", "not_in_record", "contradicted"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_TYPES = ["metric", "action", "outcome", "role"] as const;
export type ClaimType = (typeof CLAIM_TYPES)[number];

export const QUESTION_TYPES = ["defend", "trade-off", "stakeholder", "metric"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Follow-up drill-down stops at this depth (the root question is depth 0). */
export const MAX_FOLLOWUP_DEPTH = 3;

/** A dimension scoring below this threshold (of 5) triggers a follow-up question. */
export const FOLLOWUP_THRESHOLD = 3;

/** What the user sees for each record-check status. Never the word "fabricated". */
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  supported: "Supported",
  partial: "Partial",
  not_in_record: "Not in record",
  contradicted: "Contradicted",
};

export const CLAIM_STATUS_HINTS: Record<ClaimStatus, string> = {
  supported: "Your record says the same thing.",
  partial: "Your record doesn't show this figure or scope.",
  not_in_record: "Is this from work outside DeliverX? Label it so.",
  contradicted: "Your record says otherwise — check the excerpt side by side.",
};

/** Offer a follow-up only when a dimension scored weak and the depth cap allows it. */
export function shouldOfferFollowUp(
  scores: number[],
  currentDepth: number,
  threshold = FOLLOWUP_THRESHOLD,
): boolean {
  if (currentDepth >= MAX_FOLLOWUP_DEPTH) return false;
  return scores.some((s) => s < threshold);
}

/** SHA-256 checksum of an answer body, computed at submit time. Answers never change after. */
export async function answerChecksum(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Normalise an AI-returned claim status into a valid ClaimStatus, defaulting to not_in_record. */
export function normaliseClaimStatus(value: unknown): ClaimStatus {
  return CLAIM_STATUSES.includes(value as ClaimStatus) ? (value as ClaimStatus) : "not_in_record";
}

export function normaliseClaimType(value: unknown): ClaimType {
  return CLAIM_TYPES.includes(value as ClaimType) ? (value as ClaimType) : "action";
}

export function normaliseQuestionType(value: unknown): QuestionType {
  return QUESTION_TYPES.includes(value as QuestionType) ? (value as QuestionType) : "defend";
}

// ---- Practice history ----

export interface PracticeFeedbackEntry {
  dimension: string;
  score: number;
}

export interface PracticeHistorySession {
  id: string;
  roleTarget: string;
  closedAt: string | null;
  feedback: PracticeFeedbackEntry[];
}

export interface DimensionHistory {
  dimension: string;
  /** Average score across closed sessions that scored this dimension. */
  average: number;
  /** How many closed sessions scored this dimension. */
  sessions: number;
  /** Score in the most recent closed session, if any. */
  latest: number | null;
  /** "improving" when the latest score beats the average, "declining" when below, else "steady". */
  trend: "improving" | "steady" | "declining";
}

/** A dimension counts as a recurring strength at or above this average (of 5). */
export const STRENGTH_AVERAGE = 4;
/** A dimension must appear in at least this many closed sessions to be "recurring". */
export const STRENGTH_MIN_SESSIONS = 2;

/**
 * Aggregate rubric scores across closed practice sessions, oldest first.
 * Sessions without feedback are ignored. Practice-level only: this never
 * feeds evidence, capability judgements or Verified state.
 */
export function summarisePracticeHistory(sessions: PracticeHistorySession[]): DimensionHistory[] {
  const closed = sessions
    .filter((s) => s.feedback.length > 0)
    .slice()
    .sort((a, b) => (a.closedAt ?? "").localeCompare(b.closedAt ?? ""));
  const byDimension = new Map<string, number[]>();
  for (const session of closed) {
    for (const f of session.feedback) {
      const list = byDimension.get(f.dimension) ?? [];
      list.push(f.score);
      byDimension.set(f.dimension, list);
    }
  }
  return [...byDimension.entries()]
    .map(([dimension, scores]) => {
      const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const latest = scores[scores.length - 1] ?? null;
      const trend: DimensionHistory["trend"] =
        latest === null || latest === average ? "steady" : latest > average ? "improving" : "declining";
      return { dimension, average, sessions: scores.length, latest, trend };
    })
    .sort((a, b) => b.average - a.average);
}

/** Dimensions that score strongly again and again — the user's reliable interview ground. */
export function recurringStrengths(history: DimensionHistory[]): DimensionHistory[] {
  return history.filter((d) => d.average >= STRENGTH_AVERAGE && d.sessions >= STRENGTH_MIN_SESSIONS);
}
