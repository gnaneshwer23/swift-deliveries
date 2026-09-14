import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);

  // The recovery link delivers a session; wait for it before allowing a change.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (active && session) setReady(true);
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate({ to: "/workspace", replace: true });
  };

  return (
    <div className="dxs flex min-h-screen flex-col">
      <header className="nav">
        <Link to="/" className="nav-logo">
          DeliverX
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card w-full max-w-sm" style={{ padding: 32 }}>
          <h1 className="heading-1" style={{ fontSize: 24 }}>
            Choose a new password
          </h1>

          {ready === false ? (
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
