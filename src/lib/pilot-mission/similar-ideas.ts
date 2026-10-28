/**
 * PT-5 — Similar-idea assist. Suggestion only — never merges records.
 */
export type SimilarIdeaCandidate = {
  missionId: string;
  question: string;
  score: number;
  basis: string[];
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "to",
  "for",
  "of",
  "in",
  "on",
  "with",
  "we",
  "i",
  "our",
  "should",
  "build",
  "want",
  "help",
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function findSimilarIdeas(
  draftQuestion: string,
  prior: Array<{ id: string; question: string }>,
  limit = 3,
): SimilarIdeaCandidate[] {
  const draft = tokens(draftQuestion);
  if (draft.size < 2) return [];

  const scored: SimilarIdeaCandidate[] = [];
  for (const row of prior) {
    const other = tokens(row.question);
    const score = jaccard(draft, other);
    if (score < 0.18) continue;
    const shared = [...draft].filter((t) => other.has(t)).slice(0, 6);
    const basis: string[] = [];
    if (shared.some((t) => /customer|parent|user|tutor|patient|commuter/.test(t))) {
      basis.push("Similar customer language");
    }
    if (shared.some((t) => /problem|pain|why|need|inform|update/.test(t))) {
      basis.push("Similar problem framing");
    }
    if (shared.some((t) => /platform|app|feature|product|cafe|breakfast/.test(t))) {
      basis.push("Overlapping product / feature terms");
    }
    if (!basis.length && shared.length) basis.push(`Shared terms: ${shared.join(", ")}`);
    scored.push({
      missionId: row.id,
      question: row.question,
      score,
      basis,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
