import { useMemo } from "react";
import {
  NODE_STATE_TEXT,
  dependencyView,
  type DependencyNode,
} from "@/lib/workforce/dependency-view";
import type { WfMission, WfMissionTask } from "@/lib/workforce/types";
import "@/styles/plan-dependencies.css";

/**
 * The plan as its dependency graph, in waves that can run side by side. Every
 * state comes from the task rows and the scheduler's own rules; every card
 * links to its task in the task graph below.
 */
export function PlanDependencies({
  tasks,
  mission,
}: {
  tasks: WfMissionTask[];
  mission: Pick<WfMission, "status" | "externalActionsApproved">;
}) {
  const { status, externalActionsApproved } = mission;
  const view = useMemo(
    () => dependencyView(tasks, { status, externalActionsApproved }),
    [tasks, status, externalActionsApproved],
  );
  return (
    <details className="pd" open>
      <summary className="pd-summary">
        Dependencies
        {view.ok ? (
          <span className="pd-count">
            {view.waves.length} {view.waves.length === 1 ? "wave" : "waves"}, {view.edges}{" "}
            {view.edges === 1 ? "link" : "links"}
          </span>
        ) : null}
      </summary>
      {!view.ok ? (
        <p className="cc-error mt-2" role="alert">
          {view.problem}
        </p>
      ) : (
        <>
          <p className="pd-note">
            Tasks in the same wave can run side by side. A task runs only after everything it waits
            on is done, and never after a failure.
          </p>
          <ol className="pd-waves" aria-label="Plan waves">
            {view.waves.map((wave, i) => (
              <li key={i} className="pd-wave">
                <h4 className="pd-wave-title">Wave {i + 1}</h4>
                <ul className="pd-nodes">
                  {wave.map((node) => (
                    <Node key={node.id} node={node} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </details>
  );
}

function Node({ node }: { node: DependencyNode }) {
  return (
    <li className="pd-node" data-state={node.state}>
      <a href={`#task-${node.id}`} className="pd-node-title">
        {node.title}
      </a>
      <span className="pd-node-state">{NODE_STATE_TEXT[node.state]}</span>
      {node.after.length ? <span className="pd-rel">Waits on: {node.after.join(", ")}</span> : null}
      {node.unblocks.length ? (
        <span className="pd-rel">Unblocks: {node.unblocks.join(", ")}</span>
      ) : null}
    </li>
  );
}
