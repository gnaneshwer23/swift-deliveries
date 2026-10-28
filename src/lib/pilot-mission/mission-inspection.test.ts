import { describe, expect, it } from "vitest";
import { MemoryStore, SupervisedMissionService } from "./service";
import { buildMissionInspection, countUnresolvedQuestions } from "./mission-inspection";

const brief = {
  question: "Should we simplify onboarding?",
  audience: "Founders",
  outcome: "Decision pack.",
  constraints: "No deployment.",
};

describe("Phase 4 mission inspection", () => {
  it("surfaces decision attention and evidence without inventing dialogue", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "ws",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1_000,
    });

    const inspection = buildMissionInspection(mission);
    expect(inspection.decisionAttention?.id).toBe("approve_plan");
    expect(inspection.hasTeamRecord).toBe(true);
    expect(inspection.evidenceOnRecord.length).toBeGreaterThan(0);
    expect(inspection.unresolvedQuestions).toEqual([]);

    const reloaded = buildMissionInspection({ ...mission, updatedAt: mission.updatedAt });
    expect(reloaded.decisionAttention?.id).toBe(inspection.decisionAttention?.id);
  });

  it("counts unresolved questions from handoff uncertainty only", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "ws",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "ws",
      id: mission.id,
      actorId: "owner",
      nowMs: 2_000,
      env: {},
    });

    expect(countUnresolvedQuestions(mission)).toBeGreaterThanOrEqual(0);
    const withUncertainty = {
      ...mission,
      teamCollaboration: mission.teamCollaboration
        ? {
            ...mission.teamCollaboration,
            handoffs: mission.teamCollaboration.handoffs.map((h, i) =>
              i === 0 ? { ...h, uncertainty: "Need founder confirmation on scope." } : h,
            ),
          }
        : null,
    };
    const added = buildMissionInspection(withUncertainty).unresolvedQuestions.find((q) =>
      q.uncertainty.includes("Need founder confirmation"),
    );
    expect(added).toBeTruthy();
  });
});
