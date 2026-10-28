import {
  DECISION_LOOP_LABELS,
  DECISION_LOOP_STEPS,
  type PilotTeamPlan,
} from "@/lib/pilot-mission/specialist-team";
import type { EvidenceItem, PilotActivityEvent } from "@/lib/pilot-mission/types";

function formatWhen(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SpecialistTeamGraph({
  team,
  activity,
  evidence = [],
  researchGaps = [],
  researchPassCompletedAt = null,
}: {
  team: PilotTeamPlan;
  activity: PilotActivityEvent[];
  evidence?: EvidenceItem[];
  researchGaps?: string[];
  researchPassCompletedAt?: string | null;
}) {
  const specialists = [
    ...new Map(
      team.tasks
        .filter((t) => t.actor === "specialist")
        .map((t) => [
          t.capabilityId ?? t.key,
          {
            id: t.capabilityId ?? t.key,
            label: t.ownerLabel,
            status: t.status,
            title: t.title,
          },
        ]),
    ).values(),
  ];
  const live = specialists.filter((s) =>
    ["ready", "awaiting_approval", "blocked"].includes(s.status),
  );
  const recent = [...activity].reverse().slice(0, 12);
  const findings = evidence.filter((e) => e.classification === "supplied");
  const gaps = [
    ...evidence.filter((e) => e.classification === "gap"),
    ...researchGaps
      .filter((g) => !evidence.some((e) => e.statement === g))
      .map((statement) => ({
        id: `gap:${statement.slice(0, 24)}`,
        statement,
        source: "Research gaps",
        classification: "gap" as const,
      })),
  ];
  const bandLabel = team.staffingBand ?? "M";

  return (
    <section className="cc-panel ps-work-scene" aria-label="Specialist work scene">
      <h2 className="cc-panel-title">Work scene</h2>
      <p className="cc-muted text-sm">
        Living view of the proposed Available team (band {bandLabel}). Presence and motion follow
        persisted events — not a fake timer. {team.capabilityIds.length} specialists on this plan
        {team.approvedAt ? "" : " (awaiting your approval before work advances)"}
        {researchPassCompletedAt ? " · research pass on the record" : ""}.
      </p>

      <div className="ps-scene-stage" aria-label="Specialists on stage">
        {specialists.map((s) => (
          <div
            key={s.id}
            className="ps-scene-actor"
            data-status={s.status}
            title={`${s.label}: ${s.title} (${s.status.replaceAll("_", " ")})`}
          >
            <span className="ps-scene-pulse" aria-hidden="true" />
            <strong>{s.label}</strong>
            <span className="ps-scene-status">{s.status.replaceAll("_", " ")}</span>
          </div>
        ))}
      </div>

      {live.length ? (
        <p className="ps-scene-now" role="status">
          Now in focus: {live.map((s) => s.label).join(" · ")}
        </p>
      ) : (
        <p className="cc-muted text-sm mt-2">
          {team.approvedAt
            ? "No specialist task is active right now — check the next human gate."
            : "Plan proposed — approve the PM brief to open the scene."}
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

      {(findings.length > 0 || gaps.length > 0) && team.approvedAt ? (
        <section className="mt-4 ps-scene-findings" aria-label="Findings and gaps">
          <h3 className="cc-panel-title text-base">Findings and gaps</h3>
          <p className="cc-muted text-sm">
            From the research pass and evidence register. Gaps stay labelled — never invented as
            retrieved research.
          </p>
          {findings.length ? (
            <ul className="ps-scene-finding-list mt-2">
              {findings.slice(0, 6).map((item) => (
                <li key={item.id} data-kind="finding">
                  <strong>Finding</strong>
                  <span>{item.statement}</span>
                  {item.source ? (
                    <span className="cc-muted text-xs block">{item.source}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {gaps.length ? (
            <ul className="ps-scene-gap-list mt-2">
              {gaps.slice(0, 6).map((item) => (
                <li key={item.id} data-kind="gap">
                  <strong>Gap</strong>
                  <span>{item.statement}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <details className="ps-scene-tasks mt-4">
        <summary>Task ownership graph ({team.tasks.length})</summary>
        <ul className="ps-team-graph mt-3" aria-label="Task dependency graph">
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
      </details>

      <section className="mt-4 ps-scene-feed" aria-label="Persisted activity">
        <h3 className="cc-panel-title text-base">What just happened</h3>
        {recent.length === 0 ? (
          <p className="cc-muted text-sm">No task events yet.</p>
        ) : (
          <ol className="ps-activity-log">
            {recent.map((event) => (
              <li key={event.id} data-kind={event.kind}>
                <time dateTime={event.at}>{formatWhen(event.at)}</time>
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
