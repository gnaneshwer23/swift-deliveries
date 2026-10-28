import { describe, expect, it } from "vitest";
import {
  buildCommerceDisclosureMarkdown,
  commerceHardStopMessage,
  commerceSnapshot,
  commerceUnitFor,
} from "./commerce";
import { MemoryStore, SupervisedMissionService } from "./service";

const brief = {
  question: "Should we test weekday breakfasts first?",
  audience: "Founders",
  outcome: "A bounded next path",
  constraints: "No customer contact.",
};

async function missionThroughDecide() {
  const service = new SupervisedMissionService(new MemoryStore());
  let mission = await service.create({
    id: crypto.randomUUID(),
    workspaceId: "alpha",
    ownerUserId: "owner",
    brief,
    usageCeiling: 4,
    nowMs: 1_000,
  });
  mission = await service.approvePlan({
    workspaceId: "alpha",
    id: mission.id,
    actorId: "owner",
    nowMs: 2_000,
    env: {},
  });
  const compared = await service.runAlternatives({
    workspaceId: "alpha",
    id: mission.id,
    workerId: "worker",
    nowMs: 3_000,
    generator: {
      cost: 1,
      run: async () => ({
        ran: false,
        label: "not run — provider not configured",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [],
      }),
    },
  });
  mission = compared.mission;
  expect(compared.chargedUnits).toBe(0);
  const proposal = mission.proposal!;
  return service.decide({
    workspaceId: "alpha",
    id: mission.id,
    claim: {
      action: proposal.action,
      version: proposal.version,
      scopeHash: proposal.scopeHash,
      optionId: proposal.options[0]!.id,
    },
    choice: "authorise_bounded_test",
    note: "",
    actorId: "owner",
    nowMs: 4_000,
  });
}

describe("P-commerce", () => {
  it("labels Investigation until case gate proceed", async () => {
    const mission = await missionThroughDecide();
    expect(commerceUnitFor(mission)).toBe("investigation");
    const snap = commerceSnapshot(mission);
    expect(snap.paidAvailability).toBe(false);
    expect(snap.events.some((e) => e.kind === "options_comparison" && e.billable)).toBe(true);
    expect(snap.events.some((e) => e.kind === "plan_approval" && !e.billable)).toBe(true);
    expect(snap.events.some((e) => e.kind === "listen" && !e.billable)).toBe(true);
    expect(snap.disclosureLines.some((l) => /Paid availability/i.test(l))).toBe(true);
  });

  it("hard-stops when allowance is exhausted", () => {
    const mission = {
      usageCeiling: 2,
      usageConsumed: 2,
      caseRoom: null,
      continuationPlan: null,
      approval: null,
    } as Parameters<typeof commerceSnapshot>[0];
    const snap = commerceSnapshot(mission);
    expect(snap.hardStopped).toBe(true);
    expect(commerceHardStopMessage(mission)).toMatch(/allowance is exhausted/i);
  });

  it("discloses execution-failure remedy when limited", async () => {
    const mission = await missionThroughDecide();
    const limited = {
      ...mission,
      approval: mission.approval
        ? { ...mission.approval, executionLimited: true }
        : null,
    };
    const snap = commerceSnapshot(limited);
    expect(snap.disclosureLines.some((l) => /Execution limitation/i.test(l))).toBe(true);
    const md = buildCommerceDisclosureMarkdown(limited);
    expect(md).toContain("## Commerce disclosure");
    expect(md).toContain("retry or restore");
  });

  it("treats case proceed + continuation plan as Continuation unit", async () => {
    const mission = await missionThroughDecide();
    const continued = {
      ...mission,
      continuationPlan: mission.continuationPlan,
      caseRoom: mission.caseRoom
        ? {
            ...mission.caseRoom,
            stepGate: "proceed" as const,
            stepGateNote: "",
            stepGateAt: new Date().toISOString(),
          }
        : {
            version: "case-room-v1" as const,
            caseId: mission.id,
            openedAt: new Date().toISOString(),
            folders: [],
            artefacts: [],
            handoffs: [],
            flowEdges: [],
            openAsks: [],
            stepGate: "proceed" as const,
            stepGateNote: "",
            stepGateAt: new Date().toISOString(),
            linkedDecision: {
              agentRecommendation: null,
              humanNextPath: "authorise_bounded_test",
              optionId: "o1",
            },
          },
    };
    expect(mission.continuationPlan).toBeTruthy();
    expect(commerceUnitFor(continued)).toBe("continuation");
  });
});
