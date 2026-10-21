import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { authCallbackUrl, isGoogleAuthEnabled, signInWithGoogle } from "@/lib/auth-oauth";
import { waitForSession } from "@/lib/auth-session";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleButton } from "@/components/auth/google-button";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — DeliverX" },
      {
        name: "description",
        content:
          "Create your DeliverX account to open Command Centre (Stage 1 workforce preview). Career Experience and Launchpad remain available from your account.",
      },
      { property: "og:title", content: "Create your account — DeliverX" },
      {
        property: "og:description",
        content:
          "Create your DeliverX account to open Command Centre (Stage 1 workforce preview). Career Experience and Launchpad remain available from your account.",
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: authCallbackUrl(),
      },
    });
    if (signUpError) {
      setLoading(false);
      setError(formatAuthError(signUpError));
      return;
    }
    if (data.session) {
      const session = await waitForSession(2000);
      setLoading(false);
      if (!session) {
        setError("Account created, but the session did not stick. Sign in with your email and password.");
        return;
      }
      navigate({ to: "/command" });
      return;
    }
    setLoading(false);
    setSuccess(true);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error: oauthError } = await signInWithGoogle();
    setLoading(false);
    if (oauthError) setError(formatAuthError(oauthError));
  };

  return (
    <div className="dxs flex min-h-screen flex-col">
      <header className="nav">
        <BrandLogo />
        <div className="nav-right">
          <Link to="/login" className="btn-nav">
            Sign in
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card w-full max-w-sm" style={{ padding: 32 }}>
          <h1 className="heading-1" style={{ fontSize: 24 }}>
            Create your account
          </h1>
          <p className="body" style={{ marginTop: 6, marginBottom: 24 }}>
            Sign up opens Command Centre (Stage 1 workforce preview). Career Experience and
            Launchpad remain available from your account once you are in.
          </p>

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
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Start for free →"}
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
            Already have an account? <Link to="/login">Sign in →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
