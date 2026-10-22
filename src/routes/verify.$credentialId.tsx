import { createFileRoute, redirect } from "@tanstack/react-router";
/** Retired career-product link; legacy records are retained. */
export const Route = createFileRoute("/verify/$credentialId")({
  beforeLoad: () => {
    throw redirect({ to: "/resources", statusCode: 301 });
  },
});
