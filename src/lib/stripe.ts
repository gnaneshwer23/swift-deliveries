import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";
// Publishable key (safe to ship in client code). Env var wins when present;
// the published build does not always inline VITE_PAYMENTS_* vars.
const LIVE_PUBLISHABLE_KEY = "pk_live_51S6BMU2X2opf83VZTg5xySnR4YmszcWkuOZZDGOLfJzkvgGu7FcnUWQk1QCyMN8HP8qniI4q4MCPeP6HqrEv8qFx00vS1Lb8Gh";
const envToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];
const clientToken =
  typeof envToken === "string" && envToken.startsWith("pk_") ? envToken : LIVE_PUBLISHABLE_KEY;

const checkoutFlag = import.meta.env["VITE_PAYMENTS_CHECKOUT_ENABLED"];
export const isCheckoutEnabled =
  (checkoutFlag === "true" || checkoutFlag === undefined) &&
  (clientToken?.startsWith("pk_test_") || clientToken?.startsWith("pk_live_"));

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
