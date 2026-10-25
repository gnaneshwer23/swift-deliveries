import { safeProductRedirect } from "@/lib/product-journey";
import { createFileRoute, redirect } from "@tanstack/react-router";

// RG-04: legacy `/login/forgot` link (seen in the QA report) forwards to the
// real password recovery page. Declared explicitly so that a bare `/login`
// keeps rendering the sign-in page.
export const Route = createFileRoute("/login/forgot")({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: "/forgot-password",
      search: {
        redirect: safeProductRedirect(new URLSearchParams(location.searchStr).get("redirect")),
      },
      replace: true,
    });
  },
});
