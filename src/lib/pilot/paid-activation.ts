/**
 * Stripe Checkout → psi_pilot_activations (same commercial shape as manual activate).
 * Fulfill only when payment_status is paid / no_payment_required. Idempotent by session id.
 */
import { EXHAUSTION_POLICY, MAX_MISSION_ALLOWANCE, type PilotActivation } from "./activation";
import { isPilotPlan, type PilotPlan } from "./model";
import {
  CAREER_LOOKUP_KEYS,
  isPsiLookupKey,
  offerForLookupKey,
  offerForPlan,
  PSI_CATALOG,
} from "./psi-catalog";

export type PaidActivationInput = {
  checkoutSessionId: string;
  paymentStatus: string;
  userId: string | null | undefined;
  workspaceId: string | null | undefined;
  plan: string | null | undefined;
  missionAllowance: number | null | undefined;
  lookupKey: string | null | undefined;
  catalog: string | null | undefined;
  customerId: string | null | undefined;
  subscriptionId: string | null | undefined;
  environment: "sandbox" | "live";
  activatedAt: string;
};

export type PaidActivationRepository = {
  findByCheckoutSession(sessionId: string): Promise<PilotActivation | null>;
  findByWorkspace(workspaceId: string): Promise<PilotActivation | null>;
  insertPaid(row: PilotActivation & PaidStripeFields): Promise<PilotActivation>;
};

export type PaidStripeFields = {
  stripeCheckoutSessionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceLookupKey: string;
  paymentEnvironment: "sandbox" | "live";
};

export type PaidFulfillResult =
  | { ok: true; activation: PilotActivation; already: boolean }
  | {
      ok: false;
      reason: "unpaid" | "not_psi" | "career" | "invalid" | "conflict";
      message: string;
    };

const WORKSPACE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPsiCheckoutSession(session: {
  metadata?: Record<string, string> | null;
}): boolean {
  const meta = session.metadata ?? {};
  if (meta["catalog"] === PSI_CATALOG) return true;
  const lookup = meta["lookupKey"] ?? meta["priceId"] ?? "";
  return isPsiLookupKey(lookup);
}

export function parseCheckoutSessionForPsi(
  session: {
    id?: string;
    payment_status?: string;
    customer?: string | { id?: string } | null;
    subscription?: string | { id?: string } | null;
    metadata?: Record<string, string> | null;
  },
  environment: "sandbox" | "live",
  nowIso: string,
): PaidActivationInput | null {
  if (!session.id) return null;
  const meta = session.metadata ?? {};
  const customer =
    typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const subscription =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);
  const allowanceRaw = meta["missionAllowance"];
  const allowance =
    allowanceRaw !== undefined && allowanceRaw !== "" ? Number(allowanceRaw) : undefined;
  return {
    checkoutSessionId: session.id,
    paymentStatus: session.payment_status ?? "unpaid",
    userId: meta["userId"] ?? null,
    workspaceId: meta["workspaceId"] ?? null,
    plan: meta["plan"] ?? null,
    missionAllowance: Number.isFinite(allowance) ? allowance : null,
    lookupKey: meta["lookupKey"] ?? meta["priceId"] ?? null,
    catalog: meta["catalog"] ?? null,
    customerId: customer,
    subscriptionId: subscription,
    environment,
    activatedAt: nowIso,
  };
}

export async function fulfillPaidActivation(
  input: PaidActivationInput,
  repo: PaidActivationRepository,
  options?: { id?: () => string },
): Promise<PaidFulfillResult> {
  if (input.paymentStatus === "unpaid") {
    return { ok: false, reason: "unpaid", message: "Payment is not complete." };
  }
  if (input.paymentStatus !== "paid" && input.paymentStatus !== "no_payment_required") {
    return { ok: false, reason: "unpaid", message: "Payment is not complete." };
  }

  const lookup = input.lookupKey?.trim() ?? "";
  if (CAREER_LOOKUP_KEYS.has(lookup)) {
    return {
      ok: false,
      reason: "career",
      message: "Career price IDs do not activate PSI pilots.",
    };
  }
  if (input.catalog && input.catalog !== PSI_CATALOG) {
    return { ok: false, reason: "not_psi", message: "Not a PSI checkout session." };
  }
  if (!isPsiLookupKey(lookup) && input.catalog !== PSI_CATALOG) {
    return { ok: false, reason: "not_psi", message: "Not a PSI checkout session." };
  }

  const offerFromLookup = lookup ? offerForLookupKey(lookup) : null;
  const planRaw = input.plan ?? offerFromLookup?.plan;
  if (!planRaw || !isPilotPlan(planRaw)) {
    return { ok: false, reason: "invalid", message: "Checkout is missing a valid PSI plan." };
  }
  const offer = offerFromLookup ?? offerForPlan(planRaw);
  const plan: PilotPlan = offer.plan;

  let allowance = input.missionAllowance ?? offer.missionAllowance;
  if (!Number.isInteger(allowance) || allowance < 1 || allowance > MAX_MISSION_ALLOWANCE) {
    allowance = offer.missionAllowance;
  }

  const workspaceId = input.workspaceId?.trim().toLowerCase() ?? "";
  if (!WORKSPACE_ID.test(workspaceId)) {
    return { ok: false, reason: "invalid", message: "Checkout is missing a workspace." };
  }
  if (!input.userId?.trim()) {
    return { ok: false, reason: "invalid", message: "Checkout is missing the buyer." };
  }

  const existingSession = await repo.findByCheckoutSession(input.checkoutSessionId);
  if (existingSession) return { ok: true, activation: existingSession, already: true };

  const existingWorkspace = await repo.findByWorkspace(workspaceId);
  if (existingWorkspace) {
    if (existingWorkspace.stripeCheckoutSessionId === input.checkoutSessionId) {
      return { ok: true, activation: existingWorkspace, already: true };
    }
    return {
      ok: false,
      reason: "conflict",
      message: "That workspace already has a pilot activation.",
    };
  }

  const row: PilotActivation & PaidStripeFields = {
    id: (options?.id ?? (() => crypto.randomUUID()))(),
    requestId: null,
    workspaceId,
    plan,
    missionAllowance: allowance,
    missionsConsumed: 0,
    paymentTaken: true,
    exhaustion: EXHAUSTION_POLICY,
    activatedBy: `stripe:${input.userId}`,
    activatedAt: input.activatedAt,
    stripeCheckoutSessionId: input.checkoutSessionId,
    stripeCustomerId: input.customerId ?? null,
    stripeSubscriptionId: input.subscriptionId ?? null,
    stripePriceLookupKey: offer.lookupKey,
    paymentEnvironment: input.environment,
  };

  const stored = await repo.insertPaid(row);
  return { ok: true, activation: stored, already: false };
}
