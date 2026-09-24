import { createFileRoute, redirect } from "@tanstack/react-router";

// RG-04: legacy `/login/forgot` link (seen in the QA report) forwards to the
// real recovery page. Only sub-paths are caught here — a bare `/login` must
// keep rendering the sign-in page from `login.tsx`.
export const Route = createFileRoute("/login/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    if (splat.replace(/\/+$/, "").length === 0) {
      throw redirect({ to: "/login", replace: true });
    }
    throw redirect({ to: "/forgot-password", replace: true });
  },
});
