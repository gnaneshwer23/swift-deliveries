/**
 * Research with citations (pure logic; network calls live in research-provider.server.ts).
 *
 * - Every retrieved source gets a stable id (S1, S2…) and a transparent
 *   quality score from its domain class and recency — a heuristic, stated as one.
 * - Factual claims (numbers, percentages, money) must cite a known [S#] or be
 *   labelled as an assumption / inference / estimate. Unsourced claims fail.
 * - Decision "strength of evidence" is derived from the sources an option cites.
 */
import type { BusinessCase, JsonRecord, ProgrammeRecord } from "./types";

export type SourceQuality = "high" | "medium" | "low";

export type Source = {
  id: string;
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  snippet: string;
  query: string;
  itemKey: string;
  provider: string;
  score: number;
  quality: SourceQuality;
  qualityReasons: string[];
};

export type RawResult = {
  url: string;
  title: string;
  snippet: string;
  publishedAt: string | null;
};

const HIGH_DOMAINS = [
  /\.gov(\.[a-z]{2})?$/,
  /\.gov\.uk$/,
  /(^|\.)europa\.eu$/,
  /\.edu$/,
  /\.ac\.uk$/,
  /(^|\.)(ons|oecd|worldbank|imf|who|un)\.org$/,
  /(^|\.)ons\.gov\.uk$/,
  /(^|\.)(nature|science|arxiv|acm|ieee)\.(com|org)$/,
  /(^|\.)(reuters|ft|bloomberg|economist|bbc)\.(com|co\.uk)$/,
  /(^|\.)github\.com$/,
];
const LOW_DOMAINS = [
  /(^|\.)(quora|pinterest|answers|ehow|wikihow)\.com$/,
  /(^|\.)reddit\.com$/,
  /(^|\.)(medium|substack)\.com$/,
];

export function publisherOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

export function assessSource(
  raw: RawResult,
  now: Date,
): { score: number; quality: SourceQuality; reasons: string[] } {
  const host = publisherOf(raw.url);
  const reasons: string[] = [];
  let score = 0.55;
  if (HIGH_DOMAINS.some((r) => r.test(host))) {
    score = 0.8;
    reasons.push("authoritative domain class (government, academic, research or major press)");
  } else if (LOW_DOMAINS.some((r) => r.test(host))) {
    score = 0.3;
    reasons.push("user-generated or unreviewed platform");
  } else {
    reasons.push("general web source");
  }
  if (raw.publishedAt) {
    const ageDays = (now.getTime() - new Date(raw.publishedAt).getTime()) / 86_400_000;
    if (Number.isFinite(ageDays) && ageDays <= 730) {
      score += 0.1;
      reasons.push("published within two years");
    } else if (Number.isFinite(ageDays) && ageDays > 1825) {
      score -= 0.15;
      reasons.push("older than five years");
    }
  } else {
    score -= 0.05;
    reasons.push("no publication date");
  }
  if (raw.snippet.trim().length < 60) {
    score -= 0.05;
    reasons.push("little retrievable text");
  }
  score = Math.min(0.95, Math.max(0.05, Number(score.toFixed(2))));
  return { score, quality: score >= 0.7 ? "high" : score >= 0.45 ? "medium" : "low", reasons };
}

/** Deterministic research questions per deliverable, derived from the business case. */
export function researchQueries(itemKey: string, bc: BusinessCase, year: number): string[] {
  const topic = bc.idea.split(/[.!?]/)[0]!.split(/\s+/).slice(0, 9).join(" ");
  const users = bc.targetUsers.split(/,|;/)[0]!.trim();
  const problem = bc.problem.split(/[.!?]/)[0]!.slice(0, 90);
  switch (itemKey) {
    case "business_case":
      return [`${problem} ${users} statistics`, `${topic} market size`];
    case "market_research":
      return [
        `${topic} competitors`,
        `${users} ${problem}`,
        `${topic} pricing`,
        `${topic} market growth ${year}`,
      ];
    case "tech_radar":
      return [`${topic} technology trends ${year}`, `open source tools for ${topic}`];
    case "business_model":
      return [`${topic} pricing plans`, `${users} willingness to pay software`];
    default:
      return [];
  }
}

export function buildSources(
  results: Array<RawResult & { query: string }>,
  ctx: { itemKey: string; provider: string; existing: Source[]; now: Date; limit?: number },
): Source[] {
  const seen = new Set(ctx.existing.map((s) => s.url));
  let next = ctx.existing.length + 1;
  const out: Source[] = [];
  for (const r of results) {
    if (!r.url || seen.has(r.url) || !/^https?:\/\//.test(r.url)) continue;
    seen.add(r.url);
    const a = assessSource(r, ctx.now);
    out.push({
      id: `S${next++}`,
      url: r.url,
      title: (r.title || publisherOf(r.url)).slice(0, 200),
      publisher: publisherOf(r.url),
      publishedAt: r.publishedAt,
      retrievedAt: ctx.now.toISOString(),
      snippet: r.snippet.replace(/\s+/g, " ").trim().slice(0, 500),
      query: r.query,
      itemKey: ctx.itemKey,
      provider: ctx.provider,
      score: a.score,
      quality: a.quality,
      qualityReasons: a.reasons,
    });
    if (out.length >= (ctx.limit ?? 12)) break;
  }
  return out;
}

export function sourceRegister(records: ProgrammeRecord[]): Source[] {
  return records
    .filter((r) => r.kind === "event" && r.data["type"] === "sources")
    .flatMap((r) => (r.data["sources"] as unknown as Source[]) ?? []);
}

export function sourcesRecord(
  itemKey: string,
  title: string,
  sources: Source[],
  now: string,
): ProgrammeRecord {
  return {
    kind: "event",
    itemKey,
    title: `Research: ${sources.length} source(s) for ${title}`,
    body: sources.map((s) => `[${s.id}] ${s.title} — ${s.publisher} (${s.quality})`).join("\n"),
    format: "markdown",
    actor: "DX-012",
    data: { type: "sources", sources: sources as unknown as JsonRecord[] } as JsonRecord,
    createdAt: now,
  };
}

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------

const CLAIM = /\d|%|£|\$|€/;
const LABELLED = /\b(assumption|inference|estimate|hypothes[ie]s|target|placeholder)\b/i;

export type CitationCheck = {
  ok: boolean;
  claims: number;
  cited: number;
  labelled: number;
  coverage: number;
  unknownIds: string[];
  unsupported: string[];
};

/**
 * Checks factual claims (lines with numbers or money) for [S#] citations to
 * known sources. Headings, table separators and the source list itself are ignored.
 */
export function checkCitations(
  markdown: string,
  known: Set<string>,
  minCoverage = 0.9,
): CitationCheck {
  let claims = 0;
  let cited = 0;
  let labelled = 0;
  const unknown = new Set<string>();
  const unsupported: string[] = [];
  let inSources = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^##\s+(sources|evidence excerpts)\b/i.test(line)) {
      inSources = true;
      continue;
    }
    if (/^##\s/.test(line)) inSources = false;
    if (
      inSources ||
      !line ||
      line.startsWith("#") ||
      /^\|?\s*-{3}/.test(line) ||
      line.startsWith(">")
    )
      continue;
    const ids = [...line.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]!);
    ids.filter((id) => !known.has(id)).forEach((id) => unknown.add(id));
    const stripped = line.replace(/\[S\d+\]/g, "").replace(/\b(R|AC|H|D|M|S)\d+\b/g, "");
    if (!CLAIM.test(stripped)) continue;
    claims++;
    if (ids.some((id) => known.has(id))) cited++;
    else if (LABELLED.test(line)) labelled++;
    else unsupported.push(line.slice(0, 160));
  }
  const coverage = claims ? (cited + labelled) / claims : 1;
  return {
    ok: coverage >= minCoverage && unknown.size === 0,
    claims,
    cited,
    labelled,
    coverage: Number(coverage.toFixed(2)),
    unknownIds: [...unknown],
    unsupported,
  };
}

export function citationProblem(c: CitationCheck): string | null {
  if (c.ok) return null;
  const parts: string[] = [];
  if (c.unknownIds.length) parts.push(`cites unknown sources ${c.unknownIds.join(", ")}`);
  if (c.coverage < 0.9) {
    parts.push(
      `${c.unsupported.length} numeric claim(s) neither cite a [S#] source nor are labelled assumption/estimate (e.g. "${c.unsupported[0] ?? ""}")`,
    );
  }
  return parts.join("; ");
}

/** Evidence strength for an option from the quality of the sources it cites. */
export function evidenceFromSources(ids: string[], register: Source[]): number {
  const byId = new Map(register.map((s) => [s.id, s]));
  const scores = [...new Set(ids)]
    .map((id) => byId.get(id)?.score)
    .filter((x): x is number => typeof x === "number");
  if (!scores.length) return 0.2;
  return Number(Math.min(0.95, 0.15 + scores.reduce((a, b) => a + b, 0) * 0.25).toFixed(2));
}

export function sourcesForPrompt(sources: Source[], max = 15): string {
  return [...sources]
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(
      (s) =>
        `[${s.id}] ${s.title} — ${s.publisher}${s.publishedAt ? `, ${s.publishedAt.slice(0, 10)}` : ""} (quality ${s.quality})\n${s.snippet}`,
    )
    .join("\n\n");
}

export function evidenceExcerpts(sources: Source[]): string {
  if (!sources.length) return "";
  return `\n## Evidence excerpts\n${sources
    .map(
      (s) =>
        `- [${s.id}] “${s.snippet.slice(0, 240)}${s.snippet.length > 240 ? "…" : ""}” — ${s.title}, ${s.publisher}${s.publishedAt ? ` (${s.publishedAt.slice(0, 10)})` : ""}. Quality: ${s.quality}.`,
    )
    .join(
      "\n",
    )}\n\n## Sources\n${sources.map((s) => `- [${s.id}] ${s.title}. ${s.url}`).join("\n")}\n`;
}
