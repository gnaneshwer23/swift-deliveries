import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useCallback, useState } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

export type CheckoutPriceId =
  | "experience_monthly"
  | "launchpad_monthly"
  | "complete_journey_monthly"
  | "complete_journey_yearly"
  | "career_sprint_pass";

export function StripeEmbeddedCheckout({ priceId }: { priceId: CheckoutPriceId }) {
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    const result = await createCheckoutSession({
      data: {
        priceId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if ("error" in result) {
      setError(result.error);
      throw new Error(result.error);
    }
    if (!result.clientSecret) {
      const message = "Payment form could not be opened";
      setError(message);
      throw new Error(message);
    }
    return result.clientSecret;
  }, [priceId]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
