import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { piOnboardingQuery } from "@/lib/onboarding-queries";

export const Route = createFileRoute("/_authenticated/workspace")({
  // Nobody reaches the workspace before setup is finished.
  beforeLoad: async ({ context, location }) => {
    if (location.pathname.startsWith("/onboarding")) return;
    const onboarding = await context.queryClient.ensureQueryData(piOnboardingQuery);
    if (!onboarding.state.completed) throw redirect({ to: "/onboarding", replace: true });
  },
  component: () => <Outlet />,
});
