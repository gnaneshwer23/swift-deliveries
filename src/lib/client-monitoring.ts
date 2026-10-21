// Browser-side capture of critical client errors and broken journeys.
// Sends compact reports to /api/public/monitoring/client-error with
// de-duplication and a per-session cap so a render loop cannot flood the sink.

const ENDPOINT = "/api/public/monitoring/client-error";
const MAX_REPORTS_PER_SESSION = 20;
const DEDUPE_WINDOW_MS = 60_000;

let installed = false;
let sent = 0;
const seen = new Map<string, number>();

type ClientReport = {
  kind: "client_error" | "journey_error";
  message: string;
  stack?: string | undefined;
  route: string;
  detail?: Record<string, unknown> | undefined;
};

function shouldSend(key: string): boolean {
  if (sent >= MAX_REPORTS_PER_SESSION) return false;
  const now = Date.now();
  const last = seen.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
  seen.set(key, now);
  return true;
}

export function reportClientIssue(report: ClientReport): void {
  if (typeof window === "undefined") return;
  const message = (report.message || "Unknown client error").slice(0, 1_000);
  if (!shouldSend(`${report.kind}:${report.route}:${message}`)) return;
  sent += 1;

  const body = JSON.stringify({
    kind: report.kind,
    message,
    route: report.route,
    stack: report.stack?.slice(0, 4_000),
    userAgent: navigator.userAgent.slice(0, 300),
    detail: report.detail ?? {},
  });

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Monitoring must never surface an error of its own.
  });
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (error instanceof Response) return `Response ${error.status}`;
  return typeof error === "string" ? error : "Unknown client error";
}

export function installClientMonitoring(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  const onError = (event: ErrorEvent) => {
    reportClientIssue({
      kind: "client_error",
      message: messageOf(event.error ?? event.message),
      stack: event.error instanceof Error ? event.error.stack : undefined,
      route: window.location.pathname,
      detail: { filename: event.filename, line: event.lineno, column: event.colno },
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    reportClientIssue({
      kind: "client_error",
      message: messageOf(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
      route: window.location.pathname,
      detail: { unhandledRejection: true },
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    installed = false;
  };
}
