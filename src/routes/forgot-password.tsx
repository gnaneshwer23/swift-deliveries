import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — DeliverX" },
      {
        name: "description",
        content: "Request a password reset link for your DeliverX account.",
      },
      { property: "og:title", content: "Reset your password — DeliverX" },
      {
        property: "og:description",
        content: "Request a password reset link for your DeliverX account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
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
            Reset your password
          </h1>
          <p className="body" style={{ marginTop: 6, marginBottom: 24 }}>
            We'll email you a link to choose a new one.
          </p>

          {sent ? (
            <div
              className="rounded-lg px-4 py-6 text-center text-sm"
              style={{ background: "var(--x-teal-light)", color: "var(--x-teal-text)" }}
            >
              If an account exists for {email}, a reset link is on its way. Check your inbox and
              spam folder.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">
                  Email
                </label>
                <input
                  id="fp-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}
              <button type="submit" className="form-submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link →"}
              </button>
            </form>
          )}

          <div className="form-signin">
            Remembered it? <Link to="/login">Sign in →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
