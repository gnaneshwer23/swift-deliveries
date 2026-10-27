import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { orderAttention, attentionLabel, pickCurrentMission } from "@/lib/workspace-attention";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";
import { ConversationPanel } from "@/components/command/conversation-panel";
import { MissionCastPanel } from "@/components/command/mission-cast-panel";

/**
 * Studio foyer: start or resume, cast for current mission, typed+voice talk path.
 * Ops walls stay under the fold on the parent page.
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
  const current = home.data?.ready ? pickCurrentMission(missions) : null;

  return (
    <div className="ps-foyer">
      <StudioReadiness />

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
          {current ? (
            <p className="cc-muted text-xs mt-2">
              Cast below mirrors the current mission ·{" "}
              <Link to="/command/capabilities" hash="agents-office" className="underline">
                Open agents office
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <SupervisedMissionStart />

      {current ? (
        <div className="mt-6">
          <MissionCastPanel />
        </div>
      ) : null}

      <details className="ps-legacy mt-6" id="studio-talk">
        <summary>
          Talk to DeliverX (typed + voice) — same clarification → mission → approval path
        </summary>
        <p className="cc-muted text-sm mt-2 mb-3">
          Speech becomes a transcript that uses the same cards as typing. Nothing is approved by
          voice alone — you still click. If voice keys are missing, the controls say so honestly;
          typing always works.
        </p>
        <ConversationPanel />
      </details>

      {missions.length > 3 ? (
        <p className="cc-muted text-sm">
          {missions.length} saved investigations. Showing the three that need you most.
        </p>
      ) : null}
    </div>
  );
}
