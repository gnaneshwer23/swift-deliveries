import { createFileRoute, redirect } from "@tanstack/react-router";

// RG-04: legacy `/login/forgot` link (seen in the QA report) now forwards to
// the real recovery page. The splat catches every unmatched /login/* path.
export const Route = createFileRoute("/login/$")({
  beforeLoad: () => {
    throw redirect({ to: "/forgot-password", replace: true });
  },
});
