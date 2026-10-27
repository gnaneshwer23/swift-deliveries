/**
 * Evaluation results for assignable roles. A role is "not evaluated" until
 * its evaluation suite has run against a configured model and passed; the
 * fixture checks that run in CI prove the suite works, not the role.
 */
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

const NOT_EVALUATED: RoleEvaluation = {
  status: "not_evaluated",
  suiteVersion: null,
  ranAt: null,
  model: null,
};

/** Recorded results, keyed by role id. Absent means not evaluated. */
export const ROLE_EVALUATIONS: Readonly<
  Record<string, Extract<RoleEvaluation, { status: "passed" | "failed" }>>
> = {};

export function roleEvaluation(id: string): RoleEvaluation {
  return ROLE_EVALUATIONS[id] ?? NOT_EVALUATED;
}

export const EVALUATION_LABELS: Record<EvaluationStatus, string> = {
  passed: "Evaluation passed",
  failed: "Evaluation failed",
  not_evaluated: "Not evaluated",
};
