import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { recordMonitoringEvent } from "@/lib/monitoring.server";

const payloadSchema = z.object({
  kind: z.enum(["client_error", "journey_error"]),
  message: z.string().min(1).max(1_000),
  route: z.string().max(300).default("/"),
  stack: z.string().max(4_000).optional(),
  userAgent: z.string().max(300).optional(),
  detail: z.record(z.unknown()).optional(),
});

const BODY_LIMIT = 16_000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // keepalive beacons may omit it
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "deliverx.dev" ||
      hostname.endsWith(".deliverx.dev") ||
      hostname.endsWith(".lovable.app")
    );
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/monitoring/client-error")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!allowedOrigin(request)) return new Response("Forbidden", { status: 403 });

        const clientKey =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for") ??
          "unknown";
        if (rateLimited(clientKey)) return new Response("Too many reports", { status: 429 });

        const raw = await request.text();
        if (raw.length > BODY_LIMIT) return new Response("Payload too large", { status: 413 });

        let parsed: z.infer<typeof payloadSchema>;
        try {
          parsed = payloadSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        await recordMonitoringEvent({
          kind: parsed.kind,
          severity: parsed.kind === "journey_error" ? "critical" : "error",
          source: "browser",
          message: parsed.message,
          route: parsed.route,
          fingerprint: `${parsed.route}|${parsed.message.slice(0, 120)}`,
          detail: {
            ...(parsed.detail ?? {}),
            ...(parsed.stack ? { stack: parsed.stack } : {}),
            ...(parsed.userAgent ? { userAgent: parsed.userAgent } : {}),
          },
        });

        return new Response(null, { status: 204 });
      },
    },
  },
});
