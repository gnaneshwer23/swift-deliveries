// Production monitoring sink. Writes append-only rows to public.monitoring_events
// with the service role. Every helper here is fail-safe: monitoring must never
// break the request it is observing.

export type MonitoringKind =
  | "uptime_check"
  | "journey_error"
  | "client_error"
  | "server_error"
  | "payment_failure";

export type MonitoringSeverity = "info" | "warning" | "error" | "critical";

export type MonitoringEventInput = {
  kind: MonitoringKind;
  severity: MonitoringSeverity;
  source: string;
  message: string;
  route?: string | undefined;
  userId?: string | undefined;
  fingerprint?: string | undefined;
  detail?: Record<string, unknown> | undefined;
};

const MESSAGE_LIMIT = 2_000;
const DETAIL_LIMIT = 8_000;

function environment(): string {
  return process.env["NODE_ENV"] === "production" ? "production" : "preview";
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function safeDetail(detail: Record<string, unknown> | undefined): JsonValue {
  if (!detail) return {};
  try {
    const serialized = JSON.stringify(detail);
    if (serialized.length <= DETAIL_LIMIT) return JSON.parse(serialized) as JsonValue;
    return { truncated: true, preview: serialized.slice(0, DETAIL_LIMIT) };
  } catch {
    return { unserializable: true };
  }
}

export async function recordMonitoringEvent(input: MonitoringEventInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("monitoring_events").insert({
      kind: input.kind,
      severity: input.severity,
      environment: environment(),
      source: input.source,
      message: truncate(input.message || "Unknown error", MESSAGE_LIMIT),
      route: input.route ?? null,
      user_id: input.userId ?? null,
      fingerprint: input.fingerprint ?? null,
      detail: safeDetail(input.detail),
    });
    if (error) console.error("monitoring insert failed", error);
  } catch (error) {
    console.error("monitoring sink unavailable", error);
  }
}

export function describeUnknownError(error: unknown): { message: string; detail: Record<string, unknown> } {
  if (error instanceof Error) {
    return {
      message: `${error.name}: ${error.message}`,
      detail: { stack: error.stack?.slice(0, 4_000) ?? null },
    };
  }
  if (error instanceof Response) {
    return { message: `Response ${error.status}`, detail: { url: error.url } };
  }
  return { message: typeof error === "string" ? error : JSON.stringify(error ?? null), detail: {} };
}
