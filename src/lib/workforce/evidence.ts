/**
 * Founder-supplied evidence for a mission: notes the founder writes and text
 * files they upload. Only text the server can read is kept; anything else is
 * recorded as unreadable with the reason, so it is reported rather than
 * silently skipped. Readable evidence is citable by its title, and is never
 * sent to an external model when it looks like it holds personal identifiers.
 */
import { containsLikelyPersonalIdentifiers } from "./privacy";

export const MAX_EVIDENCE_FILE_BYTES = 256 * 1024;
export const MAX_EVIDENCE_NOTE_CHARS = 20_000;
export const MAX_EVIDENCE_ITEMS = 20;
/** Evidence text given to the model per step, across all items. */
export const MAX_EVIDENCE_PROMPT_CHARS = 40_000;

const TEXT_EXTENSIONS = ["txt", "md", "markdown", "csv", "tsv", "json"] as const;
const TEXT_MEDIA = /^(text\/[\w.+-]+|application\/json)$/i;

export type WfEvidence = {
  id: string;
  missionId: string;
  kind: "note" | "file";
  title: string;
  status: "readable" | "unreadable";
  unreadableReason: string | null;
  content: string | null;
  fileName: string | null;
  mediaType: string | null;
  byteSize: number | null;
  contentSha256: string | null;
  containsIdentifiers: boolean;
  suppliedBy: string;
  createdAt: string;
};

/** A mission's current evidence. `available` is false until migration 0027 is applied. */
export type EvidenceList = { available: boolean; items: WfEvidence[] };

/** What intake decided about one piece of evidence. */
export type EvidenceReading =
  | { status: "readable"; content: string; containsIdentifiers: boolean }
  | { status: "unreadable"; reason: string };

function extension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function readable(content: string): EvidenceReading {
  const text = content.replace(/\r\n/g, "\n").trim();
  if (!text) return { status: "unreadable", reason: "It is empty." };
  return {
    status: "readable",
    content: text,
    containsIdentifiers: containsLikelyPersonalIdentifiers(text),
  };
}

/** A note typed by the founder. */
export function readNote(text: string): EvidenceReading {
  if (text.length > MAX_EVIDENCE_NOTE_CHARS)
    return {
      status: "unreadable",
      reason: `It is longer than ${MAX_EVIDENCE_NOTE_CHARS.toLocaleString("en-GB")} characters.`,
    };
  return readable(text);
}

/**
 * An uploaded file. `bytes` is null when the browser did not send the
 * content because the file was over the size limit.
 */
export function readFile(input: {
  fileName: string;
  mediaType: string;
  byteSize: number;
  bytes: Uint8Array | null;
}): EvidenceReading {
  const ext = extension(input.fileName);
  const textLike =
    (TEXT_EXTENSIONS as readonly string[]).includes(ext) || TEXT_MEDIA.test(input.mediaType);
  if (!textLike) {
    const what = ext ? `.${ext} files` : "Files of this type";
    return {
      status: "unreadable",
      reason: `${what} can't be read yet. Upload it as .txt, .md, .csv or .json, or paste the relevant text as a note.`,
    };
  }
  if (input.byteSize > MAX_EVIDENCE_FILE_BYTES || !input.bytes)
    return {
      status: "unreadable",
      reason: `It is larger than ${MAX_EVIDENCE_FILE_BYTES / 1024} KB. Split it or paste the relevant part as a note.`,
    };
  if (input.bytes.length !== input.byteSize)
    return { status: "unreadable", reason: "The upload was incomplete." };
  if (input.bytes.includes(0))
    return { status: "unreadable", reason: "It contains binary data, not text." };
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
  } catch {
    return { status: "unreadable", reason: "It is not valid UTF-8 text." };
  }
  return readable(text.replace(/^\uFEFF/, ""));
}

/** A citation name: single-spaced, without characters that break "(Source: …)" or the prompt wrapper. */
export function normaliseTitle(title: string): string {
  return title
    .replace(/[()[\]\r\n<>]/g, " ")
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Re-screened at use as well as at intake, so a stricter screen also covers older evidence.
const hasIdentifiers = (e: WfEvidence) =>
  e.containsIdentifiers || containsLikelyPersonalIdentifiers(e.content ?? "");

/** Evidence a model may read: readable, current and free of likely personal identifiers. */
export function modelUsableEvidence(evidence: readonly WfEvidence[]): WfEvidence[] {
  return evidence.filter((e) => e.status === "readable" && e.content && !hasIdentifiers(e));
}

/** Evidence held back from the model because it looks like it holds personal identifiers. */
export function withheldEvidence(evidence: readonly WfEvidence[]): WfEvidence[] {
  return evidence.filter((e) => e.status === "readable" && hasIdentifiers(e));
}

/** What a step's output records about the evidence it was given. */
export type EvidenceUse = { id: string; title: string; sha256: string | null };

/**
 * Evidence text for the prompt, oldest first, within the step's budget. An
 * item cut short says so, so the model never treats a fragment as the whole.
 */
export function evidenceForPrompt(evidence: readonly WfEvidence[]): {
  text: string;
  used: EvidenceUse[];
} {
  let budget = MAX_EVIDENCE_PROMPT_CHARS;
  const parts: string[] = [];
  const used: EvidenceUse[] = [];
  for (const e of modelUsableEvidence(evidence)) {
    if (budget <= 0) break;
    // The body cannot close its own wrapper; it stays data however it is written.
    const body = e.content!.slice(0, budget).replace(/<\/evidence/gi, "<\\/evidence");
    budget -= body.length;
    const cut = body.length < e.content!.length ? ' truncated="true"' : "";
    parts.push(`<evidence title="${e.title}"${cut}>\n${body}\n</evidence>`);
    used.push({ id: e.id, title: e.title, sha256: e.contentSha256 });
  }
  return { text: parts.join("\n\n"), used };
}
