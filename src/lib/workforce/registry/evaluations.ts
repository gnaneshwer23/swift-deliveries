/**
 * Evaluation results for assignable roles. A role is "not evaluated" until
 * its evaluation suite has run against a configured model and passed; the
 * fixture checks that run in CI prove the suite works, not the role.
 */
import recorded from "./evaluations.json";

export type EvaluationStatus = "passed" | "failed" | "not_evaluated";

/** A result is either absent or carries the run that produced it. */
export type RoleEvaluation =
  | { status: "not_evaluated"; suiteVersion: null; ranAt: null; model: null }
  | {
      status: "passed" | "failed";
      /** Suite version the result was recorded against. */
      suiteVersion: string;
      /** When it ran and on which model. */
      ranAt: string;
      model: string;
    };

export type RecordedEvaluation = Extract<RoleEvaluation, { status: "passed" | "failed" }>;

const NOT_EVALUATED: RoleEvaluation = {
  status: "not_evaluated",
  suiteVersion: null,
  ranAt: null,
  model: null,
};

/**
 * Recorded results, keyed by role id. Absent means not evaluated. Written by
 * `RECORD_ROLE_EVALS=1 npm run eval:roles` after a real model run.
 */
export const ROLE_EVALUATIONS: Readonly<Record<string, RecordedEvaluation>> = recorded as Record<
  string,
  RecordedEvaluation
>;

export function roleEvaluation(id: string): RoleEvaluation {
  return ROLE_EVALUATIONS[id] ?? NOT_EVALUATED;
}

export const EVALUATION_LABELS: Record<EvaluationStatus, string> = {
  passed: "Evaluation passed",
  failed: "Evaluation failed",
  not_evaluated: "Not evaluated",
};
