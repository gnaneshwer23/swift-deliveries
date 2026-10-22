import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/projects")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
