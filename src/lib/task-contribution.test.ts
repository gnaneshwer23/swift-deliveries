import { expect, it } from "vitest";
import { contributionLinks, outputProvenance } from "./task-contribution";
import type { WfMissionTask, WfArtefact } from "./workforce/types";
const task = {
  id: "t2",
  key: "draft",
  missionId: "m",
  workspaceId: "w",
  dependsOn: ["research", "missing"],
} as WfMissionTask;
it("preserves missing upstream records and excludes other mission/workspace handoffs", () => {
  const tasks = [
    { ...task, id: "t1", key: "research", dependsOn: [] },
    { ...task, id: "t3", key: "review", dependsOn: ["draft"] },
    { ...task, id: "other", missionId: "other", key: "missing", dependsOn: ["draft"] },
    { ...task, id: "other-w", workspaceId: "other", dependsOn: ["draft"] },
  ];
  const output = { id: "a", taskId: task.id, missionId: "m", workspaceId: "w" } as WfArtefact;
  const result = contributionLinks(task, tasks, [
    output,
    { ...output, id: "foreign", workspaceId: "other" },
  ]);
  expect(result.upstream.map((item) => item.record?.id)).toEqual(["t1", undefined]);
  expect(result.recipients.map((item) => item.id)).toEqual(["t3"]);
  expect(result.outputs.map((item) => item.id)).toEqual(["a"]);
});
it("does not infer generation provenance from completion or review labels", () => {
  expect(outputProvenance({ evidenceItems: [] })).toBe("Generation provenance not recorded");
  expect(
    outputProvenance({
      evidenceItems: [
        { source: "generation:simulated", classification: "assumptions", statement: "stub" },
      ],
    }),
  ).toBe("Simulated draft");
  expect(
    outputProvenance({
      evidenceItems: [
        { source: "generation:model:test-model", classification: "inferences", statement: "draft" },
      ],
    }),
  ).toBe("Model: test-model");
});
