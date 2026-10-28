import {
  buildProjectRoomOverview,
  PROJECT_ROOM_SECTIONS,
} from "@/lib/pilot-mission/project-room";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** PT-2 — persistent project room navigation. */
export function ProjectRoomNav({ mission }: { mission: SupervisedMission }) {
  const overview = buildProjectRoomOverview(mission);

  return (
    <div className="ps-project-room" id="pr-overview">
      <nav className="ps-project-room-nav" aria-label="Project room">
        {PROJECT_ROOM_SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="ps-project-room-link">
            {section.label}
          </a>
        ))}
      </nav>

      <section className="cc-panel" aria-label="Project overview">
        <h2 className="cc-panel-title">Overview</h2>
        <p className="text-sm">{overview.objective}</p>
        <dl className="ps-project-overview-dl mt-3 text-sm">
          <div>
            <dt>Recommendation</dt>
            <dd>{overview.recommendation ?? "Pending"}</dd>
          </div>
          <div>
            <dt>Your path</dt>
            <dd>{overview.humanPath ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Approved work</dt>
            <dd>{overview.approvedWork ?? "None yet"}</dd>
          </div>
          <div>
            <dt>Needs attention</dt>
            <dd>{overview.decisionsNeedingAttention}</dd>
          </div>
          <div>
            <dt>Next review</dt>
            <dd>{overview.nextReview}</dd>
          </div>
        </dl>
        {overview.evidenceGaps.length ? (
          <div className="mt-3">
            <h3 className="text-sm font-medium">Evidence gaps</h3>
            <ul className="cc-muted mt-1 text-sm">
              {overview.evidenceGaps.map((g) => (
                <li key={g.slice(0, 40)}>{g}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {overview.recentChanges.length ? (
          <div className="mt-3">
            <h3 className="text-sm font-medium">Recent changes</h3>
            <ul className="cc-muted mt-1 text-sm">
              {overview.recentChanges.map((c) => (
                <li key={c.slice(0, 40)}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
