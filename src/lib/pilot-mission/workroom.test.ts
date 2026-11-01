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
    const bundle = deliveryBundle(discovered);
    bundle.tasks = bundle.tasks.map((t) =>
      t.status === "completed" ? { ...t, actualUsage: t.estimatedUsage - 1 } : t,
    );
    const spent = bundle.tasks.reduce((n, t) => n + t.actualUsage, 0);
    expect(spent).toBeGreaterThan(0);
    const wr = buildWorkroom(bundle);
    const budget = productMissionTasks("Build a waste log", false).reduce(
      (n, t) => n + t.estimatedUsage,
      0,
    );
    expect(wr.usage.budget).toBe(budget);
    expect(wr.team.reduce((n, m) => n + m.usage.budget, 0)).toBe(budget);
    expect(wr.usage.used).toBe(spent);
    expect(wr.team.reduce((n, m) => n + m.usage.used, 0)).toBe(spent);
    expect(wr.team.every((m) => m.name !== "You")).toBe(true);
    const keystone = wr.team.find((m) => m.name === "Keystone")!;
    expect(keystone.tasks).toMatchObject({ total: 2, done: 1 });
    // Keystone covers two catalogue roles; both are shown.
    expect(keystone.role.split(" · ")).toHaveLength(2);
  });

  it("groups the timeline by lifecycle stage in plan order", () => {
    const wr = buildWorkroom(deliveryBundle({}));
    expect(wr.timeline.map((l) => l.stage)).toEqual([
      "Capture the mission",
      "Discover & research",
      "Define the opportunity",
      "Design the solution",
      "Coordinate the build",
      "Verify the product",
      "Approve & release",
      "Learn & evolve",
    ]);
  });

  it("counts skipped prerequisites as ready and flags failed work as needing attention", () => {
    const wr = buildWorkroom(
      deliveryBundle({ charter: "completed", market: "skipped", research: "failed" }),
    );
    const prd = wr.cards.find((c) => c.key === "prd")!;
    expect(prd.plan.buildsOn.find((d) => d.owner === "Scout")?.done).toBe(true);
    expect(wr.team.find((m) => m.name === "Maya")?.tasks.needsYou).toBe(1);
  });
});

describe("Workroom inbox and quality", () => {
  it("lists what needs you and the team's updates, newest first", () => {
    const wr = buildWorkroom(
      deliveryBundle({ ...discovered }, { artefactsFor: ["charter", "market"] }),
    );
    expect(wr.inbox.needsYou).toEqual([
      expect.objectContaining({ kind: "gate", taskId: "task-gate_scope" }),
    ]);
    const ats = wr.inbox.updates.map((u) => u.at);
    expect(ats).toEqual([...ats].sort().reverse());
  });

  it("recomputes each output's contract check from its saved content", () => {
    const bundle = deliveryBundle({ charter: "completed" }, { artefactsFor: ["charter"] });
    const charterTask = bundle.tasks.find((t) => t.key === "charter")!;
    // A complete output: every required section present with a real body.
    bundle.artefacts = bundle.artefacts.map((a) => ({
      ...a,
      content: charterTask.requiredSections
        .map((h) => `## ${h}\nA substantive paragraph here.`)
        .join("\n\n"),
    }));
    const ok = buildWorkroom(bundle).quality[0]!;
    expect(ok.check).toMatchObject({
      kind: "contract",
      total: charterTask.requiredSections.length,
    });
    expect(ok.check!.passed).toBe(ok.check!.total);
    expect(ok.simulated).toBe(true);
    // The fixture's stub content misses sections, and the check says which.
    const stub = buildWorkroom(
      deliveryBundle({ charter: "completed" }, { artefactsFor: ["charter"] }),
    ).quality[0]!;
    expect(stub.check!.passed).toBeLessThan(stub.check!.total);
    expect(stub.check!.problems.length).toBeGreaterThan(0);
  });
});
