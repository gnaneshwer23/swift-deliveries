import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { auth } from "@/lib/auth/client";
import { formatAuthError } from "@/lib/auth-errors";
import { Loader2 } from "lucide-react";
import { AuthFrame } from "@/components/auth/auth-frame";

import { safeProductRedirect } from "@/lib/product-journey";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: safeProductRedirect(search["redirect"]),
  }),
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
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { redirect: targetPath } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const resetError = await auth.requestPasswordReset(
      email,
      `${window.location.origin}/reset-password?redirect=${encodeURIComponent(targetPath)}`,
    );
    setLoading(false);
    if (resetError) {
      setError(formatAuthError({ message: resetError }));
      return;
    }
    setSent(true);
  };

  return (
    <AuthFrame
      recovery
      action={
        <Link to="/login" search={{ redirect: targetPath }} className="btn-nav">
          Sign in
        </Link>
      }
    >
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
          If an account exists for {email}, a reset link is on its way. Check your inbox and spam
          folder.
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
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
                <span>Sending link…</span>
              </>
            ) : (
              "Send reset link →"
            )}
          </button>
        </form>
      )}

      <div className="form-signin">
        Remembered it?{" "}
        <Link to="/login" search={{ redirect: targetPath }}>
          Sign in →
        </Link>
      </div>
    </AuthFrame>
  );
}
