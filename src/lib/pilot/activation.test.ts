import { describe, expect, it } from "vitest";
import {
  activateEnquiry,
  isPilotOperator,
  type ActivationRepository,
  type PilotActivation,
} from "./activation";
import {
  ACCOUNT_DOES_NOT_ACTIVATE,
  ALLOWANCE_EXHAUSTED_COPY,
  CHECKOUT_NOT_LIVE_COPY,
  CHECKOUT_SANDBOX_COPY,
  MANUAL_ACTIVATION_COPY,
  pricingCheckoutCopy,
  PUBLISHED_OPERATOR_EMAIL,
  SUPPORT_RECOVERY_COPY,
} from "./commercial-copy";
import type { StoredPilotRequest } from "./model";

const alpha = "11111111-1111-4111-8111-111111111111";
const beta = "22222222-2222-4222-8222-222222222222";
const requestA = "33333333-3333-4333-8333-333333333333";
const requestB = "44444444-4444-4444-8444-444444444444";

const brief = {
  product: "Northwind",
  audience: "Founders setting up a workspace",
  problem: "Which onboarding change should we investigate first?",
  objective: "A decision pack and an experiment brief.",
  constraints: "",
  evidence: "",
};

function request(id: string): StoredPilotRequest {
  return {
    id,
    reference: "DX-TEST1234",
    plan: "founder",
    contactName: "Ada Lovelace",
    contactEmail: "ada@example.com",
    organisation: "",
    brief,
    consentAt: "2026-10-24T00:00:00.000Z",
    status: "received",
    followUpNote: "",
    ownerUserId: null,
    claimTokenHash: "hash",
    briefFingerprint: "print",
    createdAt: "2026-10-24T00:00:00.000Z",
  };
}

function memoryRepo(seed: StoredPilotRequest[] = [request(requestA), request(requestB)]): {
  repo: ActivationRepository;
  activations: PilotActivation[];
  inserts: number;
} {
  const requests = [...seed];
  const activations: PilotActivation[] = [];
  const state = { inserts: 0 };
  const repo: ActivationRepository = {
    async findRequest(id) {
      return requests.find((row) => row.id === id) ?? null;
    },
    async findByRequest(id) {
      return activations.find((row) => row.requestId === id) ?? null;
    },
    async findByWorkspace(workspaceId) {
      return activations.find((row) => row.workspaceId === workspaceId) ?? null;
    },
    async insert(row) {
      state.inserts += 1;
      if (activations.some((item) => item.requestId === row.requestId)) {
        throw new Error("duplicate request");
      }
      if (activations.some((item) => item.workspaceId === row.workspaceId)) {
        throw new Error("duplicate workspace");
      }
      const stored = { ...row, paymentTaken: false as const };
      activations.push(stored);
      return stored;
    },
  };
  return {
    repo,
    activations,
    inserts: 0,
    get insertsCount() {
      return state.inserts;
    },
  } as {
    repo: ActivationRepository;
    activations: PilotActivation[];
    inserts: number;
  };
}

describe("pilot operator gate", () => {
  it("allows the same people as the pilot request queue", () => {
    expect(
      isPilotOperator({ email: "member@example.com", configuredEmails: undefined, roles: [] }),
    ).toBe(false);
    expect(
      isPilotOperator({
        email: "member@example.com",
        configuredEmails: undefined,
        roles: ["user"],
      }),
    ).toBe(false);
    expect(isPilotOperator({ email: null, configuredEmails: undefined, roles: ["admin"] })).toBe(
      true,
    );
    expect(
      isPilotOperator({ email: null, configuredEmails: "other@example.com", roles: ["moderator"] }),
    ).toBe(true);
    expect(
      isPilotOperator({
        email: ` ${PUBLISHED_OPERATOR_EMAIL.toUpperCase()} `,
        configuredEmails: undefined,
        roles: [],
      }),
    ).toBe(true);
    expect(
      isPilotOperator({
        email: PUBLISHED_OPERATOR_EMAIL,
        configuredEmails: "other@example.com",
        roles: [],
      }),
    ).toBe(false);
    expect(
      isPilotOperator({
        email: "Other@Example.com",
        configuredEmails: "other@example.com, second@example.com",
        roles: [],
      }),
    ).toBe(true);
  });
});

describe("manual pilot activation", () => {
  it("refuses an unauthorised caller and does not store a record", async () => {
    const { repo, activations } = memoryRepo();
    const result = await activateEnquiry(
      {
        authorised: false,
        requestId: requestA,
        workspaceId: alpha,
        plan: "founder",
        missionAllowance: 1,
        actorId: "intruder",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
    );
    expect(result.ok).toBe(false);
    expect(activations).toHaveLength(0);
  });

  it("records one scoped plan for one workspace without a payment", async () => {
    const { repo, activations } = memoryRepo();
    const missions = [{ id: "mission-a", workspaceId: alpha, evidence: "kept" }];
    const result = await activateEnquiry(
      {
        authorised: true,
        requestId: requestA,
        workspaceId: alpha.toUpperCase(),
        plan: "builder",
        missionAllowance: 1,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
      { workspaceExists: async () => true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.already).toBe(false);
    expect(result.activation.paymentTaken).toBe(false);
    expect(result.activation.plan).toBe("builder");
    expect(result.activation.workspaceId).toBe(alpha);
    expect(result.activation.missionAllowance).toBe(1);
    expect(result.activation.exhaustion).toBe("block_next_billable_comparison");
    expect(JSON.stringify(result.activation)).not.toMatch(/ch_|pi_|sub_/);
    const again = await activateEnquiry(
      {
        authorised: true,
        requestId: requestA,
        workspaceId: alpha,
        plan: "studio",
        missionAllowance: 12,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T13:00:00.000Z",
    );
    expect(again.ok && again.already && again.activation.missionAllowance).toBe(1);
    expect(again.ok && again.activation.plan).toBe("builder");
    expect(activations).toHaveLength(1);
    expect(missions).toEqual([{ id: "mission-a", workspaceId: alpha, evidence: "kept" }]);
  });

  it("does not activate a missing workspace or a second enquiry on the same workspace", async () => {
    const { repo } = memoryRepo();
    const missing = await activateEnquiry(
      {
        authorised: true,
        requestId: requestA,
        workspaceId: alpha,
        plan: "founder",
        missionAllowance: 2,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
      { workspaceExists: async () => false },
    );
    expect(missing).toEqual({
      ok: false,
      message: "That workspace was not found. Nothing was activated.",
    });
    await activateEnquiry(
      {
        authorised: true,
        requestId: requestA,
        workspaceId: alpha,
        plan: "founder",
        missionAllowance: 2,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
      { workspaceExists: async () => true },
    );
    const clash = await activateEnquiry(
      {
        authorised: true,
        requestId: requestB,
        workspaceId: alpha,
        plan: "studio",
        missionAllowance: 3,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:05:00.000Z",
      { workspaceExists: async () => true },
    );
    expect(clash.ok).toBe(false);
  });

  it("keeps activations isolated between workspaces without modifying missions", async () => {
    const { repo } = memoryRepo();
    const missions = [
      { id: "mission-a", workspaceId: alpha, body: "alpha work" },
      { id: "mission-b", workspaceId: beta, body: "beta work" },
    ];
    await activateEnquiry(
      {
        authorised: true,
        requestId: requestA,
        workspaceId: alpha,
        plan: "founder",
        missionAllowance: 1,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
    );
    await activateEnquiry(
      {
        authorised: true,
        requestId: requestB,
        workspaceId: beta,
        plan: "studio",
        missionAllowance: 2,
        actorId: "operator-1",
      },
      repo,
      () => "2026-10-24T12:00:00.000Z",
    );
    const alphaRow = await repo.findByWorkspace(alpha);
    expect(alphaRow?.missionAllowance).toBe(1);
    expect(alphaRow?.missionsConsumed).toBe(0);
    expect((await repo.findByWorkspace(beta))?.missionAllowance).toBe(2);
    expect(await repo.findByWorkspace(beta)).not.toMatchObject({ workspaceId: alpha });
    expect(missions).toEqual([
      { id: "mission-a", workspaceId: alpha, body: "alpha work" },
      { id: "mission-b", workspaceId: beta, body: "beta work" },
    ]);
  });
});

describe("commercial statements", () => {
  it("keeps account creation, manual activation, checkout and support honest", () => {
    const text = [
      ACCOUNT_DOES_NOT_ACTIVATE,
      MANUAL_ACTIVATION_COPY,
      CHECKOUT_NOT_LIVE_COPY,
      ALLOWANCE_EXHAUSTED_COPY,
      SUPPORT_RECOVERY_COPY,
    ].join(" ");
    expect(text).toContain(PUBLISHED_OPERATOR_EMAIL);
    expect(text.toLowerCase()).not.toContain("within");
    expect(text.toLowerCase()).not.toContain("business day");
    expect(text.toLowerCase()).not.toContain("buy");
    expect(text.toLowerCase()).not.toContain("purchase");
    expect(CHECKOUT_NOT_LIVE_COPY).toContain("not live");
    expect(ACCOUNT_DOES_NOT_ACTIVATE).toContain("does not activate");
    expect(pricingCheckoutCopy({ checkoutEnabled: false, sandbox: false })).toBe(
      CHECKOUT_NOT_LIVE_COPY,
    );
    expect(pricingCheckoutCopy({ checkoutEnabled: true, sandbox: true })).toBe(
      CHECKOUT_SANDBOX_COPY,
    );
    expect(CHECKOUT_SANDBOX_COPY.toLowerCase()).toContain("sandbox");
  });
});
