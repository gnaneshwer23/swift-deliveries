/**
 * Primary investigation-stage phase for Studio IA (investigation → briefing → path → room).
 * Presentation only — gates and persistence unchanged.
 */
import { buildPmBriefingPack } from "./pm-briefing-pack";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type InvestigationStagePhase =
  "scope" | "canvas" | "converge" | "briefing" | "path" | "room" | "history";

export const INVESTIGATION_STAGE_LABELS: Record<InvestigationStagePhase, string> = {
  scope: "Scope & approve",
  canvas: "Investigation",
  converge: "Converge",
  briefing: "PM briefing",
  path: "Choose path",
  room: "Project room",
  history: "Downloads",
};

export function deriveInvestigationStagePhase(mission: SupervisedMission): InvestigationStagePhase {
  if (mission.stage === "cancelled") return "history";

  const next = nextRequiredAction(mission);
  const planApproved = Boolean(mission.team?.approvedAt);
  const pack = buildPmBriefingPack(mission);

  if (mission.exportBody || mission.artefact) {
    if (next.id === "export" || mission.exportBody) return "history";
  }

  if (mission.approval || mission.continuationPlan) return "room";

  if (next.id === "decide" && pack.ready) return "path";

  if (pack.ready && !mission.approval) return "briefing";

  if (planApproved) {
    if (mission.job.status === "leased") return "canvas";
    const consolidating =
      mission.stage === "alternatives" ||
      next.id === "compare" ||
      next.id === "prepare" ||
      next.id === "artefact" ||
      (Boolean(mission.researchPassCompletedAt) &&
        !mission.proposal &&
        mission.evidence.length > 0);
    if (consolidating) return "converge";
    return "canvas";
  }

  return "scope";
}
