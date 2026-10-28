import { describe, expect, it } from "vitest";
import {
  buildExecutivePackMarkdown,
  buildFullArchiveZip,
  executiveIsShorterThanFullPack,
} from "./executive-pack";
import type { SupervisedMission } from "./types";

function mission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const base = {
    id: "11111111-1111-4111-8111-111111111111",
    workspaceId: "22222222-2222-4222-8222-222222222222",
    ownerUserId: "user",
    version: 2,
    stage: "exported",
    brief: {
      question: "Should we ship the sandboxed prototype?",
      audience: "Founders",
      outcome: "A decision pack",
      constraints: "Human gates",
    },
    evidence: [
      {
        id: "e1",
        statement: "Founder supplied the one-liner",
        source: "Founder",
        classification: "supplied",
      },
      {
        id: "g1",
        statement: "No live traffic observed",
        source: "",
        classification: "gap",
      },
    ],
    proposal: null,
    approval: {
      choice: "authorise_bounded_test",
      optionId: "o1",
      note: "Bounded test",
      decidedAt: "2026-10-27T00:00:00Z",
      decidedBy: "user",
      agentRecommendation: "authorise_bounded_test",
      disagreesWithRecommendation: false,
    },
    invalidatedApprovals: [],
    artefact: {
      title: "Decision pack",
      decisionBrief: "Ship the prototype after the gate.",
      experimentBrief: "Observe click-through on the sandboxed HTML.",
      provenance: "Simulated draft",
    },
    prototype: null,
    exportBody: "# Decision pack",
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
    researchPassCompletedAt: null,
    researchPassQueuedAt: null,
    researchProvider: null,
    team: null,
    activity: [],
    projectId: null,
    updatedAt: "2026-10-27T00:00:00Z",
  } as unknown as SupervisedMission;
  return { ...base, ...overrides };
}

describe("PT-3 executive pack + full archive", () => {
  it("builds a short executive pack with honesty and gaps", () => {
    const md = buildExecutivePackMarkdown(mission());
    expect(md).toMatch(/Executive pack/);
    expect(md).toMatch(/No live traffic/);
    expect(md.toLowerCase()).toMatch(/honesty/);
    expect(md.toLowerCase()).not.toContain("chain-of-thought");
  });

  it("is shorter than the full decision pack markdown", () => {
    expect(executiveIsShorterThanFullPack(mission())).toBe(true);
  });

  it("full archive includes executive pack and archive manifest exclusions", () => {
    const { files, filename } = buildFullArchiveZip(mission());
    expect(filename).toMatch(/full-archive\.zip$/);
    expect(files.some((f) => f.path.endsWith("executive/executive-pack.md"))).toBe(true);
    const manifest = JSON.parse(
      files.find((f) => f.path.endsWith("archive-manifest.json"))!.content,
    );
    expect(manifest.kind).toBe("full-project-archive");
    expect(manifest.exclusions).toEqual(
      expect.arrayContaining(["API keys and credentials", "Hidden model chain-of-thought"]),
    );
  });
});
