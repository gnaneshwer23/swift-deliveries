import { describe, expect, it } from "vitest";
import type { PilotActivation } from "./activation";
import {
  fulfillPaidActivation,
  isPsiCheckoutSession,
  parseCheckoutSessionForPsi,
  type PaidActivationRepository,
  type PaidStripeFields,
} from "./paid-activation";

const workspace = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const sessionId = "cs_test_psi_1";

function memoryRepo(seed: Array<PilotActivation & Partial<PaidStripeFields>> = []): {
  repo: PaidActivationRepository;
  rows: Array<PilotActivation & Partial<PaidStripeFields>>;
  state: { inserts: number };
} {
  const rows = [...seed];
  const state = { inserts: 0 };
  const repo: PaidActivationRepository = {
    async findByCheckoutSession(id) {
      return rows.find((row) => row.stripeCheckoutSessionId === id) ?? null;
    },
    async findByWorkspace(id) {
      return rows.find((row) => row.workspaceId === id) ?? null;
    },
    async insertPaid(row) {
      state.inserts += 1;
      if (rows.some((item) => item.stripeCheckoutSessionId === row.stripeCheckoutSessionId)) {
        throw new Error("duplicate session");
      }
      if (rows.some((item) => item.workspaceId === row.workspaceId)) {
        throw new Error("duplicate workspace");
      }
      rows.push(row);
      return row;
    },
  };
  return { repo, rows, state };
}

function baseInput(overrides: Partial<Parameters<typeof fulfillPaidActivation>[0]> = {}) {
  return {
    checkoutSessionId: sessionId,
    paymentStatus: "paid",
    userId: "user_1",
    workspaceId: workspace,
    plan: "founder",
    missionAllowance: 4,
    lookupKey: "founder_monthly",
    catalog: "psi",
    customerId: "cus_1",
    subscriptionId: "sub_1",
    environment: "sandbox" as const,
    activatedAt: "2026-10-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("PSI checkout session detection", () => {
  it("recognises catalog=psi and PSI lookup keys", () => {
    expect(isPsiCheckoutSession({ metadata: { catalog: "psi" } })).toBe(true);
    expect(isPsiCheckoutSession({ metadata: { lookupKey: "builder_monthly" } })).toBe(true);
    expect(isPsiCheckoutSession({ metadata: { priceId: "career_sprint_pass" } })).toBe(false);
  });
});

describe("fulfillPaidActivation", () => {
  it("refuses unpaid sessions", async () => {
    const { repo, state } = memoryRepo();
    const result = await fulfillPaidActivation(baseInput({ paymentStatus: "unpaid" }), repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unpaid");
    expect(state.inserts).toBe(0);
  });

  it("ignores career lookup keys", async () => {
    const { repo, state } = memoryRepo();
    const result = await fulfillPaidActivation(
      baseInput({ lookupKey: "career_sprint_pass", catalog: null, plan: "founder" }),
      repo,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("career");
    expect(state.inserts).toBe(0);
  });

  it("writes paymentTaken true with Founder allowance", async () => {
    const { repo, rows } = memoryRepo();
    const result = await fulfillPaidActivation(baseInput(), repo, {
      id: () => "act-1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.already).toBe(false);
    expect(result.activation.paymentTaken).toBe(true);
    expect(result.activation.plan).toBe("founder");
    expect(result.activation.missionAllowance).toBe(4);
    expect(result.activation.requestId).toBeNull();
    expect(rows[0]?.stripeCheckoutSessionId).toBe(sessionId);
  });

  it("is idempotent on webhook replay", async () => {
    const { repo, state } = memoryRepo();
    const first = await fulfillPaidActivation(baseInput(), repo, { id: () => "act-1" });
    const second = await fulfillPaidActivation(baseInput(), repo, { id: () => "act-2" });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.already).toBe(true);
      expect(second.activation.id).toBe(first.activation.id);
    }
    expect(state.inserts).toBe(1);
  });

  it("does not stack allowance when workspace already activated", async () => {
    const { repo, state } = memoryRepo([
      {
        id: "existing",
        requestId: null,
        workspaceId: workspace,
        plan: "builder",
        missionAllowance: 1,
        missionsConsumed: 0,
        paymentTaken: true,
        exhaustion: "block_next_billable_comparison",
        activatedBy: "stripe:other",
        activatedAt: "2026-10-01T00:00:00.000Z",
        stripeCheckoutSessionId: "cs_other",
      },
    ]);
    const result = await fulfillPaidActivation(baseInput(), repo);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("conflict");
    expect(state.inserts).toBe(0);
  });

  it("parses Checkout Session metadata for fulfilment", () => {
    const parsed = parseCheckoutSessionForPsi(
      {
        id: "cs_x",
        payment_status: "paid",
        customer: "cus_x",
        subscription: "sub_x",
        metadata: {
          catalog: "psi",
          userId: "u1",
          workspaceId: workspace,
          plan: "studio",
          missionAllowance: "12",
          lookupKey: "studio_monthly",
        },
      },
      "sandbox",
      "2026-10-28T12:00:00.000Z",
    );
    expect(parsed?.plan).toBe("studio");
    expect(parsed?.missionAllowance).toBe(12);
    expect(parsed?.lookupKey).toBe("studio_monthly");
  });
});
