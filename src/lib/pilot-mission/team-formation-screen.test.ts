import { describe, expect, it } from "vitest";
import {
  buildTeamFormationCards,
  TEAM_FORMATION_CATALOGUE,
  teamFormationIntro,
} from "./team-formation-screen";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const seed = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 3,
    stage: "artefact",
    brief: {
      question: "Food waste app",
      audience: "Owners",
      outcome: "Less waste",
      constraints: "",
    },
    evidence: [],
    proposal: null,
    approval: {
      action: "compare_options",
      version: 1,
      scopeHash: "s",
      optionId: "o1",
      choice: "authorise_bounded_test",
      note: "Go",
      actorId: "u",
      decidedAt: "2026-10-31T12:00:00Z",
    },
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
    usageConsumed: 2,
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
    team: {
      ...buildPilotTeamPlan({ band: "M" }),
      approvedAt: "2026-10-31T09:00:00Z",
      approvedBy: "u",
    },
    activity: [],
    teamCollaboration: null,
    continuationPlan: {
      version: "continuation-v1",
      kind: "bounded_test",
      title: "Bounded test plan",
      summary: "Staff a first experiment.",
      derivedFrom: {
        agentRecommendation: "proceed_bounded_test",
        humanNextPath: "authorise_bounded_test",
        disagreesWithRecommendation: false,
        executionLimited: false,
      },
      roles: [
        {
          capabilityId: "DX-021",
          label: "Market Intelligence Agent",
          responsibility: "Map market context",
          why: "Need market signal",
          plannedArtefacts: ["Market note"],
        },
        {
          capabilityId: "DX-002",
          label: "Problem-Framing Agent",
          responsibility: "Sharpen the idea",
          why: "Clarify problem",
          plannedArtefacts: ["Problem brief"],
        },
      ],
      roadmap: [
        {
          id: "step-1",
          title: "Frame problem",
          ownerLabel: "Problem-Framing Agent",
          detail: "Rewrite the brief",
          blocked: false,
          blockedReason: null,
        },
      ],
      plannedArtefacts: [],
      unresolvedRisks: [],
      notIncluded: [],
      executionBlocked: false,
      executionBlockedReason: null,
      createdAt: "2026-10-31T12:05:00Z",
    },
    projectId: null,
    updatedAt: "2026-10-31T12:05:00Z",
  } as unknown as SupervisedMission;
  return { ...seed, ...overrides };
}

describe("team formation screen", () => {
  it("keeps catalogue size at 14 roles and marks unassigned honestly", () => {
    expect(TEAM_FORMATION_CATALOGUE).toHaveLength(14);
    const cards = buildTeamFormationCards(baseMission());
    expect(cards.filter((c) => c.role === "Market Researcher")[0]?.assigned).toBe(true);
    expect(cards.filter((c) => c.role === "Idea Analyst")[0]?.assigned).toBe(true);
    expect(cards.some((c) => c.status === "not_assigned")).toBe(true);
    expect(cards.filter((c) => !c.assigned).every((c) => c.catalogueOnly)).toBe(true);
  });

  it("writes an Aria intro that does not invent activation", () => {
    const intro = teamFormationIntro(baseMission());
    expect(intro.headline).toMatch(/ready/i);
    expect(intro.message.toLowerCase()).toContain("selected");
    expect(intro.message.toLowerCase()).not.toContain("i've activated");
  });
});
