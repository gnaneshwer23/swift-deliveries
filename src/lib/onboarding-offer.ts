/**
 * Offer choice on workspace setup. Prices come from the PSI catalog.
 * Nothing is selected until the founder picks. Setup never starts billing.
 */
import { PILOT_PLAN_LABELS, isPilotPlan, type PilotPlan } from "@/lib/pilot/model";
import { PSI_OFFERS } from "@/lib/pilot/psi-catalog";
import { clearPilotPlan, savePilotPlan } from "@/lib/pilot/storage";

export const SETUP_DOES_NOT_ACTIVATE = "Account setup does not activate a paid pilot.";

export const DEMO_OFFER_ID = "demo" as const;

export type OnboardingOfferChoice = PilotPlan | typeof DEMO_OFFER_ID;

export type StoredOfferRequest = {
  reference: string;
  plan: PilotPlan;
};

export type OnboardingOfferOption = {
  id: OnboardingOfferChoice;
  name: string;
  priceLabel: string;
  detail: string;
  paid: boolean;
};

function planName(label: string): string {
  const name = label.split(" · ")[0];
  return name && name.length > 0 ? name : label;
}

const PAID_OPTIONS: readonly OnboardingOfferOption[] = PSI_OFFERS.map((offer) => ({
  id: offer.plan,
  name: planName(offer.label),
  priceLabel: `£${offer.amountGbp}/month`,
  detail: `${offer.missionAllowance} Investigation ${
    offer.missionAllowance === 1 ? "mission" : "missions"
  } / month. Choosing this does not take payment.`,
  paid: true,
}));

const DEMO_OPTION: OnboardingOfferOption = {
  id: DEMO_OFFER_ID,
  name: "Demo",
  priceLabel: "No paid pilot",
  detail: `Open the workspace with no paid offer. ${SETUP_DOES_NOT_ACTIVATE}`,
  paid: false,
};

/** Catalog offers first, then the explicit unpaid demo path. None is a default. */
export const ONBOARDING_OFFER_OPTIONS: readonly OnboardingOfferOption[] = [
  ...PAID_OPTIONS,
  DEMO_OPTION,
];

export function isOnboardingOfferChoice(value: unknown): value is OnboardingOfferChoice {
  return value === DEMO_OFFER_ID || (typeof value === "string" && isPilotPlan(value));
}

export function canOpenWorkspace(choice: OnboardingOfferChoice | null): boolean {
  return choice !== null;
}

/**
 * "Chosen offer" only after an explicit paid selection.
 * A saved enquiry is not a selection. Demo never names a paid plan.
 */
export function chosenOfferSummary(
  choice: OnboardingOfferChoice | null,
  storedRequest: StoredOfferRequest | null,
): string | null {
  if (choice === null) return null;
  switch (choice) {
    case "demo":
      return `No paid offer chosen. Demo workspace. ${SETUP_DOES_NOT_ACTIVATE}`;
    case "builder":
    case "founder":
    case "studio": {
      const request =
        storedRequest && storedRequest.plan === choice
          ? ` · Request ${storedRequest.reference}`
          : "";
      return `Chosen offer: ${PILOT_PLAN_LABELS[choice]}${request}. ${SETUP_DOES_NOT_ACTIVATE}`;
    }
    default: {
      const exhaustive: never = choice;
      return exhaustive;
    }
  }
}

export function unselectedOfferNote(storedRequest: StoredOfferRequest | null): string {
  if (storedRequest) {
    return `Saved request ${storedRequest.reference} is on file. It is not selected. ${SETUP_DOES_NOT_ACTIVATE}`;
  }
  return `No offer is selected. ${SETUP_DOES_NOT_ACTIVATE}`;
}

/** Remember the explicit choice locally. Demo clears any earlier paid plan id. */
export function applyOnboardingOfferChoice(choice: OnboardingOfferChoice): void {
  switch (choice) {
    case "demo":
      clearPilotPlan();
      return;
    case "builder":
    case "founder":
    case "studio":
      savePilotPlan(choice);
      return;
    default: {
      const exhaustive: never = choice;
      return exhaustive;
    }
  }
}
