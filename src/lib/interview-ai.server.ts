import {
  normaliseClaimStatus,
  normaliseClaimType,
  normaliseQuestionType,
  shouldOfferFollowUp,
  type ClaimStatus,
  type ClaimType,
  type QuestionType,
} from "./interview-practice";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export class InterviewAiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "InterviewAiError";
  }
}

export type EvidenceEntry = {
  id: string;
  summary: string;
  strength: string;
  capabilityKey: string | null;
};

export type DraftQuestion = {
  prompt: string;
  capabilityKey: string | null;
  questionType: QuestionType;
  evidenceId: string | null;
};

export type AnswerAssessment = {
  scores: Array<{ dimension: string; score: number; rationale: string }>;
  claims: Array<{
    claimText: string;
    claimType: ClaimType;
    supportStatus: ClaimStatus;
    matchedEvidenceId: string | null;
    recordExcerpt: string | null;
  }>;
  followUp: { prompt: string; questionType: QuestionType } | null;
};

export type SessionFeedback = Array<{ dimension: string; score: number; rationale: string }>;

async function callGateway(body: Record<string, unknown>): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new InterviewAiError("AI drafting is not configured on the server.", 401);
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({ model: MODEL, store: false, ...body }),
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
  try {
    return JSON.parse(raw);
  } catch {
    throw new InterviewAiError("AI drafting returned an unreadable result. Try again.", 502);
  }
}

const INTERVIEWER_RULES = [
  "Ask only about the record entries provided; never invent details of the user's work.",
  "One question at a time; no hints or model answers during the interview.",
  "Follow-ups target the weakest dimension of the last answer.",
  "Every feedback point cites the answer text and the record entry it relates to.",
  "Claim extraction lists claims exactly as stated, without correcting or softening them.",
  "Feedback is practice-level and never uses the word 'verified'.",
].join(" ");

function evidenceBlock(entries: EvidenceEntry[]): string {
  return entries
    .map((e) => `Entry ${e.id} (${e.strength}${e.capabilityKey ? `, ${e.capabilityKey}` : ""}): ${e.summary}`)
    .join("\n");
}

/**
 * Produces typed interview question drafts grounded only in the supplied record
 * entries. Each question cites the entry it is drawn from. Questions are AI
 * drafts: the person answers in their own words and nothing here writes
 * evidence, capability judgements or Verified state.
 */
export async function generateInterviewQuestions(input: {
  roleTarget: string;
  focusCapabilityKey: string | null;
  entries: EvidenceEntry[];
  capabilityKeys: string[];
}): Promise<DraftQuestion[]> {
  const parsed = (await callGateway({
    instructions: `You are an evidence-grounded interview coach for a product professional. ${INTERVIEWER_RULES} Write one typed question per record entry supplied. Types: defend (defend a decision you took), trade-off (explain a trade-off you made), stakeholder (how you handled pushback), metric (the numbers behind an outcome). Each question must name the work it refers to and be answerable from that entry alone. Return JSON only.`,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Target role: ${input.roleTarget}\nFocus capability: ${input.focusCapabilityKey ?? "none specified"}\nAllowed capability keys: ${input.capabilityKeys.join(", ") || "none"}\nRecord entries:\n${evidenceBlock(input.entries)}`,
          },
        ],
      },
    ],
    reasoning: { effort: "low", summary: "auto" },
    include: ["reasoning.encrypted_content"],
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
                required: ["prompt", "capability_key", "question_type", "evidence_id"],
                properties: {
                  prompt: { type: "string" },
                  capability_key: { type: ["string", "null"] },
                  question_type: { type: "string", enum: ["defend", "trade-off", "stakeholder", "metric"] },
                  evidence_id: { type: ["string", "null"] },
                },
              },
            },
          },
        },
      },
    },
  })) as {
    questions?: Array<{
      prompt?: string;
      capability_key?: string | null;
      question_type?: string;
      evidence_id?: string | null;
    }>;
  };

  const allowed = new Set(input.capabilityKeys);
  const entryIds = new Set(input.entries.map((e) => e.id));
  const questions = (parsed.questions ?? [])
    .map((q) => ({
      prompt: (q.prompt ?? "").trim().slice(0, 600),
      capabilityKey: q.capability_key && allowed.has(q.capability_key) ? q.capability_key : null,
      questionType: normaliseQuestionType(q.question_type),
      evidenceId: q.evidence_id && entryIds.has(q.evidence_id) ? q.evidence_id : null,
    }))
    .filter((q) => q.prompt.length > 15)
    .slice(0, 5);
  if (!questions.length) throw new InterviewAiError("AI drafting produced no usable questions. Try again.", 502);
  return questions;
}

/**
 * Scores one answer against the rubric dimensions, extracts its factual claims
 * and runs the record check against the candidate's record entries. When a
 * dimension scores weak and the depth cap allows it, returns one drill-down
 * follow-up question. Practice-level only.
 */
export async function assessInterviewAnswer(input: {
  questionPrompt: string;
  answerBody: string;
  entries: EvidenceEntry[];
  capabilityKeys: string[];
  currentDepth: number;
}): Promise<AnswerAssessment> {
  const allowFollowUp = input.currentDepth < 3;
  const parsed = (await callGateway({
    instructions: `You are an evidence-grounded interview assessor. ${INTERVIEWER_RULES} Score the answer on these dimensions (1-5 each): structure, ownership, evidence_use, outcome_clarity. Extract every factual claim exactly as stated (type: metric, action, outcome or role) and check each against the record entries: supported (the record says the same thing), partial (direction right, numbers or scope not in the record), not_in_record (no entry covers it), contradicted (the record says otherwise). Quote the matching record excerpt where one exists. ${allowFollowUp ? "If any dimension scores below 3, add one drill-down follow-up question targeting the weakest dimension; otherwise follow_up must be null." : "follow_up must be null."} Return JSON only.`,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Question: ${input.questionPrompt}\nAnswer: ${input.answerBody}\nAllowed capability keys: ${input.capabilityKeys.join(", ") || "none"}\nRecord entries:\n${evidenceBlock(input.entries)}`,
          },
        ],
      },
    ],
    reasoning: { effort: "low", summary: "auto" },
    include: ["reasoning.encrypted_content"],
    text: {
      format: {
        type: "json_schema",
        name: "answer_assessment",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["scores", "claims", "follow_up"],
          properties: {
            scores: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["dimension", "score", "rationale"],
                properties: {
                  dimension: { type: "string" },
                  score: { type: "integer" },
                  rationale: { type: "string" },
                },
              },
            },
            claims: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["claim_text", "claim_type", "support_status", "matched_evidence_id", "record_excerpt"],
                properties: {
                  claim_text: { type: "string" },
                  claim_type: { type: "string", enum: ["metric", "action", "outcome", "role"] },
                  support_status: { type: "string", enum: ["supported", "partial", "not_in_record", "contradicted"] },
                  matched_evidence_id: { type: ["string", "null"] },
                  record_excerpt: { type: ["string", "null"] },
                },
              },
            },
            follow_up: {
              type: ["object", "null"],
              additionalProperties: false,
              required: ["prompt", "question_type"],
              properties: {
                prompt: { type: "string" },
                question_type: { type: "string", enum: ["defend", "trade-off", "stakeholder", "metric"] },
              },
            },
          },
        },
      },
    },
  })) as {
    scores?: Array<{ dimension?: string; score?: number; rationale?: string }>;
    claims?: Array<{
      claim_text?: string;
      claim_type?: string;
      support_status?: string;
      matched_evidence_id?: string | null;
      record_excerpt?: string | null;
    }>;
    follow_up?: { prompt?: string; question_type?: string } | null;
  };

  const entryIds = new Set(input.entries.map((e) => e.id));
  const scores = (parsed.scores ?? [])
    .map((s) => ({
      dimension: (s.dimension ?? "").trim().slice(0, 60),
      score: Math.min(5, Math.max(1, Math.round(s.score ?? 0))),
      rationale: (s.rationale ?? "").trim().slice(0, 800),
    }))
    .filter((s) => s.dimension.length > 0)
    .slice(0, 6);
  const claims = (parsed.claims ?? [])
    .map((c) => ({
      claimText: (c.claim_text ?? "").trim().slice(0, 400),
      claimType: normaliseClaimType(c.claim_type),
      supportStatus: normaliseClaimStatus(c.support_status),
      matchedEvidenceId:
        c.matched_evidence_id && entryIds.has(c.matched_evidence_id) ? c.matched_evidence_id : null,
      recordExcerpt: c.record_excerpt?.trim().slice(0, 600) || null,
    }))
    .filter((c) => c.claimText.length > 3)
    .slice(0, 12);

  const followUpPrompt = parsed.follow_up?.prompt?.trim().slice(0, 600) ?? "";
  const followUp =
    allowFollowUp &&
    followUpPrompt.length > 15 &&
    shouldOfferFollowUp(scores.map((s) => s.score), input.currentDepth)
      ? { prompt: followUpPrompt, questionType: normaliseQuestionType(parsed.follow_up?.question_type) }
      : null;

  return { scores, claims, followUp };
}

/**
 * End-of-session feedback: one score per rubric dimension with a rationale that
 * cites the answers and the record entries they relate to. Practice-level only.
 */
export async function generateSessionFeedback(input: {
  roleTarget: string;
  transcript: Array<{ question: string; answer: string }>;
  entries: EvidenceEntry[];
}): Promise<SessionFeedback> {
  const transcriptText = input.transcript
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answer}`)
    .join("\n\n");
  const parsed = (await callGateway({
    instructions: `You are an evidence-grounded interview coach closing a practice session. ${INTERVIEWER_RULES} Score the session on these dimensions (1-5 each): structure, ownership, evidence_use, outcome_clarity. Each rationale must cite the answer text and the record entry it relates to. Label everything as practice. Return JSON only.`,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Target role: ${input.roleTarget}\nTranscript:\n${transcriptText}\n\nRecord entries:\n${evidenceBlock(input.entries)}`,
          },
        ],
      },
    ],
    reasoning: { effort: "low", summary: "auto" },
    include: ["reasoning.encrypted_content"],
    text: {
      format: {
        type: "json_schema",
        name: "session_feedback",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["feedback"],
          properties: {
            feedback: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["dimension", "score", "rationale"],
                properties: {
                  dimension: { type: "string" },
                  score: { type: "integer" },
                  rationale: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  })) as { feedback?: Array<{ dimension?: string; score?: number; rationale?: string }> };

  const feedback = (parsed.feedback ?? [])
    .map((f) => ({
      dimension: (f.dimension ?? "").trim().slice(0, 60),
      score: Math.min(5, Math.max(1, Math.round(f.score ?? 0))),
      rationale: (f.rationale ?? "").trim().slice(0, 800),
    }))
    .filter((f) => f.dimension.length > 0)
    .slice(0, 6);
  if (!feedback.length) throw new InterviewAiError("AI feedback produced no usable result. Try again.", 502);
  return feedback;
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
