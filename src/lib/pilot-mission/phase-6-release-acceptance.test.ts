/**
 * Phase 6 release acceptance — automated journey (fixtures only).
 *
 * FIXTURE: `MemoryStore` + deterministic `generator` stubs. No live Tavily/Exa/OpenAI/Stripe.
 * Live provider, signed-in browser, and Neon persistence are documented as unverified in
 * `docs/psi-phase-6-release-acceptance.md`.
 */
import { describe, expect, it } from "vitest";
import {
  buildCommerceDisclosureMarkdown,
  commerceHardStopMessage,
  commerceSnapshot,
} from "./commerce";
import { authorisedDecisionPackMarkdown } from "./export-snapshot";
import { buildIntelligenceCanvas } from "./intelligence-canvas";
import { buildMissionInspection } from "./mission-inspection";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { MemoryStore, SupervisedMissionService, UsageLimitError } from "./service";
import { buildSupervisedZip } from "./supervised-zip";
import { nextRequiredAction } from "./types";
import { deriveAgentRecommendation } from "./verdict";

const FIXTURE_BRIEF = {
  question: "Which onboarding change should we ship first?",
  audience: "Founders in a pilot workspace",
  outcome: "A decision pack, experiment brief, and downloadable record.",
  constraints: "No customer contact; no deployment in this acceptance run.",
};

const FIXTURE_GENERATOR_NOT_CONFIGURED = {
  cost: 0,
  run: async () => ({
    ran: false,
    label: "not run — provider not configured",
    provider: null,
    model: null,
    output: "",
    citations: [] as string[],
    gaps: ["No observed completion rate."],
  }),
};

function fixtureOptionsJson(evidenceIds: string[]) {
  const basis = evidenceIds[0] ?? "e-fixture";
  return JSON.stringify({
    options: [
      {
        id: "fixture-option-a",
        title: "Fixture bounded test",
        tradeoff: "Acceptance fixture only.",
        basis,
      },
      {
        id: "fixture-option-b",
        title: "Fixture hold path",
        tradeoff: "Wait for more fixture evidence.",
        basis: evidenceIds[1] ?? basis,
      },
    ],
    citations: [basis],
    gaps: [],
  });
}

const FIXTURE_GENERATOR_FAIL_THEN_OK = (
  failFirst: { current: boolean },
  evidenceIds: string[],
) => ({
  cost: 1,
  run: async () => {
    if (failFirst.current) throw new Error("provider timeout");
    const output = fixtureOptionsJson(evidenceIds);
    return {
      ran: true,
      label: "fixture-model-run",
      provider: "fixture",
      model: "fixture-v1",
      output,
      citations: [evidenceIds[0] ?? "e-fixture"],
      gaps: [],
    };
  },
});

describe("Phase 6 — release acceptance (MemoryStore fixtures)", () => {
  it("submit → approve → leave → return → inspect → decide → download", async () => {
    const store = new MemoryStore();
    const service = new SupervisedMissionService(store);

    const submitted = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      brief: FIXTURE_BRIEF,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    expect(submitted.stage).toBe("brief");
    expect(nextRequiredAction(submitted).id).toBe("approve_plan");

    const approved = await service.approvePlan({
      workspaceId: "fixture-ws",
      id: submitted.id,
      actorId: "fixture-owner",
      nowMs: 2_000,
      env: {},
    });
    expect(approved.researchPassCompletedAt).toBeTruthy();
    expect(nextRequiredAction(approved).id).toBe("compare");

    const canvasAfterApprove = buildIntelligenceCanvas(approved);
    expect(canvasAfterApprove.leaveAllowed.toLowerCase()).toContain("leave");

    const returned = await new SupervisedMissionService(store).get("fixture-ws", submitted.id);
    expect(returned?.version).toBe(approved.version);
    expect(returned?.activity.some((e) => e.kind === "research.pass.completed")).toBe(true);

    const inspection = buildMissionInspection(returned!);
    expect(inspection.hasTeamRecord).toBe(true);
    expect(inspection.evidenceOnRecord.length).toBeGreaterThan(0);

    let mission = await service.saveEvidence({
      workspaceId: "fixture-ws",
      id: submitted.id,
      items: [
        {
          statement: "Setup asks for a goal before the product question is saved.",
          source: "Fixture founder note",
          classification: "supplied",
        },
      ],
      nowMs: 3_000,
    });

    const compared = await service.runAlternatives({
      workspaceId: "fixture-ws",
      id: mission.id,
      workerId: "fixture-worker",
      nowMs: 4_000,
      generator: FIXTURE_GENERATOR_NOT_CONFIGURED,
    });
    mission = compared.mission;
    expect(compared.chargedUnits).toBe(0);
    expect(mission.proposal?.generation.label).toMatch(/not run/i);

    const proposal = mission.proposal!;
    mission = await service.decide({
      workspaceId: "fixture-ws",
      id: mission.id,
      claim: {
        action: proposal.action,
        version: proposal.version,
        scopeHash: proposal.scopeHash,
        optionId: proposal.options[0]!.id,
      },
      choice: "accept",
      note: "Fixture owner decision.",
      actorId: "fixture-owner",
      nowMs: 5_000,
    });
    expect(mission.approval?.humanNextPath).toBeTruthy();

    mission = await service.recordExpectation({
      workspaceId: "fixture-ws",
      id: mission.id,
      hypothesis: "Shorter setup improves completion.",
      expectedMetric: "Setup completion rate",
      baseline: "Unknown — fixture",
      observationWindow: "Two weeks",
      actorId: "fixture-owner",
      nowMs: 5_500,
    });
    mission = await service.prepareArtefact({
      workspaceId: "fixture-ws",
      id: mission.id,
      nowMs: 6_000,
    });
    mission = await service.exportMission({
      workspaceId: "fixture-ws",
      id: mission.id,
      nowMs: 7_000,
    });

    expect(mission.exportBody).toBeTruthy();
    expect(mission.exportPdfBase64).toBeTruthy();
    const briefing = buildPmBriefingPack(mission);
    expect(briefing.ready).toBe(true);
    expect(briefing.assessments.length).toBeGreaterThan(0);

    const zip = buildSupervisedZip(mission);
    expect(zip.files.some((f) => f.path.includes("decision-pack/decision-pack.md"))).toBe(true);
    expect(authorisedDecisionPackMarkdown(mission)).toContain("Honesty");
  });

  it("recovers after a provider failure without double-charging (fixture generator)", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      brief: FIXTURE_BRIEF,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    await service.approvePlan({
      workspaceId: "fixture-ws",
      id: mission.id,
      actorId: "fixture-owner",
      nowMs: 2_000,
      env: {},
    });
    const withEvidence = await service.saveEvidence({
      workspaceId: "fixture-ws",
      id: mission.id,
      items: [
        {
          statement: "Fixture evidence line.",
          source: "Fixture",
          classification: "supplied",
        },
        {
          statement: "Fixture gap line.",
          source: "",
          classification: "gap",
        },
      ],
      nowMs: 3_000,
    });
    const evidenceIds = withEvidence.evidence.map((e) => e.id);

    const failFlag = { current: true };
    const run = () =>
      service.runAlternatives({
        workspaceId: "fixture-ws",
        id: mission.id,
        workerId: crypto.randomUUID(),
        nowMs: 10_000,
        generator: FIXTURE_GENERATOR_FAIL_THEN_OK(failFlag, evidenceIds),
      });

    await expect(run()).rejects.toThrow(/provider timeout/);
    const failed = await service.get("fixture-ws", mission.id);
    expect(failed?.job.status).toBe("failed");
    expect(failed?.usageConsumed).toBe(0);

    failFlag.current = false;
    const recovered = await run();
    expect(recovered.chargedUnits).toBe(1);
    expect(recovered.mission.spendRecords).toHaveLength(1);

    const reload = await run();
    expect(reload.chargedUnits).toBe(0);
    expect(reload.mission.usageConsumed).toBe(1);
  });

  it("blocks the next billable comparison at workspace ceiling but keeps mission readable", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      brief: FIXTURE_BRIEF,
      usageCeiling: 1,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "fixture-ws",
      id: mission.id,
      actorId: "fixture-owner",
      nowMs: 2_000,
      env: {},
    });
    const withEvidence = await service.saveEvidence({
      workspaceId: "fixture-ws",
      id: mission.id,
      items: [
        {
          statement: "Fixture evidence.",
          source: "Fixture",
          classification: "supplied",
        },
        {
          statement: "Fixture unknown.",
          source: "",
          classification: "gap",
        },
      ],
      nowMs: 3_000,
    });
    const evidenceIds = withEvidence.evidence.map((e) => e.id);
    const output = fixtureOptionsJson(evidenceIds);

    const firstCompare = await service.runAlternatives({
      workspaceId: "fixture-ws",
      id: mission.id,
      workerId: "w1",
      nowMs: 4_000,
      generator: {
        cost: 1,
        run: async () => ({
          ran: true,
          label: "fixture",
          provider: "fixture",
          model: "fixture",
          output,
          citations: [evidenceIds[0]!],
          gaps: [],
        }),
      },
    });
    expect(firstCompare.chargedUnits).toBe(1);

    await service.saveEvidence({
      workspaceId: "fixture-ws",
      id: mission.id,
      items: [
        ...withEvidence.evidence.map((e) => ({
          statement: e.statement,
          source: e.source,
          classification: e.classification,
        })),
        {
          statement: "Additional fixture note after first comparison.",
          source: "Fixture",
          classification: "supplied",
        },
      ],
      nowMs: 4_500,
    });

    await expect(
      service.runAlternatives({
        workspaceId: "fixture-ws",
        id: mission.id,
        workerId: "w2",
        nowMs: 5_000,
        generator: {
          cost: 1,
          run: async () => ({
            ran: true,
            label: "fixture-retry",
            provider: "fixture",
            model: "fixture",
            output,
            citations: [evidenceIds[0]!],
            gaps: [],
          }),
        },
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);

    const readable = await service.get("fixture-ws", mission.id);
    expect(readable?.brief.question).toBe(FIXTURE_BRIEF.question);
    const snap = commerceSnapshot(readable!);
    expect(snap.hardStopped).toBe(true);
    expect(commerceHardStopMessage(readable!)).toMatch(/allowance is exhausted/i);
  });

  it("labels provider research failure as execution-limited, not substance pause", () => {
    const draft = deriveAgentRecommendation({
      id: "fixture",
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      version: 1,
      stage: "alternatives",
      brief: FIXTURE_BRIEF,
      evidence: [],
      proposal: null,
      approval: null,
      invalidatedApprovals: [],
      artefact: null,
      prototype: null,
      exportBody: null,
      exportPdfBase64: null,
      job: {
        status: "idle",
        ownerId: null,
        leaseUntil: null,
        attempts: 0,
        lastError: null,
        idempotencyKey: null,
      },
      usageCeiling: 4,
      usageConsumed: 0,
      spendRecords: [],
      expectation: null,
      observation: null,
      reviews: [],
      followUp: null,
      origin: null,
      researchMode: "combined",
      researchGaps: ["Web research provider not configured"],
      researchPassCompletedAt: new Date().toISOString(),
      researchProvider: null,
      team: null,
      continuationPlan: null,
      caseRoom: null,
      teamCollaboration: null,
      activity: [],
      projectId: null,
      updatedAt: new Date().toISOString(),
    });
    expect(draft.executionLimited).toBe(true);
    expect(draft.rationale).toMatch(/execution limitation/i);
  });

  it("allows cancel after pause and blocks a fresh export on cancelled mission", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      brief: FIXTURE_BRIEF,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "fixture-ws",
      id: mission.id,
      actorId: "fixture-owner",
      nowMs: 2_000,
      env: {},
    });
    const paused = await service.saveStudioMeta({
      workspaceId: "fixture-ws",
      id: mission.id,
      investigationPaused: true,
      actorId: "fixture-owner",
      nowMs: 3_000,
    });
    expect(paused.stage).not.toBe("cancelled");

    const cancelled = await service.cancel({
      workspaceId: "fixture-ws",
      id: mission.id,
      nowMs: 4_000,
    });
    expect(cancelled.stage).toBe("cancelled");
    await expect(
      service.exportMission({
        workspaceId: "fixture-ws",
        id: mission.id,
        nowMs: 5_000,
      }),
    ).rejects.toThrow(/cancelled/i);
  });

  it("discloses commerce posture in export markdown (fixture mission)", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "fixture-ws",
      ownerUserId: "fixture-owner",
      brief: FIXTURE_BRIEF,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "fixture-ws",
      id: mission.id,
      actorId: "fixture-owner",
      nowMs: 2_000,
      env: {},
    });
    const md = buildCommerceDisclosureMarkdown(mission);
    expect(md).toMatch(/Paid availability/i);
    expect(md).toMatch(/Investigation/i);
  });
});
