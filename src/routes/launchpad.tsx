import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired career-product URL. */
export const Route = createFileRoute("/launchpad")({
  beforeLoad: () => {
    throw redirect({ to: "/resources", statusCode: 301 });
  },
});
