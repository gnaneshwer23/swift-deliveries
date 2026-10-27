import { describe, expect, it } from "vitest";
import {
  mintVoiceSecret,
  safetyIdentifier,
  transcriptionSession,
  voiceConfig,
  VOICE_SECRET_SECONDS,
} from "./voice.server";

const on = {
  DXSI_VOICE_ENABLED: "true",
  OPENAI_API_KEY: "sk-test",
  DXSI_VOICE_TRANSCRIBE_MODEL: "transcribe-test",
  DXSI_MODEL_ALLOWLIST: "other, transcribe-test",
};

describe("voice configuration", () => {
  it("is off unless switched on", () => {
    expect(voiceConfig({})).toEqual({ enabled: false, problem: null });
    expect(voiceConfig({ ...on, DXSI_VOICE_ENABLED: "yes" })).toEqual({
      enabled: false,
      problem: null,
    });
  });

  it("names what is missing, and never guesses a model", () => {
    expect(voiceConfig({ ...on, OPENAI_API_KEY: " " })).toEqual({
      enabled: false,
      problem: "Voice is on but OPENAI_API_KEY is not set.",
    });
    expect(voiceConfig({ ...on, DXSI_VOICE_TRANSCRIBE_MODEL: "" })).toEqual({
      enabled: false,
      problem: "Voice is on but DXSI_VOICE_TRANSCRIBE_MODEL is not set.",
    });
    expect(voiceConfig({ ...on, DXSI_MODEL_ALLOWLIST: "other" })).toEqual({
      enabled: false,
      problem:
        'Model "transcribe-test" from DXSI_VOICE_TRANSCRIBE_MODEL is not in DXSI_MODEL_ALLOWLIST.',
    });
  });

  it("is on with a key and an allowed model", () => {
    expect(voiceConfig(on)).toEqual({ enabled: true, model: "transcribe-test", apiKey: "sk-test" });
  });
});

describe("minting a session token", () => {
  it("asks only for a short-lived, transcription-only session with push-to-talk", () => {
    expect(transcriptionSession("m")).toEqual({
      expires_after: { anchor: "created_at", seconds: VOICE_SECRET_SECONDS },
      session: {
        type: "transcription",
        audio: { input: { transcription: { model: "m" }, turn_detection: null } },
      },
    });
  });

  it("sends the key only to the provider, with a hashed user id, and returns only the token", async () => {
    const seen: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ value: "ek_123", expires_at: 1700000000, session: {} }));
    }) as unknown as typeof fetch;
    const config = voiceConfig(on);
    if (!config.enabled) throw new Error("expected voice on");
    const secret = await mintVoiceSecret(config, "user-1", fakeFetch);
    expect(secret).toEqual({ value: "ek_123", expiresAt: 1700000000 });
    expect(seen[0]!.url).toBe("https://api.openai.com/v1/realtime/client_secrets");
    const headers = seen[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-test");
    expect(headers["OpenAI-Safety-Identifier"]).toBe(safetyIdentifier("user-1"));
    expect(headers["OpenAI-Safety-Identifier"]).not.toContain("user-1");
    expect(JSON.parse(String(seen[0]!.init.body))).toEqual(transcriptionSession("transcribe-test"));
  });

  it("reports a refusal without passing on the provider's message", async () => {
    const config = voiceConfig(on);
    if (!config.enabled) throw new Error("expected voice on");
    const refuse = (async () =>
      new Response('{"error":{"message":"bad key sk-test"}}', {
        status: 401,
      })) as unknown as typeof fetch;
    await expect(mintVoiceSecret(config, "u", refuse)).rejects.toThrow(
      /^The voice provider refused the session \(HTTP 401\)\.$/,
    );
    const empty = (async () => new Response("{}")) as unknown as typeof fetch;
    await expect(mintVoiceSecret(config, "u", empty)).rejects.toThrow(/no session token/);
  });
});
