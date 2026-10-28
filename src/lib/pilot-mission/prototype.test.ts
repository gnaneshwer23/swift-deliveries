import { describe, expect, it } from "vitest";
import { buildMissionPrototype, simulatedPrototypeHtml, verifyPrototypeHtml } from "./prototype";
import { buildPilotTeamPlan } from "./specialist-team";
import type { SupervisedMission } from "./types";

function mission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const team = buildPilotTeamPlan({ band: "L" });
  team.approvedAt = "2026-10-27T12:00:00.000Z";
  return {
    id: "00000000-0000-4000-8000-000000000001",
    workspaceId: "ws",
    ownerUserId: "u",
    version: 1,
    stage: "exported",
    brief: {
      question: "Should we charge for analytics?",
      audience: "Founders",
      outcome: "A decision pack",
      constraints: "Research first",
    },
    evidence: [],
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "x",
      options: [
        { id: "a", title: "Charge", tradeoff: "x", basis: "gap" },
        { id: "b", title: "Free", tradeoff: "y", basis: "gap" },
      ],
      generation: {
        ran: false,
        label: "not run — provider not configured",
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
      scopeHash: "x",
      optionId: "a",
      choice: "accept",
      note: "",
      actorId: "u",
      decidedAt: "2026-10-27T13:00:00.000Z",
    },
    invalidatedApprovals: [],
    artefact: {
      title: "Analytics pricing pack",
      decisionBrief: "Charge for analytics.",
      experimentBrief: "Pilot.",
      provenance: "Simulated draft",
    },
    prototype: null,
    exportBody: "# Pack",
    exportPdfBase64: null,
    job: {
      status: "idle",
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    usageCeiling: 5,
    usageConsumed: 0,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: [],
    researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
    researchProvider: null,
    team,
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [],
    updatedAt: new Date().toISOString(),
    projectId: null,
    ...overrides,
  };
}

describe("sandboxed prototype (P5)", () => {
  it("builds Simulated HTML that passes static sandbox checks", () => {
    const html = simulatedPrototypeHtml(mission());
    const verify = verifyPrototypeHtml(html);
    expect(verify.sandboxSafe).toBe(true);
    expect(verify.verified).toBe(true);
    expect(html).toContain("Simulated prototype");
    expect(html).toContain("Charge");
  });

  it("keeps honesty on the Simulated vs Model ladder", () => {
    const simulated = buildMissionPrototype(mission(), {
      actorId: "u",
      nowMs: 1,
      ownerCapabilityId: "DX-035",
      ownerLabel: "UX Prototype Agent",
    });
    expect(simulated.honesty.label).toBe("Simulated draft");
    expect(simulated.verified).toBe(true);

    const modeled = buildMissionPrototype(
      mission({
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "x",
          options: [
            { id: "a", title: "Charge", tradeoff: "x", basis: "gap" },
            { id: "b", title: "Free", tradeoff: "y", basis: "gap" },
          ],
          generation: {
            ran: true,
            label: "openai/gpt-test",
            provider: "openai",
            model: "gpt-test",
            output: "{}",
            citations: [],
            gaps: [],
          },
        },
      }),
      { actorId: "u", nowMs: 1 },
    );
    expect(modeled.honesty.label).toBe("Model · gpt-test");
  });

  it("surfaces verify failure when HTML is not sandbox-safe", () => {
    const bad = `<!DOCTYPE html>
<html lang="en"><head><meta name="viewport" content="width=device-width" /><title>Bad</title></head>
<body><main><button>Go</button><script src="https://evil.example/x.js"></script></main></body></html>`;
    const proto = buildMissionPrototype(mission(), { actorId: "u", nowMs: 1, html: bad });
    expect(proto.sandboxSafe).toBe(false);
    expect(proto.verified).toBe(false);
    expect(proto.failureDetail).toMatch(/sandbox/i);
    expect(proto.checks.some((c) => c.id === "no_remote_script" && !c.passed)).toBe(true);
  });
});
