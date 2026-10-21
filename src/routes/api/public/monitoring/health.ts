import { createFileRoute } from "@tanstack/react-router";
import { recordMonitoringEvent, describeUnknownError } from "@/lib/monitoring.server";

// Uptime probe for external monitors. Returns 200 only when the server can
// reach the database; 503 otherwise. Never exposes internal details.
async function checkDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("monitoring_events")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw new Error(error.message);
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: describeUnknownError(error).message,
    };
  }
}

export const Route = createFileRoute("/api/public/monitoring/health")({
  server: {
    handlers: {
      GET: async () => {
        const database = await checkDatabase();
        if (!database.ok) {
          await recordMonitoringEvent({
            kind: "uptime_check",
            severity: "critical",
            source: "health_endpoint",
            message: "Health check failed: database unreachable",
            detail: { latencyMs: database.latencyMs, error: database.error },
          });
        }
        return Response.json(
          {
            status: database.ok ? "ok" : "degraded",
            checks: { database: { ok: database.ok, latencyMs: database.latencyMs } },
            checkedAt: new Date().toISOString(),
          },
          {
            status: database.ok ? 200 : 503,
            headers: { "cache-control": "no-store" },
          },
        );
      },
    },
  },
});
