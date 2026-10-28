import { describe, expect, it } from "vitest";
import { buildContinuationPlan, buildContinuationPlanMarkdown } from "./continuation-plan";
import { MemoryStore, SupervisedMissionService } from "./service";

const brief = {
  question: "Should we test a shorter onboarding goal step?",
  audience: "Founders",
  outcome: "A bounded next path",
  constraints: "No customer contact.",
};

async function missionThroughDecide(
  choice:
    | "authorise_bounded_test"
    | "authorise_gather_evidence"
    | "close_case"
    | "founder_requested_continuation",
) {
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
      cost: 0,
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
    choice,
    note: "",
    actorId: "owner",
    nowMs: 4_000,
  });
}

describe("P-B continuation plan", () => {
  it("staffs a bounded test team distinct from closing", async () => {
    const mission = await missionThroughDecide("authorise_bounded_test");
    const plan = mission.continuationPlan;
    expect(plan).toBeTruthy();
    expect(plan!.kind).toBe("bounded_test");
    expect(plan!.roles.length).toBeGreaterThan(2);
    expect(plan!.plannedArtefacts.some((a) => a.type === "test-evidence-plan")).toBe(true);
    expect(plan!.executionBlocked).toBe(false);
    const md = buildContinuationPlanMarkdown(mission, plan!);
    expect(md).toContain("# Continuation plan (Act B)");
    expect(md).toContain("Continuation team");
    expect(md).toContain("Not included");
  });

  it("blocks execution on evidence-collection path", async () => {
    const mission = await missionThroughDecide("authorise_gather_evidence");
    expect(mission.continuationPlan?.kind).toBe("evidence_collection");
    expect(mission.continuationPlan?.executionBlocked).toBe(true);
    expect(
      mission.continuationPlan?.plannedArtefacts.some((a) => a.type === "evidence-collection-plan"),
    ).toBe(true);
    expect(mission.continuationPlan?.plannedArtefacts.some((a) => a.type === "prd-lite")).toBe(
      false,
    );
  });

  it("closes without a delivery parade", async () => {
    const mission = await missionThroughDecide("close_case");
    expect(mission.continuationPlan?.kind).toBe("close");
    expect(mission.continuationPlan?.roles).toHaveLength(1);
    expect(mission.continuationPlan?.roles[0]?.label).toMatch(/Founder/);
  });

  it("labels founder-requested continuation risks", async () => {
    const mission = await missionThroughDecide("founder_requested_continuation");
    expect(mission.continuationPlan?.kind).toBe("founder_requested_with_risks");
    expect(mission.continuationPlan?.derivedFrom.disagreesWithRecommendation).toBe(true);
    expect(mission.continuationPlan?.unresolvedRisks.some((r) => /do not endorse/i.test(r))).toBe(
      true,
    );
  });

  it("buildContinuationPlan requires approval", () => {
    expect(() =>
      buildContinuationPlan({
        mission: {
          approval: null,
        } as never,
        nowMs: 1,
      }),
    ).toThrow(/next path/i);
  });
});
