import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { JsonValue } from "@/lib/monitoring.server";

export type MonitoringEventRow = {
  id: string;
  occurred_at: string;
  kind: string;
  severity: string;
  environment: string;
  source: string;
  route: string | null;
  message: string;
  detail: JsonValue;
};

export type MonitoringOverview = {
  canView: boolean;
  lastUptimeCheck: MonitoringEventRow | null;
  counts: { kind: string; total: number }[];
  events: MonitoringEventRow[];
};

const EMPTY: MonitoringOverview = { canView: false, lastUptimeCheck: null, counts: [], events: [] };

/** Read-only monitoring feed. Visible to admins and moderators only (RLS enforced). */
export const getMonitoringOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MonitoringOverview> => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const canView = (roles ?? []).some((row) => row.role === "admin" || row.role === "moderator");
    if (!canView) return EMPTY;

    const { data, error } = await supabase
      .from("monitoring_events")
      .select("id, occurred_at, kind, severity, environment, source, route, message, detail")
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const events = (data ?? []) as unknown as MonitoringEventRow[];
    const tally = new Map<string, number>();
    for (const event of events) tally.set(event.kind, (tally.get(event.kind) ?? 0) + 1);

    return {
      canView: true,
      lastUptimeCheck: events.find((event) => event.kind === "uptime_check") ?? null,
      counts: [...tally.entries()].map(([kind, total]) => ({ kind, total })),
      events,
    };
  });
