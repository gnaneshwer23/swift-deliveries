import { createFileRoute } from "@tanstack/react-router";

// Wakes the mission worker: recovers expired leases, then runs mission steps
// until the time budget is spent. Called by the scheduler with
// `Authorization: Bearer $CRON_SECRET`; refuses everything else.
const BUDGET_MS = 50_000;

async function authorised(request: Request): Promise<Response | null> {
  const secret = process.env["CRON_SECRET"];
  if (!secret) return new Response("Worker tick is not configured.", { status: 503 });
  const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(digest(token), digest(secret))
    ? null
    : new Response("Unauthorized", { status: 401 });
}

async function tick(request: Request): Promise<Response> {
  const refused = await authorised(request);
  if (refused) return refused;
  const { runWorkerTick } = await import("@/lib/workforce/worker.server");
  const result = await runWorkerTick({ deadline: Date.now() + BUDGET_MS });
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/worker/tick")({
  server: {
    handlers: {
      GET: ({ request }) => tick(request),
      POST: ({ request }) => tick(request),
    },
  },
});
