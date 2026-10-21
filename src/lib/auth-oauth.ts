import { supabase } from "@/integrations/supabase/client";

/** Canonical post-OAuth / email-confirm landing path. */
export function authCallbackUrl(origin = typeof window !== "undefined" ? window.location.origin : ""): string {
  return `${origin}/auth/callback`;
}

/**
 * Start Google OAuth via Supabase Auth (not the Lovable `~oauth` proxy).
 * Requires Google to be enabled in the Supabase project Auth settings and
 * `http://localhost:43123/auth/callback` / `https://deliverx.dev/auth/callback`
 * on the redirect allow list.
 */
export async function signInWithGoogle(redirectTo = authCallbackUrl()) {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  });
}

/** Whether Supabase Auth has the Google provider enabled for this project. */
export async function isGoogleAuthEnabled(): Promise<boolean> {
  const url = import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return false;

  try {
    // New publishable keys are opaque — send only `apikey`, not Bearer.
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { external?: { google?: boolean } };
    return Boolean(data.external?.google);
  } catch {
    return false;
  }
}
