import { createFileRoute, redirect } from "@tanstack/react-router";

/** Retired career-product URL. */
export const Route = createFileRoute("/resources/pm-portfolio")({
  beforeLoad: () => {
    throw redirect({ to: "/resources", statusCode: 301 });
  },
});
