/**
 * Compact decision trail for the Case Room. Rows come only from the saved record.
 */
import { buildRoomDecisionTrail } from "@/lib/pilot-mission/room-decision-trail";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

export function RoomDecisionTrail({ mission }: { mission: SupervisedMission }) {
  const trail = buildRoomDecisionTrail(mission);
  return (
    <section className="room-trail" aria-labelledby="room-trail-title" id="room-decision-trail">
      <h2 id="room-trail-title">How the team decided</h2>
      <p>{trail.intro}</p>
      {trail.rows.length ? (
        <ol className="room-trail-list">
          {trail.rows.map((row) => (
            <li key={row.id}>
              <p className="room-trail-title">
                <span className="room-trail-badge">{row.badge}</span> {row.title}
              </p>
              <p className="room-trail-detail">{row.detail}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="room-output-note">Nothing in this trail is saved yet.</p>
      )}
      <p>
        <a href="#mission-team-activity">Open team activity in the full record</a>
      </p>
    </section>
  );
}
