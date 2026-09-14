import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Shown while a route (including the client-only signed-in area) resolves.
 * Without it, protected pages render a blank screen until hydration finishes,
 * which reads as a timeout.
 */
function PendingComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div
          className="mx-auto size-6 animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ color: "var(--x-slate-light)" }}
          role="status"
          aria-label="Loading"
        />
        <p className="mt-4 text-xs" style={{ color: "var(--x-slate-light)" }}>
          Loading your workspace…
        </p>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingComponent,
    defaultPendingMs: 150,
    defaultPendingMinMs: 0,
  });

  return router;
};
