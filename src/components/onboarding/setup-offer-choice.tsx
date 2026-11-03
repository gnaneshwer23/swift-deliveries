import { Check } from "lucide-react";
import {
  ONBOARDING_OFFER_OPTIONS,
  chosenOfferSummary,
  unselectedOfferNote,
  type OnboardingOfferChoice,
  type StoredOfferRequest,
} from "@/lib/onboarding-offer";

export function SetupOfferChoice({
  value,
  onChange,
  storedRequest,
}: {
  value: OnboardingOfferChoice | null;
  onChange: (choice: OnboardingOfferChoice) => void;
  storedRequest: StoredOfferRequest | null;
}) {
  const summary = chosenOfferSummary(value, storedRequest);
  return (
    <div className="setup-offers">
      <p className="ob-label" id="setup-offer-label">
        Offer
      </p>
      <div
        className="setup-offer-list"
        role="radiogroup"
        aria-labelledby="setup-offer-label"
        aria-required="true"
      >
        {ONBOARDING_OFFER_OPTIONS.map((offer) => {
          const selected = value === offer.id;
          return (
            <button
              key={offer.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(offer.id)}
            >
              <strong>{offer.name}</strong>
              <span className="setup-offer-price">
                {selected ? <Check size={14} aria-hidden="true" /> : null}
                {offer.priceLabel}
              </span>
              <small>{offer.detail}</small>
            </button>
          );
        })}
      </div>
      <p className="setup-help" id="setup-offer-status">
        {summary ?? unselectedOfferNote(storedRequest)}
      </p>
    </div>
  );
}
