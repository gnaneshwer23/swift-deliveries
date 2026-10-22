import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForSession } from "@/lib/auth-session";
import { myProfileQuery } from "@/lib/profile-queries";

const ONBOARDING_PATHS = ["/onboarding", "/career-onboarding"];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location, context }) => {
    const user = await waitForSession();
    const redirectTarget = location.pathname.startsWith("/") ? location.pathname : "/command";
    if (!user) throw redirect({ to: "/login", search: { redirect: redirectTarget } });
    // Personalised setup happens once, before anything else.
    const profile = await context.queryClient.ensureQueryData(myProfileQuery).catch(() => null);
    if (!profile && !ONBOARDING_PATHS.some((p) => location.pathname.startsWith(p))) {
      throw redirect({ to: "/onboarding", replace: true });
    }
    return { user, profile };
  },
  component: () => <Outlet />,
});
