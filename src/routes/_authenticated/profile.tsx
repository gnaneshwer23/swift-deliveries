import { createFileRoute, redirect } from "@tanstack/react-router";

/** Profile now lives in Settings; old links still land in the right place. */
export const Route = createFileRoute("/_authenticated/profile")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/profile", replace: true });
  },
});
