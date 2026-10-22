import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/experience")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
