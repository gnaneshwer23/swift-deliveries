import { describe, expect, it } from "vitest";
import { emptyWatchtowerConfig, saveWatchtowerConfig, WATCHTOWER_HONESTY } from "./watchtower";
import { MemoryStore, SupervisedMissionService } from "./service";

describe("PT-6 Watchtower", () => {
  it("keeps last/next check empty until a runner exists", () => {
    const cfg = saveWatchtowerConfig(
      {
        enabled: true,
        topics: ["pricing"],
        competitors: ["RivalCo"],
        sourcesNote: "Public pricing pages only",
        frequency: "weekly",
        geography: "UK",
        budgetCeilingUnits: 2,
        notify: "digest",
        pauseUntil: null,
      },
      1_000,
    );
    expect(cfg.enabled).toBe(true);
    expect(cfg.lastSuccessfulCheckAt).toBeNull();
    expect(cfg.nextScheduledCheckAt).toBeNull();
    expect(cfg.lastFailure).toBeNull();
    expect(cfg.honesty).toBe(WATCHTOWER_HONESTY);
    expect(cfg.honesty.toLowerCase()).toContain("preferences only");
  });

  it("stays off when frequency is off", () => {
    const cfg = saveWatchtowerConfig(
      {
        enabled: true,
        topics: ["x"],
        competitors: [],
        sourcesNote: "",
        frequency: "off",
        geography: "",
        budgetCeilingUnits: 0,
        notify: "off",
        pauseUntil: null,
      },
      1_000,
    );
    expect(cfg.enabled).toBe(false);
  });

  it("persists preferences on the mission without claiming a runner", async () => {
    const service = new SupervisedMissionService(new MemoryStore());
    let mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: "alpha",
      ownerUserId: "owner",
      brief: {
        question: "Should we monitor rival pricing?",
        audience: "Founders",
        outcome: "A decision pack",
        constraints: "No customer contact.",
      },
      usageCeiling: 4,
      nowMs: 1_000,
    });
    mission = await service.saveWatchtower({
      workspaceId: "alpha",
      id: mission.id,
      enabled: true,
      topics: ["pricing"],
      competitors: [],
      sourcesNote: "",
      frequency: "monthly",
      geography: "",
      budgetCeilingUnits: 1,
      notify: "important",
      pauseUntil: null,
      actorId: "owner",
      nowMs: 2_000,
    });
    expect(mission.watchtower?.frequency).toBe("monthly");
    expect(mission.watchtower?.lastSuccessfulCheckAt).toBeNull();
    expect(mission.activity?.some((e) => e.kind === "watchtower.config_saved")).toBe(true);
    expect(emptyWatchtowerConfig(new Date().toISOString()).enabled).toBe(false);
  });
});
