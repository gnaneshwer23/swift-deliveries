import { describe, expect, it } from "vitest";
import { MemoryStore, SupervisedMissionService } from "./service";
import {
  INVESTIGATION_TASK_KEYS,
  applyOptionsComparedCollaboration,
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

const EXPECTED_TRACE_HANDOFFS = [
  "ho-evidence-to-synthesis",
  "ho-synthesis-to-options",
  "ho-options-to-recommendation",
] as const;

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
    expect(mission.teamCollaboration?.edges.some((e) => e.kind === "planned_dependency")).toBe(
      true,
    );

    mission = await service.approvePlan({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      nowMs: 2_000,
      env: {},
    });
    expect(
      mission.teamCollaboration?.handoffs.some((h) => h.id === "ho-evidence-to-synthesis"),
    ).toBe(true);

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
    expect(
      mission.teamCollaboration?.handoffs.some((h) => h.id === "ho-evidence-register-update"),
    ).toBe(true);
    expect(
      mission.teamCollaboration?.handoffs.find((h) => h.id === "ho-evidence-register-update")
        ?.actualResult,
    ).toMatch(/not consumed/i);

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
    const optionsHandoff = mission.teamCollaboration?.handoffs.find(
      (h) => h.id === "ho-synthesis-to-options",
    );
    expect(optionsHandoff).toBeTruthy();
    expect(optionsHandoff!.consumedAt).toBeNull();
    expect(
      mission.teamCollaboration?.handoffs.some((h) => h.id === "ho-options-to-challenge"),
    ).toBe(false);
    expect(optionsHandoff!.productionLabel).toBe("simulated draft");

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
    expect(mission.teamCollaboration?.recommendation?.productionLabel).toBe("deterministic rules");
    const trace = traceFindingToRecommendation(
      mission.teamCollaboration!,
      findingId,
      mission.evidence,
    );
    expect(trace).not.toBeNull();
    expect(trace!.handoffIds).toEqual([...EXPECTED_TRACE_HANDOFFS]);
    expect(trace!.recommendation.derivedFromHandoffIds).toEqual([...EXPECTED_TRACE_HANDOFFS]);
    expect(trace!.findingStatement).toMatch(/Setup asks for a goal/);
  });

  it("does not mark challenge or structure steps complete when only comparison runs", () => {
    const plan = buildPilotTeamPlan({ band: "M" });
    const team = plan;
    const record = initTeamCollaboration(team, new Date().toISOString());
    const evidence = [
      {
        id: "f1",
        statement: "Observed signup drop.",
        source: "Founder",
        classification: "supplied" as const,
      },
    ];
    const after = applyOptionsComparedCollaboration({
      record,
      team,
      evidence,
      options: [
        {
          id: "investigate-supplied",
          title: "Investigate",
          tradeoff: "Uses basis f1.",
          basis: "f1",
        },
      ],
      generationLabel: "simulated",
      generationRan: false,
      at: new Date().toISOString(),
    });
    expect(after.handoffs.some((h) => h.toTaskKey === "challenge_options")).toBe(false);
    expect(after.edges.find((e) => e.id === "edge-artefact-proposal")?.fromTaskKey).toBe(
      "draft_options",
    );
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
