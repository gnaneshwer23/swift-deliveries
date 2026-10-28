import { auth, type AppUser } from "@/lib/auth/client";

/**
 * Resolves the signed-in user, retrying briefly so that a session created by
 * an OAuth or email-link redirect has time to land. Server functions need a
 * readable JWT (`auth.getToken()`), not just a session cookie.
 */
export async function waitForSession(timeoutMs?: number): Promise<AppUser | null> {
  const explicit = timeoutMs !== undefined;
  const budget = timeoutMs ?? 2500;
  const started = Date.now();
  const fromRedirect =
    typeof window !== "undefined" && /[?&](code|token|state)=/.test(window.location.search);
  // Signed-out visitors hitting a protected page should redirect immediately.
  const signedOutBudget = explicit || fromRedirect ? budget : 0;
  // When a session exists, allow a short window for the JWT to hydrate.
  const tokenBudget = explicit || fromRedirect ? budget : 2000;

  for (;;) {
    const user = await auth.getUser();
    if (user) {
      if (await auth.getToken()) return user;
      if (Date.now() - started >= tokenBudget) return null;
    } else if (Date.now() - started >= signedOutBudget) {
      return null;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
}
