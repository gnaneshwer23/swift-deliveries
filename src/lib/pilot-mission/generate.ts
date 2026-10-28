import { NOT_RUN_LABEL, type EvidenceItem, type GenerationResult, type OptionDraft } from "./types";

export const WITHHELD_LABEL = "not run — personal identifiers withheld";

export function notConfiguredGeneration(): GenerationResult {
  return {
    ran: false,
    label: NOT_RUN_LABEL,
    provider: null,
    model: null,
    output: "",
    citations: [],
    gaps: ["Model provider is not configured."],
  };
}

export function withheldGeneration(): GenerationResult {
  return {
    ran: false,
    label: WITHHELD_LABEL,
    provider: null,
    model: null,
    output: "",
    citations: [],
    gaps: ["The request was withheld from the model."],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseModelOptions(
  raw: string,
  evidence: EvidenceItem[],
): { options: OptionDraft[]; citations: string[]; gaps: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model output was not JSON.");
  }
  const body = asRecord(parsed);
  const rows = body?.["options"];
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("Model output needs at least two options.");
  }
  const known = new Set(evidence.map((item) => item.id));
  const options: OptionDraft[] = rows.slice(0, 4).map((row, index) => {
    const record = asRecord(row);
    const id = typeof record?.["id"] === "string" ? record["id"].trim() : "";
    const title = typeof record?.["title"] === "string" ? record["title"].trim() : "";
    const tradeoff = typeof record?.["tradeoff"] === "string" ? record["tradeoff"].trim() : "";
    const basis = typeof record?.["basis"] === "string" ? record["basis"].trim() : "";
    if (!/^[a-z0-9-]{1,40}$/.test(id)) throw new Error(`Option ${index + 1} has an invalid id.`);
    if (title.length < 3 || tradeoff.length < 3)
      throw new Error(`Option ${index + 1} is incomplete.`);
    if (basis !== "gap" && !known.has(basis)) {
      throw new Error(`Option ${index + 1} cites evidence that was not supplied.`);
    }
    return { id, title, tradeoff, basis };
  });
  const ids = new Set(options.map((option) => option.id));
  if (ids.size !== options.length) throw new Error("Option ids must be unique.");

  const citations: string[] = [];
  const gaps: string[] = [];
  const rawCitations = Array.isArray(body?.["citations"]) ? body["citations"] : [];
  for (const citation of rawCitations) {
    if (typeof citation !== "string") continue;
    if (known.has(citation)) citations.push(citation);
    else gaps.push(`Citation not in supplied evidence: ${citation.slice(0, 80)}`);
  }
  const rawGaps = Array.isArray(body?.["gaps"]) ? body["gaps"] : [];
  for (const gap of rawGaps) {
    if (typeof gap === "string" && gap.trim()) gaps.push(gap.trim().slice(0, 500));
  }
  return { options, citations: [...new Set(citations)], gaps };
}

export function draftOptions(input: { question: string; evidence: EvidenceItem[] }): OptionDraft[] {
  const supplied = input.evidence.find((item) => item.classification === "supplied");
  const gap = input.evidence.find((item) => item.classification === "gap");
  const assumption = input.evidence.find((item) => item.classification === "assumption");
  const first = supplied ?? assumption ?? input.evidence[0];
  const cited =
    supplied &&
    (/\[Cited/i.test(supplied.statement) || /tavily|exa|brave|https?:\/\//i.test(supplied.source));
  return [
    {
      id: "investigate-supplied",
      title: cited
        ? "Investigate using cited findings on the register"
        : first
          ? "Investigate from the saved evidence"
          : "Investigate the saved question",
      tradeoff: first
        ? `Uses only the saved material (basis ${first.id}). It does not create observations. ${first.statement.slice(0, 140)}`
        : "Uses only the saved material. It does not create observations.",
      basis: first?.id ?? "gap",
    },
    {
      id: "close-gap",
      title: gap
        ? "Hold until a material evidence gap is closed"
        : "Hold until the missing evidence is supplied",
      tradeoff: gap
        ? `${input.question ? "Keeps the question open where the saved material does not support a change. " : ""}${gap.statement.slice(0, 160)}`
        : input.question
          ? "Keeps the question open where the saved material does not support a change."
          : "Keeps the question open.",
      basis: gap?.id ?? "gap",
    },
  ];
}
