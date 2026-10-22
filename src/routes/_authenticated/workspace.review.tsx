import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/review")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
