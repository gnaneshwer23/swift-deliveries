import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — DeliverX" },
      { name: "description", content: "Sign in to DeliverX." },
      { property: "og:title", content: "Sign in — DeliverX" },
      { property: "og:description", content: "Sign in to DeliverX." },
    ],
  }),
  component: LoginPage,
});

export function GoogleButton({
  loading,
  onClick,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="btn btn-secondary w-full justify-center">
      <svg className="mr-2 size-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.85 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.29-4.53 6.15-4.53z" />
      </svg>
      {label}
    </button>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate({ to: "/workspace" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) setError(result.error.message || "Google sign-in failed");
  };

  return (
    <div className="dxs flex min-h-screen flex-col">
      <header className="nav">
        <Link to="/" className="nav-logo">
          DeliverX
        </Link>
        <div className="nav-right">
          <Link to="/pilot" className="btn-nav btn-nav-primary">
            Start pilot
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card w-full max-w-sm" style={{ padding: 32 }}>
          <h1 className="heading-1" style={{ fontSize: 24 }}>
            Sign in
          </h1>
          <p className="body" style={{ marginTop: 6, marginBottom: 24 }}>
            Pick up where your record left off.
          </p>

          <GoogleButton loading={loading} onClick={handleGoogle} label="Continue with Google" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--x-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="caption bg-[var(--x-paper-raised)] px-2">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
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
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in →"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs">
            <Link to="/forgot-password" style={{ color: "var(--x-slate)" }}>
              Forgot your password?
            </Link>
          </div>

          <div className="form-signin">
            New here? <Link to="/pilot">Join the pilot →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
