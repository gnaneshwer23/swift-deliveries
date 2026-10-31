/** A delivery-engine bundle on the real product plan, for tests. */
import { productMissionTasks } from "@/lib/workforce/lifecycle";
import { GENERATION_SOURCE_PREFIX } from "@/lib/workforce/stage-artefacts";
import type {
  MissionBundle,
  MissionStatus,
  TaskStatus,
  WfArtefact,
  WfMissionTask,
} from "@/lib/workforce/types";

const T0 = "2026-10-31T10:00:00Z";

export function deliveryBundle(
  statuses: Record<string, TaskStatus>,
  opts: { mission?: MissionStatus; artefactsFor?: string[]; modelFor?: string[] } = {},
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
        source: opts.modelFor?.includes(key)
          ? `${GENERATION_SOURCE_PREFIX}model:test-model`
          : `${GENERATION_SOURCE_PREFIX}simulated`,
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
