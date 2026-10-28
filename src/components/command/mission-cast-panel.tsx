import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getSupervisedMission, getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { buildSequence, castForMission } from "@/lib/pilot-mission/build-beats";
import { buildPmBrief, STAFFING_BAND_LABELS } from "@/lib/pilot-mission/pm-brief";
import { pickCurrentMission } from "@/lib/workspace-attention";

/**
 * G3 / P2 — Specialists page opens on the active mission cast; catalogue stays secondary.
 * Shows current owner, contribution and handoff aligned with Act V beats.
 */
export function MissionCastPanel() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const activeId =
    home.data?.ready && home.data.missions.length
      ? pickCurrentMission(home.data.missions)?.id ?? null
      : null;
  const mission = useQuery({
    queryKey: ["supervised", "mission", activeId],
    queryFn: () => getSupervisedMission({ data: { id: activeId! } }),
    enabled: Boolean(activeId),
  });

  if (home.isPending) {
    return (
      <section id="cast-on-stage" className="ps-mission-cast" aria-label="Active cast">
        <p className="cc-muted">Loading cast…</p>
      </section>
    );
  }

  if (!activeId || !mission.data) {
    return (
      <section id="cast-on-stage" className="ps-mission-cast ps-mission-cast-empty" aria-label="Active cast">
        <p className="ps-foyer-act">Cast</p>
        <h2 className="ps-room-subhead">No case on stage yet</h2>
        <p className="ps-foyer-lede">
          Brief a one-liner on Overview. Specialists appear here with ownership — not from opening
          the full catalogue.
        </p>
        <Link to="/command" hash="supervised-brief" className="cc-btn cc-btn-primary mt-3 inline-flex">
          Brief a case
        </Link>
      </section>
    );
  }

  const { mission: record } = mission.data;
  const brief = buildPmBrief(record);
  const cast = castForMission(record);
  const sequence = buildSequence(record);
  const currentBeat = sequence.beats.find((b) => b.id === sequence.currentId);

  return (
    <section id="cast-on-stage" className="ps-mission-cast" aria-label="Active mission cast">
      <p className="ps-foyer-act">On this case</p>
      <h2 className="ps-room-subhead">{record.brief.question}</h2>
      <p className="ps-foyer-lede">
        {brief.team.initiatingAgent}
        {currentBeat ? ` · now owning: ${currentBeat.label}` : ""}
        <span className="ps-cast-band"> · {STAFFING_BAND_LABELS[brief.team.staffing.band]}</span>
      </p>
      <ul className="ps-cast-board mt-3">
        {cast.map((s) => (
          <li
            key={s.id}
            data-status={s.status}
            data-actor={s.actor}
            data-current-owner={s.isCurrentOwner ? "true" : undefined}
          >
            <strong>
              {s.label}
              {s.isCurrentOwner ? " · owns beat" : ""}
            </strong>
            <span>{s.contribution}</span>
          </li>
        ))}
      </ul>
      <div className="ps-theatre-footnotes">
        <div className="flex flex-wrap gap-2">
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
      </div>
    </section>
  );
}
