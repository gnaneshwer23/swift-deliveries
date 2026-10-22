import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired career-product URL. */
export const Route = createFileRoute("/professional-workspace")({
  beforeLoad: () => {
    throw redirect({ to: "/how-it-works", statusCode: 301 });
  },
});
