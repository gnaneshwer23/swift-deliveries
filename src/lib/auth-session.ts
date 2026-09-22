import { supabase } from "@/integrations/supabase/client";

/** True when the current URL still carries auth tokens that must be consumed. */
function urlHasAuthPayload(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash ?? "";
  const search = window.location.search ?? "";
  return (
    hash.includes("access_token") ||
    hash.includes("refresh_token") ||
    hash.includes("type=") ||
    /[?&](code|token_hash)=/.test(search)
  );
}

/**
 * Resolves the browser session, giving the Supabase client time to consume the
 * tokens that an email-confirmation or OAuth redirect leaves in the URL.
 * Read-only: it never writes claims, evidence, scores or verification.
 */
export async function waitForSession(timeoutMs = 4000) {
  const first = await supabase.auth.getSession();
  if (first.data.session) return first.data.session;
  if (!urlHasAuthPayload()) return null;

  return new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(
    (resolve) => {
      let settled = false;
      const finish = (session: Parameters<typeof resolve>[0]) => {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        clearTimeout(timer);
        sub.subscription.unsubscribe();
        resolve(session);
      };

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) finish(session);
      });

      const poll = setInterval(() => {
        void supabase.auth.getSession().then(({ data }) => {
          if (data.session) finish(data.session);
        });
      }, 150);

      const timer = setTimeout(() => finish(null), timeoutMs);
    },
  );
}
