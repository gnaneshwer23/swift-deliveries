const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export type WorkspaceSuggestionKind = "agenda" | "artefact" | "decision_options" | "risk_flags";

const SYSTEM: Record<WorkspaceSuggestionKind, string> = {
  agenda: "Prepare a concise meeting agenda for a product team. Return useful headings and questions only. Do not invent facts, people, dates, metrics, or commitments.",
  artefact: "Prepare a concise working draft for a product team. Clearly separate known context, assumptions, and open questions. Do not invent evidence, metrics, or commitments.",
  decision_options: "Prepare three genuinely distinct decision options with a benefit, trade-off, and test for each. Do not select an option or make the decision for the user.",
  risk_flags: "Identify only risks grounded in the supplied project context. For each, state the signal, possible impact, and a practical mitigation. Do not activate or assign a risk.",
};

export class WorkspaceAiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "WorkspaceAiError";
  }
}

export async function generateWorkspaceSuggestion(input: {
  kind: WorkspaceSuggestionKind;
  projectTitle: string;
  projectPurpose: string;
  approvedContext: string;
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new WorkspaceAiError("AI drafting is not configured on the server.", 401);

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
      instructions: `${SYSTEM[input.kind]} The result is an AI draft and must remain subject to human review, editing, approval, and separate submission.`,
      input: [{
        role: "user",
        content: [{
          type: "input_text",
          text: `Project: ${input.projectTitle}\nPurpose: ${input.projectPurpose}\nApproved project context:\n${input.approvedContext || "No approved records yet."}\n\nWrite the draft in plain text, under 450 words.`,
        }],
      }],
      reasoning: { effort: "low", summary: "auto" },
      store: false,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new WorkspaceAiError(aiError(response.status, detail), response.status);
  }

  let text = "";
  let buffer = "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
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
        const event = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (event.type === "response.output_text.delta" && event.delta) text += event.delta;
        if (event.type === "response.completed" && !text && event.response?.output_text) text = event.response.output_text;
      } catch {
        // Ignore keep-alive frames.
      }
    }
  }
  if (!text.trim()) throw new WorkspaceAiError("AI drafting returned no usable content. Try again.", 502);
  return text.trim().slice(0, 12000);
}

function aiError(status: number, detail: string) {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string }; message?: string };
    const message = parsed.error?.message ?? parsed.message;
    if (message) return message;
  } catch {
    // Use status-specific fallback.
  }
  if (status === 402) return "AI credits are unavailable. Add credits in Lovable to continue.";
  if (status === 403) return "AI drafting is blocked by a workspace policy or credit limit.";
  if (status === 429) return "AI drafting is busy. Please try again shortly.";
  if (status >= 500) return "AI drafting is temporarily unavailable. Please try again shortly.";
  return "AI drafting could not complete this request.";
}
