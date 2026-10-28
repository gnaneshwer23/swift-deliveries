import { describe, expect, it } from "vitest";
import { buildLearnerLensMarkdown, buildLearnerSummary } from "./learner-lens";
import { MemoryStore, SupervisedMissionService } from "./service";

const brief = {
  question: "Should a Bath cafe try weekday grab-and-go breakfasts first?",
  audience: "Founders",
  outcome: "A bounded next path",
  constraints: "No customer contact.",
};

async function missionThroughDecide(opts?: {
  choice?:
    | "authorise_bounded_test"
    | "authorise_gather_evidence"
    | "close_case"
    | "founder_requested_continuation";
  note?: string;
}) {
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
  return service.decide({
    workspaceId: "alpha",
    id: mission.id,
    claim: {
      action: proposal.action,
      version: proposal.version,
      scopeHash: proposal.scopeHash,
      optionId: proposal.options[0]!.id,
    },
    choice: opts?.choice ?? "authorise_bounded_test",
    note: opts?.note ?? "",
    actorId: "owner",
    nowMs: 4_000,
  });
}

describe("P-D learner lens", () => {
  it("lists human contributions and does not count agent activity volume", async () => {
    const mission = await missionThroughDecide({
      note: "Trying breakfast first feels lower risk.",
    });
    const summary = buildLearnerSummary(mission);

    expect(summary.version).toBe("learner-v1");
    expect(summary.contributions.some((c) => c.kind === "brief")).toBe(true);
    expect(summary.contributions.some((c) => c.kind === "plan_approval")).toBe(true);
    expect(summary.contributions.some((c) => c.kind === "next_path")).toBe(true);
    expect(summary.contributions.some((c) => c.kind === "decision_note")).toBe(true);
    expect(summary.notCounted.toLowerCase()).toContain("activity volume");
    expect(summary.notCounted.toLowerCase()).toContain("specialist task events");
    expect(JSON.stringify(summary)).not.toMatch(/DX-0\d{2} · task\./);
    expect(summary.prompts.every((p) => p.blocking === false)).toBe(true);
  });

  it("records disagreement without erasing the recommendation", async () => {
    const mission = await missionThroughDecide({
      choice: "founder_requested_continuation",
    });
    const summary = buildLearnerSummary(mission);
    const judgement = summary.judgements.find((j) => j.id === "act-a-path");
    expect(judgement).toBeTruthy();
    expect(judgement!.stance.toLowerCase()).toContain("different");
    expect(judgement!.detail).toMatch(/Recommendation on record/i);
    expect(judgement!.detail).toMatch(/does not erase/i);
    expect(summary.prompts.some((p) => p.id === "disagree-reflect")).toBe(true);
  });

  it("exports a Learner lens section for the pack", async () => {
    const mission = await missionThroughDecide();
    const md = buildLearnerLensMarkdown(mission);
    expect(md).toContain("## Learner lens (your contributions)");
    expect(md).toContain("### Contributions");
    expect(md).toContain("### Judgements");
    expect(md).toContain("does not block execution");
  });
});
