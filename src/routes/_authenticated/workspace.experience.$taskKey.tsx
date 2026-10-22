import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/experience/$taskKey")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
