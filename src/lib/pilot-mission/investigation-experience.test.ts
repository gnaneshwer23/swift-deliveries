import { describe, expect, it } from "vitest";
import {
  buildInvestigationExperience,
  deriveInvestigationRunState,
} from "./investigation-experience";
import { MemoryStore, SupervisedMissionService } from "./service";
import { buildPilotTeamPlan } from "./specialist-team";
import { emptyStudioMeta } from "./studio-meta";
import type { SupervisedMission } from "./types";

const approvedTeam = {
  ...buildPilotTeamPlan({ band: "M" }),
  approvedAt: "2026-01-01",
  approvedBy: "u",
};

const brief = {
  question: "Should we pilot weekday breakfasts?",
  audience: "Founders",
  outcome: "Decision pack",
  constraints: "",
};

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 1,
    stage: "brief",
    brief,
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
    usageCeiling: 6,
    usageConsumed: 0,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: null,
    researchPassQueuedAt: null,
    researchProvider: null,
    team: { tasks: [], approvedAt: null, approvedBy: null },
    activity: [],
    teamCollaboration: null,
    projectId: null,
    updatedAt: "2026-10-27T00:00:00Z",
  } as unknown as SupervisedMission;
  return { ...seed, ...overrides };
}

describe("investigation experience", () => {
  it("stays idle before plan approval — no fabricated updates", () => {
    const exp = buildInvestigationExperience(baseMission());
    expect(exp.state).toBe("idle");
    expect(exp.updates).toHaveLength(0);
    expect(exp.keywords).toHaveLength(0);
    expect(JSON.stringify(exp).toLowerCase()).not.toContain("interview");
  });

  it("marks leased jobs as running from persisted job state", () => {
    const state = deriveInvestigationRunState(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        job: { ...baseMission().job, status: "leased", leaseUntil: "2026-01-02T00:00:00Z" },
      }),
      Date.parse("2026-01-01T00:00:00Z"),
    );
    expect(state).toBe("running");
  });

  it("does not treat an expired lease as running", () => {
    const state = deriveInvestigationRunState(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        job: { ...baseMission().job, status: "leased", leaseUntil: "2026-01-01T00:00:00Z" },
      }),
      Date.parse("2026-01-02T00:00:00Z"),
    );
    expect(state).not.toBe("running");
  });

  it("does not claim an approved plan has an active worker", () => {
    const mission = baseMission({ team: approvedTeam, stage: "evidence" });
    expect(deriveInvestigationRunState(mission)).toBe("waiting");
  });

  it("labels a recorded research queue without claiming it is running", () => {
    const mission = baseMission({
      team: approvedTeam,
      stage: "evidence",
      researchPassQueuedAt: "2026-01-01T00:00:00Z",
    });
    expect(deriveInvestigationRunState(mission)).toBe("queued");
    expect(buildInvestigationExperience(mission).statusLabel).toContain("queued");
  });

  it("shows running (not paused) when a leased job is active even if pause is set", () => {
    const state = deriveInvestigationRunState(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        studioMeta: { ...emptyStudioMeta("2026-01-01T00:00:00Z"), investigationPaused: true },
        job: { ...baseMission().job, status: "leased", leaseUntil: "2026-01-02T00:00:00Z" },
      }),
      Date.parse("2026-01-01T12:00:00Z"),
    );
    expect(state).toBe("running");
  });

  it("derives keywords and updates only from recorded activity", () => {
    const exp = buildInvestigationExperience(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        activity: [
          {
            id: "e1",
            at: "2026-01-01T00:00:01Z",
            taskKey: "register_evidence",
            kind: "task.register_evidence.started",
            summary: "Registering cited findings on the evidence register.",
            actor: "research-analyst",
          },
        ],
      }),
    );
    expect(exp.keywords.some((k) => k.source === "activity")).toBe(true);
    expect(exp.updates).toHaveLength(1);
    expect(exp.updates[0]?.basis).toMatch(/^activity:/);
    expect(exp.updates[0]?.summary).toContain("evidence register");
  });

  it("adds a research-pass line only when researchPassCompletedAt is set", () => {
    const exp = buildInvestigationExperience(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        researchPassCompletedAt: "2026-01-02T00:00:00Z",
        evidence: [{ id: "g1", statement: "No provider", source: "", classification: "gap" }],
      }),
    );
    expect(exp.updates.some((u) => u.basis === "researchPassCompletedAt")).toBe(true);
  });

  it("does not emit a research-pass update when only the plan is approved", () => {
    const exp = buildInvestigationExperience(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        researchPassCompletedAt: null,
      }),
    );
    expect(exp.updates.some((u) => u.basis === "researchPassCompletedAt")).toBe(false);
  });

  it("does not invent updates beyond persisted team collaboration", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1,
    });
    mission = await service.approvePlan({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      nowMs: 2,
      env: {},
    });
    const exp = buildInvestigationExperience(mission);
    for (const update of exp.updates) {
      expect(["activity", "teamCollaboration", "research"]).toContain(update.source);
      expect(update.basis.length).toBeGreaterThan(0);
    }
    if (exp.updates.length === 0) {
      expect(mission.activity?.length ?? 0).toBe(0);
    }
  });

  it("marks pause as interrupted", () => {
    const state = deriveInvestigationRunState(
      baseMission({
        team: approvedTeam,
        stage: "evidence",
        studioMeta: { ...emptyStudioMeta("2026-01-01T00:00:00Z"), investigationPaused: true },
      }),
    );
    expect(state).toBe("interrupted");
  });
});
