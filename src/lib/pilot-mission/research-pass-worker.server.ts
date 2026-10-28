/**
 * Durable post-approval research pass — not tied to a single browser request.
 * `approvePlan` persists approval + queue; this module runs queued passes from worker tick or mission reload.
 */
import { createMissionStore } from "./repository.server";
import { SupervisedMissionService } from "./service";
import type { SupervisedMission } from "./types";

function isResearchPassPending(mission: SupervisedMission): boolean {
  return Boolean(mission.researchPassQueuedAt && !mission.researchPassCompletedAt);
}

/** Best-effort batch for `/api/worker/tick` — bounded, no fake completion. */
export async function drainQueuedResearchPasses(input: {
  deadlineMs: number;
  limit?: number;
}): Promise<{ attempted: number; completed: number }> {
  const limit = input.limit ?? 5;
  let attempted = 0;
  let completed = 0;
  try {
    const { neonDb } = await import("@/lib/db/neon.server");
    const db = await neonDb();
    const res = await db
      .from("psi_supervised_missions")
      .select("workspace_id, id, document, updated_at")
      .order("updated_at", { ascending: false })
      .limit(40);
    if (res.error) return { attempted, completed };
    const rows = (res.data ?? []) as Record<string, unknown>[];
    const pending = rows.flatMap((row) => {
      const doc = row["document"];
      const mission =
        typeof doc === "string"
          ? (JSON.parse(doc) as SupervisedMission)
          : (doc as SupervisedMission | null);
      if (!mission || !isResearchPassPending(mission)) return [];
      return [
        {
          workspaceId: String(row["workspace_id"]),
          id: String(row["id"]),
        },
      ];
    });
    const service = new SupervisedMissionService(createMissionStore(db));
    const workerId = `worker-tick-${Date.now()}`;
    for (const row of pending.slice(0, limit)) {
      if (Date.now() > input.deadlineMs - 5_000) break;
      attempted += 1;
      try {
        const after = await service.runQueuedResearchPass({
          workspaceId: row.workspaceId,
          id: row.id,
          workerId,
          nowMs: Date.now(),
        });
        if (after.researchPassCompletedAt) completed += 1;
      } catch (error) {
        console.error("Queued research pass failed", row.id, error);
      }
    }
  } catch (error) {
    console.error("Research pass drain unavailable", error);
  }
  return { attempted, completed };
}
