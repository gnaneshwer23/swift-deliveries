import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired career-product URL. */
export const Route = createFileRoute("/pilot")({
  beforeLoad: () => {
    throw redirect({ to: "/signup", statusCode: 301 });
  },
});
