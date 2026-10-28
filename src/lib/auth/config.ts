/** Neon Auth browser configuration (VITE_NEON_AUTH_URL). */

export type AuthConfigIssue = "missing_browser_url" | "invalid_browser_url";

export function getAuthConfigIssue(
  viteNeonAuthUrl: string | undefined = import.meta.env["VITE_NEON_AUTH_URL"] as
    | string
    | undefined,
): AuthConfigIssue | null {
  const raw = viteNeonAuthUrl?.trim();
  if (!raw) return "missing_browser_url";
  try {
    new URL(raw);
    return null;
  } catch {
    return "invalid_browser_url";
  }
}

export function authConfigErrorMessage(issue: AuthConfigIssue): string {
  switch (issue) {
    case "missing_browser_url":
      return (
        "Sign-in is not configured: set VITE_NEON_AUTH_URL to your Neon Auth Base URL " +
        "(same value as NEON_AUTH_URL on the server). For local dev, add both to `.env.local` " +
        "and restart `npm run dev`. See docs/neon-auth-local-setup.md."
      );
    case "invalid_browser_url":
      return (
        "Sign-in is misconfigured: VITE_NEON_AUTH_URL must be a full URL (Neon Auth Base URL). " +
        "See docs/neon-auth-local-setup.md."
      );
  }
}

export function isAuthConfigured(
  viteNeonAuthUrl?: string | undefined,
): boolean {
  return getAuthConfigIssue(viteNeonAuthUrl) === null;
}
