/**
 * PSI commercial catalog → Stripe lookup keys and default mission allowances.
 * Career price IDs must never appear here. See docs/psi-stripe-catalog.md.
 */
import type { PilotPlan } from "./model";

export const PSI_CATALOG = "psi" as const;

export const PSI_LOOKUP_KEYS = [
  "builder_monthly",
  "founder_monthly",
  "studio_monthly",
] as const;

export type PsiLookupKey = (typeof PSI_LOOKUP_KEYS)[number];

export type PsiOffer = {
  plan: PilotPlan;
  lookupKey: PsiLookupKey;
  amountGbp: number;
  missionAllowance: number;
  label: string;
};

/** Defaults aligned with /pricing “Monthly missions”. */
export const PSI_OFFERS: readonly PsiOffer[] = [
  {
    plan: "builder",
    lookupKey: "builder_monthly",
    amountGbp: 29,
    missionAllowance: 1,
    label: "Builder · £29/month",
  },
  {
    plan: "founder",
    lookupKey: "founder_monthly",
    amountGbp: 99,
    missionAllowance: 4,
    label: "Founder · £99/month",
  },
  {
    plan: "studio",
    lookupKey: "studio_monthly",
    amountGbp: 299,
    missionAllowance: 12,
    label: "Studio · £299/month",
  },
] as const;

const BY_PLAN = new Map(PSI_OFFERS.map((offer) => [offer.plan, offer]));
const BY_LOOKUP = new Map(PSI_OFFERS.map((offer) => [offer.lookupKey, offer]));

/** Career / legacy lookup keys — never fulfil into psi_pilot_activations. */
export const CAREER_LOOKUP_KEYS = new Set([
  "experience_monthly",
  "launchpad_monthly",
  "complete_journey_monthly",
  "complete_journey_yearly",
  "career_sprint_pass",
]);

export function isPsiLookupKey(value: string): value is PsiLookupKey {
  return BY_LOOKUP.has(value as PsiLookupKey);
}

export function offerForPlan(plan: PilotPlan): PsiOffer {
  const offer = BY_PLAN.get(plan);
  if (!offer) throw new Error(`Unknown PSI plan: ${plan}`);
  return offer;
}

export function offerForLookupKey(lookupKey: string): PsiOffer | null {
  return BY_LOOKUP.get(lookupKey as PsiLookupKey) ?? null;
}

export function priceEnvOverride(plan: PilotPlan): string | undefined {
  const key =
    plan === "builder"
      ? "PSI_STRIPE_PRICE_BUILDER"
      : plan === "founder"
        ? "PSI_STRIPE_PRICE_FOUNDER"
        : "PSI_STRIPE_PRICE_STUDIO";
  const value = process.env[key]?.trim();
  return value && value.startsWith("price_") ? value : undefined;
}

export function isCheckoutFlagEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env["VITE_PAYMENTS_CHECKOUT_ENABLED"] === "true";
}
