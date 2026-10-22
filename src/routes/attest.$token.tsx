import { createFileRoute, redirect } from "@tanstack/react-router";
/** Retired career-product link; legacy records are retained. */
export const Route = createFileRoute("/attest/$token")({
  beforeLoad: () => {
    throw redirect({ to: "/resources", statusCode: 301 });
  },
});
