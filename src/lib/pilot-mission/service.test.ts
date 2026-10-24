import { describe, expect, it } from "vitest";
import { notConfiguredGeneration } from "./generate";
import { generationPlan } from "./generate.server";
import { learningLinks } from "./learning";
import {
  ApprovalMismatchError,
  MemoryStore,
  MissionNotFoundError,
  SupervisedMissionService,
  UsageLimitError,
  missionFromRow,
} from "./service";
import {
  LEASE_MS,
  NOT_RUN_LABEL,
  OWNER_SUPPLIED_OBSERVATION_LABEL,
  workspaceAllowsSpend,
  type GenerationResult,
  type SupervisedMission,
} from "./types";

const brief = {
  question: "Which onboarding change should we investigate first?",
  audience: "Founders setting up a workspace",
  outcome: "A decision pack and an experiment brief.",
  constraints: "No customer contact and no deployment.",
};

const evidence = [
  {
    statement: "Account setup asks for a goal before the product question is saved.",
    source: "Founder note, 24 Oct 2026",
    classification: "supplied",
  },
  {
    statement: "No observed completion rate is available.",
    source: "",
    classification: "gap",
  },
];

function modelResult(): GenerationResult {
  return {
    ran: true,
    label: "gpt-4.1",
    provider: "openai",
    model: "gpt-4.1",
    output: JSON.stringify({
      options: [
        {
          id: "shorten-setup",
          title: "Investigate a shorter setup",
          tradeoff: "Removes a step before any observed baseline exists.",
          basis: "e1",
        },
        {
          id: "hold",
          title: "Hold for a baseline",
          tradeoff: "Waits until a completion observation is supplied.",
          basis: "e2",
        },
      ],
      citations: ["e1"],
      gaps: ["No observed completion rate."],
    }),
    citations: ["e1"],
    gaps: ["No observed completion rate."],
  };
}

async function readyMission(
  service: SupervisedMissionService,
  workspaceId = "alpha",
  ceiling = 4,
): Promise<SupervisedMission> {
  const created = await service.create({
    id: crypto.randomUUID(),
    workspaceId,
    ownerUserId: "owner",
    brief,
    usageCeiling: ceiling,
    nowMs: 1_000,
  });
  return service.saveEvidence({
    workspaceId,
    id: created.id,
    items: evidence,
    nowMs: 2_000,
  });
}

describe("supervised mission isolation, approval and recovery", () => {
  it("stops one workspace from reading another workspace mission", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const alpha = await readyMission(service, "alpha");
    const beta = await readyMission(service, "beta");
    expect(await service.get("beta", alpha.id)).toBeNull();
    expect(await service.get("alpha", beta.id)).toBeNull();
    expect((await service.list("beta")).map((mission) => mission.id)).not.toContain(alpha.id);
    await expect(
      service.saveEvidence({
        workspaceId: "beta",
        id: alpha.id,
        items: evidence,
        nowMs: 3_000,
      }),
    ).rejects.toBeInstanceOf(MissionNotFoundError);
    expect(
      missionFromRow(
        {
          id: alpha.id,
          workspace_id: "alpha",
          version: 2,
          usage_ceiling: 4,
          usage_consumed: 0,
          document: { ...alpha, workspaceId: "beta" },
        },
        "beta",
      ),
    ).toBeNull();
    expect(
      missionFromRow(
        {
          id: alpha.id,
          workspace_id: "alpha",
          version: alpha.version,
          usage_ceiling: alpha.usageCeiling,
          usage_consumed: alpha.usageConsumed,
          document: alpha,
        },
        "alpha",
      )?.workspaceId,
    ).toBe("alpha");
  });

  it("invalidates an approval when the evidence scope changes", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await readyMission(service);
    const compared = await service.runAlternatives({
      workspaceId: "alpha",
      id: mission.id,
      workerId: "worker-a",
      nowMs: 3_000,
      generator: { cost: 1, run: async () => modelResult() },
    });
    const proposal = compared.mission.proposal;
    expect(proposal?.action).toBe("compare_options");
    if (!proposal) throw new Error("expected a proposal");
    await expect(
      service.decide({
        workspaceId: "alpha",
        id: mission.id,
        claim: { ...proposal, version: proposal.version + 1, optionId: proposal.options[0]!.id },
        choice: "accept",
        note: "",
        actorId: "owner",
        nowMs: 4_000,
      }),
    ).rejects.toBeInstanceOf(ApprovalMismatchError);
    const decided = await service.decide({
      workspaceId: "alpha",
      id: mission.id,
      claim: {
        action: proposal.action,
        version: proposal.version,
        scopeHash: proposal.scopeHash,
        optionId: "shorten-setup",
      },
      choice: "accept",
      note: "Start with the supplied setup note.",
      actorId: "owner",
      nowMs: 4_000,
    });
    expect(decided.approval?.version).toBe(proposal.version);
    expect(decided.approval?.scopeHash).toBe(proposal.scopeHash);
    const changed = await service.saveEvidence({
      workspaceId: "alpha",
      id: mission.id,
      items: [
        ...evidence,
        {
          statement: "A second founder note says the goal step is optional.",
          source: "Founder note, later the same day",
          classification: "supplied",
        },
      ],
      nowMs: 5_000,
    });
    expect(changed.approval).toBeNull();
    expect(changed.proposal).toBeNull();
    expect(changed.invalidatedApprovals).toHaveLength(1);
    expect(changed.invalidatedApprovals[0]?.scopeHash).toBe(proposal.scopeHash);
    await expect(
      service.decide({
        workspaceId: "alpha",
        id: mission.id,
        claim: {
          action: proposal.action,
          version: proposal.version,
          scopeHash: proposal.scopeHash,
          optionId: "shorten-setup",
        },
        choice: "accept",
        note: "",
        actorId: "owner",
        nowMs: 6_000,
      }),
    ).rejects.toBeInstanceOf(ApprovalMismatchError);
  });

  it("records one spend when a failed comparison is retried and reloaded", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await readyMission(service, "alpha", 1);
    let fail = true;
    let calls = 0;
    const run = () =>
      service.runAlternatives({
        workspaceId: "alpha",
        id: mission.id,
        workerId: crypto.randomUUID(),
        nowMs: 10_000 + calls,
        generator: {
          cost: 1,
          run: async () => {
            calls += 1;
            if (fail) throw new Error("provider timeout");
            return modelResult();
          },
        },
      });
    await expect(run()).rejects.toThrow(/provider timeout/);
    const failed = await service.get("alpha", mission.id);
    expect(failed?.job.status).toBe("failed");
    expect(failed?.spendRecords).toHaveLength(0);
    expect(failed?.usageConsumed).toBe(0);
    fail = false;
    const recovered = await run();
    expect(recovered.chargedUnits).toBe(1);
    expect(recovered.mission.spendRecords).toHaveLength(1);
    const reloaded = await run();
    expect(reloaded.chargedUnits).toBe(0);
    expect(reloaded.mission.spendRecords).toHaveLength(1);
    expect(reloaded.mission.usageConsumed).toBe(1);
    expect(calls).toBe(2);
    await expect(run()).resolves.toMatchObject({ chargedUnits: 0 });
    expect(calls).toBe(2);
  });

  it("recovers an expired lease without a second spend record", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await readyMission(service);
    let release: (value: GenerationResult) => void = () => undefined;
    const hung = new Promise<GenerationResult>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    const first = service.runAlternatives({
      workspaceId: "alpha",
      id: mission.id,
      workerId: "worker-a",
      nowMs: 10_000,
      generator: {
        cost: 1,
        run: () => {
          calls += 1;
          return hung;
        },
      },
    });
    let leased = false;
    for (let attempt = 0; attempt < 20 && !leased; attempt += 1) {
      await Promise.resolve();
      leased = (await service.get("alpha", mission.id))?.job.status === "leased";
    }
    expect(leased).toBe(true);
    const recovered = await service.runAlternatives({
      workspaceId: "alpha",
      id: mission.id,
      workerId: "worker-b",
      nowMs: 10_000 + LEASE_MS + 1,
      generator: {
        cost: 1,
        run: async () => {
          calls += 1;
          return modelResult();
        },
      },
    });
    expect(recovered.chargedUnits).toBe(1);
    release(modelResult());
    await expect(first).rejects.toThrow(/Lease recovered/);
    const again = await service.runAlternatives({
      workspaceId: "alpha",
      id: mission.id,
      workerId: "worker-c",
      nowMs: 99_000,
      generator: {
        cost: 1,
        run: async () => {
          calls += 1;
          return modelResult();
        },
      },
    });
    expect(again.chargedUnits).toBe(0);
    expect(again.mission.spendRecords).toHaveLength(1);
    expect(again.mission.usageConsumed).toBe(1);
    expect(calls).toBe(2);
  });

  it("stores an explicit not-run record and exports one pack without a second spend", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const mission = await readyMission(service, "alpha", 0);
    await expect(
      service.runAlternatives({
        workspaceId: "alpha",
        id: mission.id,
        workerId: "worker-blocked",
        nowMs: 2_500,
        generator: { cost: 1, run: async () => modelResult() },
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);
    expect((await service.get("alpha", mission.id))?.spendRecords).toHaveLength(0);
    const generator = { cost: 0 as const, run: async () => notConfiguredGeneration() };
    const compared = await service.runAlternatives({
      workspaceId: "alpha",
      id: mission.id,
      workerId: "worker-a",
      nowMs: 3_000,
      generator,
    });
    expect(compared.mission.proposal?.generation.label).toBe(NOT_RUN_LABEL);
    expect(compared.mission.proposal?.generation.ran).toBe(false);
    expect(compared.chargedUnits).toBe(0);
    expect(compared.mission.spendRecords).toEqual([
      expect.objectContaining({ units: 0, reason: NOT_RUN_LABEL }),
    ]);
    const proposal = compared.mission.proposal;
    if (!proposal) throw new Error("expected a proposal");
    const decided = await service.decide({
      workspaceId: "alpha",
      id: mission.id,
      claim: {
        action: proposal.action,
        version: proposal.version,
        scopeHash: proposal.scopeHash,
        optionId: "close-gap",
      },
      choice: "request_more_evidence",
      note: "The completion rate is missing.",
      actorId: "owner",
      nowMs: 4_000,
    });
    const packed = await service.prepareArtefact({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 5_000,
    });
    const exported = await service.exportMission({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 6_000,
    });
    const again = await service.exportMission({
      workspaceId: "alpha",
      id: mission.id,
      nowMs: 7_000,
    });
    expect(decided.stage).toBe("decision");
    expect(packed.artefact?.title).toContain("research");
    expect(exported.exportBody).toContain(NOT_RUN_LABEL);
    expect(exported.exportBody).toContain("Hypothesis");
    expect(exported.exportBody).toContain("no baseline has been observed");
    expect(again.exportBody).toBe(exported.exportBody);
    expect(again.spendRecords).toHaveLength(1);
    expect(again.usageConsumed).toBe(0);
    expect(workspaceAllowsSpend({ ceiling: 4, consumed: 4, cost: 1, alreadyRecorded: false })).toBe(
      false,
    );
    expect(workspaceAllowsSpend({ ceiling: 4, consumed: 4, cost: 1, alreadyRecorded: true })).toBe(
      true,
    );
  });

  it("blocks the next billable comparison when a workspace is at its ceiling and leaves another workspace able to run", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const alpha = await readyMission(service, "alpha", 1);
    const beta = await readyMission(service, "beta", 1);
    const first = await service.runAlternatives({
      workspaceId: "alpha",
      id: alpha.id,
      workerId: "worker-alpha",
      nowMs: 3_000,
      generator: { cost: 1, run: async () => modelResult() },
    });
    expect(first.chargedUnits).toBe(1);
    const changed = await service.saveEvidence({
      workspaceId: "alpha",
      id: alpha.id,
      items: [
        ...evidence,
        {
          statement: "A second note was added after the first comparison.",
          source: "Founder note, 24 Oct 2026",
          classification: "supplied",
        },
      ],
      nowMs: 4_000,
    });
    expect(changed.evidence).toHaveLength(3);
    await expect(
      service.runAlternatives({
        workspaceId: "alpha",
        id: alpha.id,
        workerId: "worker-alpha-2",
        nowMs: 5_000,
        generator: { cost: 1, run: async () => modelResult() },
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);
    const readable = await service.get("alpha", alpha.id);
    expect(readable?.evidence).toHaveLength(3);
    expect(readable?.usageConsumed).toBe(1);
    const betaRun = await service.runAlternatives({
      workspaceId: "beta",
      id: beta.id,
      workerId: "worker-beta",
      nowMs: 6_000,
      generator: { cost: 1, run: async () => modelResult() },
    });
    expect(betaRun.chargedUnits).toBe(1);
    expect(await service.get("beta", alpha.id)).toBeNull();
    expect((await service.get("alpha", alpha.id))?.id).toBe(alpha.id);
  });

  it("does not call a provider when none is configured, and withholds personal identifiers", () => {
    expect(generationPlan({}, "Which setup change should we investigate?").mode).toBe(
      "not_configured",
    );
    expect(
      generationPlan(
        { DXSI_MODEL_ENABLED: "true", DXSI_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
        "Which setup change should we investigate?",
      ).mode,
    ).toBe("model");
    expect(
      generationPlan(
        { DXSI_MODEL_ENABLED: "true", DXSI_PROVIDER: "openai", OPENAI_API_KEY: "test-key" },
        "The contact number is 123-45-6789.",
      ).mode,
    ).toBe("withheld");
  });
});

const measurementPlan = {
  hypothesis: "A shorter setup could help people finish account creation.",
  expectedMetric: "More people reach the first useful action in the window.",
  baseline: "No completion count was available on 24 Oct 2026.",
  observationWindow: "The first seven days after the owner makes the change.",
};

const suppliedResult = {
  result: "The owner counted 4 of 10 people reaching the first useful action.",
  evidence: "A tally the owner kept beside the setup screen that week.",
  source: "Owner tally, 24 Oct 2026",
};

const firstUncertainty = "One owner tally over seven days cannot show why people left.";
const laterUncertainty = "The same tally still leaves the cause of leaving unknown.";

async function exportedMission(service: SupervisedMissionService): Promise<SupervisedMission> {
  const mission = await readyMission(service);
  const compared = await service.runAlternatives({
    workspaceId: "alpha",
    id: mission.id,
    workerId: "worker-a",
    nowMs: 3_000,
    generator: { cost: 0, run: async () => notConfiguredGeneration() },
  });
  const proposal = compared.mission.proposal;
  if (!proposal) throw new Error("expected a proposal");
  await service.decide({
    workspaceId: "alpha",
    id: mission.id,
    claim: {
      action: proposal.action,
      version: proposal.version,
      scopeHash: proposal.scopeHash,
      optionId: proposal.options[0]!.id,
    },
    choice: "accept",
    note: "Investigate the shorter setup.",
    actorId: "owner",
    nowMs: 4_000,
  });
  await service.recordExpectation({
    workspaceId: "alpha",
    id: mission.id,
    ...measurementPlan,
    actorId: "owner",
    nowMs: 4_500,
  });
  await service.prepareArtefact({ workspaceId: "alpha", id: mission.id, nowMs: 5_000 });
  return service.exportMission({ workspaceId: "alpha", id: mission.id, nowMs: 6_000 });
}

describe("supervised mission outcome review", () => {
  it("labels an owner-supplied observation and keeps review versions", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const exported = await exportedMission(service);
    expect(exported.exportBody).toContain(measurementPlan.hypothesis);
    expect(exported.exportBody).toContain("not measured by DeliverX");
    expect(exported.expectation).toMatchObject(measurementPlan);
    await expect(
      service.recordObservation({
        workspaceId: "alpha",
        id: exported.id,
        ...suppliedResult,
        actorId: "owner",
        nowMs: 6_100,
      }),
    ).resolves.toBeTruthy();
    const observed = await service.get("alpha", exported.id);
    expect(observed?.observation?.label).toBe(OWNER_SUPPLIED_OBSERVATION_LABEL);
    expect(observed?.observation?.provenance).toBe("owner-supplied");
    expect(observed?.observation?.label).toContain("DeliverX did not measure");
    expect(learningLinks(observed!).find((link) => link.step === "observation")?.detail).toBe(
      OWNER_SUPPLIED_OBSERVATION_LABEL,
    );

    await expect(
      service.recordReview({
        workspaceId: "alpha",
        id: exported.id,
        reading: "uncertain",
        uncertainty: "87%",
        followUp: {
          question: "Which setup step should we inspect next?",
          audience: "Founders setting up a workspace",
          outcome: "A narrower question grounded in the owner tally.",
          constraints: "No customer contact.",
        },
        actorId: "owner",
        nowMs: 7_000,
      }),
    ).rejects.toThrow(/confidence score/);
    expect((await service.get("alpha", exported.id))?.reviews).toHaveLength(0);

    const first = await service.recordReview({
      workspaceId: "alpha",
      id: exported.id,
      reading: "uncertain",
      uncertainty: firstUncertainty,
      followUp: {
        question: "Which setup step should we inspect next?",
        audience: "Founders setting up a workspace",
        outcome: "A narrower question grounded in the owner tally.",
        constraints: "No customer contact.",
      },
      actorId: "owner",
      nowMs: 7_000,
    });
    const revisedObservation = await service.recordObservation({
      workspaceId: "alpha",
      id: exported.id,
      result: "A later recount by the same owner still showed 4 of 10.",
      evidence: suppliedResult.evidence,
      source: suppliedResult.source,
      actorId: "owner",
      nowMs: 7_500,
    });
    expect(revisedObservation.reviews[0]?.observedResult).toBe(suppliedResult.result);
    const second = await service.recordReview({
      workspaceId: "alpha",
      id: exported.id,
      reading: "different",
      uncertainty: laterUncertainty,
      followUp: {
        question: "What should we ask about the setup step people leave?",
        audience: "Founders setting up a workspace",
        outcome: "One follow-up question the owner can approve.",
        constraints: "No customer contact.",
      },
      actorId: "owner",
      nowMs: 8_000,
    });
    expect(second.reviews).toHaveLength(2);
    expect(second.reviews[0]).toEqual(first.reviews[0]);
    expect(second.reviews[1]?.version).toBe(2);
    expect(second.reviews[1]?.uncertainty).toBe(laterUncertainty);
    expect(second.reviews[1]?.observedResult).toContain("later recount");
    expect(second.reviews[0]).not.toHaveProperty("confidence");
    expect(second.reviews[1]).not.toHaveProperty("confidence");
    expect(JSON.stringify(second.reviews)).not.toMatch(/confidence/i);
    expect(second.reviews[1]?.decision.optionId).toBe(exported.approval?.optionId);
    expect(second.reviews[1]?.artefactTitle).toBe(exported.artefact?.title);
    expect(second.followUp).toMatchObject({
      status: "proposed",
      missionId: null,
      reviewVersion: 2,
    });
  });

  it("does not start a follow-up mission until the owner approves it", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const exported = await exportedMission(service);
    await service.recordObservation({
      workspaceId: "alpha",
      id: exported.id,
      ...suppliedResult,
      actorId: "owner",
      nowMs: 7_000,
    });
    const before = (await service.list("alpha")).map((mission) => mission.id);
    const proposed = await service.recordReview({
      workspaceId: "alpha",
      id: exported.id,
      reading: "uncertain",
      uncertainty: firstUncertainty,
      followUp: {
        question: "Which setup step should we inspect next?",
        audience: "Founders setting up a workspace",
        outcome: "A narrower question grounded in the owner tally.",
        constraints: "No customer contact.",
      },
      actorId: "owner",
      nowMs: 8_000,
    });
    expect((await service.list("alpha")).map((mission) => mission.id)).toEqual(before);
    expect(proposed.followUp?.status).toBe("proposed");
    expect(proposed.followUp?.missionId).toBeNull();
    expect(proposed.stage).toBe("exported");
    const childId = crypto.randomUUID();
    const approved = await service.approveFollowUp({
      workspaceId: "alpha",
      id: exported.id,
      actorId: "owner",
      followUpMissionId: childId,
      usageCeiling: 4,
      nowMs: 9_000,
    });
    const missions = await service.list("alpha");
    expect(missions).toHaveLength(2);
    expect(approved.followUp).toMatchObject({
      status: "approved",
      missionId: childId,
      approvedBy: "owner",
    });
    const child = await service.get("alpha", childId);
    expect(child?.stage).toBe("brief");
    expect(child?.approval).toBeNull();
    expect(child?.proposal).toBeNull();
    expect(child?.origin).toMatchObject({
      parentMissionId: exported.id,
      reviewVersion: 1,
      artefactTitle: exported.artefact?.title,
    });
    await service.approveFollowUp({
      workspaceId: "alpha",
      id: exported.id,
      actorId: "owner",
      followUpMissionId: crypto.randomUUID(),
      usageCeiling: 4,
      nowMs: 10_000,
    });
    expect(await service.list("alpha")).toHaveLength(2);
    expect((await service.get("alpha", childId))?.stage).toBe("brief");
    const extra = await service.recordReview({
      workspaceId: "alpha",
      id: exported.id,
      reading: "uncertain",
      uncertainty: laterUncertainty,
      followUp: {
        question: "Should we look at one setup field only?",
        audience: "Founders setting up a workspace",
        outcome: "A second note that must not open another mission.",
        constraints: "No customer contact.",
      },
      actorId: "owner",
      nowMs: 11_000,
    });
    expect(extra.reviews).toHaveLength(2);
    expect(extra.followUp?.missionId).toBe(childId);
    expect(extra.followUp?.status).toBe("approved");
    expect(await service.list("alpha")).toHaveLength(2);
  });

  it("stops a second workspace from reading the review", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    const exported = await exportedMission(service);
    await service.recordObservation({
      workspaceId: "alpha",
      id: exported.id,
      ...suppliedResult,
      actorId: "owner",
      nowMs: 7_000,
    });
    const reviewed = await service.recordReview({
      workspaceId: "alpha",
      id: exported.id,
      reading: "uncertain",
      uncertainty: firstUncertainty,
      followUp: {
        question: "Which setup step should we inspect next?",
        audience: "Founders setting up a workspace",
        outcome: "A narrower question grounded in the owner tally.",
        constraints: "No customer contact.",
      },
      actorId: "owner",
      nowMs: 8_000,
    });
    expect(reviewed.reviews).toHaveLength(1);
    expect(await service.get("beta", exported.id)).toBeNull();
    expect((await service.list("beta")).map((mission) => mission.id)).not.toContain(exported.id);
    await expect(
      service.recordReview({
        workspaceId: "beta",
        id: exported.id,
        reading: "consistent",
        uncertainty: laterUncertainty,
        followUp: {
          question: "Which setup step should we inspect next?",
          audience: "Founders setting up a workspace",
          outcome: "A narrower question grounded in the owner tally.",
          constraints: "No customer contact.",
        },
        actorId: "intruder",
        nowMs: 9_000,
      }),
    ).rejects.toBeInstanceOf(MissionNotFoundError);
    expect((await service.get("alpha", exported.id))?.reviews).toHaveLength(1);
    expect(
      missionFromRow(
        {
          id: exported.id,
          workspace_id: "alpha",
          version: reviewed.version,
          usage_ceiling: 4,
          usage_consumed: 0,
          document: reviewed,
        },
        "beta",
      ),
    ).toBeNull();
    const restored = missionFromRow(
      {
        id: exported.id,
        workspace_id: "alpha",
        version: reviewed.version,
        usage_ceiling: 4,
        usage_consumed: 0,
        document: { ...reviewed, reviews: undefined },
      },
      "alpha",
    );
    expect(restored?.reviews).toEqual([]);
    expect(restored?.workspaceId).toBe("alpha");
  });
});
