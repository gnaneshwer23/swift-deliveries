import type { ProductBrief } from "./marketing/product-resources";
import {
  DEFAULT_MISSION_OUTCOME,
  RESEARCH_FIRST_CONSTRAINT,
  RESEARCH_REFINE_AUDIENCE,
} from "./pilot-mission/pm-brief";
export type MissionIntakeDraft = {
  question: string;
  audience: string;
  outcome: string;
  constraints: string;
};
export { DEFAULT_MISSION_OUTCOME };
export function preparedMissionIntake(brief: ProductBrief): MissionIntakeDraft {
  return {
    question: brief.problem.slice(0, 2000),
    audience: brief.audience.slice(0, 2000),
    outcome: (brief.objective || DEFAULT_MISSION_OUTCOME).slice(0, 2000),
    constraints: brief.constraints.slice(0, 2000),
  };
}
export function parseMissionIntake(raw: string | null): MissionIntakeDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (
      !["question", "audience", "outcome", "constraints"].every(
        (key) => typeof value[key] === "string",
      )
    )
      return null;
    return {
      question: value.question.slice(0, 2000),
      audience: value.audience.slice(0, 2000),
      outcome: value.outcome.slice(0, 2000),
      constraints: value.constraints.slice(0, 2000),
    };
  } catch {
    return null;
  }
}
export function restoreMissionIntake(
  local: MissionIntakeDraft | null,
  question: string | undefined,
  brief: ProductBrief | null,
): MissionIntakeDraft {
  if (local) return local;
  if (brief && (!question?.trim() || question.trim() === brief.problem.trim()))
    return preparedMissionIntake(brief);
  return {
    question: question?.slice(0, 2000) ?? "",
    audience: RESEARCH_REFINE_AUDIENCE,
    outcome: DEFAULT_MISSION_OUTCOME,
    constraints: RESEARCH_FIRST_CONSTRAINT,
  };
}
