/**
 * Storage for product memory (migration 0028). Every function takes the
 * caller's query executor, so memory is written in the same transaction as the
 * artefact, decision or evidence it comes from, and is scoped to a workspace.
 */
import { createHash } from "node:crypto";
import type { Executor } from "@/lib/db/builder";
import {
  memoryMatchKey,
  type MemoryConflict,
  type MemoryDraft,
  type ProductMemoryEntry,
} from "./product-memory";

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

/** True once 0029 is applied. */
async function conflictsAvailable(query: Executor): Promise<boolean> {
  const [probe] = await query(`select to_regclass('wf_memory_conflicts') is not null as ok`, []);
  return Boolean(probe?.["ok"]);
}

function mapConflict(row: Record<string, unknown>): MemoryConflict {
  const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());
  return {
    id: row["id"] as string,
    projectId: row["project_id"] as string,
    entryLow: row["entry_low"] as string,
    entryHigh: row["entry_high"] as string,
    note: (row["note"] as string | null) ?? null,
    flaggedBy: row["flagged_by"] as string,
    createdAt: iso(row["created_at"])!,
    resolvedAt: iso(row["resolved_at"]),
    resolvedBy: (row["resolved_by"] as string | null) ?? null,
    resolution: (row["resolution"] as string | null) ?? null,
  };
}

/** A product's conflicts, open and resolved. Empty before 0029 is applied. */
export async function listConflicts(
  query: Executor,
  workspaceId: string,
  projectId: string,
): Promise<{ available: boolean; conflicts: MemoryConflict[] }> {
  if (!(await conflictsAvailable(query))) return { available: false, conflicts: [] };
  const rows = await query(
    `select * from wf_memory_conflicts
      where workspace_id = $1::uuid and project_id = $2::uuid
      order by created_at, id`,
    [workspaceId, projectId] as never,
  );
  return { available: true, conflicts: rows.map(mapConflict) };
}

/**
 * Marks two current entries of the same product as conflicting. Both entries
 * stay exactly as they are; the conflict is recorded beside them.
 */
export async function flagConflict(
  query: Executor,
  input: {
    workspaceId: string;
    projectId: string;
    entryA: string;
    entryB: string;
    note?: string | null;
    actorId: string;
  },
): Promise<MemoryConflict> {
  if (input.entryA === input.entryB) throw new Error("Choose two different entries.");
  if (!(await conflictsAvailable(query)))
    throw new Error("Conflicts need a database update that has not been applied yet.");
  const found = await query(
    `select id from wf_product_memory
      where workspace_id = $1::uuid and project_id = $2::uuid and retired_at is null
        and id = any($3::uuid[])
      for share`,
    [input.workspaceId, input.projectId, `{${input.entryA},${input.entryB}}`] as never,
  );
  if (found.length !== 2) throw new Error("Both entries must be current entries of this product.");
  const [low, high] = [input.entryA, input.entryB].sort();
  const rows = await query(
    `insert into wf_memory_conflicts (workspace_id, project_id, entry_low, entry_high, note, flagged_by)
     values ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6)
     on conflict (entry_low, entry_high) where resolved_at is null do nothing
     returning *`,
    [
      input.workspaceId,
      input.projectId,
      low,
      high,
      input.note?.trim() || null,
      input.actorId,
    ] as never,
  );
  if (!rows[0]) throw new Error("These entries are already marked as conflicting.");
  return mapConflict(rows[0]);
}

/** Records the founder's resolution. Both entries stay; nothing is merged or deleted. */
export async function resolveConflict(
  query: Executor,
  input: {
    workspaceId: string;
    projectId: string;
    conflictId: string;
    resolution: string;
    actorId: string;
  },
): Promise<void> {
  const resolution = input.resolution.trim();
  if (resolution.length < 3) throw new Error("Say how the conflict was resolved.");
  const rows = await query(
    `update wf_memory_conflicts set resolved_at = now(), resolved_by = $4, resolution = $5
      where id = $3::uuid and workspace_id = $1::uuid and project_id = $2::uuid
        and resolved_at is null
      returning id`,
    [input.workspaceId, input.projectId, input.conflictId, input.actorId, resolution] as never,
  );
  if (!rows[0]) throw new Error("Open conflict not found.");
}
