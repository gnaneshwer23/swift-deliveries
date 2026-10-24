import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/product-brain")({
  beforeLoad: () => {
    throw redirect({ to: "/psi", hash: "product-brain", statusCode: 301 });
  },
});
