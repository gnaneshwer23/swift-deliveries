/**
 * Server-only capability judge.
 *
 * Reads a person's ledger evidence and asks Lovable AI for a level, a
 * confidence band and a written rationale per capability. It never decides
 * Verified — that stays with external attestation — and it never invents
 * evidence: every judgement must cite ledger ids it was given.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type JudgeEvidence = {
  id: string;
  capabilityKey: string;
  strength: string;
  source: string;
  summary: string;
  occurredAt: string;
  coachConfirmed: boolean;
  excerpt: string | null;
};

export type JudgeCapability = { key: string; name: string; description: string | null };

export type AiJudgement = {
  capability_key: string;
  level: number;
  band: "low" | "moderate" | "high";
  rationale: string;
  evidence_ids: string[];
};

export class AiJudgeError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiJudgeError";
    this.status = status;
    this.retryable = status === 429 || status >= 500;
  }
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["judgements"],
  properties: {
    judgements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["capability_key", "level", "band", "rationale", "evidence_ids"],
        properties: {
          capability_key: { type: "string" },
          level: { type: "integer", minimum: 1, maximum: 5 },
          band: { type: "string", enum: ["low", "moderate", "high"] },
          rationale: { type: "string" },
          evidence_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

const SYSTEM = `You judge professional capability from an evidence ledger, for a product where every number must be explainable.

Rules you must follow:
- Judge only the capabilities listed. Skip a capability with no evidence; do not guess.
- Level 1-5: 1 = has been exposed to it, 2 = did it with support, 3 = did it independently once, 4 = did it repeatedly and well, 5 = sets the standard for others.
- Evidence strength matters more than volume. externally_verified > assessed (a coach confirmed it) > observed (the person did the work in a simulation) > self_reported (never on its own enough for level 3+).
- Confidence band: "high" only with several independent, assessed or verified entries; "moderate" with solid observed work; "low" with thin or mostly self-reported evidence.
- The rationale is written for the person being judged: 2-3 plain sentences naming what they actually did and what would move the level up. No jargon, no flattery, no mention of AI.
- evidence_ids must contain only ids from the evidence given to you, and only the ones your rationale actually relies on.
- Never claim anything is verified or endorsed by a third party unless an entry's strength is externally_verified.`;

function buildPrompt(capabilities: JudgeCapability[], evidence: JudgeEvidence[]): string {
  const caps = capabilities
    .map((c) => `- ${c.key}: ${c.name}${c.description ? ` — ${c.description}` : ""}`)
    .join("\n");
  const items = evidence
    .map(
      (e) =>
        `- id: ${e.id}\n  capability: ${e.capabilityKey}\n  strength: ${e.strength}\n  source: ${e.source}\n  coach_confirmed: ${e.coachConfirmed}\n  date: ${e.occurredAt}\n  summary: ${e.summary}${e.excerpt ? `\n  work_excerpt: ${e.excerpt}` : ""}`,
    )
    .join("\n");

  return `Framework capabilities:\n${caps}\n\nEvidence ledger entries:\n${items}\n\nReturn json with one judgement per capability that has usable evidence.`;
}

/** Calls the gateway with streaming (required for reasoning models) and returns parsed judgements. */
export async function judgeCapabilities(
  capabilities: JudgeCapability[],
  evidence: JudgeEvidence[],
): Promise<AiJudgement[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiJudgeError("Scoring is not configured on the server.", 401);

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      instructions: SYSTEM,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: buildPrompt(capabilities, evidence) }],
        },
      ],
      reasoning: { effort: "medium", summary: "auto" },
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "capability_judgements",
          strict: true,
          schema: SCHEMA,
        },
      },
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new AiJudgeError(errorMessage(response.status, detail), response.status);
  }

  let text = "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
        } else if (event.type === "response.completed" && event.response?.output_text) {
          if (!text) text = event.response.output_text;
        }
      } catch {
        // Ignore keep-alive or non-JSON frames.
      }
    }
  }

  if (!text.trim()) {
    throw new AiJudgeError("The scoring run returned nothing to record. Try again.", 502);
  }

  let parsed: { judgements?: unknown };
  try {
    parsed = JSON.parse(text) as { judgements?: unknown };
  } catch {
    throw new AiJudgeError("The scoring run returned an unreadable result.", 502);
  }

  const allowedCapabilities = new Set(capabilities.map((c) => c.key));
  const allowedEvidence = new Set(evidence.map((e) => e.id));

  return (Array.isArray(parsed.judgements) ? parsed.judgements : [])
    .map((row) => row as Partial<AiJudgement>)
    .filter(
      (row): row is AiJudgement =>
        typeof row.capability_key === "string" &&
        allowedCapabilities.has(row.capability_key) &&
        typeof row.level === "number" &&
        typeof row.rationale === "string" &&
        row.rationale.trim().length > 0 &&
        (row.band === "low" || row.band === "moderate" || row.band === "high"),
    )
    .map((row) => ({
      capability_key: row.capability_key,
      level: Math.min(5, Math.max(1, Math.round(row.level))),
      band: row.band,
      rationale: row.rationale.trim().slice(0, 1200),
      evidence_ids: (Array.isArray(row.evidence_ids) ? row.evidence_ids : []).filter((id) =>
        allowedEvidence.has(id),
      ),
    }))
    .filter((row) => row.evidence_ids.length > 0);
}

function errorMessage(status: number, detail: string): string {
  if (status === 402) {
    return "The AI credits for this workspace have run out, so scoring can't run. Top up in Lovable to continue.";
  }
  if (status === 403) {
    return "Scoring is blocked by a workspace setting or credit limit. An admin needs to allow it.";
  }
  if (status === 429) return "Scoring is busy right now. Try again in a minute.";
  if (status === 401) return "Scoring is not configured on the server.";
  if (status >= 500) return "The scoring service is temporarily unavailable. Try again shortly.";
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string }; message?: string };
    const message = parsed.error?.message ?? parsed.message;
    if (message) return `Scoring failed: ${message}`;
  } catch {
    // fall through
  }
  return "Scoring failed before any judgement was recorded.";
}
