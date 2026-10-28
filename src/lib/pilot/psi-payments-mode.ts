/**
 * PSI Checkout environment resolution (P1-5 live cutover).
 * Once PSI_PAYMENTS_LIVE_APPROVED=true, Production must use live keys —
 * sandbox is never the default for an approved live deployment.
 */
import type { StripeEnv } from "@/lib/stripe.server";
import { isCheckoutFlagEnabled } from "./psi-catalog";

export type PsiPaymentsModeResult =
  | { ok: true; environment: StripeEnv }
  | { ok: false; message: string };

/** Immediate stop: no new Checkout Sessions (live or sandbox). */
export function isPaymentsKillSwitchOn(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const raw = env["PSI_PAYMENTS_KILL_SWITCH"]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

export function isLivePaymentsApproved(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env["PSI_PAYMENTS_LIVE_APPROVED"] === "true";
}

function publishableToken(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  return (env["VITE_PAYMENTS_CLIENT_TOKEN"] ?? "").trim();
}

/**
 * Resolve sandbox vs live for PSI Checkout.
 * - Kill switch or missing checkout flag → refuse.
 * - Live approved → require pk_live_ + STRIPE_LIVE_API_KEY (no sandbox fallback).
 * - Otherwise → sandbox only (pk_test_ + STRIPE_SANDBOX_API_KEY).
 */
export function resolvePsiPaymentsMode(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): PsiPaymentsModeResult {
  if (isPaymentsKillSwitchOn(env)) {
    return {
      ok: false,
      message: "Payments are paused (kill switch). Checkout is temporarily unavailable.",
    };
  }
  if (!isCheckoutFlagEnabled(env)) {
    return { ok: false, message: "Checkout is not live." };
  }

  const token = publishableToken(env);
  const liveApproved = isLivePaymentsApproved(env);
  const liveKey = (env["STRIPE_LIVE_API_KEY"] ?? "").trim();
  const sandboxKey = (env["STRIPE_SANDBOX_API_KEY"] ?? "").trim();

  if (liveApproved) {
    if (!token.startsWith("pk_live_")) {
      return {
        ok: false,
        message:
          "Live payments are approved but VITE_PAYMENTS_CLIENT_TOKEN must be the live publishable key (pk_live_…).",
      };
    }
    if (!liveKey) {
      return {
        ok: false,
        message: "Live payments need STRIPE_LIVE_API_KEY (prefer rk_live_ restricted key).",
      };
    }
    return { ok: true, environment: "live" };
  }

  if (token.startsWith("pk_live_")) {
    return {
      ok: false,
      message:
        "Live card charging is not approved. Set PSI_PAYMENTS_LIVE_APPROVED=true with live keys, or use pk_test_ for sandbox.",
    };
  }
  if (token && !token.startsWith("pk_test_")) {
    return {
      ok: false,
      message: "VITE_PAYMENTS_CLIENT_TOKEN must be a Stripe publishable key (pk_test_ or pk_live_).",
    };
  }
  if (!sandboxKey) {
    return {
      ok: false,
      message: "Checkout needs STRIPE_SANDBOX_API_KEY in the server environment.",
    };
  }
  return { ok: true, environment: "sandbox" };
}
