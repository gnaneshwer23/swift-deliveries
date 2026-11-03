import { afterEach, describe, expect, it, vi } from "vitest";
import { PSI_OFFERS } from "@/lib/pilot/psi-catalog";
import { loadPilotPlan, savePilotPlan } from "@/lib/pilot/storage";
import {
  ONBOARDING_OFFER_OPTIONS,
  SETUP_DOES_NOT_ACTIVATE,
  applyOnboardingOfferChoice,
  canOpenWorkspace,
  chosenOfferSummary,
  unselectedOfferNote,
} from "./onboarding-offer";

afterEach(() => vi.unstubAllGlobals());

function memoryStorage() {
  const rows = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  });
}

describe("onboarding offer choice", () => {
  it("lists catalog prices and an explicit demo path, with nothing pre-selected", () => {
    const paid = ONBOARDING_OFFER_OPTIONS.filter((offer) => offer.paid);
    expect(paid.map((offer) => [offer.id, offer.priceLabel])).toEqual(
      PSI_OFFERS.map((offer) => [offer.plan, `£${offer.amountGbp}/month`]),
    );
    expect(paid.map((offer) => offer.priceLabel)).toEqual(["£29/month", "£99/month", "£299/month"]);
    expect(ONBOARDING_OFFER_OPTIONS.at(-1)?.id).toBe("demo");
    expect(ONBOARDING_OFFER_OPTIONS.at(-1)?.paid).toBe(false);
    expect(canOpenWorkspace(null)).toBe(false);
    expect(chosenOfferSummary(null, { reference: "DX-AAAAAAAA", plan: "studio" })).toBeNull();
  });

  it("does not call a saved Studio request a chosen offer until the founder picks it", () => {
    const stored = { reference: "DX-AAAAAAAA", plan: "studio" as const };
    expect(unselectedOfferNote(stored)).not.toMatch(/Chosen offer/);
    expect(unselectedOfferNote(stored)).toContain("DX-AAAAAAAA");
    expect(unselectedOfferNote(stored)).toContain("not selected");
    expect(unselectedOfferNote(stored)).toContain(SETUP_DOES_NOT_ACTIVATE);
    expect(unselectedOfferNote(null)).toMatch(/^No offer is selected/);
  });

  it("names a paid offer only after it is chosen, and labels demo without a price", () => {
    const stored = { reference: "DX-AAAAAAAA", plan: "studio" as const };
    expect(chosenOfferSummary("studio", stored)).toBe(
      `Chosen offer: Studio · £299/month · Request DX-AAAAAAAA. ${SETUP_DOES_NOT_ACTIVATE}`,
    );
    expect(chosenOfferSummary("builder", stored)).toBe(
      `Chosen offer: Builder · £29/month. ${SETUP_DOES_NOT_ACTIVATE}`,
    );
    const demo = chosenOfferSummary("demo", stored);
    expect(demo).toContain("No paid offer chosen");
    expect(demo).toContain("Demo workspace");
    expect(demo).not.toMatch(/Chosen offer/);
    expect(demo).not.toMatch(/£299/);
    expect(demo).toContain(SETUP_DOES_NOT_ACTIVATE);
    expect(canOpenWorkspace("demo")).toBe(true);
    expect(canOpenWorkspace("founder")).toBe(true);
  });

  it("stores the picked plan and clears a leftover Studio id on the demo path", () => {
    memoryStorage();
    savePilotPlan("studio");
    applyOnboardingOfferChoice("demo");
    expect(loadPilotPlan()).toBeNull();
    applyOnboardingOfferChoice("builder");
    expect(loadPilotPlan()).toBe("builder");
  });
});
