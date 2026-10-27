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
    audience: (brief.audience.trim() || RESEARCH_REFINE_AUDIENCE).slice(0, 2000),
    outcome: (brief.objective.trim() || DEFAULT_MISSION_OUTCOME).slice(0, 2000),
    constraints: (brief.constraints.trim() || RESEARCH_FIRST_CONSTRAINT).slice(0, 2000),
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
/**
 * Prefer a session draft the user already edited.
 * Otherwise prefer `dx-psi-brief` (homepage / brief builder) over a stale profile firstIdea
 * so post-auth continuity opens the prepared one-liner → PM path.
 */
export function restoreMissionIntake(
  local: MissionIntakeDraft | null,
  question: string | undefined,
  brief: ProductBrief | null,
): MissionIntakeDraft {
  if (local?.question.trim()) return local;
  if (brief?.problem.trim()) return preparedMissionIntake(brief);
  if (local) return local;
  return {
    question: question?.slice(0, 2000) ?? "",
    audience: RESEARCH_REFINE_AUDIENCE,
    outcome: DEFAULT_MISSION_OUTCOME,
    constraints: RESEARCH_FIRST_CONSTRAINT,
  };
}
