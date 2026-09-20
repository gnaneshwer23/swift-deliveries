import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — DeliverX" },
      { name: "description", content: "Create your DeliverX account and start building your evidence record." },
      { property: "og:title", content: "Create your account — DeliverX" },
      { property: "og:description", content: "Create your DeliverX account and start building your evidence record." },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    setSuccess(true);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) setError(result.error.message || "Google sign-up failed");
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
            Your evidence record starts empty — that's correct.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="btn btn-secondary w-full justify-center"
          >
            <svg className="mr-2 size-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.85 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.29-4.53 6.15-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--x-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="caption bg-[var(--x-paper-raised)] px-2">or</span>
            </div>
          </div>

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
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
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
