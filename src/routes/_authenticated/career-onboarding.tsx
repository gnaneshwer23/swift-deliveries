import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/career-onboarding")({
  beforeLoad: () => {
    throw redirect({ to: "/onboarding", replace: true });
  },
});
