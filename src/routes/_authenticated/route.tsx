import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForSession } from "@/lib/auth-session";
import { myProfileQuery } from "@/lib/profile-queries";

import { safeProductRedirect } from "@/lib/product-journey";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location, context }) => {
    const user = await waitForSession();
    const redirectTarget = safeProductRedirect(location.href);
    if (!user) throw redirect({ to: "/login", search: { redirect: redirectTarget } });
    // Personalised setup happens once, before anything else.
    const profile = await context.queryClient.ensureQueryData(myProfileQuery);
    if (!profile && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding", search: { redirect: redirectTarget }, replace: true });
    }
    return { user, profile };
  },
  component: () => <Outlet />,
});
