/**
 * Workspace scoping for the workforce server functions (server only).
 *
 * Every mission handler resolves the caller's workspace with `ensureWorkspace`
 * and reads a mission only through `loadMissionBundle`, which filters by that
 * workspace. The database role bypasses row-level security, so these two
 * functions are the isolation boundary; `access.server.test.ts` exercises them
 * against a real database with two workspaces.
 */
import { wfDb, isMissingRelationError } from "@/lib/workforce/db";
import {
  decodePlanCapabilityMeta,
  decodeTaskCapabilityIds,
} from "@/lib/workforce/capability-persistence";
import type {
  ClarificationQuestion,
  DeliveryReport,
  EvidenceItem,
  MissionBundle,
  QualityLabel,
  WfApproval,
  WfArtefact,
  WfAuditEvent,
  WfMission,
  WfMissionPlan,
  WfMissionTask,
  WfProject,
  WfWorkspace,
} from "@/lib/workforce/types";

export type DbClient = { from: (table: string) => any };

/**
 * Service-role accessor for writes that must not be forgeable by workspace members
 * (usage, approvals, audit, permission/approval flags). Callers MUST authorise the
 * request via the user-scoped client first. Loaded lazily: *.functions.ts is bundled
 * for the client, so the service-role module must never be imported at top level.
 */
export async function adminDb() {
  const { neonDb } = await import("@/lib/db/neon.server");
  return wfDb(neonDb());
}

export function mapWorkspace(row: any): WfWorkspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    usageCeiling: row.usage_ceiling,
    usageConsumed: row.usage_consumed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProject(row: any): WfProject {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMission(row: any): WfMission {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    intent: row.intent,
    title: row.title,
    requestText: row.request_text,
    status: row.status,
    clarificationAnswers: (row.clarification_answers ?? {}) as Record<string, string>,
    permissionCeiling: row.permission_ceiling,
    externalActionsApproved: Boolean(row.external_actions_approved),
    deliveryReport: (row.delivery_report as DeliveryReport | null) ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPlan(row: any): WfMissionPlan {
  const rawCriteria = (row.acceptance_criteria ?? []) as string[];
  const fromColumns = {
    assigned: (row.assigned_capabilities ?? null) as WfMissionPlan["assignedCapabilities"] | null,
    limitations: (row.capability_limitations ?? null) as
      WfMissionPlan["capabilityLimitations"] | null,
  };
  const decoded = decodePlanCapabilityMeta(rawCriteria);
  return {
    id: row.id,
    missionId: row.mission_id,
    workspaceId: row.workspace_id,
    summary: row.summary,
    estimatedUsage: row.estimated_usage,
    requiredPermission: row.required_permission,
    includesExternalActions: Boolean(row.includes_external_actions),
    clarificationQuestions: (row.clarification_questions ?? []) as ClarificationQuestion[],
    acceptanceCriteria: decoded.criteria,
    assignedCapabilities: fromColumns.assigned ?? decoded.assignedCapabilities,
    capabilityLimitations: fromColumns.limitations ?? decoded.capabilityLimitations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTask(row: any): WfMissionTask {
  const rawDescription = row.description ?? "";
  const fromColumn = (row.capability_ids ?? null) as string[] | null;
  const decoded = decodeTaskCapabilityIds(rawDescription);
  return {
    id: row.id,
    missionId: row.mission_id,
    workspaceId: row.workspace_id,
    planId: row.plan_id ?? null,
    sortOrder: row.sort_order,
    title: row.title,
    description: decoded.description,
    acceptanceCriteria: row.acceptance_criteria ?? "",
    status: row.status,
    permissionRequired: row.permission_required,
    isExternal: Boolean(row.is_external),
    estimatedUsage: row.estimated_usage,
    actualUsage: row.actual_usage,
    evidenceNotes: (row.evidence_notes ?? []) as EvidenceItem[],
    capabilityIds: fromColumn ?? decoded.capabilityIds,
    key: decoded.meta?.key ?? `t${row.sort_order}`,
    dependsOn: decoded.meta?.dependsOn ?? [],
    stage: decoded.meta?.stage ?? null,
    gate: Boolean(decoded.meta?.gate),
    requiredSections: decoded.meta?.requiredSections ?? [],
    produces: decoded.meta?.produces ?? null,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapArtefact(row: any): WfArtefact {
  return {
    id: row.id,
    missionId: row.mission_id,
    workspaceId: row.workspace_id,
    taskId: row.task_id ?? null,
    kind: row.kind,
    title: row.title,
    content: row.content,
    contentFormat: row.content_format,
    qualityLabels: (row.quality_labels ?? []) as QualityLabel[],
    evidenceItems: (row.evidence_items ?? []) as EvidenceItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApproval(row: any): WfApproval {
  return {
    id: row.id,
    missionId: row.mission_id,
    workspaceId: row.workspace_id,
    kind: row.kind,
    status: row.status,
    decidedBy: row.decided_by ?? null,
    decidedAt: row.decided_at ?? null,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

export function mapAuditEvent(row: any): WfAuditEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    missionId: row.mission_id ?? null,
    actorId: row.actor_id ?? null,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id ?? null,
    createdAt: row.created_at,
  };
}

export async function audit(
  _db: ReturnType<typeof wfDb>,
  input: {
    workspaceId: string;
    missionId?: string | null;
    actorId: string;
    eventType: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await (await adminDb()).from("wf_audit_events").insert({
    workspace_id: input.workspaceId,
    mission_id: input.missionId ?? null,
    actor_id: input.actorId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function loadMissionBundle(
  supabase: DbClient,
  workspaceId: string,
  missionId: string,
): Promise<MissionBundle> {
  const db = wfDb(supabase);
  const missionRes = await db
    .from("wf_missions")
    .select("*")
    .eq("id", missionId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (missionRes.error) throw new Error(missionRes.error.message);
  if (!missionRes.data) throw new Error("Mission not found.");

  const [planRes, tasksRes, artefactsRes, approvalsRes, auditRes] = await Promise.all([
    db
      .from("wf_mission_plans")
      .select("*")
      .eq("mission_id", missionId)
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    db
      .from("wf_mission_tasks")
      .select("*")
      .eq("mission_id", missionId)
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true }),
    db
      .from("wf_artefacts")
      .select("*")
      .eq("mission_id", missionId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    db.from("wf_approvals").select("*").eq("mission_id", missionId).eq("workspace_id", workspaceId),
    db
      .from("wf_audit_events")
      .select("*")
      .eq("mission_id", missionId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (planRes.error) throw new Error(planRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (artefactsRes.error) throw new Error(artefactsRes.error.message);
  if (approvalsRes.error) throw new Error(approvalsRes.error.message);
  if (auditRes.error) throw new Error(auditRes.error.message);

  return {
    mission: mapMission(missionRes.data),
    plan: planRes.data ? mapPlan(planRes.data) : null,
    tasks: (tasksRes.data ?? []).map(mapTask),
    artefacts: (artefactsRes.data ?? []).map(mapArtefact),
    approvals: (approvalsRes.data ?? []).map(mapApproval),
    auditEvents: (auditRes.data ?? []).map(mapAuditEvent),
  };
}

export async function ensureWorkspace(
  supabase: DbClient,
  userId: string,
): Promise<{ workspace: WfWorkspace; storage: "supabase" }> {
  const db = wfDb(supabase);
  const existing = await db.from("wf_workspaces").select("*").eq("owner_id", userId).maybeSingle();

  if (existing.error && isMissingRelationError(existing.error)) {
    throw new Error(
      "Workforce tables are not available. Apply migration `workforce_command_centre` (see docs/prd-gap-analysis.md).",
    );
  }
  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    return { workspace: mapWorkspace(existing.data), storage: "supabase" };
  }

  const created = await (
    await adminDb()
  )
    .from("wf_workspaces")
    .insert({
      owner_id: userId,
      name: "Personal workspace",
      usage_ceiling: 100,
      usage_consumed: 0,
    })
    .select("*")
    .single();
  if (created.error) throw new Error(created.error.message);

  const member = await (await adminDb()).from("wf_workspace_members").insert({
    workspace_id: created.data.id,
    user_id: userId,
    role: "operator",
  });
  if (member.error) throw new Error(member.error.message);

  await audit(db, {
    workspaceId: created.data.id,
    actorId: userId,
    eventType: "workspace.created",
    entityType: "workspace",
    entityId: created.data.id,
  });

  return { workspace: mapWorkspace(created.data), storage: "supabase" };
}
