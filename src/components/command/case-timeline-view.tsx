import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlanDependencies } from "@/components/command/plan-dependencies";
import { caseMilestones, MILESTONE_STATE_TEXT } from "@/lib/pilot-mission/case-timeline";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import { missionBundleQuery } from "@/lib/workforce-queries";

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Time not recorded";

/**
 * Screen 11 — the case's milestones, then the delivery mission's own staged plan when delivery
 * has started. Every state comes from a saved record; nothing is estimated as progress.
 */
export function CaseTimelineView({ mission }: { mission: SupervisedMission }) {
  const milestones = caseMilestones(mission);
  return (
    <div className="sx-doc">
      <section aria-labelledby="sx-timeline-case">
        <h3 id="sx-timeline-case">Case milestones</h3>
        <ol className="sx-list">
          {milestones.map((m) => (
            <li key={m.id}>
              <div className="sx-row">
                <strong>{m.title}</strong>
                <span className="sx-status" data-state={m.state}>
                  {MILESTONE_STATE_TEXT[m.state]}
                </span>
              </div>
              <p className="sx-detail">
                {m.owner === "you" ? "You" : "Specialists"} ·{" "}
                <span className="sx-mono">{m.state === "done" ? when(m.at) : "—"}</span> ·{" "}
                {m.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <DeliveryPlan mission={mission} />
    </div>
  );
}

function DeliveryPlan({ mission }: { mission: SupervisedMission }) {
  const delivery = mission.delivery;
  const bundle = useQuery({
    ...missionBundleQuery(delivery?.wfMissionId ?? "none"),
    enabled: Boolean(delivery),
  });
  if (!delivery) {
    return (
      <section aria-labelledby="sx-timeline-delivery">
        <h3 id="sx-timeline-delivery">Delivery plan</h3>
        <p className="sx-empty">
          The staged delivery plan appears here once you approve delivery from the Team section.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="sx-timeline-delivery">
      <div className="sx-row">
        <h3 id="sx-timeline-delivery">Delivery plan</h3>
        <Link
          to="/command/missions/$missionId"
          params={{ missionId: delivery.wfMissionId }}
          className="sx-btn"
        >
          Open delivery mission
        </Link>
      </div>
      {bundle.isPending ? (
        <p className="sx-empty" role="status">
          Loading the delivery plan…
        </p>
      ) : bundle.isError ? (
        <p className="sx-empty" role="alert">
          The delivery plan could not be loaded. The delivery mission page still shows it.
        </p>
      ) : (
        <PlanDependencies tasks={bundle.data.tasks} mission={bundle.data.mission} />
      )}
    </section>
  );
}
