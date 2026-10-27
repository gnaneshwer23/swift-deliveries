/**
 * Storage for product memory (migration 0028). Every function takes the
 * caller's query executor, so memory is written in the same transaction as the
 * artefact, decision or evidence it comes from, and is scoped to a workspace.
 */
import { createHash } from "node:crypto";
import type { Executor } from "@/lib/db/builder";
import { memoryMatchKey, type MemoryDraft, type ProductMemoryEntry } from "./product-memory";

/** True once 0028 is applied. Checked rather than caught, so a caller's transaction survives. */
export async function memoryAvailable(query: Executor): Promise<boolean> {
  const [probe] = await query(`select to_regclass('wf_product_memory') is not null as ok`, []);
  return Boolean(probe?.["ok"]);
}

function mapEntry(row: Record<string, unknown>): ProductMemoryEntry {
  const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());
  return {
    id: row["id"] as string,
    projectId: row["project_id"] as string,
    kind: row["kind"] as ProductMemoryEntry["kind"],
    statement: row["statement"] as string,
    citation: (row["citation"] as string | null) ?? null,
    refKey: (row["ref_key"] as string | null) ?? null,
    originKind: row["origin_kind"] as ProductMemoryEntry["originKind"],
    originId: row["origin_id"] as string,
    firstMissionId: (row["first_mission_id"] as string | null) ?? null,
    lastMissionId: (row["last_mission_id"] as string | null) ?? null,
    firstSeenAt: iso(row["first_seen_at"])!,
    lastSeenAt: iso(row["last_seen_at"])!,
    timesSeen: Number(row["times_seen"]),
    retiredAt: iso(row["retired_at"]),
    retiredReason: (row["retired_reason"] as string | null) ?? null,
  };
}

/** A product's memory, current and retired, newest first. Empty before 0028 is applied. */
export async function listProductMemory(
  query: Executor,
  workspaceId: string,
  projectId: string,
): Promise<{ available: boolean; entries: ProductMemoryEntry[] }> {
  if (!(await memoryAvailable(query))) return { available: false, entries: [] };
  const rows = await query(
    `select * from wf_product_memory
      where workspace_id = $1::uuid and project_id = $2::uuid
      order by last_seen_at desc, id`,
    [workspaceId, projectId] as never,
  );
  return { available: true, entries: rows.map(mapEntry) };
}

export type MemoryOrigin = {
  workspaceId: string;
  projectId: string;
  missionId: string;
  originKind: "evidence" | "artefact" | "gate";
  originId: string;
};

/**
 * Records entries, or marks them seen again when an identical current entry
 * exists. Returns how many were new.
 */
export async function recordMemory(
  query: Executor,
  origin: MemoryOrigin,
  drafts: readonly MemoryDraft[],
): Promise<number> {
  if (!drafts.length || !(await memoryAvailable(query))) return 0;
  let added = 0;
  for (const d of drafts) {
    const hash = createHash("sha256").update(memoryMatchKey(d)).digest("hex");
    const rows = await query(
      `insert into wf_product_memory
         (workspace_id, project_id, kind, statement, citation, ref_key, statement_hash,
          origin_kind, origin_id, first_mission_id, last_mission_id)
       values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::uuid, $10::uuid)
       on conflict (project_id, kind, statement_hash) where retired_at is null
       do update set last_seen_at = now(), times_seen = wf_product_memory.times_seen + 1,
         last_mission_id = excluded.last_mission_id
       returning (xmax = 0) as inserted`,
      [
        origin.workspaceId,
        origin.projectId,
        d.kind,
        d.statement,
        d.citation,
        d.refKey,
        hash,
        origin.originKind,
        origin.originId,
        origin.missionId,
      ] as never,
    );
    if (rows[0]?.["inserted"]) added += 1;
  }
  return added;
}

/**
 * Retires the source entry for removed evidence, unless another current piece
 * of evidence in the same product still has that title.
 */
export async function retireEvidenceSource(
  query: Executor,
  input: { workspaceId: string; projectId: string; title: string },
): Promise<void> {
  if (!(await memoryAvailable(query))) return;
  await query(
    `update wf_product_memory m set retired_at = now(), retired_reason = 'evidence removed'
      where m.workspace_id = $1::uuid and m.project_id = $2::uuid and m.kind = 'source'
        and lower(m.statement) = lower($3) and m.retired_at is null
        and not exists (
          select 1 from wf_mission_evidence e join wf_missions mi on mi.id = e.mission_id
           where mi.project_id = $2::uuid and e.workspace_id = $1::uuid
             and e.removed_at is null and e.status = 'readable'
             and lower(e.title) = lower($3))`,
    [input.workspaceId, input.projectId, input.title] as never,
  );
}
