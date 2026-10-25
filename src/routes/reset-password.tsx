import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — DeliverX" },
      { name: "description", content: "Set a new password for your DeliverX account." },
      { property: "og:title", content: "Choose a new password — DeliverX" },
      { property: "og:description", content: "Set a new password for your DeliverX account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The reset email links here with ?token=…; an expired link arrives with ?error=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
    setReady(Boolean(t) && !params.get("error"));
    if (t) window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    const updateError = await auth.resetPassword(password, token);
    setLoading(false);
    if (updateError) {
      setError(updateError);
      return;
    }
    setDone(true);
  };

  return (
    <div className="dxs psi-auth flex min-h-screen flex-col">
      <header className="nav">
        <BrandLogo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card w-full max-w-sm" style={{ padding: 32 }}>
          <h1 className="heading-1" style={{ fontSize: 24 }}>
            Choose a new password
          </h1>

          {done ? (
            <p className="body" style={{ marginTop: 12 }}>
              Password updated. <Link to="/login">Sign in with your new password →</Link>
            </p>
          ) : ready === false ? (
            <p className="body" style={{ marginTop: 12 }}>
              This reset link is invalid or has expired.{" "}
              <Link to="/forgot-password">Request a new one →</Link>
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="rp-pass">
                  New password
                </label>
                <input
                  id="rp-pass"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="rp-confirm">
                  Confirm password
                </label>
                <input
                  id="rp-confirm"
                  type="password"
                  className="form-input"
                  placeholder="Repeat it"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}
              <button type="submit" className="form-submit" disabled={loading || ready !== true}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save new password →"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
