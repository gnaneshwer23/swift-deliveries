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

/** Result of reading `psi_pilot_activations` for a workspace — not the same as “failed to load”. */
export type InvestigationAllowanceLoad =
  | { status: "active"; snapshot: PilotAllowanceSnapshot }
  | { status: "demo" }
  | { status: "failed"; reason: string };

export const PILOT_ACTIVATION_MIGRATION_HINT =
  "Pilot activation storage is not available on this database (apply migration drizzle/migrations/0021_psi_pilot_activations.sql).";

export function investigationAllowanceDemoLine(usage: {
  ceiling: number;
  consumed: number;
}): string {
  const remaining = Math.max(0, usage.ceiling - usage.consumed);
  return `No paid pilot plan on this workspace yet. Demo mode uses the workspace usage ceiling (${remaining} of ${usage.ceiling} units remain). Builder, Founder, or Studio activation sets Investigation allowance separately.`;
}

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
