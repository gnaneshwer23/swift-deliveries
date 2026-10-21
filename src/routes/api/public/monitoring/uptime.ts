import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { recordMonitoringEvent, describeUnknownError } from "@/lib/monitoring.server";

// Scheduled uptime + journey probe. Fetches the pages a visitor and a buyer
// need, plus the health endpoint, and records one row per run.
const PROBES = ["/", "/pricing", "/experience", "/launchpad", "/login"] as const;

type ProbeResult = { path: string; status: number; ok: boolean; ms: number; error?: string };

async function probe(origin: string, path: string): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const response = await fetch(new URL(path, origin), {
      headers: { "user-agent": "DeliverX-uptime-probe" },
      redirect: "manual",
    });
    const ok = response.status < 400 || response.status === 405;
    return { path, status: response.status, ok, ms: Date.now() - started };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      error: describeUnknownError(error).message,
    };
  }
}

export const Route = createFileRoute("/api/public/monitoring/uptime")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;

        const origin = new URL(request.url).origin;
        const results = await Promise.all([
          ...PROBES.map((path) => probe(origin, path)),
          probe(origin, "/api/public/monitoring/health"),
        ]);
        const failures = results.filter((result) => !result.ok);

        await recordMonitoringEvent({
          kind: "uptime_check",
          severity: failures.length === 0 ? "info" : failures.length > 2 ? "critical" : "error",
          source: "scheduled_probe",
          message:
            failures.length === 0
              ? `All ${results.length} journeys responded`
              : `${failures.length} of ${results.length} journeys failed: ${failures
                  .map((f) => `${f.path} (${f.status || "no response"})`)
                  .join(", ")}`,
          detail: { results },
        });

        return Response.json(
          { status: failures.length === 0 ? "ok" : "failing", results },
          { status: failures.length === 0 ? 200 : 503, headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
