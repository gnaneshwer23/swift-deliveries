import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { waitForSession } from "@/lib/auth-session";

/**
 * Public landing point for email-confirmation and OAuth redirects. It exchanges
 * any `?code=` PKCE payload, waits for the session to hydrate, then routes to
 * Command Centre.
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

    void (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (active) setFailed(true);
            return;
          }
          // Drop the code from the address bar so a refresh cannot reuse it.
          url.searchParams.delete("code");
          url.searchParams.delete("state");
          window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
        }

        const session = await waitForSession();
        if (!active) return;
        if (!session) {
          setFailed(true);
          return;
        }
        navigate({ to: "/command", replace: true });
      } catch {
        if (active) setFailed(true);
      }
    })();

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
