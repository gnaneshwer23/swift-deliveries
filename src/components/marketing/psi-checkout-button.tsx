import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";
import { createPsiCheckoutSession } from "@/lib/pilot/psi-checkout.functions";
import type { PilotPlan } from "@/lib/pilot/model";
import { isCheckoutEnabled, isSandboxCheckout } from "@/lib/stripe";

type Props = {
  plan: PilotPlan;
  planName: string;
  featured?: boolean;
};

/**
 * Pricing CTA for PSI sandbox Checkout. Hidden unless the checkout flag and
 * publishable key are configured. Career Stripe checkout is never used here.
 */
export function PsiCheckoutButton({ plan, planName, featured }: Props) {
  const { user, loading } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCheckoutEnabled) return null;

  const className = `dxl-btn ${featured ? "dxl-btn-primary" : "dxl-btn-ghost"}`;

  if (loading) {
    return (
      <button type="button" className={className} disabled>
        Checking session…
      </button>
    );
  }

  if (!user) {
    return (
      <Link to="/login" search={{ redirect: "/pricing" }} className={className}>
        Sign in to pay ({isSandboxCheckout ? "sandbox" : "checkout"})
      </Link>
    );
  }

  return (
    <div className="pricing-checkout-action">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          setError(null);
          setPending(true);
          const origin = window.location.origin;
          void createPsiCheckoutSession({
            data: {
              plan,
              successUrl: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
              cancelUrl: `${origin}/pricing`,
            },
          })
            .then((result) => {
              if (!result.ok) {
                setError(result.message);
                setPending(false);
                return;
              }
              window.location.assign(result.url);
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Checkout could not start.");
              setPending(false);
            });
        }}
      >
        {pending ? "Opening Checkout…" : `Pay ${planName}${isSandboxCheckout ? " (sandbox)" : ""}`}
      </button>
      {error ? (
        <p className="pricing-checkout-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
