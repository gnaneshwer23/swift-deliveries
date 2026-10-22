import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CAREER_SUITE_ENABLED } from "@/lib/features";
import { piOnboardingQuery } from "@/lib/onboarding-queries";

export const Route = createFileRoute("/_authenticated/workspace")({
  // Career workspace is off unless its schema exists; otherwise nobody reaches it before setup.
  beforeLoad: async ({ context, location }) => {
    if (!CAREER_SUITE_ENABLED) throw redirect({ to: "/command" });
    if (location.pathname.startsWith("/career-onboarding")) return;
    const onboarding = await context.queryClient.ensureQueryData(piOnboardingQuery);
    if (!onboarding.state.completed) throw redirect({ to: "/career-onboarding", replace: true });
  },
  component: () => <Outlet />,
});
