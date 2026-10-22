import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired career-product URL. */
export const Route = createFileRoute("/prove")({
  beforeLoad: () => {
    throw redirect({ to: "/how-it-works", statusCode: 301 });
  },
});
