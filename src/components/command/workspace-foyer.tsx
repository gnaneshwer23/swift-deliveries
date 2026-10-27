import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { orderAttention, attentionLabel } from "@/lib/workspace-attention";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";

/**
 * Overview foyer: start or resume only.
 * Chat dumps, KPI walls and emergency-stop-as-hero live elsewhere (collapsed).
 */
export function WorkspaceFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.missions ?? [];
  const attention = orderAttention(missions)
    .filter((m) => !["cancelled", "follow_up_approved"].includes(m.next.id))
    .slice(0, 3);

  return (
    <div className="ps-foyer">
      {home.isPending ? (
        <p className="cc-muted" role="status">
          Loading saved work…
        </p>
      ) : home.isError || (home.data && !home.data.ready) ? (
        <div role="alert" className="cc-panel">
          <p>{home.data?.reason || "Saved work could not load."}</p>
          <button
            type="button"
            className="cc-btn cc-btn-secondary mt-3"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : attention.length > 0 ? (
        <section className="ps-foyer-resume" aria-label="Continue">
          <div>
            <p className="cc-kicker">Continue</p>
            <h2 className="cc-panel-title mb-0">Pick up where you left off</h2>
          </div>
          <ul className="ps-foyer-resume-list">
            {attention.map((m) => (
              <li key={m.id}>
                <Link to="/command/supervised/$missionId" params={{ missionId: m.id }}>
                  <span className="cc-muted text-xs">{attentionLabel(m.next.id)}</span>
                  <strong>{m.question}</strong>
                  <span className="cc-muted text-sm">
                    {m.nextTitle} <ArrowUpRight className="inline size-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SupervisedMissionStart />

      {missions.length > 3 ? (
        <p className="cc-muted text-sm">
          {missions.length} saved investigations. Showing the three that need you most.
        </p>
      ) : null}
    </div>
  );
}
