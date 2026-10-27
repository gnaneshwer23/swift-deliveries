import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getSupervisedMission, getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { buildPmBrief, STAFFING_BAND_LABELS } from "@/lib/pilot-mission/pm-brief";
import { orderAttention } from "@/lib/workspace-attention";

/**
 * G3 — Specialists page opens on the active mission cast; catalogue stays secondary.
 */
export function MissionCastPanel() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const activeId =
    home.data?.ready && home.data.missions.length
      ? orderAttention(home.data.missions).find(
          (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
        )?.id ?? home.data.missions[0]?.id
      : null;
  const mission = useQuery({
    queryKey: ["supervised", "mission", activeId],
    queryFn: () => getSupervisedMission({ data: { id: activeId! } }),
    enabled: Boolean(activeId),
  });

  if (home.isPending) {
    return (
      <section className="cc-panel ps-mission-cast" aria-label="Active cast">
        <p className="cc-muted">Loading active mission cast…</p>
      </section>
    );
  }

  if (!activeId || !mission.data) {
    return (
      <section className="cc-panel ps-mission-cast" aria-label="Active cast">
        <p className="cc-kicker">Cast</p>
        <h2 className="cc-panel-title">No active investigation</h2>
        <p className="cc-muted">
          Start a one-liner from Overview to staff a cast. The catalogue below is for exploring the
          bench — not the default story.
        </p>
        <Link to="/command" hash="supervised-brief" className="cc-btn cc-btn-primary mt-3 inline-flex">
          Start a mission
        </Link>
      </section>
    );
  }

  const { mission: record } = mission.data;
  const brief = buildPmBrief(record);
  const specialists =
    record.team?.tasks
      .filter((t) => t.actor === "specialist")
      .reduce(
        (acc, t) => {
          const id = t.capabilityId ?? t.key;
          if (!acc.some((s) => s.id === id)) {
            acc.push({
              id,
              label: t.ownerLabel,
              contribution: t.produces,
              status: t.status,
            });
          }
          return acc;
        },
        [] as Array<{ id: string; label: string; contribution: string; status: string }>,
      ) ?? [];

  return (
    <section className="cc-panel ps-mission-cast" aria-label="Active mission cast">
      <p className="cc-kicker">On this case</p>
      <h2 className="cc-panel-title">{record.brief.question}</h2>
      <p className="cc-muted text-sm">
        {brief.team.initiatingAgent} · {brief.team.staffing.activeSpecialists} specialists ·{" "}
        {STAFFING_BAND_LABELS[brief.team.staffing.band]}
      </p>
      <ul className="ps-cast-board mt-3">
        {specialists.map((s) => (
          <li key={s.id} data-status={s.status}>
            <strong>{s.label}</strong>
            <span>{s.contribution}</span>
            <span className="cc-muted text-xs">{s.status.replaceAll("_", " ")}</span>
          </li>
        ))}
        <li data-actor="human">
          <strong>You</strong>
          <span>Human gates and decisions</span>
        </li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to="/command/supervised/$missionId"
          params={{ missionId: record.id }}
          className="cc-btn cc-btn-primary"
        >
          Open briefing theatre
        </Link>
        <a href="#an-catalogue" className="cc-btn cc-btn-secondary">
          Explore the bench
        </a>
      </div>
    </section>
  );
}
