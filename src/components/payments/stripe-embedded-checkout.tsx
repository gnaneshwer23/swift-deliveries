import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

export type CheckoutPriceId =
  | "experience_monthly"
  | "launchpad_monthly"
  | "complete_journey_monthly";

export function StripeEmbeddedCheckout({ priceId }: { priceId: CheckoutPriceId }) {
  const fetchClientSecret = useCallback(async () => {
    const result = await createCheckoutSession({
      data: {
        priceId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Payment form could not be opened");
    return result.clientSecret;
  }, [priceId]);

  return (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
