import { describe, expect, it } from "vitest";
import {
  artefactHonesty,
  buildSequence,
  castForMission,
  projectShelfItems,
} from "./build-beats";
import type { SupervisedMission } from "./types";
import { buildPilotTeamPlan } from "./specialist-team";

function baseMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const team = buildPilotTeamPlan({ band: "M" });
  return {
    id: "00000000-0000-4000-8000-000000000001",
    workspaceId: "ws",
    ownerUserId: "u",
    version: 1,
    stage: "brief",
    brief: {
      question: "Should we charge for analytics?",
      audience: "Founders",
      outcome: "A decision pack",
      constraints: "Research first",
    },
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
    usageCeiling: 5,
    usageConsumed: 0,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "combined",
    researchGaps: ["Web search not configured"],
    researchPassCompletedAt: null,
    team,
    activity: [],
    updatedAt: new Date().toISOString(),
    projectId: "00000000-0000-4000-8000-000000000099",
    ...overrides,
  };
}

describe("buildSequence", () => {
  it("keeps beats upcoming until the plan is approved", () => {
    const seq = buildSequence(baseMission());
    expect(seq.planApproved).toBe(false);
    expect(seq.currentId).toBeNull();
    expect(seq.beats.every((b) => b.state === "upcoming" || b.state === "blocked")).toBe(true);
  });

  it("opens Frame after plan approval with a focal artefact", () => {
    const team = buildPilotTeamPlan({ band: "M" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    team.approvedBy = "u";
    const seq = buildSequence(
      baseMission({
        stage: "evidence",
        team,
      }),
    );
    expect(seq.planApproved).toBe(true);
    expect(seq.currentId).toBe("research");
    expect(seq.beats.find((b) => b.id === "frame")?.state).toBe("done");
    expect(seq.beats.find((b) => b.id === "frame")?.artefact?.title).toBe("Product frame");
    expect(seq.beats.find((b) => b.id === "research")?.state).toMatch(/current|blocked/);
  });

  it("advances Options only when research is ready and proposal exists", () => {
    const team = buildPilotTeamPlan({ band: "M" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    team.approvedBy = "u";
    const seq = buildSequence(
      baseMission({
        stage: "alternatives",
        team,
        researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "abc",
          options: [
            { id: "a", title: "Charge", tradeoff: "Revenue vs adoption", basis: "gap" },
            { id: "b", title: "Free", tradeoff: "Adoption vs cost", basis: "gap" },
          ],
          generation: {
            ran: false,
            label: "not run — provider not configured",
            provider: null,
            model: null,
            output: "",
            citations: [],
            gaps: ["Model provider is not configured."],
          },
        },
      }),
    );
    expect(seq.beats.find((b) => b.id === "options")?.state).toBe("done");
    expect(seq.beats.find((b) => b.id === "options")?.artefact?.honesty.label).toBe(
      "Simulated draft",
    );
    expect(seq.currentId).toBe("decide");
  });

  it("does not open Pack before Decide", () => {
    const team = buildPilotTeamPlan({ band: "M" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    const seq = buildSequence(
      baseMission({
        stage: "alternatives",
        team,
        researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "abc",
          options: [
            { id: "a", title: "Charge", tradeoff: "x", basis: "gap" },
            { id: "b", title: "Free", tradeoff: "y", basis: "gap" },
          ],
          generation: {
            ran: false,
            label: "simulated",
            provider: null,
            model: null,
            output: "",
            citations: [],
            gaps: [],
          },
        },
      }),
    );
    expect(seq.beats.find((b) => b.id === "pack")?.state).toBe("upcoming");
    expect(seq.beats.find((b) => b.id === "pack")?.artefact).toBeNull();
  });
});

describe("artefactHonesty (P4)", () => {
  it("labels Simulated when the model did not run", () => {
    const h = artefactHonesty(
      baseMission({
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "x",
          options: [],
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
      }),
    );
    expect(h.mode).toBe("simulated");
    expect(h.label).toBe("Simulated draft");
  });

  it("labels Model with id when generation ran — same ladder, no silent upgrade", () => {
    const h = artefactHonesty(
      baseMission({
        proposal: {
          action: "compare_options",
          version: 1,
          scopeHash: "x",
          options: [],
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
    );
    expect(h.mode).toBe("model");
    expect(h.label).toBe("Model · gpt-test");
    expect(h.modelId).toBe("gpt-test");
  });
});

describe("castForMission (P2)", () => {
  it("marks the current beat owner and handoff", () => {
    const team = buildPilotTeamPlan({ band: "M" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    const cast = castForMission(
      baseMission({
        stage: "evidence",
        team,
        researchPassCompletedAt: null,
      }),
    );
    expect(cast.some((c) => c.actor === "specialist")).toBe(true);
    expect(cast.some((c) => c.actor === "human")).toBe(true);
    expect(cast.some((c) => c.isCurrentOwner)).toBe(true);
    expect(cast.find((c) => c.isCurrentOwner)?.handoff.length).toBeGreaterThan(0);
  });
});

describe("prototype beat (P5)", () => {
  it("keeps Prototype behind a human gate until Pack is ready", () => {
    const team = buildPilotTeamPlan({ band: "L" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    const seq = buildSequence(
      baseMission({
        stage: "exported",
        team,
        researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
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
            label: "simulated",
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
        artefact: {
          title: "Analytics pricing pack",
          decisionBrief: "Charge for analytics.",
          experimentBrief: "Pilot with 10 teams.",
          provenance: "Simulated draft",
        },
        exportBody: "# Pack",
      }),
    );
    expect(seq.currentId).toBe("prototype");
    const beat = seq.beats.find((b) => b.id === "prototype");
    expect(beat?.state).toBe("current");
    expect(beat?.owner.actor).toBe("human");
    expect(beat?.handoff.status).toBe("awaiting_you");
    expect(beat?.artefact).toBeNull();
  });

  it("shows the sandboxed HTML artefact with honesty and verify rows after build", () => {
    const team = buildPilotTeamPlan({ band: "L" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    const seq = buildSequence(
      baseMission({
        stage: "exported",
        team,
        researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
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
            label: "simulated",
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
        artefact: {
          title: "Analytics pricing pack",
          decisionBrief: "Charge.",
          experimentBrief: "Pilot.",
          provenance: "Simulated draft",
        },
        exportBody: "# Pack",
        prototype: {
          title: "Analytics pricing pack — prototype",
          html: "<!DOCTYPE html><html lang=\"en\"><head><title>t</title></head><body><main><button>Go</button></main></body></html>",
          honesty: { mode: "simulated", label: "Simulated draft", modelId: null },
          checks: [
            { id: "doctype", label: "Declares <!DOCTYPE html>", passed: true },
            { id: "no_network", label: "Makes no network calls", passed: false },
          ],
          sandboxSafe: false,
          verified: false,
          failureDetail: "Prototype loads remote scripts or makes network calls — rejected as not sandbox-safe.",
          approvedAt: "2026-10-27T14:00:00.000Z",
          approvedBy: "u",
          producedAt: "2026-10-27T14:00:00.000Z",
          ownerCapabilityId: "DX-035",
          ownerLabel: "UX Prototype Agent",
        },
      }),
    );
    expect(seq.currentId).toBeNull();
    const beat = seq.beats.find((b) => b.id === "prototype");
    expect(beat?.state).toBe("done");
    expect(beat?.owner.label).toBe("UX Prototype Agent");
    expect(beat?.artefact?.kind).toBe("prototype_html");
    expect(beat?.artefact?.honesty.label).toBe("Simulated draft");
    expect(beat?.artefact?.html).toContain("<!DOCTYPE html>");
    expect(beat?.artefact?.verification?.some((c) => !c.passed)).toBe(true);
    expect(beat?.artefact?.gaps[0]).toMatch(/sandbox/i);
  });
});

describe("projectShelfItems (P3)", () => {
  it("lists decisions and completed beat artefacts for the attached product", () => {
    const team = buildPilotTeamPlan({ band: "M" });
    team.approvedAt = "2026-10-27T12:00:00.000Z";
    const shelf = projectShelfItems(
      baseMission({
        stage: "decision",
        team,
        researchPassCompletedAt: "2026-10-27T12:05:00.000Z",
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
            label: "simulated",
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
        artefact: {
          title: "Analytics pricing pack",
          decisionBrief: "Charge for analytics.",
          experimentBrief: "Pilot with 10 teams.",
          provenance: "Simulated draft",
        },
      }),
    );
    expect(shelf.decisions[0]?.summary).toContain("Charge");
    expect(shelf.artefacts.some((a) => a.kind === "pack")).toBe(true);
    expect(shelf.artefacts.every((a) => a.honesty.length > 0)).toBe(true);
  });
});
