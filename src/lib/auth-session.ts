import { auth, type AppUser } from "@/lib/auth/client";

/**
 * Resolves the signed-in user, retrying briefly so that a session created by
 * an OAuth or email-link redirect has time to land.
 */
export async function waitForSession(timeoutMs = 2500): Promise<AppUser | null> {
  const started = Date.now();
  for (;;) {
    const user = await auth.getUser();
    if (user || Date.now() - started >= timeoutMs) return user;
    const fromRedirect =
      typeof window !== "undefined" && /[?&](code|token|state)=/.test(window.location.search);
    if (!fromRedirect) return null;
    await new Promise((r) => setTimeout(r, 200));
  }
}
