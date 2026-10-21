import { createFileRoute, redirect } from "@tanstack/react-router";

// RG-04: legacy `/login/forgot` link (seen in the QA report) forwards to the
// real password recovery page. Declared explicitly so that a bare `/login`
// keeps rendering the sign-in page.
export const Route = createFileRoute("/login/forgot")({
  beforeLoad: () => {
    throw redirect({ to: "/forgot-password", replace: true });
  },
});
