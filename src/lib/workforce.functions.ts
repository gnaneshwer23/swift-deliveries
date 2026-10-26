import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { wfDb } from "@/lib/workforce/db";
import {
  adminDb,
  audit,
  ensureWorkspace,
  loadMissionBundle,
  mapApproval,
  mapMission,
  mapPlan,
  mapProject,
  mapTask,
  mapWorkspace,
  type DbClient,
} from "@/lib/workforce/access.server";
import { generateMissionPlan, deriveMissionTitle } from "@/lib/workforce/planner";
import {
  buildDeliveryReport,
  executeTaskStep,
  isStructureCheck,
  nextMissionStatusAfterRun,
  type UpstreamArtefact,
} from "@/lib/workforce/executor";
import { runnableTasks, unreachableTasks } from "@/lib/workforce/graph";
import { canAfford } from "@/lib/workforce/usage";
import {
  encodePlanAcceptanceCriteria,
  encodeTaskDescription,
  type TaskMeta,
} from "@/lib/workforce/capability-persistence";
import type {
  DeliveryReport,
  MissionBundle,
  MissionIntent,
  PermissionLevel,
  PlannedTask,
  QualityLabel,
  WfMission,
  WfMissionPlan,
  WfMissionTask,
  WfProject,
  WfWorkspace,
} from "@/lib/workforce/types";

const intentSchema = z.enum(["investigate", "prototype", "improve", "build"]);

function taskMetaOf(t: PlannedTask): TaskMeta {
  return {
    key: t.key,
    dependsOn: t.dependsOn ?? [],
    stage: t.stage ?? null,
    gate: Boolean(t.gate),
    requiredSections: t.requiredSections ?? [],
    produces: t.produces ?? null,
  };
}

let schemaProbe: { at: number; productMission: boolean } | null = null;

/**
 * Product missions need migration 20261022100000 (intent + artefact kind constraints).
 * Probe once per minute so the UI never offers a mission the database would reject.
 */
async function productMissionSupported(): Promise<boolean> {
  if (schemaProbe && Date.now() - schemaProbe.at < 60_000) return schemaProbe.productMission;
  const { neonDb } = await import("@/lib/db/neon.server");
  const res = await neonDb().rpc("wf_schema_version");
  const productMission = !res.error && Number(res.data) >= 2;
  schemaProbe = { at: Date.now(), productMission };
  return productMission;
}

export type CommandCentreBootstrap = {
  workspace: WfWorkspace;
  projects: WfProject[];
  recentMissions: WfMission[];
  /** Tasks of `recentMissions`, for the agents office: who is working on what. */
  recentTasks: WfMissionTask[];
  /** True when the task read failed; the rest of the bootstrap is still valid. */
  recentTasksUnavailable: boolean;
  storage: "supabase";
  permissionLadder: PermissionLevel[];
  features: {
    productMission: boolean;
    modelMode: {
      enabled: boolean;
      provider: string | null;
      model: string | null;
      problem: string | null;
    };
  };
};

export const getCommandCentreBootstrap = createServerFn({ method: "GET" })
  .middleware([requireAuth])
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

    const missionIds = (missionsRes.data ?? []).map((m: { id: string }) => m.id);
    const tasksRes = missionIds.length
      ? await db
          .from("wf_mission_tasks")
          .select("*")
          .eq("workspace_id", workspace.id)
          .in("mission_id", missionIds)
          .order("sort_order", { ascending: true })
      : { data: [], error: null };
    // the office is secondary: a failed task read must not take down the workspace
    if (tasksRes.error) {
      const { recordMonitoringEvent } = await import("@/lib/monitoring.server");
      await recordMonitoringEvent({
        kind: "server_error",
        severity: "warning",
        source: "command-bootstrap",
        message: `Task read failed: ${tasksRes.error.message}`,
        route: "/command",
        userId,
      });
    }

    return {
      workspace,
      projects: (projectsRes.data ?? []).map(mapProject),
      recentMissions: (missionsRes.data ?? []).map(mapMission),
      // newest mission first, then plan order, so the newest work leads the office
      recentTasks: tasksRes.error
        ? []
        : (tasksRes.data ?? [])
            .map(mapTask)
            .sort(
              (a: WfMissionTask, b: WfMissionTask) =>
                missionIds.indexOf(a.missionId) - missionIds.indexOf(b.missionId) ||
                a.sortOrder - b.sortOrder,
            ),
      recentTasksUnavailable: Boolean(tasksRes.error),
      storage,
      permissionLadder: ["plan", "create", "execute_internally", "act_externally"],
      features: {
        productMission: await productMissionSupported().catch(() => false),
        modelMode: (await import("@/lib/workforce/model-runner.server")).modelModeStatus(),
      },
    };
  });

export const createWfProject = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
  .middleware([requireAuth])
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
  .middleware([requireAuth])
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

    if (data.intent === "build" && !(await productMissionSupported())) {
      throw new Error(
        "Product missions need the latest workforce database migration. Ask an admin to apply supabase/migrations/20261022100000_dxsi_product_mission.sql.",
      );
    }

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
        description: encodeTaskDescription(t.description, t.capabilityIds, taskMetaOf(t)),
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
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle & { workspace: WfWorkspace }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
    return { ...bundle, workspace };
  });

export const answerClarifications = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
          description: encodeTaskDescription(t.description, t.capabilityIds, taskMetaOf(t)),
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
  .middleware([requireAuth])
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
            description: encodeTaskDescription(t.description, t.capabilityIds, taskMetaOf(t)),
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
  .middleware([requireAuth])
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
  .middleware([requireAuth])
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
  .middleware([requireAuth])
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

type StepResult = MissionBundle & { workspace: WfWorkspace; done: boolean; note?: string };

/** Persists the final status + delivery report once no task can make progress. */
async function finaliseMission(
  supabase: DbClient,
  workspace: WfWorkspace,
  bundle: MissionBundle,
): Promise<StepResult> {
  const writeDb = await adminDb();
  const { mission, tasks } = bundle;
  const finalStatus = nextMissionStatusAfterRun({ tasks, hitCeiling: false });
  const report = buildDeliveryReport({
    missionTitle: mission.title,
    intent: mission.intent,
    tasks,
    artefacts: bundle.artefacts.filter((a) => a.kind !== "delivery_report"),
    usageSpent: tasks.reduce((sum, t) => sum + t.actualUsage, 0),
    partial: finalStatus !== "completed",
  });
  // Conditional on status so concurrent finalisers write the report once.
  const updated = await writeDb
    .from("wf_missions")
    .update({ status: finalStatus, delivery_report: report, updated_at: new Date().toISOString() })
    .eq("id", mission.id)
    .eq("workspace_id", workspace.id)
    .in("status", ["queued", "running", "blocked"])
    .select("id");
  if ((updated.data ?? []).length && finalStatus !== "blocked") {
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

/** Upstream artefacts for a task: outputs of its transitive dependencies (all prior work for verify). */
/** Prototypes this mission has saved, for the legacy check task (legacy plans have no dependencies). */
function savedPrototypes(bundle: MissionBundle): UpstreamArtefact[] {
  return bundle.artefacts
    .filter((a) => a.kind === "prototype_html")
    .map((a) => ({
      kind: a.kind,
      title: a.title,
      content: a.content,
      contentFormat: a.contentFormat,
      taskKey: bundle.tasks.find((t) => t.id === a.taskId)?.key ?? null,
      requiredSections: [],
    }));
}

function upstreamFor(task: WfMissionTask, bundle: MissionBundle): UpstreamArtefact[] {
  const byKey = new Map(bundle.tasks.map((t) => [t.key, t]));
  const byId = new Map(bundle.tasks.map((t) => [t.id, t]));
  const wanted = new Set<string>();
  const visit = (key: string) => {
    for (const dep of byKey.get(key)?.dependsOn ?? []) {
      if (!wanted.has(dep)) {
        wanted.add(dep);
        visit(dep);
      }
    }
  };
  visit(task.key);
  return bundle.artefacts
    .filter(
      (a) => a.kind !== "delivery_report" && a.taskId && wanted.has(byId.get(a.taskId)?.key ?? ""),
    )
    .map((a) => {
      const owner = byId.get(a.taskId!);
      return {
        kind: a.kind,
        title: a.title,
        content: a.content,
        contentFormat: a.contentFormat,
        taskKey: owner?.key ?? null,
        requiredSections: owner?.requiredSections ?? [],
      };
    });
}

/** Optimistic-concurrency usage charge: never lets two parallel steps overspend the ceiling. */
async function chargeWorkspaceUsage(
  workspaceId: string,
  amount: number,
): Promise<{ ok: true; consumed: number } | { ok: false }> {
  if (amount <= 0) return { ok: true, consumed: -1 };
  const writeDb = await adminDb();
  for (let attempt = 0; attempt < 4; attempt++) {
    const live = await writeDb
      .from("wf_workspaces")
      .select("usage_ceiling, usage_consumed")
      .eq("id", workspaceId)
      .single();
    if (live.error || !live.data) return { ok: false };
    const consumed = live.data.usage_consumed as number;
    if (consumed + amount > (live.data.usage_ceiling as number)) return { ok: false };
    const upd = await writeDb
      .from("wf_workspaces")
      .update({ usage_consumed: consumed + amount, updated_at: new Date().toISOString() })
      .eq("id", workspaceId)
      .eq("usage_consumed", consumed)
      .select("id");
    if ((upd.data ?? []).length) return { ok: true, consumed: consumed + amount };
  }
  return { ok: false };
}

export const runMissionStep = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<StepResult> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
    const { mission, tasks } = bundle;
    if (mission.workspaceId !== workspace.id) throw new Error("Mission not found.");
    if (!["queued", "running", "blocked"].includes(mission.status)) {
      return { ...bundle, workspace, done: true };
    }

    // Approved external tasks re-enter the schedule; everything else follows the DAG.
    const retryable = (t: WfMissionTask) =>
      t.status === "blocked" && t.isExternal && mission.externalActionsApproved;
    const nodes = tasks.map((t) => ({
      ...t,
      status: retryable(t) ? ("pending" as const) : t.status,
    }));
    const runnable = runnableTasks(nodes);
    const next = runnable.find((t) => !t.gate) ?? null;

    if (!next) {
      const gate =
        runnable.find((t) => t.gate) ?? tasks.find((t) => t.gate && t.status === "blocked");
      if (gate) {
        if (gate.status !== "blocked") {
          await writeDb
            .from("wf_mission_tasks")
            .update({ status: "blocked", updated_at: new Date().toISOString() })
            .eq("id", gate.id)
            .eq("status", "pending");
          await audit(db, {
            workspaceId: workspace.id,
            missionId: mission.id,
            actorId: userId,
            eventType: "mission.awaiting_gate",
            entityType: "task",
            entityId: gate.id,
            metadata: { gate: gate.key },
          });
        }
        await writeDb
          .from("wf_missions")
          .update({ status: "blocked", updated_at: new Date().toISOString() })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);
        const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
        return { ...refreshed, workspace, done: true, note: `Awaiting human gate: ${gate.title}` };
      }

      // Tasks downstream of a failure can never run: report them as blocked, never drop them.
      const dead = unreachableTasks(nodes);
      if (dead.length) {
        await writeDb
          .from("wf_mission_tasks")
          .update({ status: "blocked", updated_at: new Date().toISOString() })
          .in(
            "id",
            dead.map((t) => t.id),
          )
          .eq("status", "pending");
      }
      return finaliseMission(
        supabase,
        workspace,
        await loadMissionBundle(supabase, workspace.id, mission.id),
      );
    }

    // Atomic claim: only one concurrent caller can move this task out of pending/blocked.
    const claimed = await writeDb
      .from("wf_mission_tasks")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", next.id)
      .in("status", ["pending", "blocked"])
      .select("id");
    if (!(claimed.data ?? []).length) {
      const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
      return { ...refreshed, workspace, done: false, note: "Task already claimed by another run." };
    }
    if (mission.status !== "running") {
      await writeDb
        .from("wf_missions")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", mission.id)
        .eq("workspace_id", workspace.id);
    }

    const liveWorkspace = (
      await db.from("wf_workspaces").select("*").eq("id", workspace.id).single()
    ).data;
    const budget = {
      ceiling: liveWorkspace?.usage_ceiling ?? workspace.usageCeiling,
      consumed: liveWorkspace?.usage_consumed ?? workspace.usageConsumed,
    };
    const task = tasks.find((t) => t.id === next.id)!;
    const upstream = task.produces
      ? upstreamFor(task, bundle)
      : isStructureCheck(task)
        ? savedPrototypes(bundle)
        : [];

    // Only spend a model call when the step is affordable and permitted.
    const generated =
      task.produces &&
      task.produces !== "test_report" &&
      canAfford(budget, task.estimatedUsage) &&
      !task.isExternal
        ? await (
            await import("@/lib/workforce/model-runner.server")
          ).generateStageContent({
            mission,
            task,
            upstream,
          })
        : undefined;

    const result = executeTaskStep({
      mission,
      task: { ...task, status: "running" },
      budget,
      upstream,
      ...(generated ? { generated } : {}),
    });

    const charge = result.ok ? result.usageCharged : (result.usageCharged ?? 0);
    if (charge > 0) {
      const charged = await chargeWorkspaceUsage(workspace.id, charge);
      if (!charged.ok) {
        // Lost a race for the last credits: release the task, nothing persisted.
        await writeDb
          .from("wf_mission_tasks")
          .update({ status: "pending", started_at: null })
          .eq("id", task.id);
        const reportBundle = await loadMissionBundle(supabase, workspace.id, mission.id);
        const report = buildDeliveryReport({
          missionTitle: mission.title,
          intent: mission.intent,
          tasks: reportBundle.tasks,
          artefacts: reportBundle.artefacts,
          usageSpent: reportBundle.tasks.reduce((s, t) => s + t.actualUsage, 0),
          partial: true,
        });
        await writeDb
          .from("wf_missions")
          .update({
            status: "partially_completed",
            delivery_report: report,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);
        const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
        return { ...refreshed, workspace, done: true, note: "Usage ceiling reached." };
      }
      await writeDb.from("wf_usage_records").insert({
        workspace_id: workspace.id,
        mission_id: mission.id,
        task_id: task.id,
        amount: charge,
        label: task.title,
      });
    }

    const persistArtefact = async (artefact: typeof result.artefact) => {
      if (!artefact) return;
      await writeDb.from("wf_artefacts").insert({
        mission_id: artefact.missionId,
        workspace_id: artefact.workspaceId,
        task_id: artefact.taskId,
        kind: artefact.kind,
        title: artefact.title,
        content: artefact.content,
        content_format: artefact.contentFormat,
        quality_labels: artefact.qualityLabels,
        evidence_items: artefact.evidenceItems,
      });
    };

    if (!result.ok) {
      await persistArtefact(result.artefact ?? null);
      const failed = result.reason === "contract_failed";
      await writeDb
        .from("wf_mission_tasks")
        .update({
          status: failed ? "failed" : "blocked",
          actual_usage: charge,
          completed_at: failed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (result.reason === "ceiling_reached") {
        const reportBundle = await loadMissionBundle(supabase, workspace.id, mission.id);
        const report = buildDeliveryReport({
          missionTitle: mission.title,
          intent: mission.intent,
          tasks: reportBundle.tasks,
          artefacts: reportBundle.artefacts,
          usageSpent: budget.consumed,
          partial: true,
        });
        await writeDb
          .from("wf_missions")
          .update({
            status: "partially_completed",
            delivery_report: report,
            updated_at: new Date().toISOString(),
          })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);
      } else if (!failed) {
        await writeDb
          .from("wf_missions")
          .update({ status: "blocked", updated_at: new Date().toISOString() })
          .eq("id", mission.id)
          .eq("workspace_id", workspace.id);
      }

      await audit(db, {
        workspaceId: workspace.id,
        missionId: mission.id,
        actorId: userId,
        eventType: failed ? "task.contract_failed" : `mission.${result.reason}`,
        entityType: "task",
        entityId: task.id,
        metadata: result.detail ? { detail: result.detail } : {},
      });

      const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
      const ws = await db.from("wf_workspaces").select("*").eq("id", workspace.id).single();
      return {
        ...refreshed,
        workspace: ws.data ? mapWorkspace(ws.data) : workspace,
        // A failed stage does not stop independent branches; the next call finalises.
        done: !failed,
        ...(result.detail ? { note: result.detail } : {}),
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
      .eq("id", task.id);
    await persistArtefact(result.artefact);

    await audit(db, {
      workspaceId: workspace.id,
      missionId: mission.id,
      actorId: userId,
      eventType: "task.completed",
      entityType: "task",
      entityId: task.id,
      metadata: {
        usage: result.usageCharged,
        ...(generated ? { generation: generated.mode, model: generated.model ?? null } : {}),
      },
    });

    // Completion is decided on the next call so gates and failures are evaluated on fresh state.
    const refreshed = await loadMissionBundle(supabase, workspace.id, mission.id);
    const ws = await db.from("wf_workspaces").select("*").eq("id", workspace.id).single();
    return { ...refreshed, workspace: ws.data ? mapWorkspace(ws.data) : workspace, done: false };
  });

const gateDecisionSchema = z.object({
  missionId: z.string().uuid(),
  taskId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(1000).optional(),
});

/** Operator decision on a lifecycle human gate. Agents can never pass a gate. */
export const decideStageGate = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => gateDecisionSchema.parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const writeDb = await adminDb();

    const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
    const gate = bundle.tasks.find((t) => t.id === data.taskId);
    if (!gate || !gate.gate) throw new Error("Gate not found on this mission.");
    if (gate.status !== "blocked" && gate.status !== "pending") {
      throw new Error("This gate has already been decided.");
    }
    const status = new Map(bundle.tasks.map((t) => [t.key, t.status]));
    if (!gate.dependsOn.every((d) => status.get(d) === "completed")) {
      throw new Error("Upstream stages must complete before this gate can be decided.");
    }

    const now = new Date().toISOString();
    const approve = data.decision === "approve";
    const updated = await writeDb
      .from("wf_mission_tasks")
      .update({
        status: approve ? "completed" : "failed",
        completed_at: now,
        updated_at: now,
        evidence_notes: [
          {
            classification: "sourced_facts",
            statement: `${approve ? "Approved" : "Rejected"} by operator${data.note?.trim() ? `: ${data.note.trim()}` : "."}`,
            source: "operator.gate_decision",
          },
        ],
      })
      .eq("id", gate.id)
      .in("status", ["blocked", "pending"])
      .select("id");
    if (!(updated.data ?? []).length) throw new Error("This gate has already been decided.");

    await writeDb.from("wf_approvals").insert({
      mission_id: data.missionId,
      workspace_id: workspace.id,
      kind: "plan",
      status: approve ? "approved" : "rejected",
      decided_by: userId,
      decided_at: now,
      note: `Stage gate ${approve ? "approved" : "rejected"}: ${gate.title}${data.note?.trim() ? ` — ${data.note.trim()}` : ""} [gate:${gate.key}]`,
    });
    // Approved inputs become human-reviewed: the operator has signed off on them.
    if (approve) {
      const reviewedIds = bundle.artefacts
        .filter(
          (a) =>
            a.taskId &&
            gate.dependsOn.includes(bundle.tasks.find((t) => t.id === a.taskId)?.key ?? ""),
        )
        .filter((a) => !a.qualityLabels.includes("human_reviewed"));
      for (const a of reviewedIds) {
        await writeDb
          .from("wf_artefacts")
          .update({ quality_labels: [...a.qualityLabels, "human_reviewed"], updated_at: now })
          .eq("id", a.id);
      }
    }
    await writeDb
      .from("wf_missions")
      .update({ status: "queued", updated_at: now })
      .eq("id", data.missionId)
      .eq("workspace_id", workspace.id);
    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: approve ? "gate.approved" : "gate.rejected",
      entityType: "task",
      entityId: gate.id,
      metadata: { gate: gate.key, note: data.note ?? null },
    });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const markArtefactHumanReviewed = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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

export const cancelMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
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
