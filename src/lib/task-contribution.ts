import type { WfArtefact, WfMissionTask } from "./workforce/types";
export function contributionLinks(
  task: WfMissionTask,
  tasks: WfMissionTask[],
  artefacts: WfArtefact[],
) {
  // Keep IDs scoped even if a caller accidentally supplies several mission bundles.
  const scope = tasks.filter(
    (t) => t.missionId === task.missionId && t.workspaceId === task.workspaceId,
  );
  return {
    upstream: task.dependsOn.map((key) => ({ key, record: scope.find((t) => t.key === key) })),
    recipients: scope.filter((t) => t.dependsOn.includes(task.key)),
    outputs: artefacts.filter(
      (a) =>
        a.taskId === task.id &&
        a.missionId === task.missionId &&
        a.workspaceId === task.workspaceId,
    ),
  };
}
export function outputProvenance(artefact: Pick<WfArtefact, "evidenceItems">): string {
  const source = artefact.evidenceItems.find((e) => e.source?.startsWith("generation:"))?.source;
  if (source === "generation:simulated") return "Simulated draft";
  if (source?.startsWith("generation:model:"))
    return `Model: ${source.slice("generation:model:".length)}`;
  return "Generation provenance not recorded";
}
