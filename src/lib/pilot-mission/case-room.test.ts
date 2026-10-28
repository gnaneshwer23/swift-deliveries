import { describe, expect, it } from "vitest";
import { caseRoomTraceLines } from "./case-room";
import { MemoryStore, SupervisedMissionService } from "./service";

const brief = {
  question: "Should we test a shorter onboarding goal step?",
  audience: "Founders",
  outcome: "A bounded next path",
  constraints: "No customer contact.",
};

async function decide(
  choice: "authorise_bounded_test" | "authorise_gather_evidence" | "close_case",
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
  mission = await service.decide({
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
  return { service, mission };
}

describe("P-C case room", () => {
  it("opens folders, artefacts, and flow edges on the same case", async () => {
    const { mission } = await decide("authorise_bounded_test");
    const room = mission.caseRoom!;
    expect(room.caseId).toBe(mission.id);
    expect(room.folders.length).toBeGreaterThan(1);
    expect(room.artefacts.length).toBeGreaterThan(1);
    expect(room.flowEdges.length).toBeGreaterThan(0);
    expect(room.handoffs.every((h) => h.finding && h.request)).toBe(true);
    const consumer = room.artefacts.find((a) => a.consumesArtefactIds.length > 0);
    expect(consumer).toBeTruthy();
    const trace = caseRoomTraceLines(consumer!, room);
    expect(trace.some((l) => l.startsWith("Consumes:"))).toBe(true);
    expect(trace.some((l) => l.startsWith("Decision:"))).toBe(true);
  });

  it("blocks downstream artefacts on evidence-collection path", async () => {
    const { mission } = await decide("authorise_gather_evidence");
    expect(mission.caseRoom?.openAsks.length).toBeGreaterThan(0);
    expect(mission.caseRoom?.artefacts.some((a) => a.status === "blocked")).toBe(true);
  });

  it("records a step gate without starting a new mission", async () => {
    const { service, mission } = await decide("authorise_bounded_test");
    const gated = await service.recordCaseStepGate({
      workspaceId: "alpha",
      id: mission.id,
      gate: "pause",
      note: "Need one more founder fact before the test.",
      actorId: "owner",
      nowMs: 5_000,
    });
    expect(gated.caseRoom?.stepGate).toBe("pause");
    expect(gated.followUp).toBeNull();
    expect(gated.activity.some((e) => e.kind === "case_room.step_gate")).toBe(true);
  });

  it("keeps close path minimal but present", async () => {
    const { mission } = await decide("close_case");
    expect(mission.caseRoom?.folders).toHaveLength(1);
    expect(mission.caseRoom?.artefacts.some((a) => a.type === "close-summary")).toBe(true);
  });
});
