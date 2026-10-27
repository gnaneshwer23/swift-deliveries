import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("stage generation records every call and never falls back quietly", () => {
  const input = {
    mission: { title: "Fixture", requestText: "Fixture request", clarificationAnswers: {} },
    task: {
      title: "PRD",
      description: "Write the PRD",
      acceptanceCriteria: "Complete",
      requiredSections: ["Requirements"],
      produces: "prd" as const,
    },
    upstream: [],
  };
  // Hermetic: no inherited provider settings reach these cases.
  beforeEach(() => {
    for (const k of [
      "DXSI_MODEL_ENABLED",
      "DXSI_PROVIDER",
      "DXSI_MODEL",
      "DXSI_OPENAI_MODEL",
      "DXSI_MODEL_ALLOWLIST",
      "OPENAI_API_KEY",
      "AI_GATEWAY_API_KEY",
      "VERCEL_OIDC_TOKEN",
      "OPENROUTER_API_KEY",
    ])
      vi.stubEnv(k, "");
  });
  const enable = () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("DXSI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubEnv("DXSI_OPENAI_MODEL", "fixture-model");
    vi.stubEnv("DXSI_MODEL_ALLOWLIST", "fixture-model");
  };
  const reply = (content: string, init: { status?: number } = {}) =>
    new Response(
      JSON.stringify({
        id: "chatcmpl-1",
        usage: { prompt_tokens: 120, completion_tokens: 40 },
        choices: [{ finish_reason: "stop", message: { content } }],
      }),
      { status: init.status ?? 200, headers: { "x-request-id": "req-abc" } },
    );

  it("uses a labelled simulated draft only when model mode is off", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "false");
    const r = await (await import("./model-runner.server")).generateStageContent(input);
    expect(r).toMatchObject({ mode: "simulated", note: "model mode not enabled" });
    expect(r.failure).toBeUndefined();
  });

  it("fails when model mode is on but the selected provider has no key", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    vi.stubEnv("DXSI_PROVIDER", "openai");
    const r = await (await import("./model-runner.server")).generateStageContent(input);
    expect(r).toMatchObject({ content: "", failure: { class: "not_configured" } });
  });

  it("fails when model mode is on with no provider credentials at all", async () => {
    vi.stubEnv("DXSI_MODEL_ENABLED", "true");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await (await import("./model-runner.server")).generateStageContent(input);
    expect(r).toMatchObject({ content: "", failure: { class: "not_configured" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a provider-side timeout (HTTP 408) as a timeout to retry", async () => {
    enable();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("slow", { status: 408 })),
    );
    const r = await (await import("./model-runner.server")).generateStageContent(input);
    expect(r.failure?.class).toBe("timeout");
  });

  it("records the provider, model, request id and tokens of a successful call", async () => {
    enable();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => reply("## Requirements\n- R1: Book a lesson slot.")),
    );
    const r = await (
      await import("./model-runner.server")
    ).generateStageContent({
      ...input,
      instructionVersion: "DX-023@1",
    });
    expect(r).toMatchObject({ mode: "model", instructionVersion: "DX-023@1" });
    expect(r.calls).toEqual([
      expect.objectContaining({
        provider: "openai",
        model: "fixture-model",
        requestId: "req-abc",
        inputTokens: 120,
        outputTokens: 40,
        failure: null,
      }),
    ]);
  });

  it("classes a provider error as a failure, with the call recorded", async () => {
    enable();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("busy", { status: 503 })),
    );
    const r = await (await import("./model-runner.server")).generateStageContent(input);
    expect(r.failure?.class).toBe("provider_error");
    expect(r.calls).toHaveLength(1);
  });

  it("fails after two attempts that miss the checks, instead of using a simulated draft", async () => {
    enable();
    const fetchMock = vi.fn(async () => reply("## Something else\nnot the contract"));
    vi.stubGlobal("fetch", fetchMock);
    const r = await (
      await import("./model-runner.server")
    ).generateStageContent({
      ...input,
      extraCheck: () => null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(r).toMatchObject({ content: "", failure: { class: "contract_failed" } });
    expect(r.calls).toHaveLength(2);
  });
});
