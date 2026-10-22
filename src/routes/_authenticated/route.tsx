import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { waitForSession } from "@/lib/auth-session";
import { dxProfileOf } from "@/lib/dx-profile";

const ONBOARDING_PATHS = ["/onboarding", "/career-onboarding"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Give tokens arriving in the URL (email confirmation, OAuth) time to land
    // before deciding that nobody is signed in.
    const session = await waitForSession();
    const redirectTarget = location.pathname.startsWith("/") ? location.pathname : "/command";
    if (!session) throw redirect({ to: "/login", search: { redirect: redirectTarget } });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login", search: { redirect: redirectTarget } });
    // Personalised setup happens once, before anything else.
    if (!dxProfileOf(data.user) && !ONBOARDING_PATHS.some((p) => location.pathname.startsWith(p))) {
      throw redirect({ to: "/onboarding", replace: true });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
