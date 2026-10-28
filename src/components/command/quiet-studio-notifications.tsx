import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { buildStudioInbox, type StudioInboxMissionRow } from "@/lib/pilot-mission/studio-inbox";

type MissionRow = StudioInboxMissionRow;

/** Compact deduplicated inbox — one row per case needing the founder. */
export function QuietStudioNotifications({ missions }: { missions: MissionRow[] }) {
  const inbox = buildStudioInbox(missions);
  if (inbox.length === 0) return null;

  return (
    <aside className="ps-quiet-notifications" aria-label="Inbox">
      <p className="ps-quiet-notifications-kicker">Needs you</p>
      <ul>
        {inbox.map((item) => (
          <li key={item.key}>
            <Link
              to="/command/supervised/$missionId"
              params={{ missionId: item.missionId }}
              hash="mission-inspect"
            >
              <span className="ps-quiet-notif-gate">{item.gateLabel}</span>
              <strong>{item.question}</strong>
              <span className="ps-quiet-notif-next">
                {item.headline}
                <ArrowUpRight className="inline size-3.5" aria-hidden="true" />
              </span>
              {item.detail ? (
                <span className="ps-quiet-notif-detail cc-muted text-xs">{item.detail}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <p className="cc-muted text-xs mt-2 mb-0">
        In-app only — email and push are not sent until separately approved. Notify preferences on a
        case are stored honestly.
      </p>
    </aside>
  );
}
