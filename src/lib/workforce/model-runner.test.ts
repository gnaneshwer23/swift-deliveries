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
        DXSI_MODEL_ALLOWLIST: "anthropic/example",
      }),
    ).toThrow(/gateway prefix/);
  });
  it("allows a provider-specific model to override a shared gateway ID", () => {
    expect(
      resolveProvider({
        DXSI_MODEL_ENABLED: "true",
        OPENAI_API_KEY: "test",
        DXSI_MODEL: "anthropic/example",
        DXSI_OPENAI_MODEL: "openai-test-model",
        DXSI_MODEL_ALLOWLIST: "anthropic/example,openai-test-model",
      })?.model,
    ).toBe("openai-test-model");
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
    vi.stubEnv("DXSI_MODEL", "openai-test-model");
    vi.stubEnv("DXSI_MODEL_ALLOWLIST", "openai-test-model");
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
    vi.stubEnv("DXSI_MODEL", "openai-test-model");
    vi.stubEnv("DXSI_MODEL_ALLOWLIST", "openai-test-model");
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

  it("has no built-in model: a model must be named and allowed", () => {
    const base = { DXSI_MODEL_ENABLED: "true", OPENAI_API_KEY: "test" };
    expect(() => resolveProvider(base)).toThrow(/DXSI_MODEL is not set/);
    expect(() => resolveProvider({ ...base, DXSI_MODEL: "openai-test-model" })).toThrow(
      /DXSI_MODEL_ALLOWLIST is empty/,
    );
    expect(() =>
      resolveProvider({
        ...base,
        DXSI_MODEL: "openai-test-model",
        DXSI_MODEL_ALLOWLIST: "something-else",
      }),
    ).toThrow(/not in DXSI_MODEL_ALLOWLIST/);
  });

  it("refuses a decision model that is not allowed, without calling the provider", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubEnv("DXSI_MODEL", "openai-test-model");
    vi.stubEnv("DXSI_MODEL_ALLOWLIST", "openai-test-model");
    vi.stubEnv("DXSI_DECISION_MODEL", "unlisted-model");
    vi.stubGlobal("fetch", vi.fn());
    const result = await generateJson({
      system: "JSON only",
      user: "Draft options",
      screenText: "A product",
      validate: () => ({ ok: true, value: "accepted" }),
    });
    expect(result).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/not in DXSI_MODEL_ALLOWLIST/),
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses a gateway-prefixed decision model on direct OpenAI", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubEnv("DXSI_MODEL", "openai-test-model");
    vi.stubEnv("DXSI_DECISION_MODEL", "anthropic/example");
    vi.stubEnv("DXSI_MODEL_ALLOWLIST", "openai-test-model,anthropic/example");
    vi.stubGlobal("fetch", vi.fn());
    const result = await generateJson({
      system: "JSON only",
      user: "Draft options",
      screenText: "A product",
      validate: () => ({ ok: true, value: "accepted" }),
    });
    expect(result).toMatchObject({ ok: false, reason: expect.stringMatching(/gateway prefix/) });
    expect(fetch).not.toHaveBeenCalled();
  });
});
