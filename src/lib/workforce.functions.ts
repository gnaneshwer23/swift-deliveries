import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { wfDb, isMissingRelationError } from "@/lib/workforce/db";
import { generateMissionPlan, deriveMissionTitle } from "@/lib/workforce/planner";
import {
  buildDeliveryReport,
  executeTaskStep,
  nextMissionStatusAfterRun,
} from "@/lib/workforce/executor";
import {
  decodePlanCapabilityMeta,
  decodeTaskCapabilityIds,
  encodePlanAcceptanceCriteria,
  encodeTaskDescription,
} from "@/lib/workforce/capability-persistence";
import type {
  ClarificationQuestion,
  DeliveryReport,
  EvidenceItem,
  MissionBundle,
  MissionIntent,
  PermissionLevel,
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

const intentSchema = z.enum(["investigate", "prototype", "improve"]);

type DbClient = { from: (table: string) => any };

/**
 * Service-role accessor for writes that must not be forgeable by workspace members
 * (usage, approvals, audit, permission/approval flags). Callers MUST authorise the
 * request via the user-scoped client first. Loaded lazily: *.functions.ts is bundled
 * for the client, so the service-role module must never be imported at top level.
 */
async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return wfDb(supabaseAdmin as unknown as { from: (table: string) => unknown });
}

function mapWorkspace(row: any): WfWorkspace {
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

function mapProject(row: any): WfProject {
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

function mapMission(row: any): WfMission {
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

function mapPlan(row: any): WfMissionPlan {
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

function mapTask(row: any): WfMissionTask {
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
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArtefact(row: any): WfArtefact {
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

function mapApproval(row: any): WfApproval {
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

function mapAuditEvent(row: any): WfAuditEvent {
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

async function audit(
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

async function loadMissionBundle(
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
    db.from("wf_mission_plans").select("*").eq("mission_id", missionId).maybeSingle(),
    db
      .from("wf_mission_tasks")
      .select("*")
      .eq("mission_id", missionId)
      .order("sort_order", { ascending: true }),
    db
      .from("wf_artefacts")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: true }),
    db.from("wf_approvals").select("*").eq("mission_id", missionId),
    db
      .from("wf_audit_events")
      .select("*")
      .eq("mission_id", missionId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (planRes.error) throw new Error(planRes.error.message);
  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (artefactsRes.error) throw new Error(artefactsRes.error.message);
  if (approvalsRes.error) throw new Error(approvalsRes.error.message);

  return {
    mission: mapMission(missionRes.data),
    plan: planRes.data ? mapPlan(planRes.data) : null,
    tasks: (tasksRes.data ?? []).map(mapTask),
    artefacts: (artefactsRes.data ?? []).map(mapArtefact),
    approvals: (approvalsRes.data ?? []).map(mapApproval),
    auditEvents: (auditRes.data ?? []).map(mapAuditEvent),
  };
}

async function ensureWorkspace(
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

export type CommandCentreBootstrap = {
  workspace: WfWorkspace;
  projects: WfProject[];
  recentMissions: WfMission[];
  storage: "supabase";
  permissionLadder: PermissionLevel[];
};

export const getCommandCentreBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommandCentreBootstrap> => {
    const { supabase, userId } = context;
    const { workspace, storage } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);

    const [projectsRes, missionsRes] = await Promise.all([
      db
        .from("wf_projects")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false }),
      db
        .from("wf_missions")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    if (projectsRes.error) throw new Error(projectsRes.error.message);
    if (missionsRes.error) throw new Error(missionsRes.error.message);

    return {
      workspace,
      projects: (projectsRes.data ?? []).map(mapProject),
      recentMissions: (missionsRes.data ?? []).map(mapMission),
      storage,
      permissionLadder: ["plan", "create", "execute_internally", "act_externally"],
    };
  });

export const createWfProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        name: z.string().min(2).max(120),
        description: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<WfProject> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();
    const inserted = await writeDb
      .from("wf_projects")
      .insert({
        workspace_id: workspace.id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (inserted.error) throw new Error(inserted.error.message);
    await audit(db, {
      workspaceId: workspace.id,
      actorId: userId,
      eventType: "project.created",
      entityType: "project",
      entityId: inserted.data.id,
      metadata: { name: data.name },
    });
    return mapProject(inserted.data);
  });

export const listWfProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WfProject[]> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const res = await db
      .from("wf_projects")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []).map(mapProject);
  });

export const createMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        intent: intentSchema,
        requestText: z.string().min(3).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const project = await db
      .from("wf_projects")
      .select("*")
      .eq("id", data.projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (project.error) throw new Error(project.error.message);
    if (!project.data) throw new Error("Project not found in this workspace.");

    const title = deriveMissionTitle(data.intent, data.requestText);
    const draftPlan = generateMissionPlan({
      intent: data.intent,
      requestText: data.requestText,
    });

    const needsClarification = draftPlan.tasks.length === 0;
    const status = needsClarification ? "needs_clarification" : "awaiting_approval";

    const missionIns = await writeDb
      .from("wf_missions")
      .insert({
        workspace_id: workspace.id,
        project_id: data.projectId,
        intent: data.intent,
        title,
        request_text: data.requestText.trim(),
        status,
        clarification_answers: {},
        permission_ceiling: "execute_internally",
        created_by: userId,
      })
      .select("*")
      .single();
    if (missionIns.error) throw new Error(missionIns.error.message);
    const mission = mapMission(missionIns.data);

    let plan: WfMissionPlan | null = null;
    let tasks: WfMissionTask[] = [];

    const planIns = await writeDb
      .from("wf_mission_plans")
      .insert({
        mission_id: mission.id,
        workspace_id: workspace.id,
        summary: draftPlan.summary,
        estimated_usage: draftPlan.estimatedUsage,
        required_permission: draftPlan.requiredPermission,
        includes_external_actions: draftPlan.includesExternalActions,
        clarification_questions: draftPlan.clarificationQuestions,
        acceptance_criteria: encodePlanAcceptanceCriteria(draftPlan),
      })
      .select("*")
      .single();
    if (planIns.error) throw new Error(planIns.error.message);
    plan = mapPlan(planIns.data);

    if (!needsClarification) {
      const taskRows = draftPlan.tasks.map((t, index) => ({
        mission_id: mission.id,
        workspace_id: workspace.id,
        plan_id: plan!.id,
        sort_order: index,
        title: t.title,
        description: encodeTaskDescription(t.description, t.capabilityIds),
        acceptance_criteria: t.acceptanceCriteria,
        status: "pending",
        permission_required: t.permissionRequired,
        is_external: t.isExternal,
        estimated_usage: t.estimatedUsage,
      }));
      const taskIns = await writeDb.from("wf_mission_tasks").insert(taskRows).select("*");
      if (taskIns.error) throw new Error(taskIns.error.message);
      tasks = (taskIns.data ?? []).map(mapTask);

      await writeDb.from("wf_approvals").insert({
        mission_id: mission.id,
        workspace_id: workspace.id,
        kind: "plan",
        status: "pending",
      });
    }

    await audit(db, {
      workspaceId: workspace.id,
      missionId: mission.id,
      actorId: userId,
      eventType: needsClarification ? "mission.needs_clarification" : "mission.planned",
      entityType: "mission",
      entityId: mission.id,
      metadata: { intent: data.intent },
    });

    const approvalsRes = await db.from("wf_approvals").select("*").eq("mission_id", mission.id);
    if (approvalsRes.error) throw new Error(approvalsRes.error.message);

    return {
      mission,
      plan,
      tasks,
      artefacts: [],
      approvals: (approvalsRes.data ?? []).map(mapApproval),
      auditEvents: [],
    };
  });

export const getMissionBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle & { workspace: WfWorkspace }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
    return { ...bundle, workspace };
  });

export const answerClarifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        answers: z.record(z.string()),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const missionRes = await db
      .from("wf_missions")
      .select("*")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (missionRes.error) throw new Error(missionRes.error.message);
    if (!missionRes.data) throw new Error("Mission not found.");
    const mission = mapMission(missionRes.data);

    const mergedAnswers = {
      ...mission.clarificationAnswers,
      ...Object.fromEntries(Object.entries(data.answers).map(([k, v]) => [k, v.trim()])),
    };

    const draftPlan = generateMissionPlan({
      intent: mission.intent as MissionIntent,
      requestText: mission.requestText,
      clarificationAnswers: mergedAnswers,
    });

    if (draftPlan.tasks.length === 0) {
      await writeDb
        .from("wf_missions")
        .update({
          clarification_answers: mergedAnswers,
          status: "needs_clarification",
          updated_at: new Date().toISOString(),
        })
        .eq("id", mission.id)
        .eq("workspace_id", workspace.id);

      await writeDb.from("wf_mission_plans").upsert(
        {
          mission_id: mission.id,
          workspace_id: workspace.id,
          summary: draftPlan.summary,
          estimated_usage: 0,
          required_permission: "plan",
          includes_external_actions: draftPlan.includesExternalActions,
          clarification_questions: draftPlan.clarificationQuestions,
          acceptance_criteria: encodePlanAcceptanceCriteria(draftPlan),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mission_id" },
      );

      return loadMissionBundle(supabase, workspace.id, mission.id);
    }

    await writeDb
      .from("wf_missions")
      .update({
        clarification_answers: mergedAnswers,
        status: "awaiting_approval",
        updated_at: new Date().toISOString(),
      })
      .eq("id", mission.id)
      .eq("workspace_id", workspace.id);

    const planUpsert = await writeDb
      .from("wf_mission_plans")
      .upsert(
        {
          mission_id: mission.id,
          workspace_id: workspace.id,
          summary: draftPlan.summary,
          estimated_usage: draftPlan.estimatedUsage,
          required_permission: draftPlan.requiredPermission,
          includes_external_actions: draftPlan.includesExternalActions,
          clarification_questions: draftPlan.clarificationQuestions,
          acceptance_criteria: encodePlanAcceptanceCriteria(draftPlan),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mission_id" },
      )
      .select("*")
      .single();
    if (planUpsert.error) throw new Error(planUpsert.error.message);

    await writeDb.from("wf_mission_tasks").delete().eq("mission_id", mission.id);
    const taskIns = await writeDb
      .from("wf_mission_tasks")
      .insert(
        draftPlan.tasks.map((t, index) => ({
          mission_id: mission.id,
          workspace_id: workspace.id,
          plan_id: planUpsert.data.id,
          sort_order: index,
          title: t.title,
          description: encodeTaskDescription(t.description, t.capabilityIds),
          acceptance_criteria: t.acceptanceCriteria,
          status: "pending",
          permission_required: t.permissionRequired,
          is_external: t.isExternal,
          estimated_usage: t.estimatedUsage,
        })),
      )
      .select("*");
    if (taskIns.error) throw new Error(taskIns.error.message);

    await writeDb.from("wf_approvals").delete().eq("mission_id", mission.id).eq("kind", "plan");
    await writeDb.from("wf_approvals").insert({
      mission_id: mission.id,
      workspace_id: workspace.id,
      kind: "plan",
      status: "pending",
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId: mission.id,
      actorId: userId,
      eventType: "mission.planned",
      entityType: "mission",
      entityId: mission.id,
    });

    return loadMissionBundle(supabase, workspace.id, mission.id);
  });

export const reviseMissionScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        requestText: z.string().min(3).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const missionRes = await db
      .from("wf_missions")
      .select("*")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (missionRes.error) throw new Error(missionRes.error.message);
    if (!missionRes.data) throw new Error("Mission not found.");
    const mission = mapMission(missionRes.data);

    const nextText = data.requestText.trim();
    const nextTitle = deriveMissionTitle(mission.intent, nextText);
    const draftPlan = generateMissionPlan({
      intent: mission.intent,
      requestText: nextText,
      clarificationAnswers: mission.clarificationAnswers,
    });

    const needsClarification = draftPlan.tasks.length === 0;
    const nextStatus = needsClarification ? "needs_clarification" : "awaiting_approval";
    const now = new Date().toISOString();

    await writeDb
      .from("wf_missions")
      .update({
        title: nextTitle,
        request_text: nextText,
        status: nextStatus,
        external_actions_approved: false,
        permission_ceiling: "execute_internally",
        updated_at: now,
      })
      .eq("id", mission.id)
      .eq("workspace_id", workspace.id);

    const planUpsert = await writeDb
      .from("wf_mission_plans")
      .upsert(
        {
          mission_id: mission.id,
          workspace_id: workspace.id,
          summary: draftPlan.summary,
          estimated_usage: draftPlan.estimatedUsage,
          required_permission: draftPlan.requiredPermission,
          includes_external_actions: draftPlan.includesExternalActions,
          clarification_questions: draftPlan.clarificationQuestions,
          acceptance_criteria: encodePlanAcceptanceCriteria(draftPlan),
          updated_at: now,
        },
        { onConflict: "mission_id" },
      )
      .select("*")
      .single();
    if (planUpsert.error) throw new Error(planUpsert.error.message);

    await writeDb.from("wf_mission_tasks").delete().eq("mission_id", mission.id);
    if (!needsClarification) {
      const taskIns = await writeDb
        .from("wf_mission_tasks")
        .insert(
          draftPlan.tasks.map((t, index) => ({
            mission_id: mission.id,
            workspace_id: workspace.id,
            plan_id: planUpsert.data.id,
            sort_order: index,
            title: t.title,
            description: encodeTaskDescription(t.description, t.capabilityIds),
            acceptance_criteria: t.acceptanceCriteria,
            status: "pending",
            permission_required: t.permissionRequired,
            is_external: t.isExternal,
            estimated_usage: t.estimatedUsage,
          })),
        )
        .select("*");
      if (taskIns.error) throw new Error(taskIns.error.message);
    }

    // Invalidate any prior approvals on scope change
    await writeDb.from("wf_approvals").delete().eq("mission_id", mission.id);
    if (!needsClarification) {
      await writeDb.from("wf_approvals").insert({
        mission_id: mission.id,
        workspace_id: workspace.id,
        kind: "plan",
        status: "pending",
        note: "Re-queued after operator scope revision",
      });
    }

    await audit(db, {
      workspaceId: workspace.id,
      missionId: mission.id,
      actorId: userId,
      eventType: "mission.scope_revised",
      entityType: "mission",
      entityId: mission.id,
      metadata: { needsClarification },
    });

    return loadMissionBundle(supabase, workspace.id, mission.id);
  });

export const rejectMissionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        note: z.string().max(400).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const missionRes = await db
      .from("wf_missions")
      .select("id")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (missionRes.error) throw new Error(missionRes.error.message);
    if (!missionRes.data) throw new Error("Mission not found.");

    const now = new Date().toISOString();
    await writeDb
      .from("wf_approvals")
      .update({
        status: "rejected",
        decided_by: userId,
        decided_at: now,
        note: data.note?.trim() || "Plan rejected by operator for revision",
      })
      .eq("mission_id", data.missionId)
      .eq("kind", "plan");

    await writeDb
      .from("wf_missions")
      .update({
        status: "draft",
        external_actions_approved: false,
        permission_ceiling: "execute_internally",
        updated_at: now,
      })
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id);

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.plan_rejected",
      entityType: "mission",
      entityId: data.missionId,
      metadata: { note: data.note?.trim() || null },
    });

    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const approveMissionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        approveExternalActions: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);

    const missionRes = await db
      .from("wf_missions")
      .select("*")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (missionRes.error) throw new Error(missionRes.error.message);
    if (!missionRes.data) throw new Error("Mission not found.");
    if (missionRes.data.status !== "awaiting_approval" && missionRes.data.status !== "planned") {
      throw new Error("This mission is not awaiting plan approval.");
    }

    const approveExternal = Boolean(data.approveExternalActions);
    const now = new Date().toISOString();

    await (
      await adminDb()
    )
      .from("wf_approvals")
      .update({
        status: "approved",
        decided_by: userId,
        decided_at: now,
        note: approveExternal ? "Plan + external actions approved" : "Plan approved",
      })
      .eq("mission_id", data.missionId)
      .eq("kind", "plan")
      .eq("status", "pending");

    if (approveExternal) {
      await (await adminDb()).from("wf_approvals").insert({
        mission_id: data.missionId,
        workspace_id: workspace.id,
        kind: "external_action",
        status: "approved",
        decided_by: userId,
        decided_at: now,
        note: "Operator approved Act externally for this mission",
      });
    }

    await (
      await adminDb()
    )
      .from("wf_missions")
      .update({
        status: "queued",
        external_actions_approved: approveExternal || missionRes.data.external_actions_approved,
        permission_ceiling: approveExternal ? "act_externally" : "execute_internally",
        updated_at: now,
      })
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id);

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.plan_approved",
      entityType: "mission",
      entityId: data.missionId,
      metadata: { approveExternal },
    });

    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const approveExternalActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const now = new Date().toISOString();

    const owned = await db
      .from("wf_missions")
      .select("id")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data) throw new Error("Mission not found.");

    await (await adminDb()).from("wf_approvals").insert({
      mission_id: data.missionId,
      workspace_id: workspace.id,
      kind: "external_action",
      status: "approved",
      decided_by: userId,
      decided_at: now,
    });

    await (
      await adminDb()
    )
      .from("wf_missions")
      .update({
        external_actions_approved: true,
        permission_ceiling: "act_externally",
        status: "queued",
        updated_at: now,
      })
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id);

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.external_approved",
      entityType: "mission",
      entityId: data.missionId,
    });

    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const runMissionStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(
    async ({
      context,
      data,
    }): Promise<MissionBundle & { workspace: WfWorkspace; done: boolean }> => {
      const { supabase, userId } = context;
      const { workspace } = await ensureWorkspace(supabase, userId);
      const db = wfDb(supabase);
      const writeDb = await adminDb();

      const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
      const { mission, tasks } = bundle;
      if (mission.workspaceId !== workspace.id) throw new Error("Mission not found.");

      const runnableStatuses = new Set(["queued", "running", "blocked"]);
      if (!runnableStatuses.has(mission.status)) {
        return { ...bundle, workspace, done: true };
      }

      const nextTask = tasks.find(
        (t) =>
          t.status === "pending" ||
          (t.status === "blocked" && mission.externalActionsApproved && t.isExternal),
      );

      if (!nextTask) {
        const finalStatus = nextMissionStatusAfterRun({ tasks, hitCeiling: false });
        const report = buildDeliveryReport({
          missionTitle: mission.title,
          intent: mission.intent,
          tasks,
          artefacts: bundle.artefacts,
          usageSpent: tasks.reduce((s, t) => s + t.actualUsage, 0),
          partial: finalStatus === "partially_completed" || finalStatus === "blocked",
        });
        await writeDb
          .from("wf_missions")
          .update({
            status: finalStatus,
            delivery_report: report,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);

        if (finalStatus === "completed" || finalStatus === "partially_completed") {
          await writeDb.from("wf_artefacts").insert({
            mission_id: mission.id,
            workspace_id: workspace.id,
            kind: "delivery_report",
            title: report.headline,
            content: `# ${report.headline}\n\n${report.summary}\n\n## Outcomes\n${report.outcomes.map((o) => `- ${o}`).join("\n")}\n\n## Open risks\n${report.openRisks.map((r) => `- ${r}`).join("\n")}\n\n## Usage spent\n${report.usageSpent} credits`,
            content_format: "markdown",
            quality_labels: report.qualitySummary,
            evidence_items: [],
          });
        }

        const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
        return { ...refreshed, workspace, done: true };
      }

      // Mark running
      if (mission.status === "queued" || mission.status === "blocked") {
        await writeDb
          .from("wf_missions")
          .update({ status: "running", updated_at: new Date().toISOString() })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);
      }
      await writeDb
        .from("wf_mission_tasks")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", nextTask.id);

      const liveWorkspace = (
        await db.from("wf_workspaces").select("*").eq("id", workspace.id).single()
      ).data;
      const budget = {
        ceiling: liveWorkspace?.usage_ceiling ?? workspace.usageCeiling,
        consumed: liveWorkspace?.usage_consumed ?? workspace.usageConsumed,
      };

      const result = executeTaskStep({
        mission: {
          ...mission,
          externalActionsApproved: mission.externalActionsApproved,
          permissionCeiling: mission.permissionCeiling,
        },
        task: { ...nextTask, status: "running" },
        budget,
      });

      if (!result.ok) {
        await writeDb
          .from("wf_mission_tasks")
          .update({
            status: "blocked",
            updated_at: new Date().toISOString(),
          })
          .eq("id", nextTask.id);

        const newStatus =
          result.reason === "ceiling_reached"
            ? "partially_completed"
            : result.reason === "external_approval_required"
              ? "blocked"
              : "blocked";

        if (result.reason === "ceiling_reached") {
          const completedTasks = tasks.map((t) => (t.id === nextTask.id ? result.task : t));
          const report = buildDeliveryReport({
            missionTitle: mission.title,
            intent: mission.intent,
            tasks: completedTasks,
            artefacts: bundle.artefacts,
            usageSpent: budget.consumed,
            partial: true,
          });
          await writeDb
            .from("wf_missions")
            .update({
              status: newStatus,
              delivery_report: report,
              updated_at: new Date().toISOString(),
            })
            .eq("id", mission.id)
            .eq("workspace_id", workspace.id);
        } else {
          await writeDb
            .from("wf_missions")
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq("id", mission.id)
            .eq("workspace_id", workspace.id);
        }

        await audit(db, {
          workspaceId: workspace.id,
          missionId: mission.id,
          actorId: userId,
          eventType: `mission.${result.reason}`,
          entityType: "task",
          entityId: nextTask.id,
        });

        const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
        return {
          ...refreshed,
          workspace: liveWorkspace ? mapWorkspace(liveWorkspace) : workspace,
          done: result.reason === "ceiling_reached",
        };
      }

      await writeDb
        .from("wf_mission_tasks")
        .update({
          status: "completed",
          actual_usage: result.usageCharged,
          evidence_notes: result.task.evidenceNotes,
          started_at: result.task.startedAt,
          completed_at: result.task.completedAt,
          updated_at: result.task.updatedAt,
        })
        .eq("id", nextTask.id);

      if (result.artefact) {
        await writeDb.from("wf_artefacts").insert({
          mission_id: result.artefact.missionId,
          workspace_id: result.artefact.workspaceId,
          task_id: result.artefact.taskId,
          kind: result.artefact.kind,
          title: result.artefact.title,
          content: result.artefact.content,
          content_format: result.artefact.contentFormat,
          quality_labels: result.artefact.qualityLabels,
          evidence_items: result.artefact.evidenceItems,
        });
      }

      if (result.usageCharged > 0) {
        await writeDb.from("wf_usage_records").insert({
          workspace_id: workspace.id,
          mission_id: mission.id,
          task_id: nextTask.id,
          amount: result.usageCharged,
          label: nextTask.title,
        });
        await writeDb
          .from("wf_workspaces")
          .update({
            usage_consumed: result.nextBudget.consumed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspace.id);
      }

      await audit(db, {
        workspaceId: workspace.id,
        missionId: mission.id,
        actorId: userId,
        eventType: "task.completed",
        entityType: "task",
        entityId: nextTask.id,
        metadata: { usage: result.usageCharged },
      });

      // If no pending tasks remain, close out
      const remaining = tasks.filter(
        (t) => t.id !== nextTask.id && (t.status === "pending" || t.status === "running"),
      );
      if (remaining.length === 0) {
        const updatedTasks = tasks.map((t) => (t.id === nextTask.id ? result.task : t));
        const artefactsRes = await db
          .from("wf_artefacts")
          .select("title, quality_labels")
          .eq("mission_id", mission.id);
        const report = buildDeliveryReport({
          missionTitle: mission.title,
          intent: mission.intent,
          tasks: updatedTasks,
          artefacts: (artefactsRes.data ?? []).map((a: any) => ({
            title: a.title,
            qualityLabels: a.quality_labels ?? [],
          })),
          usageSpent: updatedTasks.reduce((s, t) => s + t.actualUsage, 0),
          partial: false,
        });

        await writeDb
          .from("wf_missions")
          .update({
            status: "reviewing",
            delivery_report: report,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);

        await writeDb.from("wf_artefacts").insert({
          mission_id: mission.id,
          workspace_id: workspace.id,
          kind: "delivery_report",
          title: report.headline,
          content: `# ${report.headline}\n\n${report.summary}\n\n## Outcomes\n${report.outcomes.map((o) => `- ${o}`).join("\n")}\n\n## Open risks\n${report.openRisks.map((r) => `- ${r}`).join("\n")}\n\n## Usage spent\n${report.usageSpent} credits`,
          content_format: "markdown",
          quality_labels: report.qualitySummary,
          evidence_items: [],
        });

        await writeDb
          .from("wf_missions")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);

        const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
        const ws = await db.from("wf_workspaces").select("*").eq("id", workspace.id).single();
        return {
          ...refreshed,
          workspace: ws.data ? mapWorkspace(ws.data) : workspace,
          done: true,
        };
      }

      const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
      const ws = await db.from("wf_workspaces").select("*").eq("id", workspace.id).single();
      return {
        ...refreshed,
        workspace: ws.data ? mapWorkspace(ws.data) : workspace,
        done: false,
      };
    },
  );

export const markArtefactHumanReviewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        artefactId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const artRes = await db
      .from("wf_artefacts")
      .select("*")
      .eq("id", data.artefactId)
      .eq("mission_id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (artRes.error) throw new Error(artRes.error.message);
    if (!artRes.data) throw new Error("Artefact not found in this workspace.");

    const existingLabels = ((artRes.data.quality_labels ?? []) as QualityLabel[]).slice();
    if (!existingLabels.includes("human_reviewed")) {
      existingLabels.push("human_reviewed");
    }
    const now = new Date().toISOString();

    await writeDb
      .from("wf_artefacts")
      .update({
        quality_labels: existingLabels,
        updated_at: now,
      })
      .eq("id", data.artefactId)
      .eq("workspace_id", workspace.id);

    const missionRes = await db
      .from("wf_missions")
      .select("delivery_report")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (missionRes.data?.delivery_report) {
      const report = missionRes.data.delivery_report as DeliveryReport;
      const nextQual = Array.from(new Set([...(report.qualitySummary ?? []), "human_reviewed"]));
      await writeDb
        .from("wf_missions")
        .update({
          delivery_report: { ...report, qualitySummary: nextQual },
          updated_at: now,
        })
        .eq("id", data.missionId)
        .eq("workspace_id", workspace.id);
    }

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "artefact.human_reviewed",
      entityType: "artefact",
      entityId: data.artefactId,
    });

    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const resetWorkspacePreviewCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WfWorkspace> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();
    const now = new Date().toISOString();

    const updated = await writeDb
      .from("wf_workspaces")
      .update({
        usage_consumed: 0,
        updated_at: now,
      })
      .eq("id", workspace.id)
      .select("*")
      .single();
    if (updated.error) throw new Error(updated.error.message);

    await audit(db, {
      workspaceId: workspace.id,
      actorId: userId,
      eventType: "workspace.preview_credits_reset",
      entityType: "workspace",
      entityId: workspace.id,
    });

    return mapWorkspace(updated.data);
  });

export const cancelMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const owned = await db
      .from("wf_missions")
      .select("id")
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data) throw new Error("Mission not found.");

    await writeDb
      .from("wf_missions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id);
    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.cancelled",
      entityType: "mission",
      entityId: data.missionId,
    });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });
