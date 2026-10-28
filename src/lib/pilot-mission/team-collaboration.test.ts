import { describe, expect, it } from "vitest";
import { MemoryStore, SupervisedMissionService } from "./service";
import {
  INVESTIGATION_TASK_KEYS,
  initTeamCollaboration,
  traceFindingToRecommendation,
} from "./team-collaboration";
import { buildPilotTeamPlan } from "./specialist-team";

const brief = {
  question: "Which onboarding change should we investigate first?",
  audience: "Founders setting up a workspace",
  outcome: "A decision pack and an experiment brief.",
  constraints: "No customer contact and no deployment.",
};

describe("Phase 2 merge gate — finding through handoff to recommendation", () => {
  it("traces a supplied finding across specialist handoffs to the agent recommendation", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1_000,
    });

    expect(mission.teamCollaboration?.assignments.length).toBe(INVESTIGATION_TASK_KEYS.length);
    expect(
      mission.teamCollaboration?.edges.some((e) => e.kind === "planned_dependency"),
    ).toBe(true);

    mission = await service.approvePlan({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      nowMs: 2_000,
      env: {},
    });
    expect(mission.teamCollaboration?.handoffs.some((h) => h.id === "ho-evidence-to-synthesis")).toBe(
      true,
    );

    mission = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        {
          statement: "Setup asks for a goal before the product question is saved.",
          source: "Founder note, 28 Oct 2026",
          classification: "supplied",
        },
        {
          statement: "No observed completion rate is available.",
          source: "",
          classification: "gap",
        },
      ],
      nowMs: 2_500,
    });
    const findingId = mission.evidence.find((e) => e.source.includes("Founder"))!.id;

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
          gaps: ["No observed completion rate."],
        }),
      },
    });
    mission = compared.mission;
    expect(mission.teamCollaboration?.handoffs.some((h) => h.id === "ho-synthesis-to-options")).toBe(
      true,
    );

    const proposal = mission.proposal!;
    mission = await service.decide({
      workspaceId: "alpha",
      id: mission.id,
      claim: {
        action: proposal.action,
        version: proposal.version,
        scopeHash: proposal.scopeHash,
        optionId: proposal.options[0]!.id,
      },
      choice: "accept",
      note: "Proceed with the draft option.",
      actorId: "owner",
      nowMs: 4_000,
    });

    expect(mission.teamCollaboration?.recommendation?.recommendation).toBeTruthy();
    const trace = traceFindingToRecommendation(
      mission.teamCollaboration!,
      findingId,
      mission.evidence,
    );
    expect(trace).not.toBeNull();
    expect(trace!.handoffIds.length).toBeGreaterThanOrEqual(2);
    expect(trace!.recommendation.derivedFromHandoffIds.length).toBeGreaterThanOrEqual(2);
    expect(trace!.findingStatement).toMatch(/Setup asks for a goal/);
  });

  it("seeds only the small investigation team from Wave-1 plan", () => {
    const plan = buildPilotTeamPlan({ band: "M" });
    const collab = initTeamCollaboration(plan, new Date().toISOString());
    expect(collab.assignments).toHaveLength(INVESTIGATION_TASK_KEYS.length);
    expect(collab.assignments.every((a) => a.why.includes("Wave-1"))).toBe(true);
    expect(new Set(collab.assignments.map((a) => a.taskKey))).toEqual(
      new Set(INVESTIGATION_TASK_KEYS),
    );
  });
});
