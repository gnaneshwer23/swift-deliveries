import type { ReactNode } from "react";
import { deriveQuietStatus } from "@/lib/pilot-mission/quiet-status";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** First-viewport calm strip: real status + optional download slot. */
export function QuietMissionBar({
  mission,
  downloadSlot,
}: {
  mission: SupervisedMission;
  downloadSlot?: ReactNode;
}) {
  const status = deriveQuietStatus(mission);
  return (
    <header className="ps-quiet-bar" aria-label="Studio presence">
      <div className="ps-quiet-bar-main">
        <p className="ps-foyer-brand">DeliverX Studio</p>
        <h1 className="ps-quiet-bar-question">{mission.brief.question}</h1>
        <p className="ps-quiet-bar-status" data-presence={status.presence} role="status">
          <span className="ps-quiet-bar-status-label">{status.label}</span>
          <span className="ps-quiet-bar-status-detail">{status.detail}</span>
        </p>
      </div>
      {downloadSlot ? <div className="ps-quiet-bar-downloads">{downloadSlot}</div> : null}
    </header>
  );
}
