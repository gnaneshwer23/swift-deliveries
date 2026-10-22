import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workspace/capability")({
  beforeLoad: () => {
    throw redirect({ to: "/command", replace: true });
  },
});
