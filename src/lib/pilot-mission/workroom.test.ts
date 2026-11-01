import { describe, expect, it } from "vitest";
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { deliveryBundle } from "./delivery-test-fixtures";
import { buildWorkroom } from "./workroom";

const discovered = {
  charter: "completed",
  market: "completed",
  research: "completed",
  foresight: "completed",
  prd: "completed",
} as const;

describe("buildWorkroom", () => {
  it("puts each task in the column its status says, with gates under Needs you", () => {
    const wr = buildWorkroom(deliveryBundle({ charter: "completed", market: "running" }));
    const col = (key: string) => wr.cards.find((c) => c.key === key)?.column;
    expect(col("charter")).toBe("done");
    expect(col("market")).toBe("working");
    expect(col("prd")).toBe("next");
    const gated = buildWorkroom(deliveryBundle(discovered));
    expect(gated.board.find((c) => c.id === "needs_you")?.cards.map((c) => c.key)).toEqual([
      "gate_scope",
    ]);
  });

  it("shows each agent's work plan from the task's own contract and dependencies", () => {
    const plan = productMissionTasks("Build a waste log", false).find((t) => t.key === "prd")!;
    const wr = buildWorkroom(deliveryBundle({ charter: "completed", market: "completed" }));
    const prd = wr.cards.find((c) => c.key === "prd")!;
    expect(prd.owner).toBe("Atlas");
    expect(prd.plan.mustInclude).toEqual(plan.requiredSections);
    expect(prd.plan.check).toBe(plan.acceptanceCriteria);
    expect(prd.plan.buildsOn.map((d) => [d.owner, d.done])).toEqual([
      ["Scout", true],
      ["Maya", false],
      ["Keystone", false],
    ]);
    expect(prd.plan.unblocks.length).toBeGreaterThan(0);
  });

  it("totals capacity from the units each task budgeted and spent — nothing invented", () => {
    const wr = buildWorkroom(deliveryBundle(discovered));
    const budget = productMissionTasks("Build a waste log", false).reduce(
      (n, t) => n + t.estimatedUsage,
      0,
    );
    expect(wr.usage.budget).toBe(budget);
    expect(wr.team.reduce((n, m) => n + m.usage.budget, 0)).toBe(budget);
    expect(wr.team.every((m) => m.name !== "You")).toBe(true);
    const keystone = wr.team.find((m) => m.name === "Keystone")!;
    expect(keystone.tasks).toMatchObject({ total: 2, done: 1 });
  });

  it("groups the timeline by lifecycle stage in plan order", () => {
    const wr = buildWorkroom(deliveryBundle({}));
    expect(wr.timeline.map((l) => l.stage).slice(0, 3)).toEqual([
      "Capture the mission",
      "Discover & research",
      "Define the opportunity",
    ]);
  });
});
