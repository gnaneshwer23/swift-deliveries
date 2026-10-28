import { describe, expect, it } from "vitest";
import { buildDecisionRoadmapEntries, buildDecisionRoadmapMarkdown } from "./decision-roadmap";
import type { SupervisedMission } from "./types";

function mission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const base = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "w",
    ownerUserId: "u",
    version: 2,
    stage: "decision",
    brief: {
      question: "Should we ship?",
      audience: "Founders",
      outcome: "A decision pack",
      constraints: "",
    },
    evidence: [],
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "abc123def456",
      options: [{ id: "o1", title: "Ship", tradeoff: "t", basis: "b" }],
      generation: {
        ran: false,
        label: "Simulated draft",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: [],
      },
    },
    approval: {
      action: "compare_options",
      version: 1,
      scopeHash: "abc123def456",
      optionId: "o1",
      choice: "authorise_bounded_test",
      note: "",
      actorId: "u",
      decidedAt: "2026-10-27T12:00:00Z",
      agentRecommendation: "authorise_bounded_test",
    },
    invalidatedApprovals: [],
    artefact: {
      title: "Decision pack",
      decisionBrief: "Brief",
      experimentBrief: "Experiment",
      provenance: "Simulated draft",
    },
    prototype: null,
    exportBody: "# pack",
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
    usageConsumed: 1,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: "2026-10-27T11:00:00Z",
    researchProvider: null,
    team: {
      tasks: [],
      approvedAt: "2026-10-27T10:00:00Z",
      approvedBy: "u",
    },
    activity: [
      { at: "2026-10-27T11:30:00Z", actor: "Research", kind: "task", summary: "Compared options" },
    ],
    projectId: null,
    updatedAt: "2026-10-27T12:00:00Z",
  } as unknown as SupervisedMission;
  return { ...base, ...overrides };
}

describe("decision roadmap markdown", () => {
  it("includes human gate, recommendation, path, and honesty", () => {
    const md = buildDecisionRoadmapMarkdown(mission());
    expect(md).toMatch(/Decision roadmap/);
    expect(md).toMatch(/Plan approved/);
    expect(md).toMatch(/Agent recommendation/);
    expect(md).toMatch(/Human next path/);
    expect(md).toMatch(/Simulated draft/);
    expect(md.toLowerCase()).toMatch(/honesty/);
  });

  it("orders persisted activity as agent work lines", () => {
    const entries = buildDecisionRoadmapEntries(mission());
    expect(entries.some((e) => e.title === "task" && e.detail.includes("Compared options"))).toBe(
      true,
    );
  });
});
