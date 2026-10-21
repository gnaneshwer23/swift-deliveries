/** Map Supabase Auth errors to short, actionable copy for login/signup forms. */
export function formatAuthError(
  error:
    | {
        message?: string | undefined;
        code?: string | undefined;
        status?: number | undefined;
      }
    | null
    | undefined,
): string {
  if (!error) return "Something went wrong. Please try again.";

  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").trim();
  const lower = message.toLowerCase();

  if (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Confirm your email before signing in. Check your inbox (and spam) for the link we sent.";
  }

  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "That email or password is incorrect. Try again, or reset your password.";
  }

  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists. Sign in instead.";
  }

  if (lower.includes("password") && (lower.includes("weak") || lower.includes("least"))) {
    return "Choose a stronger password (at least 8 characters).";
  }

  if (
    lower.includes("provider is not enabled") ||
    lower.includes("unsupported provider") ||
    lower.includes("validation_failed")
  ) {
    return "Google sign-in is not enabled for this project yet. Use email and password instead.";
  }

  return message || "Something went wrong. Please try again.";
}
