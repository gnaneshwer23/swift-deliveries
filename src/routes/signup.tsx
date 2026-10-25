import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth/client";
import { formatAuthError } from "@/lib/auth-errors";
import { authCallbackUrl, isGoogleAuthEnabled, signInWithGoogle } from "@/lib/auth-oauth";
import { waitForSession } from "@/lib/auth-session";
import { Loader2 } from "lucide-react";
import { AuthFrame } from "@/components/auth/auth-frame";
import { GoogleButton } from "@/components/auth/google-button";

import { safeProductRedirect as sanitizeRedirect } from "@/lib/product-journey";
import { PILOT_PLAN_LABELS } from "@/lib/pilot/model";
import { loadPilotClaim, loadPilotPlan } from "@/lib/pilot/storage";
import { ACCOUNT_DOES_NOT_ACTIVATE } from "@/lib/pilot/commercial-copy";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect:
      typeof search["redirect"] === "string" ? sanitizeRedirect(search["redirect"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create your account — DeliverX" },
      {
        name: "description",
        content: `${ACCOUNT_DOES_NOT_ACTIVATE} It does not start a subscription.`,
      },
      { property: "og:title", content: "Create your account — DeliverX" },
      {
        property: "og:description",
        content: `${ACCOUNT_DOES_NOT_ACTIVATE} It does not start a subscription.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const targetPath = sanitizeRedirect(search.redirect);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [pilotNote, setPilotNote] = useState<string | null>(null);

  useEffect(() => {
    const plan = loadPilotPlan();
    const claim = loadPilotClaim();
    if (plan || claim) {
      setPilotNote(
        `${claim ? `Request ${claim.reference} is saved on this device. ` : ""}${
          plan ? `Chosen offer: ${PILOT_PLAN_LABELS[plan]}. ` : ""
        }${ACCOUNT_DOES_NOT_ACTIVATE}`,
      );
    }
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
    const signUpError = await auth.signUp({
      name: fullName.trim(),
      email,
      password,
      callbackURL: authCallbackUrl(undefined, targetPath),
    });
    if (signUpError) {
      setLoading(false);
      setError(formatAuthError({ message: signUpError }));
      return;
    }
    // Signed in straight away unless email verification is required.
    const user = await waitForSession(2000);
    if (user) {
      setLoading(false);
      navigate({ to: "/onboarding", search: { redirect: targetPath } });
      return;
    }
    setLoading(false);
    setSuccess(true);
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
        <Link to="/login" search={{ redirect: targetPath }} className="btn-nav">
          Sign in
        </Link>
      }
    >
      <h1 className="heading-1" style={{ fontSize: 24 }}>
        Create your account
      </h1>
      <p className="body" style={{ marginTop: 6, marginBottom: 24 }}>
        {ACCOUNT_DOES_NOT_ACTIVATE}
      </p>
      {pilotNote ? <p className="body">{pilotNote}</p> : null}

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

      {success ? (
        <div
          className="rounded-lg px-4 py-6 text-center text-sm"
          style={{ background: "var(--x-teal-light)", color: "var(--x-teal-text)" }}
        >
          Account created. Check your email to confirm, then sign in.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="su-name">
              Full name
            </label>
            <input
              id="su-name"
              type="text"
              autoComplete="name"
              className="form-input"
              placeholder="Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="su-email">
              Email
            </label>
            <input
              id="su-email"
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
            <label className="form-label" htmlFor="su-pass">
              Password
            </label>
            <input
              id="su-pass"
              type="password"
              autoComplete="new-password"
              className="form-input"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Creating account…</span>
              </>
            ) : (
              "Create account →"
            )}
          </button>
        </form>
      )}
      <p className="mt-4 text-xs" style={{ color: "var(--x-slate-light)" }}>
        By creating an account you agree to our{" "}
        <Link to="/terms" style={{ color: "var(--x-slate)" }}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" style={{ color: "var(--x-slate)" }}>
          Privacy Policy
        </Link>
        .
      </p>
      <div className="form-signin">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect: targetPath }}>
          Sign in →
        </Link>
      </div>
    </AuthFrame>
  );
}
