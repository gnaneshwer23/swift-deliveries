import { contributionLinks, outputProvenance } from "@/lib/task-contribution";
import { Link } from "@tanstack/react-router";
import type { WfMissionTask, WfArtefact } from "@/lib/workforce/types";
import { QUALITY_LABEL_DISPLAY } from "@/lib/workforce/types";
import { getCapability } from "@/lib/workforce/registry";
import "@/styles/psi-operations.css";

/** A task's persisted links, not a reconstruction of model reasoning. */
export function TaskContribution({
  task,
  tasks,
  artefacts,
}: {
  task: WfMissionTask;
  tasks: WfMissionTask[];
  artefacts: WfArtefact[];
}) {
  const { outputs, recipients, upstream } = contributionLinks(task, tasks, artefacts);
  return (
    <dl className="po-contribution">
      <dt>Input</dt>
      <dd>
        {upstream.length ? (
          <ul>
            {upstream.map(({ key, record }) => (
              <li key={key}>
                {record?.title ?? key} —{" "}
                {record?.status.replaceAll("_", " ") ?? "record unavailable"}
              </li>
            ))}
          </ul>
        ) : (
          "Saved mission brief · no upstream task recorded"
        )}
      </dd>
      <dt>Acceptance</dt>
      <dd>{task.acceptanceCriteria || "No acceptance criteria recorded"}</dd>
      <dt>Saved output</dt>
      <dd>
        {outputs.length ? (
          <ul>
            {outputs.map((a) => {
              const provenance = outputProvenance(a);
              return (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <br />
                  {provenance}
                  <br />
                  {a.qualityLabels.map((label) => QUALITY_LABEL_DISPLAY[label]).join(" · ") ||
                    "No review label recorded"}
                </li>
              );
            })}
          </ul>
        ) : (
          "No output attached to this task"
        )}
      </dd>
      <dt>Passes to</dt>
      <dd>
        {recipients.length ? (
          <ul>
            {recipients.map((t) => (
              <li key={t.id}>
                {t.title}
                <br />
                {t.gate
                  ? "Human approval gate"
                  : t.capabilityIds.map((id) => getCapability(id)?.name ?? id).join(", ") ||
                    "No specialist assigned"}{" "}
                — {t.status.replaceAll("_", " ")}
              </li>
            ))}
          </ul>
        ) : (
          "No downstream task recorded"
        )}
      </dd>
      <dt>Inspect the source record</dt>
      <dd>
        <Link
          to="/command/missions/$missionId"
          params={{ missionId: task.missionId }}
          hash="mission-outputs"
        >
          Open mission and outputs
        </Link>
      </dd>
    </dl>
  );
}
