import { describe, expect, it } from "vitest";
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { GENERATION_SOURCE_PREFIX } from "@/lib/workforce/stage-artefacts";
import type {
  MissionBundle,
  MissionStatus,
  TaskStatus,
  WfArtefact,
  WfMissionTask,
} from "@/lib/workforce/types";
import { buildDeliveryRoom } from "./delivery-room";

const T0 = "2026-10-31T10:00:00Z";

function bundle(
  statuses: Record<string, TaskStatus>,
  opts: { mission?: MissionStatus; artefactsFor?: string[] } = {},
): MissionBundle {
  const tasks: WfMissionTask[] = productMissionTasks("Build a waste log", false).map((p, i) => ({
    id: `task-${p.key}`,
    missionId: "m",
    workspaceId: "w",
    planId: "p",
    sortOrder: i,
    title: p.title,
    description: p.description,
    acceptanceCriteria: p.acceptanceCriteria,
    status: statuses[p.key] ?? "pending",
    permissionRequired: p.permissionRequired,
    isExternal: p.isExternal,
    estimatedUsage: p.estimatedUsage,
    actualUsage: 0,
    evidenceNotes: [],
    capabilityIds: p.capabilityIds,
    key: p.key,
    dependsOn: p.dependsOn ?? [],
    stage: p.stage ?? null,
    gate: Boolean(p.gate),
    requiredSections: p.requiredSections ?? [],
    produces: p.produces ?? null,
    startedAt: null,
    completedAt: statuses[p.key] === "completed" ? `2026-10-31T10:0${i % 10}:00Z` : null,
    createdAt: T0,
    updatedAt: T0,
  }));
  const artefacts: WfArtefact[] = (opts.artefactsFor ?? []).map((key) => ({
    id: `art-${key}`,
    missionId: "m",
    workspaceId: "w",
    taskId: `task-${key}`,
    kind: "note",
    title: `${key} output`,
    content: `## ${key}\nBody`,
    contentFormat: "markdown",
    qualityLabels: ["agent_reviewed"],
    evidenceItems: [
      {
        classification: "assumptions",
        statement: "draft",
        source: `${GENERATION_SOURCE_PREFIX}simulated`,
      },
    ],
    createdAt: T0,
    updatedAt: T0,
  }));
  return {
    mission: { id: "m", status: opts.mission ?? "running" } as MissionBundle["mission"],
    plan: null,
    tasks,
    artefacts,
    approvals: [],
    auditEvents: [],
  };
}

const discovered = {
  charter: "completed",
  market: "completed",
  research: "completed",
  foresight: "completed",
} as const;

describe("buildDeliveryRoom", () => {
  it("reads stage status, owners and outputs from the task and artefact rows", () => {
    const room = buildDeliveryRoom(
      bundle({ charter: "completed", market: "running" }, { artefactsFor: ["charter"] }),
    );
    const charter = room.stages.find((s) => s.key === "charter")!;
    expect(charter).toMatchObject({ status: "done", owner: "Aria" });
    expect(charter.output).toMatchObject({
      title: "charter output",
      production: "Simulated draft",
    });
    expect(charter.output?.quality).toEqual(["Agent-reviewed"]);
    expect(room.stages.find((s) => s.key === "market")).toMatchObject({
      status: "working",
      owner: "Scout",
    });
    expect(room.team.find((m) => m.name === "Scout")?.state).toBe("working");
    expect(room.progress).toEqual({ done: 1, total: room.stages.length });
    // Something is running: the Room must not ask for another step.
    expect(room.canAdvance).toBe(false);
    expect(room.state).toBe("running");
  });

  it("stops at a human gate and lists the outputs being signed off", () => {
    const room = buildDeliveryRoom(
      bundle({ ...discovered, prd: "completed" }, { artefactsFor: ["prd"] }),
    );
    expect(room.state).toBe("waiting_on_you");
    expect(room.gate?.taskId).toBe("task-gate_scope");
    expect(room.gate?.inputs.map((o) => o.title)).toEqual(["prd output"]);
    expect(room.stages.find((s) => s.key === "gate_scope")).toMatchObject({
      status: "waiting_on_you",
      owner: "You",
    });
    expect(room.canAdvance).toBe(false);
  });

  it("asks for the next step only when work is runnable and nothing is running", () => {
    expect(buildDeliveryRoom(bundle({ charter: "completed" })).canAdvance).toBe(true);
    expect(
      buildDeliveryRoom(bundle({ charter: "completed" }, { mission: "paused" })).canAdvance,
    ).toBe(false);
  });

  it("shows a sent-back gate as such, and the build as stopped", () => {
    const room = buildDeliveryRoom(
      bundle({ ...discovered, prd: "completed", gate_scope: "failed" }),
    );
    expect(room.stages.find((s) => s.key === "gate_scope")?.status).toBe("sent_back");
    expect(room.state).toBe("failed");
    expect(room.gate).toBeNull();
  });

  it("reports done only when every task is completed", () => {
    const all = Object.fromEntries(
      productMissionTasks("x", false).map((p) => [p.key, "completed" as const]),
    );
    const room = buildDeliveryRoom(bundle(all, { mission: "completed" }));
    expect(room.state).toBe("done");
    expect(room.updates.length).toBe(room.stages.length);
  });
});
