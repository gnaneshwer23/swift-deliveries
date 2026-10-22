import { afterEach, describe, expect, it, vi } from "vitest";
import { generateJson, resolveProvider } from "./model-runner.server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("direct model provider boundary", () => {
  it("requires credentials for an explicitly selected provider", () => {
    expect(() =>
      resolveProvider({
        DXSI_MODEL_ENABLED: "true",
        DXSI_PROVIDER: "openai",
        AI_GATEWAY_API_KEY: "unused",
      }),
    ).toThrow(/no configured credentials/);
  });
  it("rejects gateway model IDs for direct OpenAI calls", () => {
    expect(() =>
      resolveProvider({
        DXSI_MODEL_ENABLED: "true",
        OPENAI_API_KEY: "test",
        DXSI_MODEL: "anthropic/example",
      }),
    ).toThrow(/gateway prefix/);
  });
  it("allows a provider-specific model to override a shared gateway ID", () => {
    expect(
      resolveProvider({
        DXSI_MODEL_ENABLED: "true",
        OPENAI_API_KEY: "test",
        DXSI_MODEL: "anthropic/example",
        DXSI_OPENAI_MODEL: "gpt-4.1",
      })?.model,
    ).toBe("gpt-4.1");
  });
  it.each([
    { status: 401 },
    { status: 429 },
    { status: 500 },
    { body: { choices: [{ finish_reason: "length", message: { content: '{"ok":true}' } }] } },
    { body: { choices: [{ finish_reason: "stop", message: { refusal: "no" } }] } },
    { body: { choices: [{ finish_reason: "stop", message: { content: null } }] } },
  ])("does not accept failed, refused or incomplete output %j", async ({ status, body }) => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubEnv("DXSI_PROVIDER", "openai");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify(body ?? {}), { status: status ?? 200 })),
    );
    const result = await generateJson({
      system: "JSON only",
      user: "Draft options",
      screenText: "A product",
      validate: () => ({ ok: true, value: "accepted" }),
    });
    expect(result.ok).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("accepts complete output after validation", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubEnv("DXSI_PROVIDER", "openai");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ finish_reason: "stop", message: { content: '{"option":"A"}' } }],
          }),
        ),
      ),
    );
    const result = await generateJson({
      system: "JSON only",
      user: "Draft options",
      screenText: "A product",
      validate: (text) => ({ ok: true, value: JSON.parse(text) }),
    });
    expect(result).toMatchObject({ ok: true, value: { option: "A" } });
  });
});
