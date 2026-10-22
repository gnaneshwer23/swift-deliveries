import { useEffect, useState } from "react";
import { auth, AUTH_CHANGE_EVENT, type AppUser } from "@/lib/auth/client";

/**
 * Client-only session state for UI affordances (header, CTAs).
 * `loading` stays true until the first read resolves so SSR markup and the
 * first client render agree.
 */
export function useSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      void auth.getUser().then((u) => {
        if (!active) return;
        setUser(u);
        setLoading(false);
      });
    refresh();
    window.addEventListener(AUTH_CHANGE_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return { user, loading };
}
