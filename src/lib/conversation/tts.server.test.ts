import { describe, expect, it } from "vitest";
import {
  DEFAULT_TTS_VOICE_ID,
  synthesizeSpeech,
  ttsConfig,
  ttsVoiceId,
} from "./tts.server";

describe("TTS config", () => {
  it("defaults to the founder voice id", () => {
    expect(ttsVoiceId({})).toBe(DEFAULT_TTS_VOICE_ID);
    expect(ttsVoiceId({ DXSI_TTS_VOICE_ID: "Aa6nEBJJMKJwJkCx8VU2" })).toBe(
      "Aa6nEBJJMKJwJkCx8VU2",
    );
  });

  it("stays off until explicitly enabled with a key", () => {
    expect(ttsConfig({}).enabled).toBe(false);
    expect(
      ttsConfig({ DXSI_TTS_ENABLED: "true", ELEVENLABS_API_KEY: "" }).enabled,
    ).toBe(false);
    const on = ttsConfig({
      DXSI_TTS_ENABLED: "true",
      ELEVENLABS_API_KEY: "sk-test",
    });
    expect(on.enabled).toBe(true);
    if (on.enabled) expect(on.voiceId).toBe(DEFAULT_TTS_VOICE_ID);
  });
});

describe("synthesizeSpeech", () => {
  it("posts to ElevenLabs with the configured voice", async () => {
    const calls: Array<{ url: string; headers: HeadersInit; body: string }> = [];
    const audio = await synthesizeSpeech(
      "Hello founder",
      {
        enabled: true,
        apiKey: "sk-test",
        voiceId: DEFAULT_TTS_VOICE_ID,
        modelId: "eleven_multilingual_v2",
      },
      async (url, init) => {
        calls.push({
          url: String(url),
          headers: init?.headers ?? {},
          body: String(init?.body ?? ""),
        });
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "audio/mpeg" },
        });
      },
    );
    expect(calls[0]?.url).toContain(DEFAULT_TTS_VOICE_ID);
    expect(audio.voiceId).toBe(DEFAULT_TTS_VOICE_ID);
    expect(audio.base64.length).toBeGreaterThan(0);
  });
});
