/**
 * Product memory: what the team has learned about one product, kept across
 * missions. Entries are taken deterministically, without a model, from:
 * labelled claims and requirements in accepted model-written artefacts; the
 * founder's gate decisions; and the founder's evidence. Every entry keeps the
 * label it was written with and where it came from. Entries that may be out of
 * date are marked as possibly stale, never silently dropped or merged.
 */
import { markdownSections } from "./contracts";
import { containsLikelyPersonalIdentifiers } from "./privacy";

export const MEMORY_KINDS = [
  "source",
  "sourced_fact",
  "assumption",
  "inference",
  "speculation",
  "requirement",
  "decision",
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const MEMORY_KIND_LABELS: Record<MemoryKind, string> = {
  source: "Source",
  sourced_fact: "Sourced fact",
  assumption: "Assumption",
  inference: "Inference",
  speculation: "Speculative",
  requirement: "Requirement",
  decision: "Decision",
};

/** An entry not seen for this long may no longer hold. */
export const STALE_AFTER_DAYS = 90;
const MAX_STATEMENT = 600;
const MAX_ENTRIES_PER_ARTEFACT = 60;
/** Memory text given to the model per step. */
export const MAX_MEMORY_PROMPT_CHARS = 12_000;

export type MemoryDraft = {
  kind: MemoryKind;
  statement: string;
  citation: string | null;
  refKey: string | null;
};

export type ProductMemoryEntry = MemoryDraft & {
  id: string;
  projectId: string;
  originKind: "evidence" | "artefact" | "gate";
  originId: string;
  firstMissionId: string | null;
  lastMissionId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  timesSeen: number;
  retiredAt: string | null;
  retiredReason: string | null;
};

const LABEL_KIND: Record<string, MemoryKind> = {
  "sourced fact": "sourced_fact",
  assumption: "assumption",
  inference: "inference",
  speculative: "speculation",
};
const LABELLED = /^\s*(?:[-*]\s*)?\[(sourced fact|assumption|inference|speculative)\]\s*(.+)$/i;
// The same citation form the output checks accept, wherever it sits in the line.
const SOURCE = /\s*\(source:\s*([^)]{3,})\)/i;
const REQUIREMENT = /^\s*[-*]\s*(R\d+)\s*:\s*(.+)$/;

/** The text an entry is matched on: case, spacing and closing punctuation do not matter. */
export function normaliseStatement(statement: string): string {
  return statement
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.;:,!?\s]+$/, "")
    .trim();
}

function clip(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > MAX_STATEMENT ? `${t.slice(0, MAX_STATEMENT - 1)}…` : t;
}

/**
 * Entries in a model-written stage artefact: every labelled claim (in any
 * section, bullet or not) and, for a PRD, its numbered requirements. Text that
 * looks like it holds personal identifiers is never kept.
 */
export function extractMemory(markdown: string): MemoryDraft[] {
  const out: MemoryDraft[] = [];
  const seen = new Set<string>();
  const push = (d: MemoryDraft) => {
    if (!d.statement || containsLikelyPersonalIdentifiers(`${d.statement} ${d.citation ?? ""}`))
      return;
    const key = memoryMatchKey(d);
    if (seen.has(key) || out.length >= MAX_ENTRIES_PER_ARTEFACT) return;
    seen.add(key);
    out.push(d);
  };
  for (const [heading, body] of markdownSections(markdown)) {
    for (const line of body.split(/\r?\n/)) {
      const labelled = LABELLED.exec(line);
      if (labelled) {
        const kind = LABEL_KIND[labelled[1]!.toLowerCase()]!;
        const text = labelled[2]!;
        const citation = kind === "sourced_fact" ? (SOURCE.exec(text)?.[1]?.trim() ?? null) : null;
        // A sourced fact without its source is kept only as what it can claim to be.
        push({
          kind: kind === "sourced_fact" && !citation ? "assumption" : kind,
          statement: clip(text.replace(SOURCE, " ")).replace(/\s+([.;,])$/, ""),
          citation: citation ? clip(citation) : null,
          refKey: null,
        });
        continue;
      }
      // Headings match as the contract checker matches them: "Requirements" or "Requirements …".
      const inRequirements = heading === "requirements" || heading.startsWith("requirements ");
      const req = inRequirements ? REQUIREMENT.exec(line) : null;
      if (req)
        push({ kind: "requirement", statement: clip(req[2]!), citation: null, refKey: req[1]! });
    }
  }
  return out;
}

/** The key an entry is matched on: kind, normalised statement and, for sourced facts, the source. */
export function memoryMatchKey(d: Pick<MemoryDraft, "kind" | "statement" | "citation">): string {
  return [d.kind, normaliseStatement(d.statement), (d.citation ?? "").toLowerCase().trim()].join(
    "\u0001",
  );
}

/** A founder's gate decision as a memory entry. A note that may hold identifiers is left out. */
export function decisionMemory(
  gate: { key: string; title: string },
  approved: boolean,
  note?: string | null,
): MemoryDraft {
  const n = note?.trim();
  const keep = n && !containsLikelyPersonalIdentifiers(n) ? `: ${n}` : "";
  return {
    kind: "decision",
    statement: clip(`${gate.title} ${approved ? "approved" : "rejected"} by the founder${keep}`),
    citation: null,
    refKey: gate.key,
  };
}

export type Staleness = { stale: boolean; reason: string | null };

/**
 * Whether an entry may no longer hold: not seen for STALE_AFTER_DAYS, or a
 * sourced fact whose founder source has since been withdrawn.
 */
export function staleness(
  entry: Pick<ProductMemoryEntry, "kind" | "citation" | "lastSeenAt">,
  withdrawnSources: ReadonlySet<string>,
  now = Date.now(),
): Staleness {
  if (
    entry.kind === "sourced_fact" &&
    entry.citation &&
    withdrawnSources.has(entry.citation.toLowerCase())
  )
    return { stale: true, reason: "its source was withdrawn" };
  const ageDays = (now - new Date(entry.lastSeenAt).getTime()) / 86_400_000;
  if (ageDays > STALE_AFTER_DAYS)
    return { stale: true, reason: `not seen for ${Math.floor(ageDays)} days` };
  return { stale: false, reason: null };
}

/** Titles of founder sources that have been removed, for staleness checks. */
export function withdrawnSourceTitles(entries: readonly ProductMemoryEntry[]): Set<string> {
  const current = new Set(
    entries
      .filter((e) => e.kind === "source" && !e.retiredAt)
      .map((e) => e.statement.toLowerCase()),
  );
  return new Set(
    entries
      .filter((e) => e.kind === "source" && e.retiredAt)
      .map((e) => e.statement.toLowerCase())
      .filter((t) => !current.has(t)),
  );
}

export type MemoryForPrompt = { text: string; citable: string[]; included: number };

/**
 * Memory from earlier missions for a step's prompt, newest first, within the
 * budget. Each line keeps its label and source and says when it was last seen;
 * possibly stale entries say so. Founder sources that are still current can be
 * cited, so a sourced fact can be carried forward with its original source.
 */
export function memoryForPrompt(
  entries: readonly ProductMemoryEntry[],
  missionId: string,
  now = Date.now(),
): MemoryForPrompt {
  const withdrawn = withdrawnSourceTitles(entries);
  const current = entries
    .filter((e) => !e.retiredAt && e.firstMissionId !== missionId)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  let budget = MAX_MEMORY_PROMPT_CHARS;
  const lines: string[] = [];
  const currentSources = new Map<string, string>();
  const cited = new Set<string>();
  for (const e of current) {
    // Screened again at use, so a stricter screen also covers older entries.
    if (containsLikelyPersonalIdentifiers(`${e.statement} ${e.citation ?? ""}`)) continue;
    const s = staleness(e, withdrawn, now);
    if (e.kind === "source") {
      if (!s.stale) currentSources.set(e.statement.toLowerCase(), e.statement);
      continue;
    }
    const label =
      e.kind === "requirement"
        ? `Requirement ${e.refKey ?? ""}`.trim()
        : MEMORY_KIND_LABELS[e.kind];
    const line = `- [${label}] ${e.statement}${e.citation ? ` (Source: ${e.citation})` : ""} — last seen ${e.lastSeenAt.slice(0, 10)}${s.stale ? ` — possibly stale: ${s.reason}` : ""}`;
    if (line.length > budget) break;
    budget -= line.length;
    lines.push(line);
    if (e.citation) cited.add(e.citation.toLowerCase());
  }
  // A founder source can be cited again only where the model was shown a fact that cites it.
  const citable = [...currentSources].filter(([k]) => cited.has(k)).map(([, title]) => title);
  // The block cannot be closed from inside; entries stay data however they are written.
  const text = lines.join("\n").replace(/<\/product_memory/gi, "<\\/product_memory");
  return { text, citable, included: lines.length };
}
