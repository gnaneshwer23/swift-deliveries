import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { attentionLabel, orderAttention } from "@/lib/workspace-attention";

type MissionRow = {
  id: string;
  question: string;
  next: { id: string };
  nextTitle: string;
};

/** Compact attention list — one line per case needing the founder. */
export function QuietStudioNotifications({ missions }: { missions: MissionRow[] }) {
  const attention = orderAttention(missions).filter(
    (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
  );
  if (attention.length === 0) return null;

  return (
    <aside className="ps-quiet-notifications" aria-label="Notifications">
      <p className="ps-quiet-notifications-kicker">Needs you</p>
      <ul>
        {attention.map((m) => (
          <li key={m.id}>
            <Link to="/command/supervised/$missionId" params={{ missionId: m.id }}>
              <span className="ps-quiet-notif-gate">{attentionLabel(m.next.id)}</span>
              <strong>{m.question}</strong>
              <span className="ps-quiet-notif-next">
                {m.nextTitle}
                <ArrowUpRight className="inline size-3.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
