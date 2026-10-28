import { describe, expect, it } from "vitest";
import { buildIntelligenceCanvas } from "./intelligence-canvas";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { MemoryStore, SupervisedMissionService } from "./service";

const brief = {
  question: "Should a Bath cafe try weekday grab-and-go breakfasts first?",
  audience: "Founders",
  outcome: "A decision pack",
  constraints: "No customer contact.",
};

async function missionAfterResearch() {
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
  return compared.mission;
}

describe("PT-1 Intelligence Canvas", () => {
  it("does not invent interview theatre on a fresh mission", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1,
    });
    const canvas = buildIntelligenceCanvas(mission);
    expect(canvas.version).toBe("canvas-v1");
    expect(canvas.nodes.find((n) => n.id === "idea")?.state).toBe("settled");
    expect(canvas.nodes.find((n) => n.id === "market")?.state).toBe("idle");
    expect(JSON.stringify(canvas).toLowerCase()).not.toContain("interviewing customers");
    expect(canvas.statusLine.toLowerCase()).toMatch(/approve/);
  });

  it("activates market from plan approval / research events", async () => {
    const mission = await missionAfterResearch();
    const canvas = buildIntelligenceCanvas(mission);
    expect(canvas.leaveAllowed.toLowerCase()).toContain("leave");
    const market = canvas.nodes.find((n) => n.id === "market");
    expect(market).toBeTruthy();
    expect(["active", "settled", "blocked"]).toContain(market!.state);
    expect(canvas.edges.every((e) => typeof e.eventBacked === "boolean")).toBe(true);
  });
});

describe("PT-1 PM briefing pack", () => {
  it("separates assessments and requires SWOT basis", async () => {
    const mission = await missionAfterResearch();
    const pack = buildPmBriefingPack(mission);
    expect(pack.ready).toBe(true);
    expect(pack.assessments.map((a) => a.dimension)).toEqual([
      "feasibility",
      "demand",
      "proposition",
      "next_investment",
    ]);
    expect(pack.recommendation).toBeTruthy();
    expect(pack.swot.length).toBeGreaterThan(0);
    for (const item of pack.swot) {
      expect(item.basis.length).toBeGreaterThan(5);
      expect(item.implication.length).toBeGreaterThan(5);
      expect(item.nextQuestion.length).toBeGreaterThan(5);
    }
  });
});
