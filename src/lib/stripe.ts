import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";
/**
 * Publishable key for client Stripe.js. Prefer VITE_PAYMENTS_CLIENT_TOKEN.
 * Fallback pk_live_ is the account publishable key (public by design) so legacy
 * career embeds keep working; PSI Pay UI still requires the checkout flag.
 */
const LIVE_PUBLISHABLE_KEY =
  "pk_live_51S6BMU2X2opf83VZTg5xySnR4YmszcWkuOZZDGOLfJzkvgGu7FcnUWQk1QCyMN8HP8qniI4q4MCPeP6HqrEv8qFx00vS1Lb8Gh";
const envToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];
const clientToken =
  typeof envToken === "string" && envToken.startsWith("pk_") ? envToken : LIVE_PUBLISHABLE_KEY;

const checkoutFlag = import.meta.env["VITE_PAYMENTS_CHECKOUT_ENABLED"];
/**
 * Explicit opt-in only — missing flag means checkout UI stays off.
 * Kill switch is server-enforced; unsetting this flag is the client-side stop.
 */
export const isCheckoutEnabled =
  checkoutFlag === "true" &&
  (clientToken?.startsWith("pk_test_") || clientToken?.startsWith("pk_live_"));

/** True only when Pay is on and the build uses a test publishable key. */
export const isSandboxCheckout =
  isCheckoutEnabled && Boolean(clientToken?.startsWith("pk_test_"));

/**
 * True only when Pay is on and the build uses pk_live_.
 * Server still requires PSI_PAYMENTS_LIVE_APPROVED before charging cards.
 */
export const isLiveCheckout =
  isCheckoutEnabled && Boolean(clientToken?.startsWith("pk_live_"));

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error("Payments are not ready for this build.");
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
