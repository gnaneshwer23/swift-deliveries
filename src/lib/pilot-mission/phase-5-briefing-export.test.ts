import { describe, expect, it } from "vitest";
import { authorisedDecisionPackMarkdown, authorisedDecisionPackPdfBytes } from "./export-snapshot";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import { MemoryStore, SupervisedMissionService } from "./service";
import { buildSupervisedZip } from "./supervised-zip";
import { traceFindingToRecommendation } from "./team-collaboration";

const brief = {
  question: "Which onboarding change should we investigate first?",
  audience: "Founders setting up a workspace",
  outcome: "A decision pack and an experiment brief.",
  constraints: "No customer contact and no deployment.",
};

describe("Phase 5 — briefing and downloadable record", () => {
  it("preserves human disagreement on the briefing pack and export", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 6,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      nowMs: 2_000,
      env: {},
    });
    mission = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        {
          statement: "Setup asks for a goal before the product question is saved.",
          source: "Founder note",
          classification: "supplied",
        },
        {
          statement: "No observed completion rate is available.",
          source: "",
          classification: "gap",
        },
      ],
      nowMs: 2_500,
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
      choice: "founder_requested_continuation",
      note: "Proceed anyway with eyes open.",
      actorId: "owner",
      nowMs: 4_000,
    });

    const pack = buildPmBriefingPack(mission);
    expect(pack.disagreesWithRecommendation).toBe(true);
    expect(pack.humanNextPathLabel).toMatch(/Founder-requested continuation/i);
    expect(pack.recommendationLabel).toBeTruthy();

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

    const md = mission.exportBody!;
    expect(md).toContain("### Supporting evidence");
    expect(md).toContain("### Counterevidence & gaps");
    expect(md).toContain("### Important unknowns");
    expect(md).toMatch(/Human decision vs agent recommendation/i);
    expect(md).toMatch(/does not erase the recommendation/i);
    expect(md).toContain("## Recorded team collaboration");
    expect(md).toMatch(/Decision roadmap/);
    expect(md).toMatch(/Honesty labels/);
  });

  it("uses one authorised snapshot for Markdown, PDF, and ZIP", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 6,
      nowMs: 1_000,
    });
    mission = await service.approvePlan({
      workspaceId: "alpha",
      id: mission.id,
      actorId: "owner",
      nowMs: 2_000,
      env: {},
    });
    mission = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        {
          statement: "Founder supplied context on setup friction.",
          source: "Founder",
          classification: "supplied",
        },
      ],
      nowMs: 2_500,
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
          label: "simulated",
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

    const findingId = mission.evidence.find((e) => e.classification === "supplied")!.id;
    const trace = traceFindingToRecommendation(
      mission.teamCollaboration!,
      findingId,
      mission.evidence,
    );
    expect(trace).not.toBeNull();

    const md = authorisedDecisionPackMarkdown(mission);
    expect(md).toBe(mission.exportBody);
    const pdf = authorisedDecisionPackPdfBytes(mission);
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");

    const { files } = buildSupervisedZip(mission);
    const zipMd = files.find((f) => f.path.endsWith("decision-pack/decision-pack.md"))!.content;
    expect(zipMd).toBe(mission.exportBody);
    expect(files.some((f) => f.path.endsWith("briefing/product-briefing.md"))).toBe(true);
    expect(files.some((f) => f.path.endsWith("team-collaboration/team-collaboration.md"))).toBe(
      true,
    );
    const collab = files.find((f) =>
      f.path.endsWith("team-collaboration/team-collaboration.md"),
    )!.content;
    expect(collab).toMatch(/Evidence trace.*handoffs/i);
    expect(collab).toContain(findingId);

    const manifest = JSON.parse(
      files.find((f) => f.path.endsWith("project-manifest.json"))!.content,
    );
    expect(manifest.exportSnapshotFrozen).toBe(true);
    expect(manifest.teamCollaborationBundled).toBe(true);
    expect(manifest.permissionsNote).toMatch(/workspace-scoped/i);
  });

  it("does not expose missions across workspaces", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief,
      usageCeiling: 4,
      nowMs: 1_000,
    });
    const other = await service.get("beta", mission.id);
    expect(other).toBeNull();
  });
});
