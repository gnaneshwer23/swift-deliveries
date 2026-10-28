/**
 * Optional ElevenLabs TTS for “listen” to the same PM-brief text (P-D).
 * Voice id is configuration, not a secret. API key stays server-side.
 */

/** Founder-selected ElevenLabs voice (28 Oct 2026). */
export const DEFAULT_TTS_VOICE_ID = "Aa6nEBJJMKJwJkCx8VU2";

const TIMEOUT_MS = 45_000;
const MAX_CHARS = 4_000;

export type TtsConfig =
  | { enabled: true; apiKey: string; voiceId: string; modelId: string }
  | { enabled: false; problem: string | null; voiceId: string };

export function ttsVoiceId(env: Record<string, string | undefined> = process.env): string {
  const fromEnv = env["DXSI_TTS_VOICE_ID"]?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_TTS_VOICE_ID;
}

/**
 * Listen/TTS is off unless DXSI_TTS_ENABLED=true and ELEVENLABS_API_KEY is set.
 * When off, the client may fall back to browser speechSynthesis (same words).
 */
export function ttsConfig(env: Record<string, string | undefined> = process.env): TtsConfig {
  const voiceId = ttsVoiceId(env);
  if (env["DXSI_TTS_ENABLED"] !== "true") {
    return { enabled: false, problem: null, voiceId };
  }
  const apiKey = env["ELEVENLABS_API_KEY"]?.trim();
  if (!apiKey) {
    return {
      enabled: false,
      problem: "Listen is on but ELEVENLABS_API_KEY is not set.",
      voiceId,
    };
  }
  const modelId = env["DXSI_TTS_MODEL"]?.trim() || "eleven_multilingual_v2";
  return { enabled: true, apiKey, voiceId, modelId };
}

export type TtsAudio = {
  contentType: string;
  base64: string;
  voiceId: string;
  provider: "elevenlabs";
};

export async function synthesizeSpeech(
  text: string,
  config: Extract<TtsConfig, { enabled: true }>,
  fetchImpl: typeof fetch = fetch,
): Promise<TtsAudio> {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length < 1) throw new Error("Nothing to speak.");
  if (trimmed.length > MAX_CHARS) {
    throw new Error(`Listen text must be at most ${MAX_CHARS} characters.`);
  }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: trimmed,
      model_id: config.modelId,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`The speech provider refused the request (HTTP ${res.status}).`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    contentType: res.headers.get("content-type") || "audio/mpeg",
    base64: buffer.toString("base64"),
    voiceId: config.voiceId,
    provider: "elevenlabs",
  };
}
