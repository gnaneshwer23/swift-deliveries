import {
  DECISION_LOOP_LABELS,
  DECISION_LOOP_STEPS,
  type PilotTeamPlan,
} from "@/lib/pilot-mission/specialist-team";
import type { PilotActivityEvent } from "@/lib/pilot-mission/types";

export function SpecialistTeamGraph({
  team,
  activity,
}: {
  team: PilotTeamPlan;
  activity: PilotActivityEvent[];
}) {
  return (
    <section className="cc-panel" aria-label="Specialist team">
      <h2 className="cc-panel-title">Specialist team</h2>
      <p className="cc-muted text-sm">
        {team.capabilityIds.length} Available Wave 1 specialists. Each task shows who owns it, what
        it may use, and what it produces. AI drafts stay distinct from your contributions. Activity
        is persisted task events only.
      </p>
      {!team.approvedAt ? (
        <p className="cc-error mt-2" role="status">
          Plan proposed — awaiting your approval before specialist work advances.
        </p>
      ) : (
        <p className="cc-muted mt-2 text-sm">
          Plan approved {team.approvedAt}
          {team.approvedBy ? ` by you` : ""}.
        </p>
      )}

      <ol className="ps-decision-loop mt-4" aria-label="Supervised decision loop">
        {DECISION_LOOP_STEPS.map((step) => {
          const tasks = team.tasks.filter((t) => t.loopStep === step);
          const current = tasks.some((t) =>
            ["ready", "awaiting_approval", "blocked"].includes(t.status),
          );
          const done = tasks.length > 0 && tasks.every((t) => t.status === "completed");
          return (
            <li key={step} data-state={done ? "done" : current ? "current" : "upcoming"}>
              <strong>{DECISION_LOOP_LABELS[step]}</strong>
            </li>
          );
        })}
      </ol>

      <ul className="ps-team-graph mt-4" aria-label="Task dependency graph">
        {team.tasks.map((task) => (
          <li key={task.key} data-status={task.status} data-actor={task.actor}>
            <div className="ps-team-graph-head">
              <strong>{task.title}</strong>
              <span className="ps-team-status">{task.status.replaceAll("_", " ")}</span>
            </div>
            <p className="cc-muted text-sm">
              Owner:{" "}
              <span data-actor={task.actor}>
                {task.ownerLabel}
                {task.capabilityId ? ` · ${task.capabilityId}` : ""}
                {task.actor === "human" ? " (human)" : " (specialist draft)"}
              </span>
            </p>
            <p className="text-sm">
              Uses: {task.uses.join("; ")}. Produces: {task.produces}.
            </p>
            {task.dependsOn.length ? (
              <p className="cc-muted text-xs">Depends on: {task.dependsOn.join(" → ")}</p>
            ) : null}
            {task.blockedReason ? (
              <p className="cc-error text-sm" role="status">
                {task.blockedReason}
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <section className="mt-4" aria-label="Persisted activity">
        <h3 className="cc-panel-title text-base">Activity</h3>
        {activity.length === 0 ? (
          <p className="cc-muted text-sm">No task events yet.</p>
        ) : (
          <ol className="ps-activity-log">
            {[...activity].reverse().slice(0, 20).map((event) => (
              <li key={event.id}>
                <time dateTime={event.at}>{event.at}</time>
                <span>
                  {event.actor} · {event.kind}
                </span>
                <p>{event.summary}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
