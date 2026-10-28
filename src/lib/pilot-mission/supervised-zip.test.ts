import { describe, expect, it } from "vitest";
import { buildSupervisedZip } from "./supervised-zip";
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
    ],
    proposal: null,
    approval: null,
    invalidatedApprovals: [],
    artefact: {
      title: "Decision pack",
      decisionBrief: "Ship the prototype after the gate.",
      experimentBrief: "Observe click-through on the sandboxed HTML.",
      provenance: "Simulated draft",
    },
    prototype: {
      title: "Sandboxed prototype",
      html: "<!doctype html><html><body><h1>Hello</h1></body></html>",
      honesty: { mode: "simulated", label: "Simulated draft", modelId: null },
      checks: [{ id: "has-html", label: "Has HTML root", passed: true }],
      sandboxSafe: true,
      verified: true,
      failureDetail: null,
      approvedAt: "2026-10-27T00:00:00Z",
      approvedBy: "user",
      producedAt: "2026-10-27T00:00:00Z",
      ownerCapabilityId: "DX-035",
      ownerLabel: "UX Prototype Agent",
    },
    exportBody: "# Decision pack\n\n## Honesty labels\n",
    exportPdfBase64: null,
    teamCollaboration: null,
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
    researchProvider: null,
    team: null,
    activity: [],
    projectId: null,
    updatedAt: "2026-10-27T00:00:00Z",
  } as unknown as SupervisedMission;
  return { ...base, ...overrides };
}

describe("supervised ZIP export", () => {
  it("bundles decision pack, evidence, prototype and honesty manifest", () => {
    const { files, filename } = buildSupervisedZip(mission());
    expect(filename).toMatch(/\.zip$/);
    const paths = files.map((f) => f.path);
    expect(paths.some((p) => p.endsWith("decision-pack/decision-pack.md"))).toBe(true);
    expect(paths.some((p) => p.endsWith("briefing/product-briefing.md"))).toBe(true);
    expect(paths.some((p) => p.endsWith("decision-roadmap/decision-roadmap.md"))).toBe(true);
    expect(paths.some((p) => p.endsWith("evidence/evidence-register.md"))).toBe(true);
    expect(paths.some((p) => p.endsWith("prototype/prototype.html"))).toBe(true);
    expect(paths.some((p) => p.endsWith("project-manifest.json"))).toBe(true);
    const manifest = JSON.parse(
      files.find((f) => f.path.endsWith("project-manifest.json"))!.content,
    );
    expect(manifest.sourcesBundled).toBe(false);
    expect(manifest.prototypeBundled).toBe(true);
  });

  it("labels missing prototype honestly instead of inventing HTML", () => {
    const { files } = buildSupervisedZip(mission({ prototype: null }));
    const protoReadme = files.find((f) => f.path.endsWith("prototype/README.md"));
    expect(protoReadme?.content).toMatch(/Not produced yet/i);
    expect(files.some((f) => f.path.endsWith("prototype/prototype.html"))).toBe(false);
  });
});
