import { ArrowRight } from "lucide-react";
import { CountVessel } from "@/components/illustrations/platform-illustrations";
import type { MissionStatus } from "@/lib/workforce/types";

/** Missions that cannot move until the owner acts: drafts, questions and plans to approve. */
export const WAITING_STATUSES: readonly MissionStatus[] = [
  "draft",
  "needs_clarification",
  "planned",
  "awaiting_approval",
];

const GROUPS: Array<{
  id: string;
  label: string;
  note: string;
  statuses: readonly MissionStatus[];
}> = [
  {
    id: "you",
    label: "Waiting for you",
    note: "Finish a draft, answer questions or approve a plan",
    statuses: WAITING_STATUSES,
  },
  {
    id: "progress",
    label: "In progress",
    note: "Specialists at work",
    statuses: ["queued", "running"],
  },
  { id: "review", label: "In review", note: "Checks before delivery", statuses: ["reviewing"] },
  {
    id: "done",
    label: "Delivered",
    note: "Artefacts you can inspect",
    statuses: ["completed", "partially_completed"],
  },
  {
    id: "stopped",
    label: "Stopped",
    note: "Blocked, failed or cancelled",
    statuses: ["blocked", "failed", "cancelled"],
  },
];

export function MissionPipelineStage({
  missions,
  usage,
  onShowWaiting,
}: {
  missions: ReadonlyArray<{ status: MissionStatus }>;
  usage: { consumed: number; ceiling: number };
  onShowWaiting?: () => void;
}) {
  const counts = GROUPS.map((g) => missions.filter((m) => g.statuses.includes(m.status)).length);
  const total = missions.length;
  const waiting = counts[0] ?? 0;
  const share = usage.ceiling > 0 ? Math.min(1, usage.consumed / usage.ceiling) : 0;
  return (
    <section className="ix hp-stage cc-pipeline" aria-label="Mission pipeline">
      <div className="hp-input">
        <div>
          <small>Specialist missions</small>
          <strong>
            {total === 0
              ? "No missions yet"
              : `Your ${total} most recent mission${total === 1 ? "" : "s"}`}
          </strong>
        </div>
        <div className="cc-pipeline-usage">
          <small>Usage this period</small>
          <strong>
            {usage.consumed} of {usage.ceiling} credits
          </strong>
          <div className="hp-bar" style={{ ["--share" as string]: `${share * 100}%` }}>
            <i />
          </div>
        </div>
      </div>
      <div className="hp-rule">
        <span>Where your work is</span>
      </div>
      <div className="cc-pipeline-grid">
        {GROUPS.map((g, i) => (
          <div key={g.id} className="cc-pipeline-col" data-empty={counts[i] === 0 || undefined}>
            <CountVessel
              count={counts[i] ?? 0}
              attention={g.id === "you" && (counts[i] ?? 0) > 0}
            />
            <strong>{counts[i]}</strong>
            <h3>{g.label}</h3>
            <p>{g.note}</p>
          </div>
        ))}
      </div>
      <div className="hp-stagebar">
        <div>
          <small>Next for you</small>
          <strong>
            {waiting > 0
              ? `${waiting} mission${waiting === 1 ? " needs" : "s need"} your decision before work continues`
              : "Nothing is waiting on you. Start a mission when you are ready."}
          </strong>
        </div>
        {waiting > 0 && onShowWaiting && (
          <button type="button" className="hp-link cc-pipeline-cta" onClick={onShowWaiting}>
            Review decisions <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
