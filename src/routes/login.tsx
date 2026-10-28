import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, authConfigErrorMessage, getAuthConfigIssue } from "@/lib/auth/client";
import { waitForSession } from "@/lib/auth-session";
import { formatAuthError } from "@/lib/auth-errors";
import { authCallbackUrl, isGoogleAuthEnabled, signInWithGoogle } from "@/lib/auth-oauth";
import { Loader2 } from "lucide-react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { GoogleButton } from "@/components/auth/google-button";

import { safeProductRedirect as sanitizeRedirect } from "@/lib/product-journey";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect:
      typeof search["redirect"] === "string" ? sanitizeRedirect(search["redirect"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — DeliverX" },
      { name: "description", content: "Sign in to DeliverX." },
      { property: "og:title", content: "Sign in — DeliverX" },
      { property: "og:description", content: "Sign in to DeliverX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const targetPath = sanitizeRedirect(search.redirect);
  // Someone who already has a session should be routed forward, not asked again.
  useEffect(() => {
    let active = true;
    void waitForSession().then((session) => {
      if (active && session) navigate({ to: targetPath, replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate, targetPath]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const authConfigIssue = getAuthConfigIssue();

  useEffect(() => {
    let active = true;
    void isGoogleAuthEnabled().then((enabled) => {
      if (active) setGoogleEnabled(enabled);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const signInError = await auth.signIn({ email, password });
    if (signInError) {
      setLoading(false);
      setError(formatAuthError({ message: signInError }));
      return;
    }
    // Ensure the session is readable before the authenticated gate runs.
    const session = await waitForSession(2000);
    setLoading(false);
    if (!session) {
      setError(
        "Signed in, but the session did not stick. Check that cookies/storage are allowed, then try again.",
      );
      return;
    }
    navigate({ to: targetPath });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle(authCallbackUrl(undefined, targetPath));
    setLoading(false);
    if (oauthError) setError(formatAuthError(oauthError));
  };

  return (
    <AuthFrame
      action={
        <Link to="/signup" search={{ redirect: targetPath }} className="btn-nav btn-nav-primary">
          Create account
        </Link>
      }
    >
      <h1 className="heading-1" style={{ fontSize: 24 }}>
        Sign in
      </h1>
      <p className="body" style={{ marginTop: 6, marginBottom: 24 }}>
        Pick up where your product team left off.
      </p>

      {authConfigIssue && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
          {authConfigErrorMessage(authConfigIssue)}
        </p>
      )}

      {googleEnabled && (
        <>
          <GoogleButton loading={loading} onClick={handleGoogle} label="Continue with Google" />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--x-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="caption bg-[var(--x-paper-raised)] px-2">or</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-pass">
            Password
          </label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="form-submit" disabled={loading || !!authConfigIssue}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            "Sign in →"
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-xs">
        <Link
          to="/forgot-password"
          search={{ redirect: targetPath }}
          style={{ color: "var(--x-slate)" }}
        >
          Forgot your password?
        </Link>
      </div>

      <div className="form-signin">
        New here?{" "}
        <Link to="/signup" search={{ redirect: targetPath }}>
          Create an account →
        </Link>
      </div>
    </AuthFrame>
  );
}
