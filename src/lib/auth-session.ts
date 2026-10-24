import { auth, type AppUser } from "@/lib/auth/client";

/**
 * Resolves the signed-in user, retrying briefly so that a session created by
 * an OAuth or email-link redirect has time to land.
 */
export async function waitForSession(timeoutMs?: number): Promise<AppUser | null> {
  const explicit = timeoutMs !== undefined;
  const budget = timeoutMs ?? 2500;
  const started = Date.now();
  const fromRedirect =
    typeof window !== "undefined" && /[?&](code|token|state)=/.test(window.location.search);
  // Signed-out visitors hitting a protected page should redirect immediately.
  // Sign-in, sign-up and the auth callback pass an explicit budget and must poll.
  const deadline = explicit || fromRedirect ? budget : 0;
  for (;;) {
    const user = await auth.getUser();
    if (user || Date.now() - started >= deadline) return user;
    await new Promise((r) => setTimeout(r, 200));
  }
}
