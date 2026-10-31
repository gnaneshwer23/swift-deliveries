import type { ProductBrief } from "./marketing/product-resources";
import {
  DEFAULT_MISSION_OUTCOME,
  RESEARCH_FIRST_CONSTRAINT,
  RESEARCH_REFINE_AUDIENCE,
} from "./pilot-mission/pm-brief";
import { isResearchMode, type ResearchMode } from "./pilot-mission/research-mode";

export type ClarifyingProductType =
  "" | "Consumer app" | "Business product" | "Internal tool" | "Not sure yet";

export type MissionIntakeDraft = {
  question: string;
  audience: string;
  outcome: string;
  constraints: string;
  intakeEvidenceNote?: string;
  budget?: string;
  timeline?: string;
  platform?: string;
  existingAssets?: string;
  researchMode?: ResearchMode;
  /** Screen 4 — optional clarifying answers */
  clarifyWho?: string;
  clarifyDayOne?: string;
  clarifyProductType?: ClarifyingProductType;
  clarifySuccess?: string;
};

export { DEFAULT_MISSION_OUTCOME };

export const CLARIFYING_PRODUCT_TYPES = [
  "Consumer app",
  "Business product",
  "Internal tool",
  "Not sure yet",
] as const satisfies ReadonlyArray<Exclude<ClarifyingProductType, "">>;

export function preparedMissionIntake(brief: ProductBrief): MissionIntakeDraft {
  return {
    question: brief.problem.slice(0, 2000),
    audience: (brief.audience.trim() || RESEARCH_REFINE_AUDIENCE).slice(0, 2000),
    outcome: (brief.objective.trim() || DEFAULT_MISSION_OUTCOME).slice(0, 2000),
    constraints: brief.constraints.trim().slice(0, 2000),
  };
}

function optionalString(value: unknown, max = 2000): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, max);
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
    const draft: MissionIntakeDraft = {
      question: value.question.slice(0, 2000),
      audience: value.audience.slice(0, 2000),
      outcome: value.outcome.slice(0, 2000),
      constraints: value.constraints.slice(0, 2000),
    };
    const evidence = optionalString(value.intakeEvidenceNote);
    if (evidence !== undefined) draft.intakeEvidenceNote = evidence;
    for (const key of ["budget", "timeline", "platform", "existingAssets"] as const) {
      const next = optionalString(value[key]);
      if (next !== undefined) draft[key] = next;
    }
    if (typeof value.researchMode === "string" && isResearchMode(value.researchMode)) {
      draft.researchMode = value.researchMode;
    }
    const who = optionalString(value.clarifyWho, 400);
    if (who !== undefined) draft.clarifyWho = who;
    const dayOne = optionalString(value.clarifyDayOne);
    if (dayOne !== undefined) draft.clarifyDayOne = dayOne;
    if (typeof value.clarifyProductType === "string") {
      const type = value.clarifyProductType as ClarifyingProductType;
      if (
        type === "" ||
        type === "Consumer app" ||
        type === "Business product" ||
        type === "Internal tool" ||
        type === "Not sure yet"
      ) {
        draft.clarifyProductType = type;
      }
    }
    const success = optionalString(value.clarifySuccess);
    if (success !== undefined) draft.clarifySuccess = success;
    return draft;
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
    audience: "",
    outcome: DEFAULT_MISSION_OUTCOME,
    constraints: "",
    intakeEvidenceNote: "",
  };
}

export function missionIntakeStorageKey(userId: string): string {
  return `dx-mission-intake:${userId}`;
}

/** Merge Screen 3 + Screen 4 into the startSupervisedMission brief payload. */
export function buildStartBriefFromIntake(
  draft: MissionIntakeDraft,
  options: { skippedClarifying: boolean },
): {
  question: string;
  audience: string;
  outcome: string;
  constraints: string;
  researchMode: ResearchMode;
  intakeEvidenceNote: string | null;
} {
  const who = draft.clarifyWho?.trim() ?? "";
  const dayOne = draft.clarifyDayOne?.trim() ?? "";
  const productType = (draft.clarifyProductType ?? "").trim();
  const success = draft.clarifySuccess?.trim() ?? "";

  const unanswered: string[] = [];
  if (!who) unanswered.push("who will use this first");
  if (!dayOne) unanswered.push("day-one capability");
  if (!productType || productType === "Not sure yet") unanswered.push("product type");
  if (!success) unanswered.push("success after the first version");

  let audience = draft.audience.trim();
  if (who) audience = who.slice(0, 400);
  else if (!audience) audience = RESEARCH_REFINE_AUDIENCE;

  let outcome = draft.outcome.trim();
  if (success) outcome = success.slice(0, 2000);
  else if (!outcome) outcome = DEFAULT_MISSION_OUTCOME;

  const constraintParts: string[] = [];
  if (draft.constraints.trim()) constraintParts.push(draft.constraints.trim());

  const contextLines = [
    draft.budget?.trim() && `Budget: ${draft.budget.trim()}`,
    draft.timeline?.trim() && `Timeline: ${draft.timeline.trim()}`,
    draft.platform?.trim() && `Platform: ${draft.platform.trim()}`,
    draft.existingAssets?.trim() && `Existing assets: ${draft.existingAssets.trim()}`,
  ].filter(Boolean) as string[];
  if (contextLines.length) constraintParts.push(contextLines.join("\n"));

  if (dayOne) {
    constraintParts.push(`Day-one capability (founder-supplied): ${dayOne}`);
  }
  if (productType) {
    constraintParts.push(`Product type (founder-supplied): ${productType}`);
  }

  if (options.skippedClarifying && unanswered.length === 4) {
    constraintParts.push(
      "Clarifying questions skipped — Aria should state assumptions clearly for first users, day-one capability, product type, and success.",
    );
  } else if (unanswered.length > 0) {
    constraintParts.push(
      `Unanswered clarifying details (state as assumptions, not founder facts): ${unanswered.join("; ")}.`,
    );
  }

  if (constraintParts.length === 0) {
    constraintParts.push(RESEARCH_FIRST_CONSTRAINT);
  }

  return {
    question: draft.question.trim().slice(0, 2000),
    audience: audience.slice(0, 400),
    outcome: outcome.slice(0, 2000),
    constraints: constraintParts.join("\n\n").slice(0, 2000),
    researchMode: draft.researchMode ?? "combined",
    intakeEvidenceNote: draft.intakeEvidenceNote?.trim() || null,
  };
}
