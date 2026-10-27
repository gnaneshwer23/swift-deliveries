import { describe, expect, it } from "vitest";
import {
  buildDecisionPackMarkdown,
  buildDecisionPackPdf,
  honestyFor,
} from "./decision-pack";
import { planResearchMode } from "./research-mode";
import { MemoryStore, SupervisedMissionService } from "./service";
import { buildPilotTeamPlan, syncTeamWithMission } from "./specialist-team";
import { nextRequiredAction, type SupervisedMission } from "./types";

const brief = {
  question: "Which onboarding change should we investigate first?",
  audience: "Founders setting up a workspace",
  outcome: "A decision pack and an experiment brief.",
  constraints: "No customer contact and no deployment.",
};

describe("founder vertical slice — specialist plan", () => {
  it("staffs eight Available specialists with visible ownership on the plan", () => {
    const plan = buildPilotTeamPlan();
    expect(plan.capabilityIds).toEqual([
      "DX-001",
      "DX-002",
      "DX-018",
      "DX-020",
      "DX-021",
      "DX-023",
      "DX-035",
      "DX-071",
    ]);
    expect(plan.tasks.every((t) => t.ownerLabel.length > 0)).toBe(true);
    expect(plan.tasks.some((t) => t.actor === "human" && t.key === "human_decision")).toBe(true);
    expect(plan.approvedAt).toBeNull();
    const owners = new Map(plan.tasks.map((t) => [t.key, t.capabilityId]));
    expect(owners.get("register_evidence")).toBe("DX-018");
    expect(owners.get("draft_options")).toBe("DX-021");
    expect(owners.get("challenge_options")).toBe("DX-071");
    expect(owners.get("human_decision")).toBeNull();
  });

  it("blocks evidence and comparison until the plan is approved", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const created = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    expect(nextRequiredAction(created).id).toBe("approve_plan");
    expect(created.team?.tasks.every((t) => t.status === "awaiting_approval")).toBe(true);
    await expect(
      service.saveEvidence({
        workspaceId: "alpha",
        id: created.id,
        items: [
          {
            statement: "Setup asks for a goal early.",
            source: "Founder note",
            classification: "supplied",
          },
        ],
        nowMs: 2_000,
      }),
    ).rejects.toThrow(/Approve the specialist plan/);

    const approved = await service.approvePlan({
      workspaceId: "alpha",
      id: created.id,
      actorId: "owner",
      nowMs: 2_000,
    });
    expect(approved.team?.approvedAt).toBeTruthy();
    // Research-first: placeholders are seeded at create, so the next gate is compare.
    expect(approved.evidence.length).toBeGreaterThan(0);
    expect(nextRequiredAction(approved).id).toBe("compare");
    expect(approved.activity.some((e) => e.kind === "plan.approved")).toBe(true);
    expect(approved.activity.some((e) => e.kind === "pm_brief.drafted")).toBe(true);
  });

  it("defaults to combined research and soft-fills a one-liner brief", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const created = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief: {
        question: "Should we charge for onboarding analytics before launch?",
        audience: "",
        outcome: "",
        constraints: "",
      },
      usageCeiling: 4,
      nowMs: 1_000,
    });
    expect(created.researchMode).toBe("combined");
    expect(created.brief.audience.length).toBeGreaterThan(2);
    expect(created.brief.outcome.length).toBeGreaterThan(7);
    expect(created.evidence.some((e) => e.classification === "gap")).toBe(true);
  });
});

describe("founder vertical slice — research mode honesty", () => {
  it("blocks pure web mode when no search provider key is configured", () => {
    const plan = planResearchMode("web", {});
    expect(plan.executable).toBe(false);
    expect(plan.blockReason).toMatch(/will not invent retrieved research/i);
    expect(plan.tools.every((t) => t.id !== "web_search" || !t.available)).toBe(true);
  });

  it("allows combined mode with provided evidence and marks external gaps", () => {
    const plan = planResearchMode("combined", {});
    expect(plan.executable).toBe(true);
    expect(plan.externalGaps.some((g) => /Web portion unavailable/i.test(g))).toBe(true);
  });

  it("records research mode changes as persisted activity", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const created = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      researchMode: "provided",
      usageCeiling: 4,
      nowMs: 1_000,
    });
    await service.approvePlan({
      workspaceId: "alpha",
      id: created.id,
      actorId: "owner",
      nowMs: 1_500,
    });
    // Combined remains executable without a search key; gaps are marked honestly.
    const updated = await service.setResearchMode({
      workspaceId: "alpha",
      id: created.id,
      mode: "combined",
      actorId: "owner",
      nowMs: 2_000,
    });
    expect(updated.researchMode).toBe("combined");
    expect(updated.researchGaps.length).toBeGreaterThan(0);
    expect(updated.activity.some((e) => e.kind === "research_mode.set")).toBe(true);
  });
});

describe("founder vertical slice — decision pack export", () => {
  it("includes the honesty contract sections in Markdown and PDF", async () => {
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
      nowMs: 1_200,
    });
    mission = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        {
          statement: "Setup asks for a goal before the product question is saved.",
          source: "Founder note, 24 Oct 2026",
          classification: "supplied",
        },
        {
          statement: "No observed completion rate is available.",
          source: "",
          classification: "gap",
        },
      ],
      nowMs: 2_000,
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
          gaps: ["No observed completion rate."],
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
      choice: "accept",
      note: "Proceed with the draft option.",
      actorId: "owner",
      nowMs: 4_000,
    });
    mission = await service.recordExpectation({
      workspaceId: "alpha",
      id: mission.id,
      hypothesis: "Shorter setup raises completion without new interviews.",
      expectedMetric: "Setup completion rate",
      baseline: "Unknown — no observation yet",
      observationWindow: "Two weeks after change",
      actorId: "owner",
      nowMs: 4_500,
    });
    mission = await service.prepareArtefact({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 5_000,
    });
    mission = await service.exportMission({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 6_000,
    });

    const md = mission.exportBody ?? buildDecisionPackMarkdown(mission);
    expect(md).toContain("## Honesty labels");
    expect(md).toContain("Sources bundled: no");
    expect(md).toContain("## 1. Mission objective, scope and constraints");
    expect(md).toContain("## 2. Evidence register");
    expect(md).toContain("## 3. Options and recommendation");
    expect(md).toContain("## 4. Human decisions and approval history");
    expect(md).toContain("## 5. Product / experiment brief");
    expect(md).toContain("## 6. Execution and review status");
    expect(md).toContain("### Specialist ownership");
    expect(md).toContain("## 7. Proposed next step and outcome-review plan");
    expect(md).toMatch(/DX-018|Evidence/);
    expect(honestyFor(mission).sourcesBundled).toBe(false);
    expect(mission.exportPdfBase64).toBeTruthy();
    const pdf = buildDecisionPackPdf(md);
    expect(pdf[0]).toBe(0x25); // %
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
  });
});

describe("founder vertical slice — follow-up not auto-started", () => {
  it("keeps a proposed follow-up inactive until explicit approval", async () => {
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
      nowMs: 1_100,
    });
    mission = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        {
          statement: "Setup asks for a goal early.",
          source: "Founder note",
          classification: "supplied",
        },
      ],
      nowMs: 2_000,
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
      choice: "accept",
      note: "",
      actorId: "owner",
      nowMs: 4_000,
    });
    mission = await service.recordExpectation({
      workspaceId: "alpha",
      id: mission.id,
      hypothesis: "A bounded change improves setup completion.",
      expectedMetric: "Setup completion rate",
      baseline: "Unknown",
      observationWindow: "Two weeks",
      actorId: "owner",
      nowMs: 4_500,
    });
    mission = await service.prepareArtefact({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 5_000,
    });
    mission = await service.exportMission({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 6_000,
    });
    mission = await service.recordObservation({
      workspaceId: "alpha",
      id: mission.id,
      result: "Completion rose in the owner-supplied sample.",
      evidence: "Spreadsheet the founder exported.",
      source: "Owner worksheet, Oct 2026",
      actorId: "owner",
      nowMs: 7_000,
    });
    mission = await service.recordReview({
      workspaceId: "alpha",
      id: mission.id,
      reading: "consistent",
      uncertainty: "Sample is small and was not measured by DeliverX.",
      followUp: {
        question: "Should we remove another setup step next?",
        audience: "Founders",
        outcome: "A decision pack for the next change.",
        constraints: "Still no customer contact.",
      },
      actorId: "owner",
      nowMs: 8_000,
    });

    expect(mission.followUp?.status).toBe("proposed");
    expect(mission.followUp?.missionId).toBeNull();
    expect(nextRequiredAction(mission).id).toBe("approve_follow_up");
    const synced = syncTeamWithMission(mission.team!, mission);
    const follow = synced.tasks.find((t) => t.key === "propose_follow_up");
    expect(follow?.status).toBe("awaiting_approval");
    expect(follow?.blockedReason).toMatch(/not started until you approve/i);

    const approved = await service.approveFollowUp({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      followUpMissionId: crypto.randomUUID(),
      usageCeiling: 4,
      nowMs: 9_000,
    });
    expect(approved.followUp?.status).toBe("approved");
    expect(approved.followUp?.missionId).toBeTruthy();
    const child = await service.get("alpha", approved.followUp!.missionId!);
    expect(child).toBeTruthy();
    expect(child!.stage).toBe("brief");
    expect(child!.team && !child!.team.approvedAt).toBe(true);
    expect(nextRequiredAction(child as SupervisedMission).id).toBe("approve_plan");
  });
});
