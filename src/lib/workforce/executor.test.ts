import { describe, expect, it } from "vitest";
import { buildDeliveryReport, executeTaskStep, nextMissionStatusAfterRun } from "./executor";
import type { WfMissionTask } from "./types";

function baseTask(overrides: Partial<WfMissionTask> = {}): WfMissionTask {
  return {
    id: "task-1",
    missionId: "m1",
    workspaceId: "w1",
    planId: "p1",
    sortOrder: 0,
    title: "Draft product investigation brief",
    description: "Write brief",
    acceptanceCriteria: "Brief exists",
    capabilityIds: [],
    key: "t0",
    dependsOn: [],
    stage: null,
    gate: false,
    requiredSections: [],
    produces: null,
    status: "pending",
    permissionRequired: "create",
    isExternal: false,
    estimatedUsage: 10,
    actualUsage: 0,
    evidenceNotes: [],
    startedAt: null,
    completedAt: null,
    createdAt: "2026-10-21T00:00:00.000Z",
    updatedAt: "2026-10-21T00:00:00.000Z",
    ...overrides,
  };
}

const mission = {
  id: "m1",
  workspaceId: "w1",
  intent: "investigate" as const,
  title: "Investigate: sponsor dashboard",
  requestText:
    "Investigate whether we should add a sponsor dashboard for healthcare delivery leads",
  clarificationAnswers: { audience: "COO" },
  permissionCeiling: "execute_internally" as const,
  externalActionsApproved: false,
};

describe("executeTaskStep", () => {
  it("produces a brief artefact and charges usage", () => {
    const result = executeTaskStep({
      mission,
      task: baseTask(),
      budget: { ceiling: 100, consumed: 0 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.usageCharged).toBe(10);
      expect(result.nextBudget.consumed).toBe(10);
      expect(result.artefact?.kind).toBe("brief");
      expect(result.artefact?.qualityLabels).not.toContain("verified" as never);
      expect(result.artefact?.evidenceItems.some((e) => e.classification === "sourced_facts")).toBe(
        true,
      );
    }
  });

  it("blocks external tasks without approval", () => {
    const result = executeTaskStep({
      mission,
      task: baseTask({
        title: "Share brief externally",
        isExternal: true,
        permissionRequired: "act_externally",
        estimatedUsage: 5,
      }),
      budget: { ceiling: 100, consumed: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("external_approval_required");
      expect(result.task.status).toBe("blocked");
    }
  });

  it("hard-stops when the usage ceiling is reached", () => {
    const result = executeTaskStep({
      mission,
      task: baseTask({ estimatedUsage: 20 }),
      budget: { ceiling: 100, consumed: 95 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("ceiling_reached");
  });
});

describe("delivery status", () => {
  it("marks partially_completed when ceiling stops remaining work", () => {
    const tasks = [
      baseTask({ id: "a", status: "completed" }),
      baseTask({ id: "b", status: "blocked" }),
    ];
    expect(nextMissionStatusAfterRun({ tasks, hitCeiling: true })).toBe("partially_completed");
    const report = buildDeliveryReport({
      missionTitle: "Test",
      intent: "investigate",
      tasks,
      artefacts: [{ title: "Brief", qualityLabels: ["agent_reviewed"] }],
      usageSpent: 95,
      partial: true,
    });
    expect(report.headline).toMatch(/Partial/);
    expect(report.qualitySummary).toEqual(["agent_reviewed"]);
  });
});

describe("structure checks (legacy plan)", () => {
  const checkTask = baseTask({
    key: "auto_test",
    title: "Run automatic structure checks",
    estimatedUsage: 4,
  });
  const prototype = (content: string) => ({
    kind: "prototype_html" as const,
    title: "Lightweight interactive prototype (HTML)",
    content,
    contentFormat: "html" as const,
    taskKey: "html",
    requiredSections: [],
  });
  const good = `<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>T</title></head><body><main><button>Go</button></main></body></html>`;

  it("fails, and claims no test, when there is no prototype to check", () => {
    const result = executeTaskStep({
      mission,
      task: checkTask,
      budget: { ceiling: 100, consumed: 0 },
      upstream: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.task.status).toBe("failed");
      expect(result.artefact).toBeUndefined();
      expect(result.detail).toMatch(/nothing to check/);
    }
  });

  it("records each check that ran against the saved prototype", () => {
    const result = executeTaskStep({
      mission,
      task: checkTask,
      budget: { ceiling: 100, consumed: 0 },
      upstream: [prototype(good)],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artefact?.qualityLabels).toEqual(["automatically_tested"]);
      expect(result.artefact?.content).toMatch(/\| pass \|/);
      expect(result.artefact?.content).not.toMatch(/\| fail \|/);
      expect(result.artefact?.content).toMatch(/not run in a browser/);
    }
  });

  it("fails the task and reports which checks failed", () => {
    const result = executeTaskStep({
      mission,
      task: checkTask,
      budget: { ceiling: 100, consumed: 0 },
      upstream: [prototype("<div>no document</div>")],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.task.status).toBe("failed");
      expect(result.artefact?.content).toMatch(/\| fail \|/);
      expect(result.detail).toMatch(/static checks? failed/);
      expect(result.artefact?.qualityLabels).toEqual([]);
    }
  });

  it("never labels a prototype tested just because its task title mentions tests", () => {
    const result = executeTaskStep({
      mission,
      task: baseTask({ title: "Build and test the HTML prototype", key: "html" }),
      budget: { ceiling: 100, consumed: 0 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.artefact?.kind).toBe("prototype_html");
      expect(result.artefact?.qualityLabels).not.toContain("automatically_tested");
    }
  });

  it("recognises the check task on older rows saved without a stored key", () => {
    const result = executeTaskStep({
      mission,
      task: baseTask({ key: "t3", title: "Run automatic structure checks" }),
      budget: { ceiling: 100, consumed: 0 },
      upstream: [],
    });
    expect(result.ok).toBe(false);
  });
});
