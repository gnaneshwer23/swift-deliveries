import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { waitForSession } from "@/lib/auth-session";

/**
 * Public landing point for email-confirmation and OAuth redirects. It waits for
 * the session to hydrate, then routes forward — the onboarding gate on
 * /workspace decides between setup and the dashboard.
 */
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — DeliverX" },
      { name: "description", content: "Completing your DeliverX sign-in." },
      { property: "og:title", content: "Signing you in — DeliverX" },
      { property: "og:description", content: "Completing your DeliverX sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void waitForSession().then((session) => {
      if (!active) return;
      if (!session) {
        setFailed(true);
        return;
      }
      navigate({ to: "/workspace", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="dxs flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-sm text-center" style={{ padding: 32 }}>
        {failed ? (
          <>
            <h1 className="heading-1" style={{ fontSize: 20 }}>
              That link has expired
            </h1>
            <p className="body" style={{ marginTop: 8 }}>
              Sign in with your email and password to continue.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-6 w-full justify-center"
              onClick={() => navigate({ to: "/login", replace: true })}
            >
              Go to sign in
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-5 animate-spin" />
            <p className="body" style={{ marginTop: 12 }}>
              Confirming your account…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
