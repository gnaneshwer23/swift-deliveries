import { describe, expect, it } from "vitest";
import { buildConnections, type ConnectionsInput } from "./connections";
import { readConnections } from "./connections.server";

const NOW = Date.parse("2026-11-03T12:00:00Z");
const SECRET = "SENTINEL-SECRET-VALUE";

const off: ConnectionsInput = {
  model: { enabled: false, provider: null, model: null, problem: null },
  research: { configured: false, provider: null },
  voice: { enabled: false, problem: null },
  payments: { ok: false, message: "Checkout is not live." },
  checkoutFlagOn: false,
  schedulerConfigured: false,
  googleSignIn: false,
};

const byId = (input: ConnectionsInput) =>
  Object.fromEntries(buildConnections(input, NOW).rows.map((r) => [r.id, r]));

describe("buildConnections", () => {
  it("with nothing set up, says what happens instead and reports no problems", () => {
    const rows = byId(off);
    expect(rows["model"]?.status).toBe("off");
    expect(rows["model"]?.now).toMatch(/Simulated draft/);
    expect(rows["research"]?.now).toMatch(/recorded as gaps; no sources are invented/);
    expect(rows["voice"]?.now).toMatch(/microphone is never used/);
    expect(rows["payments"]?.label).toBe("Off");
    expect(rows["scheduler"]?.now).toMatch(/waits until you open the project/);
    // Listen always uses the browser's own speech.
    expect(rows["listen"]?.status).toBe("on");
    expect(Object.values(rows).every((r) => r.problem === null)).toBe(true);
  });

  it("names the provider and model when they are on", () => {
    const rows = byId({
      ...off,
      model: { enabled: true, provider: "openai", model: "model-x", problem: null },
      research: { configured: true, provider: "tavily" },
      schedulerConfigured: true,
    });
    expect(rows["model"]?.label).toBe("On · model-x");
    expect(rows["research"]?.label).toBe("On · tavily");
    expect(rows["scheduler"]?.label).toBe("On · every 5 minutes");
  });

  it("separates test-mode payments from live, and a paused checkout from one that is off", () => {
    expect(
      byId({ ...off, payments: { ok: true, environment: "sandbox" } })["payments"]?.label,
    ).toBe("Test mode · Stripe");
    expect(byId({ ...off, payments: { ok: true, environment: "live" } })["payments"]?.label).toBe(
      "On · Stripe",
    );
    const paused = byId({
      ...off,
      checkoutFlagOn: true,
      payments: { ok: false, message: "Payments are paused (kill switch)." },
    })["payments"];
    expect(paused?.status).toBe("problem");
    expect(paused?.problem).toMatch(/kill switch/);
  });

  it("flags a misconfigured model and voice as problems", () => {
    const rows = byId({
      ...off,
      model: { enabled: false, provider: null, model: null, problem: "DXSI_MODEL is not allowed." },
      voice: { enabled: false, problem: "Voice is on but OPENAI_API_KEY is not set." },
    });
    expect(rows["model"]?.status).toBe("problem");
    expect(rows["voice"]?.status).toBe("problem");
  });

  it("dates the check and states its method", () => {
    const summary = buildConnections(off, NOW);
    expect(summary.checkedAt).toBe("2026-11-03T12:00:00.000Z");
    expect(summary.method).toMatch(/does not make a test call/);
  });
});

describe("readConnections", () => {
  it("never returns a key or secret value, even when every service is set up", () => {
    const env = {
      DXSI_MODEL_ENABLED: "true",
      DXSI_PROVIDER: "openai",
      DXSI_MODEL: "model-x",
      DXSI_MODEL_ALLOWLIST: "model-x,transcribe-x",
      OPENAI_API_KEY: `sk-${SECRET}`,
      DXSI_VOICE_ENABLED: "true",
      DXSI_VOICE_TRANSCRIBE_MODEL: "transcribe-x",
      TAVILY_API_KEY: `tvly-${SECRET}`,
      VITE_PAYMENTS_CHECKOUT_ENABLED: "true",
      VITE_PAYMENTS_CLIENT_TOKEN: `pk_test_${SECRET}`,
      STRIPE_SANDBOX_API_KEY: `rk_test_${SECRET}`,
      CRON_SECRET: SECRET,
    };
    const summary = readConnections(env, true, NOW);
    const rows = Object.fromEntries(summary.rows.map((r) => [r.id, r]));
    expect(rows["model"]?.label).toBe("On · model-x");
    expect(rows["voice"]?.status).toBe("on");
    expect(rows["research"]?.label).toBe("On · tavily");
    expect(rows["payments"]?.label).toBe("Test mode · Stripe");
    expect(rows["scheduler"]?.status).toBe("on");
    expect(rows["google"]?.status).toBe("on");
    expect(JSON.stringify(summary)).not.toContain(SECRET);
  });

  it("reports a broken configuration by variable name only", () => {
    const summary = readConnections(
      {
        DXSI_MODEL_ENABLED: "true",
        DXSI_PROVIDER: "openai",
        DXSI_MODEL: "not-allowed",
        DXSI_MODEL_ALLOWLIST: "model-x",
        OPENAI_API_KEY: `sk-${SECRET}`,
      },
      false,
      NOW,
    );
    const model = summary.rows.find((r) => r.id === "model");
    expect(model?.status).toBe("problem");
    expect(model?.problem).toBeTruthy();
    expect(JSON.stringify(summary)).not.toContain(SECRET);
  });
});
