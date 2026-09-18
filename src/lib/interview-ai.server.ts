const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export class InterviewAiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "InterviewAiError";
  }
}

export type DraftQuestion = { prompt: string; capabilityKey: string | null };

/**
 * Produces interview question drafts grounded only in the supplied evidence
 * context. Questions are AI drafts: the person answers in their own words and
 * nothing here writes evidence, capability judgements or Verified state.
 */
export async function generateInterviewQuestions(input: {
  roleTarget: string;
  focusCapabilityKey: string | null;
  evidenceContext: string;
  capabilityKeys: string[];
}): Promise<DraftQuestion[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new InterviewAiError("AI drafting is not configured on the server.", 401);

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions:
        "You write interview questions for a product professional. Base every question on the supplied evidence record only. Never invent projects, employers, metrics or outcomes. Each question must be answerable from the listed work. Return five questions.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Target role: ${input.roleTarget}\nFocus capability: ${input.focusCapabilityKey ?? "none specified"}\nAllowed capability keys: ${input.capabilityKeys.join(", ") || "none"}\nEvidence record:\n${input.evidenceContext || "No recorded work yet."}`,
            },
          ],
        },
      ],
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "interview_questions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["questions"],
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["prompt", "capability_key"],
                  properties: {
                    prompt: { type: "string" },
                    capability_key: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new InterviewAiError(aiError(response.status, detail), response.status);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const raw =
    payload.output_text ??
    payload.output?.flatMap((o) => o.content ?? []).map((c) => c.text ?? "").join("") ??
    "";
  let parsed: { questions?: Array<{ prompt?: string; capability_key?: string | null }> };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new InterviewAiError("AI drafting returned an unreadable result. Try again.", 502);
  }
  const allowed = new Set(input.capabilityKeys);
  const questions = (parsed.questions ?? [])
    .map((q) => ({
      prompt: (q.prompt ?? "").trim().slice(0, 600),
      capabilityKey: q.capability_key && allowed.has(q.capability_key) ? q.capability_key : null,
    }))
    .filter((q) => q.prompt.length > 15)
    .slice(0, 5);
  if (!questions.length) throw new InterviewAiError("AI drafting produced no usable questions. Try again.", 502);
  return questions;
}

function aiError(status: number, detail: string) {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string }; message?: string };
    const message = parsed.error?.message ?? parsed.message;
    if (message) return message;
  } catch {
    // Fall through to a status-specific message.
  }
  if (status === 402) return "AI credits are unavailable. Add credits in Lovable to continue.";
  if (status === 429) return "AI drafting is busy. Please try again shortly.";
  if (status >= 500) return "AI drafting is temporarily unavailable. Please try again shortly.";
  return "AI drafting could not complete this request.";
}
