/**
 * Voice input (Phase 4b). The provider only transcribes: the transcript goes
 * through the same deterministic path as typed text, so speech can never act
 * or approve anything. The browser never sees the API key. It gets a
 * short-lived client secret, minted here for a transcription-only session
 * whose model comes from configuration and the deployment's allowlist.
 */
import { createHash } from "node:crypto";
import { allowedModel } from "@/lib/workforce/model-runner.server";

export const VOICE_SECRET_SECONDS = 60;
const CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";
const TIMEOUT_MS = 10_000;

export type VoiceConfig =
  { enabled: true; model: string; apiKey: string } | { enabled: false; problem: string | null };

/**
 * Voice is off unless DXSI_VOICE_ENABLED is "true". When it is on, it still
 * needs OPENAI_API_KEY and a transcription model in DXSI_VOICE_TRANSCRIBE_MODEL
 * that is listed in DXSI_MODEL_ALLOWLIST. Any gap is reported, never guessed.
 */
export function voiceConfig(env: Record<string, string | undefined> = process.env): VoiceConfig {
  if (env["DXSI_VOICE_ENABLED"] !== "true") return { enabled: false, problem: null };
  const apiKey = env["OPENAI_API_KEY"]?.trim();
  if (!apiKey) return { enabled: false, problem: "Voice is on but OPENAI_API_KEY is not set." };
  try {
    const model = allowedModel(
      env["DXSI_VOICE_TRANSCRIBE_MODEL"]?.trim(),
      env,
      "DXSI_VOICE_TRANSCRIBE_MODEL",
    );
    return { enabled: true, model, apiKey };
  } catch (e) {
    return { enabled: false, problem: (e as Error).message.replace(/^Model mode/, "Voice") };
  }
}

/** The transcription-only session the client secret is bound to. */
export function transcriptionSession(model: string) {
  return {
    expires_after: { anchor: "created_at", seconds: VOICE_SECRET_SECONDS },
    session: {
      type: "transcription",
      audio: {
        input: {
          transcription: { model },
          // Push-to-talk: the browser says when a turn ends; nothing is detected for it.
          turn_detection: null,
        },
      },
    },
  };
}

/** A stable, non-reversible id for the provider's abuse monitoring; never the user id itself. */
export function safetyIdentifier(userId: string): string {
  return createHash("sha256").update(`deliverx-voice:${userId}`, "utf8").digest("hex");
}

export type VoiceSecret = { value: string; expiresAt: number };

export async function mintVoiceSecret(
  config: Extract<VoiceConfig, { enabled: true }>,
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<VoiceSecret> {
  const res = await fetchImpl(CLIENT_SECRETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": safetyIdentifier(userId),
    },
    body: JSON.stringify(transcriptionSession(config.model)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // The provider's error body is not passed on: it can echo request details.
  if (!res.ok) throw new Error(`The voice provider refused the session (HTTP ${res.status}).`);
  const body = (await res.json()) as { value?: unknown; expires_at?: unknown };
  if (typeof body.value !== "string" || !body.value)
    throw new Error("The voice provider returned no session token.");
  return {
    value: body.value,
    expiresAt: typeof body.expires_at === "number" ? body.expires_at : 0,
  };
}
