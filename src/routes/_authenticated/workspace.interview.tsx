import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/interview")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
