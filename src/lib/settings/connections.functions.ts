/**
 * Settings → Connections. See connections.server.ts: only booleans, provider and model names,
 * and configuration problems (variable names, never values) leave the server.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import type { ConnectionsSummary } from "./connections";

export const getConnections = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async (): Promise<ConnectionsSummary> => {
    const { readConnections } = await import("./connections.server");
    return readConnections();
  });
