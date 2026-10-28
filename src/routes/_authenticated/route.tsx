import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PilotContinuityClaim } from "@/components/pilot-continuity-claim";
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
    let profile;
    try {
      profile = await context.queryClient.ensureQueryData(myProfileQuery);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/unauthorized|sign in|auth/i.test(message)) {
        throw redirect({ to: "/login", search: { redirect: redirectTarget } });
      }
      throw error;
    }
    if (!profile && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding", search: { redirect: redirectTarget }, replace: true });
    }
    return { user, profile };
  },
  component: () => (
    <>
      <PilotContinuityClaim />
      <Outlet />
    </>
  ),
});
