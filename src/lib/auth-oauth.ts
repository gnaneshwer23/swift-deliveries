import { safeProductRedirect } from "./product-journey";
import { auth } from "@/lib/auth/client";

/** Canonical post-OAuth / email-link landing path. */
export function authCallbackUrl(
  origin = typeof window !== "undefined" ? window.location.origin : "",
  redirect = "/command",
): string {
  return `${origin}/auth/callback?${new URLSearchParams({ redirect: safeProductRedirect(redirect) })}`;
}

/** Google sign-in is offered only once enabled in Neon Auth and flagged on. */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  return import.meta.env["VITE_AUTH_GOOGLE_ENABLED"] === "true";
}

export async function signInWithGoogle(redirectTo = authCallbackUrl()) {
  const message = await auth.signInWithGoogle(redirectTo);
  return { error: message ? { message } : null };
}
