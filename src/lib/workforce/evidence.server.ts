/**
 * Storage for founder-supplied mission evidence (migration 0027). Every
 * function takes the transaction's query executor and is scoped to a
 * workspace, so a mission in another workspace is never read or written.
 */
import { createHash } from "node:crypto";
import type { Executor } from "@/lib/db/builder";
import {
  MAX_EVIDENCE_ITEMS,
  normaliseTitle,
  type EvidenceList,
  type EvidenceReading,
  type WfEvidence,
} from "./evidence";
import { appendEvent, lockMission, TERMINAL } from "./plan-store.server";

export function mapEvidence(row: Record<string, unknown>): WfEvidence {
  return {
    id: row["id"] as string,
    missionId: row["mission_id"] as string,
    kind: row["kind"] as WfEvidence["kind"],
    title: row["title"] as string,
    status: row["status"] as WfEvidence["status"],
    unreadableReason: (row["unreadable_reason"] as string | null) ?? null,
    content: (row["content"] as string | null) ?? null,
    fileName: (row["file_name"] as string | null) ?? null,
    mediaType: (row["media_type"] as string | null) ?? null,
    byteSize: row["byte_size"] == null ? null : Number(row["byte_size"]),
    contentSha256: (row["content_sha256"] as string | null) ?? null,
    containsIdentifiers: Boolean(row["contains_identifiers"]),
    suppliedBy: row["supplied_by"] as string,
    createdAt: new Date(row["created_at"] as string).toISOString(),
  };
}

/** A mission's current evidence, oldest first. `available` is false before 0027 is applied. */
export async function listEvidence(
  query: Executor,
  workspaceId: string,
  missionId: string,
): Promise<EvidenceList> {
  // Checked first rather than caught: a failed statement would abort the caller's transaction.
  const [probe] = await query(`select to_regclass('wf_mission_evidence') is not null as ok`, []);
  if (!probe?.["ok"]) return { available: false, items: [] };
  const rows = await query(
    `select * from wf_mission_evidence
      where workspace_id = $1::uuid and mission_id = $2::uuid and removed_at is null
      order by created_at, id`,
    [workspaceId, missionId] as never,
  );
  return { available: true, items: rows.map(mapEvidence) };
}

export type AddEvidenceInput = {
  workspaceId: string;
  missionId: string;
  actorId: string;
  kind: "note" | "file";
  title: string;
  reading: EvidenceReading;
  file?: { name: string; mediaType: string; byteSize: number };
};

/** Records one piece of evidence, readable or not, and logs it on the mission. */
export async function addEvidence(query: Executor, input: AddEvidenceInput): Promise<WfEvidence> {
  const title = normaliseTitle(input.title);
  if (title.length < 3 || title.length > 120)
    throw new Error("Give the evidence a title between 3 and 120 characters.");
  const locked = await lockMission(query, input.workspaceId, input.missionId);
  if (TERMINAL.includes(locked.status))
    throw new Error("This mission has finished; evidence can no longer be added.");
  const current = await query(
    `select lower(title) as t from wf_mission_evidence
      where mission_id = $1::uuid and removed_at is null`,
    [input.missionId] as never,
  );
  if (current.length >= MAX_EVIDENCE_ITEMS)
    throw new Error(`A mission can hold up to ${MAX_EVIDENCE_ITEMS} pieces of evidence.`);
  if (current.some((r) => r["t"] === title.toLowerCase()))
    throw new Error(
      "Another piece of evidence already has this title. Titles are how roles cite it.",
    );

  const r = input.reading;
  const content = r.status === "readable" ? r.content : null;
  const rows = await query(
    `insert into wf_mission_evidence
       (workspace_id, mission_id, kind, title, status, unreadable_reason, content, file_name,
        media_type, byte_size, content_sha256, contains_identifiers, supplied_by)
     values ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::int, $11, $12::boolean, $13)
     returning *`,
    [
      input.workspaceId,
      input.missionId,
      input.kind,
      title,
      r.status,
      r.status === "unreadable" ? r.reason : null,
      content,
      input.file?.name ?? null,
      input.file?.mediaType || null,
      input.file?.byteSize ?? null,
      content === null ? null : createHash("sha256").update(content).digest("hex"),
      r.status === "readable" && r.containsIdentifiers,
      input.actorId,
    ] as never,
  );
  const saved = mapEvidence(rows[0]!);
  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: input.missionId,
    type: "evidence.added",
    actorKind: "user",
    actorId: input.actorId,
    data: {
      evidenceId: saved.id,
      title: saved.title,
      kind: saved.kind,
      status: saved.status,
      ...(saved.unreadableReason ? { reason: saved.unreadableReason } : {}),
      ...(saved.containsIdentifiers ? { withheldFromModel: true } : {}),
    },
  });
  return saved;
}

/** Removes evidence from the mission. The row stays as provenance for anything already written. */
export async function removeEvidence(
  query: Executor,
  input: { workspaceId: string; missionId: string; evidenceId: string; actorId: string },
): Promise<void> {
  const locked = await lockMission(query, input.workspaceId, input.missionId);
  if (TERMINAL.includes(locked.status))
    throw new Error("This mission has finished; its evidence is kept as the record.");
  const rows = await query(
    `update wf_mission_evidence set removed_at = now(), removed_by = $4
      where id = $3::uuid and mission_id = $2::uuid and workspace_id = $1::uuid
        and removed_at is null
      returning title`,
    [input.workspaceId, input.missionId, input.evidenceId, input.actorId] as never,
  );
  if (!rows[0]) throw new Error("Evidence not found.");
  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: input.missionId,
    type: "evidence.removed",
    actorKind: "user",
    actorId: input.actorId,
    data: { evidenceId: input.evidenceId, title: rows[0]["title"] as string },
  });
}
