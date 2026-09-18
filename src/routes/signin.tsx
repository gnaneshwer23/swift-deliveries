import { createFileRoute, redirect } from "@tanstack/react-router";

/** Inbound links from older material use /signin; the sign-in page lives at /login. */
export const Route = createFileRoute("/signin")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
