import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/organisation")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
