/**
 * Manual pilot activation. An operator records one scoped plan and a mission
 * allowance for one workspace. The record does not mean Stripe charged anyone.
 */
import { ALLOWANCE_EXHAUSTED_COPY, PUBLISHED_OPERATOR_EMAIL } from "./commercial-copy";
import { isPilotPlan, type PilotPlan, type StoredPilotRequest } from "./model";

export const MAX_MISSION_ALLOWANCE = 24;
export const EXHAUSTION_POLICY = "block_next_billable_comparison" as const;

const WORKSPACE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWANCE_EXHAUSTED_MESSAGE = `Mission allowance is used. The next billable comparison was not run. ${ALLOWANCE_EXHAUSTED_COPY}`;

export class ActivationStoreUnavailableError extends Error {
  constructor(
    message = "The activation was not saved. Migration drizzle/migrations/0021_psi_pilot_activations.sql is committed and has not been applied to this database.",
  ) {
    super(message);
    this.name = "ActivationStoreUnavailableError";
  }
}

export class ActivationConflictError extends Error {
  constructor(message = "That enquiry or workspace already has an activation.") {
    super(message);
    this.name = "ActivationConflictError";
  }
}

export type PilotActivation = {
  id: string;
  requestId: string;
  workspaceId: string;
  plan: PilotPlan;
  missionAllowance: number;
  missionsConsumed: number;
  paymentTaken: false;
  exhaustion: typeof EXHAUSTION_POLICY;
  activatedBy: string;
  activatedAt: string;
};

export type ActivationRepository = {
  findRequest(id: string): Promise<StoredPilotRequest | null>;
  findByRequest(requestId: string): Promise<PilotActivation | null>;
  findByWorkspace(workspaceId: string): Promise<PilotActivation | null>;
  insert(row: PilotActivation): Promise<PilotActivation>;
  advanceConsumption(
    workspaceId: string,
    expectedConsumed: number,
  ): Promise<PilotActivation | null>;
};

export function isPilotOperator(input: {
  email: string | null | undefined;
  configuredEmails: string | undefined;
  roles: readonly string[];
}): boolean {
  const configured = input.configuredEmails;
  const allow = (configured && configured.trim() ? configured : PUBLISHED_OPERATOR_EMAIL)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const email = input.email?.trim().toLowerCase() ?? "";
  if (email && allow.includes(email)) return true;
  return input.roles.some((role) => role === "admin" || role === "moderator");
}

export function billableComparisonGate(
  activation: PilotActivation | null,
  workspaceId: string,
  billable: boolean,
): { ok: true } | { ok: false; message: string } {
  if (!billable) return { ok: true };
  if (!activation || activation.workspaceId !== workspaceId) return { ok: true };
  if (activation.missionsConsumed >= activation.missionAllowance) {
    return { ok: false, message: ALLOWANCE_EXHAUSTED_MESSAGE };
  }
  return { ok: true };
}

export async function recordBillableComparison(
  repo: ActivationRepository,
  workspaceId: string,
): Promise<{ recorded: boolean; activation: PilotActivation | null }> {
  const current = await repo.findByWorkspace(workspaceId);
  if (!current || current.workspaceId !== workspaceId) return { recorded: false, activation: null };
  if (current.missionsConsumed >= current.missionAllowance) {
    return { recorded: false, activation: current };
  }
  const next = await repo.advanceConsumption(workspaceId, current.missionsConsumed);
  if (!next || next.workspaceId !== workspaceId) {
    return { recorded: false, activation: await repo.findByWorkspace(workspaceId) };
  }
  return { recorded: true, activation: next };
}

function cleanWorkspaceId(value: string): string | null {
  const id = value.trim().toLowerCase();
  return WORKSPACE_ID.test(id) ? id : null;
}

export async function activateEnquiry(
  input: {
    authorised: boolean;
    requestId: string;
    workspaceId: string;
    plan: string;
    missionAllowance: number;
    actorId: string;
  },
  repo: ActivationRepository,
  now: () => string,
  options?: { workspaceExists?: (workspaceId: string) => Promise<boolean>; id?: () => string },
): Promise<
  { ok: true; activation: PilotActivation; already: boolean } | { ok: false; message: string }
> {
  if (!input.authorised) {
    return { ok: false, message: "You are not authorised to activate a pilot." };
  }
  if (!isPilotPlan(input.plan)) {
    return { ok: false, message: "Choose one Builder, Founder or Studio plan." };
  }
  if (
    !Number.isInteger(input.missionAllowance) ||
    input.missionAllowance < 1 ||
    input.missionAllowance > MAX_MISSION_ALLOWANCE
  ) {
    return {
      ok: false,
      message: `Enter a mission allowance from 1 to ${MAX_MISSION_ALLOWANCE}.`,
    };
  }
  const workspaceId = cleanWorkspaceId(input.workspaceId);
  if (!workspaceId) {
    return { ok: false, message: "Enter the workspace this activation applies to." };
  }
  const request = await repo.findRequest(input.requestId);
  if (!request) return { ok: false, message: "That enquiry was not found." };

  const existing = await repo.findByRequest(request.id);
  if (existing) return { ok: true, activation: existing, already: true };

  const workspaceActivation = await repo.findByWorkspace(workspaceId);
  if (workspaceActivation && workspaceActivation.requestId !== request.id) {
    return { ok: false, message: "That workspace already has a manual activation." };
  }
  if (options?.workspaceExists && !(await options.workspaceExists(workspaceId))) {
    return { ok: false, message: "That workspace was not found. Nothing was activated." };
  }

  const activation: PilotActivation = {
    id: (options?.id ?? (() => crypto.randomUUID()))(),
    requestId: request.id,
    workspaceId,
    plan: input.plan,
    missionAllowance: input.missionAllowance,
    missionsConsumed: 0,
    paymentTaken: false,
    exhaustion: EXHAUSTION_POLICY,
    activatedBy: input.actorId,
    activatedAt: now(),
  };
  try {
    const stored = await repo.insert(activation);
    return { ok: true, activation: { ...stored, paymentTaken: false }, already: false };
  } catch (error) {
    if (error instanceof ActivationStoreUnavailableError) throw error;
    if (error instanceof ActivationConflictError) {
      const byRequest = await repo.findByRequest(request.id);
      if (byRequest) return { ok: true, activation: byRequest, already: true };
      const byWorkspace = await repo.findByWorkspace(workspaceId);
      if (byWorkspace) {
        return { ok: false, message: "That workspace already has a manual activation." };
      }
    }
    return { ok: false, message: "The activation was not saved." };
  }
}
