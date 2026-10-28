/**
 * PT-2 — Project room navigation: calm overview + deep sections.
 */
import { buildPmBriefingPack } from "./pm-briefing-pack";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  deriveAgentRecommendation,
  normalizeDecisionChoice,
  HUMAN_NEXT_PATH_LABELS,
} from "./verdict";

export const PROJECT_ROOM_SECTIONS = [
  { id: "pr-overview", label: "Overview" },
  { id: "pr-briefings", label: "Briefings" },
  { id: "pr-evidence", label: "Evidence" },
  { id: "pr-team", label: "Team" },
  { id: "pr-flow", label: "Information flow" },
  { id: "pr-artefacts", label: "Artefacts" },
  { id: "pr-decisions", label: "Decisions" },
  { id: "pr-build", label: "Build & verification" },
  { id: "pr-outcomes", label: "Outcomes" },
  { id: "pr-monitoring", label: "Monitoring" },
] as const;

export type ProjectRoomSectionId = (typeof PROJECT_ROOM_SECTIONS)[number]["id"];

export type ProjectRoomOverview = {
  objective: string;
  recommendation: string | null;
  humanPath: string | null;
  approvedWork: string | null;
  decisionsNeedingAttention: string;
  evidenceGaps: string[];
  recentChanges: string[];
  nextReview: string;
};

export function buildProjectRoomOverview(mission: SupervisedMission): ProjectRoomOverview {
  const next = nextRequiredAction(mission);
  const draft = deriveAgentRecommendation(mission);
  const briefing = buildPmBriefingPack(mission);
  const gaps = mission.evidence
    .filter((e) => e.classification === "gap")
    .slice(0, 5)
    .map((e) => e.statement);
  const recent = [...(mission.activity ?? [])]
    .slice(-5)
    .reverse()
    .map((e) => `${e.kind}: ${e.summary}`);

  return {
    objective: mission.brief.question,
    recommendation: briefing.ready
      ? AGENT_RECOMMENDATION_LABELS[draft.recommendation]
      : mission.approval?.agentRecommendation
        ? AGENT_RECOMMENDATION_LABELS[mission.approval.agentRecommendation]
        : null,
    humanPath: mission.approval
      ? HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]
      : null,
    approvedWork: mission.artefact?.title ?? mission.prototype?.title ?? null,
    decisionsNeedingAttention: next.title,
    evidenceGaps: gaps,
    recentChanges: recent,
    nextReview: mission.expectation
      ? `Observation window: ${mission.expectation.observationWindow}`
      : "Record a measurement plan after you authorise a path.",
  };
}
