import { Link } from "@tanstack/react-router";
import { buildMissionInspection } from "@/lib/pilot-mission/mission-inspection";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** On-mission compact pointer to the gate and inspect record (reload-safe). */
export function MissionInspectionStrip({
  mission,
  missionId,
}: {
  mission: SupervisedMission;
  missionId: string;
}) {
  const inspection = buildMissionInspection(mission);
  if (!inspection.decisionAttention && inspection.unresolvedQuestions.length === 0) {
    return null;
  }

  return (
    <aside className="ps-mission-inbox-strip" aria-label="Attention on this case">
      {inspection.decisionAttention ? (
        <p className="text-sm">
          <strong>{inspection.decisionAttention.title}</strong>
          <span className="cc-muted"> — {inspection.decisionAttention.detail}</span>
        </p>
      ) : null}
      {inspection.unresolvedQuestions.length ? (
        <p className="cc-muted text-xs mt-1">
          {inspection.unresolvedQuestions.length} open question
          {inspection.unresolvedQuestions.length === 1 ? "" : "s"} on team handoffs.
        </p>
      ) : null}
      <Link
        to="/command/supervised/$missionId"
        params={{ missionId }}
        hash="mission-team-activity"
        className="cc-muted text-xs mt-2 inline-block"
      >
        Inspect team activity ↓
      </Link>
    </aside>
  );
}
