/**
 * A fingerprint of everything an owner sees and approves in a plan: the
 * request, summary, usage estimate, permission, and each task's place in the
 * graph, specialists, permission, outside action and cost. An approval stores
 * the version and fingerprint it was given; any change produces a new pair, so
 * an old approval can never authorise a different plan.
 */
import { createHash } from "node:crypto";
import type { GeneratedPlan } from "./types";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function planHash(input: {
  requestText: string;
  plan: Pick<
    GeneratedPlan,
    "summary" | "estimatedUsage" | "requiredPermission" | "includesExternalActions" | "tasks"
  >;
}): string {
  const body = canonical({
    requestText: input.requestText.trim(),
    summary: input.plan.summary,
    estimatedUsage: input.plan.estimatedUsage,
    requiredPermission: input.plan.requiredPermission,
    includesExternalActions: input.plan.includesExternalActions,
    tasks: input.plan.tasks.map((t) => ({
      key: t.key,
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria,
      dependsOn: t.dependsOn ?? [],
      capabilityIds: t.capabilityIds,
      permissionRequired: t.permissionRequired,
      isExternal: t.isExternal,
      estimatedUsage: t.estimatedUsage,
      gate: Boolean(t.gate),
      produces: t.produces ?? null,
    })),
  });
  return `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;
}
