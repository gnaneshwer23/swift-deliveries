/**
 * P-paid — Investigation paid availability helpers.
 * Selling uses existing PSI checkout; this module names the unit and start gates.
 */
import { isCheckoutFlagEnabled } from "./psi-catalog";

export const INVESTIGATION_UNIT_LABEL = "Investigation mission";

export const INVESTIGATION_UNIT_DEFINITION =
  "One Investigation is a bounded diligence scope: research, four-outcome recommendation, decision pack, and a next-step outline — not unlimited product build.";

export const CONTINUATION_SEPARATE_COPY =
  "Continuation (staffed team, case-room artefacts, gated execution) is separately scoped. Authorising a next path does not purchase open-ended build.";

export const INVESTIGATION_ALLOWANCE_EXHAUSTED =
  "Investigation allowance on this workspace is used. Existing cases stay readable. Start another Investigation after a new plan or allowance restore — there is no automatic overage.";

export type PilotAllowanceSnapshot = {
  remaining: number;
  missionAllowance: number;
  missionsConsumed: number;
};

/** True when self-serve checkout can sell Investigation capacity (env flag). */
export function isInvestigationPaidAvailable(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return isCheckoutFlagEnabled(env);
}

/**
 * When an activation exists and remaining Investigations are 0, block a new start.
 * Workspaces without activation stay on demo / workspace usage ceiling.
 */
export function assertCanStartInvestigation(
  activation: PilotAllowanceSnapshot | null,
): { ok: true } | { ok: false; message: string } {
  if (!activation) return { ok: true };
  if (activation.remaining > 0) return { ok: true };
  return { ok: false, message: INVESTIGATION_ALLOWANCE_EXHAUSTED };
}
