import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { wfDb } from "@/lib/workforce/db";
import {
  adminDb,
  audit,
  ensureWorkspace,
  loadMissionBundle,
  mapMission,
  mapProject,
  mapTask,
  mapMissionEvent,
  mapWorkspace,
} from "@/lib/workforce/access.server";
import {
  appendEvent,
  approveExternalForPlan,
  approvePlanVersion,
  lockMission,
  PAUSABLE,
  PRE_EXECUTION,
  savePlanVersion,
  TERMINAL,
} from "@/lib/workforce/plan-store.server";
import {
  MAX_EVIDENCE_FILE_BYTES,
  MAX_EVIDENCE_NOTE_CHARS,
  readFile,
  readNote,
  type EvidenceList,
} from "@/lib/workforce/evidence";
import { generateMissionPlan, deriveMissionTitle } from "@/lib/workforce/planner";
import {
  decisionMemory,
  staleness,
  withdrawnSourceTitles,
  type MemoryConflict,
  type ProductMemoryEntry,
} from "@/lib/workforce/product-memory";
import type {
  DeliveryReport,
  MissionBundle,
  MissionIntent,
  PermissionLevel,
  QualityLabel,
  WfMission,
  WfMissionEvent,
  WfMissionTask,
  WfProject,
  WfWorkspace,
} from "@/lib/workforce/types";

const intentSchema = z.enum(["investigate", "prototype", "improve", "build"]);

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

    const project = await db
      .from("wf_projects")
      .select("id")
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

    const requestText = data.requestText.trim();
    const title = deriveMissionTitle(data.intent, requestText);
    const draftPlan = generateMissionPlan({ intent: data.intent, requestText });
    const status = draftPlan.tasks.length === 0 ? "needs_clarification" : "awaiting_approval";

    // Mission, plan, tasks, approval and events commit together or not at all.
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const missionId = await neonTransaction(async (_tx, query) => {
      const rows = await query(
        `insert into wf_missions (workspace_id, project_id, intent, title, request_text, status,
            clarification_answers, permission_ceiling, created_by)
         values ($1::uuid, $2::uuid, $3, $4, $5, $6, '{}'::jsonb, 'execute_internally', $7)
         returning id`,
        [workspace.id, data.projectId, data.intent, title, requestText, status, userId] as never,
      );
      const id = rows[0]!["id"] as string;
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: id,
        type: "mission.created",
        actorKind: "user",
        actorId: userId,
        data: { intent: data.intent },
      });
      await savePlanVersion(query, {
        workspaceId: workspace.id,
        missionId: id,
        requestText,
        plan: draftPlan,
        actorId: userId,
        reason: "Plan drafted from the mission request",
      });
      return id;
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId,
      actorId: userId,
      eventType:
        status === "needs_clarification" ? "mission.needs_clarification" : "mission.planned",
      entityType: "mission",
      entityId: missionId,
      metadata: { intent: data.intent },
    });
    return loadMissionBundle(supabase, workspace.id, missionId);
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

const EVENT_PAGE = 100;

/**
 * Mission events after a cursor, oldest first. The page reads progress from
 * here; it never advances the mission itself.
 */
export const getMissionEvents = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({ missionId: z.string().uuid(), after: z.number().int().nonnegative().optional() })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ events: WfMissionEvent[]; cursor: number }> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    let query = wfDb(supabase)
      .from("wf_mission_events")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("mission_id", data.missionId);
    if (data.after) query = query.gt("id", data.after);
    const res = await query.order("id", { ascending: true }).limit(EVENT_PAGE);
    if (res.error) throw new Error(res.error.message);
    const events = ((res.data ?? []) as unknown[]).map(mapMissionEvent);
    return { events, cursor: events.at(-1)?.id ?? data.after ?? 0 };
  });

/** The workspace's most recent events, newest first, for the agents office. */
export const getRecentWorkspaceEvents = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<WfMissionEvent[]> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const res = await wfDb(supabase)
      .from("wf_mission_events")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("id", { ascending: false })
      .limit(12);
    if (res.error) throw new Error(res.error.message);
    return ((res.data ?? []) as unknown[]).map(mapMissionEvent);
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

    const { neonTransaction } = await import("@/lib/db/neon.server");
    const needsClarification = await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (!PRE_EXECUTION.includes(locked.status))
        throw new Error("This mission has started. Its answers can no longer change the plan.");
      const rows = await query(
        `select intent, clarification_answers from wf_missions where id = $1::uuid`,
        [data.missionId] as never,
      );
      const mergedAnswers = {
        ...((rows[0]!["clarification_answers"] ?? {}) as Record<string, string>),
        ...Object.fromEntries(Object.entries(data.answers).map(([k, v]) => [k, v.trim()])),
      };
      const draftPlan = generateMissionPlan({
        intent: rows[0]!["intent"] as MissionIntent,
        requestText: locked.requestText,
        clarificationAnswers: mergedAnswers,
      });
      const waiting = draftPlan.tasks.length === 0;
      await query(
        `update wf_missions set clarification_answers = $2::jsonb, status = $3, updated_at = now()
          where id = $1::uuid`,
        [
          data.missionId,
          JSON.stringify(mergedAnswers),
          waiting ? "needs_clarification" : "awaiting_approval",
        ] as never,
      );
      await savePlanVersion(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        requestText: locked.requestText,
        plan: draftPlan,
        actorId: userId,
        reason: "Plan redrafted after clarification answers",
      });
      return waiting;
    });

    if (!needsClarification) {
      await audit(db, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        actorId: userId,
        eventType: "mission.planned",
        entityType: "mission",
        entityId: data.missionId,
      });
    }
    return loadMissionBundle(supabase, workspace.id, data.missionId);
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

    const nextText = data.requestText.trim();
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const needsClarification = await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      // Revising a mission that has started would delete work in progress.
      if (!PRE_EXECUTION.includes(locked.status))
        throw new Error(
          "This mission has started, so its scope can no longer change. Cancel it and start a new mission instead.",
        );
      const rows = await query(
        `select intent, clarification_answers from wf_missions where id = $1::uuid`,
        [data.missionId] as never,
      );
      const intent = rows[0]!["intent"] as MissionIntent;
      const draftPlan = generateMissionPlan({
        intent,
        requestText: nextText,
        clarificationAnswers: (rows[0]!["clarification_answers"] ?? {}) as Record<string, string>,
      });
      const waiting = draftPlan.tasks.length === 0;
      await query(
        `update wf_missions set title = $2, request_text = $3, status = $4,
            external_actions_approved = false, permission_ceiling = 'execute_internally',
            updated_at = now()
          where id = $1::uuid`,
        [
          data.missionId,
          deriveMissionTitle(intent, nextText),
          nextText,
          waiting ? "needs_clarification" : "awaiting_approval",
        ] as never,
      );
      await savePlanVersion(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        requestText: nextText,
        plan: draftPlan,
        actorId: userId,
        reason: "Scope revised by the owner",
      });
      return waiting;
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.scope_revised",
      entityType: "mission",
      entityId: data.missionId,
      metadata: { needsClarification },
    });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
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
    const note = data.note?.trim() || "Plan rejected by the owner for revision";

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (locked.status !== "awaiting_approval" && locked.status !== "planned")
        throw new Error("This mission has no plan waiting for a decision.");
      await query(
        `update wf_approvals set status = 'rejected', decided_by = $2, decided_at = now(), note = $3
          where mission_id = $1::uuid and kind = 'plan' and status = 'pending'
            and invalidated_at is null`,
        [data.missionId, userId, note] as never,
      );
      await query(
        `update wf_missions set status = 'draft', external_actions_approved = false,
            permission_ceiling = 'execute_internally', updated_at = now()
          where id = $1::uuid`,
        [data.missionId] as never,
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        type: "plan.rejected",
        actorKind: "user",
        actorId: userId,
        data: { note },
      });
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.plan_rejected",
      entityType: "mission",
      entityId: data.missionId,
      metadata: { note },
    });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const approveMissionPlan = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        /** The plan version and fingerprint the owner was shown. */
        planVersion: z.number().int().positive(),
        planHash: z.string().min(8).max(200).nullable(),
        approveExternalActions: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);
    const approveExternal = Boolean(data.approveExternalActions);

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (locked.status !== "awaiting_approval" && locked.status !== "planned")
        throw new Error("This mission is not awaiting plan approval.");
      await approvePlanVersion(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        planVersion: data.planVersion,
        planHash: data.planHash,
        actorId: userId,
        approveExternal,
      });
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.plan_approved",
      entityType: "mission",
      entityId: data.missionId,
      metadata: { approveExternal, planVersion: data.planVersion },
    });
    await (
      await import("@/lib/workforce/worker.server")
    ).kickWorker({ workspaceId: workspace.id, missionId: data.missionId });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

export const approveExternalActions = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        missionId: z.string().uuid(),
        planVersion: z.number().int().positive(),
        planHash: z.string().min(8).max(200).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const db = wfDb(supabase);

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (TERMINAL.includes(locked.status) || PRE_EXECUTION.includes(locked.status))
        throw new Error("Outside actions can only be approved on an approved, unfinished mission.");
      await approveExternalForPlan(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        planVersion: data.planVersion,
        planHash: data.planHash,
        actorId: userId,
      });
    });

    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: "mission.external_approved",
      entityType: "mission",
      entityId: data.missionId,
    });

    await (
      await import("@/lib/workforce/worker.server")
    ).kickWorker({ workspaceId: workspace.id, missionId: data.missionId });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

type StepResult = MissionBundle & { workspace: WfWorkspace; done: boolean; note?: string };

export const runMissionStep = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<StepResult> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    // Scoped read first: a mission outside the caller's workspace is never advanced.
    await loadMissionBundle(supabase, workspace.id, data.missionId);

    const { advanceMission } = await import("@/lib/workforce/worker.server");
    const result = await advanceMission({
      workspaceId: workspace.id,
      missionId: data.missionId,
      actor: { kind: "user", id: userId },
      workerId: `user:${userId}:${crypto.randomUUID()}`,
    });

    const refreshed = await loadMissionBundle(supabase, workspace.id, data.missionId);
    const ws = await wfDb(supabase)
      .from("wf_workspaces")
      .select("*")
      .eq("id", workspace.id)
      .single();
    return {
      ...refreshed,
      workspace: ws.data ? mapWorkspace(ws.data) : workspace,
      done: result.done,
      ...(result.note ? { note: result.note } : {}),
    };
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

    const bundle = await loadMissionBundle(supabase, workspace.id, data.missionId);
    const gate = bundle.tasks.find((t) => t.id === data.taskId);
    if (!gate || !gate.gate) throw new Error("Gate not found on this mission.");
    if (bundle.mission.status === "paused")
      throw new Error("This mission is paused. Resume it before deciding this gate.");
    if (gate.status !== "blocked" && gate.status !== "pending") {
      throw new Error("This gate has already been decided.");
    }
    const status = new Map(bundle.tasks.map((t) => [t.key, t.status]));
    if (!gate.dependsOn.every((d) => status.get(d) === "completed")) {
      throw new Error("Upstream stages must complete before this gate can be decided.");
    }

    const now = new Date().toISOString();
    const approve = data.decision === "approve";
    // The decision, its effects and its place in the product's memory commit together.
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { recordMemory } = await import("@/lib/workforce/product-memory.server");
    await neonTransaction(async (tx, query) => {
      // Builder calls return errors instead of throwing; any error must abort the whole decision.
      const must = <T extends { error?: { message: string } | null }>(res: T): T => {
        if (res.error) throw new Error(res.error.message);
        return res;
      };
      // Re-checked under the lock: a pause, cancel or other decision may have landed since the read.
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (locked.status === "paused")
        throw new Error("This mission is paused. Resume it before deciding this gate.");
      if (TERMINAL.includes(locked.status)) throw new Error("This mission has already finished.");
      const states = await query(
        `select task_key, status from wf_mission_tasks where mission_id = $1::uuid`,
        [data.missionId] as never,
      );
      const taskStatus = new Map(
        states.map((r) => [r["task_key"] as string, r["status"] as string]),
      );
      if (!["blocked", "pending"].includes(taskStatus.get(gate.key) ?? ""))
        throw new Error("This gate has already been decided.");
      if (!gate.dependsOn.every((d) => taskStatus.get(d) === "completed"))
        throw new Error("Upstream stages must complete before this gate can be decided.");
      const updated = must(
        await tx
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
          .select("id"),
      );
      if (!((updated.data as unknown[] | null) ?? []).length)
        throw new Error("This gate has already been decided.");

      must(
        await tx.from("wf_approvals").insert({
          mission_id: data.missionId,
          workspace_id: workspace.id,
          kind: "plan",
          status: approve ? "approved" : "rejected",
          decided_by: userId,
          decided_at: now,
          note: `Stage gate ${approve ? "approved" : "rejected"}: ${gate.title}${data.note?.trim() ? ` — ${data.note.trim()}` : ""} [gate:${gate.key}]`,
        }),
      );
      // Approved inputs become human-reviewed: the operator has signed off on them.
      if (approve) {
        const reviewed = bundle.artefacts
          .filter(
            (a) =>
              a.taskId &&
              gate.dependsOn.includes(bundle.tasks.find((t) => t.id === a.taskId)?.key ?? ""),
          )
          .filter((a) => !a.qualityLabels.includes("human_reviewed"));
        for (const a of reviewed)
          must(
            await tx
              .from("wf_artefacts")
              .update({ quality_labels: [...a.qualityLabels, "human_reviewed"], updated_at: now })
              .eq("id", a.id),
          );
      }
      // A pause or cancel that landed meanwhile keeps its status.
      must(
        await tx
          .from("wf_missions")
          .update({ status: "queued", updated_at: now })
          .eq("id", data.missionId)
          .eq("workspace_id", workspace.id)
          .in("status", ["queued", "running", "blocked"]),
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        taskId: gate.id,
        type: approve ? "gate.approved" : "gate.rejected",
        actorKind: "user",
        actorId: userId,
        data: { gate: gate.key, ...(data.note?.trim() ? { note: data.note.trim() } : {}) },
      });
      // The founder's decision becomes part of the product's memory.
      await recordMemory(
        query,
        {
          workspaceId: workspace.id,
          projectId: bundle.mission.projectId,
          missionId: data.missionId,
          originKind: "gate",
          originId: gate.id,
        },
        [decisionMemory(gate, approve, data.note)],
      );
    });
    await audit(db, {
      workspaceId: workspace.id,
      missionId: data.missionId,
      actorId: userId,
      eventType: approve ? "gate.approved" : "gate.rejected",
      entityType: "task",
      entityId: gate.id,
      metadata: { gate: gate.key, note: data.note ?? null },
    });
    await (
      await import("@/lib/workforce/worker.server")
    ).kickWorker({ workspaceId: workspace.id, missionId: data.missionId });
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

    // The sign-off shows in the mission's activity log as well as the audit trail.
    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction((_tx, query) =>
      appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        taskId: (artRes.data.task_id as string | null) ?? null,
        type: "artefact.reviewed",
        actorKind: "user",
        actorId: userId,
        data: { artefactId: data.artefactId, title: artRes.data.title as string },
      }),
    );
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

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (TERMINAL.includes(locked.status)) throw new Error("This mission has already finished.");
      await query(
        `update wf_missions set status = 'cancelled', updated_at = now() where id = $1::uuid`,
        [data.missionId] as never,
      );
      // Pending approvals for a cancelled mission must never authorise anything later.
      await query(
        `update wf_approvals set invalidated_at = now(), invalidated_reason = 'Mission cancelled'
          where mission_id = $1::uuid and status = 'pending' and invalidated_at is null`,
        [data.missionId] as never,
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        type: "mission.cancelled",
        actorKind: "user",
        actorId: userId,
        data: { from: locked.status },
      });
    });
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

/** Pauses a mission: no further step starts until it is resumed. Work in flight finishes. */
export const pauseMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (!PAUSABLE.includes(locked.status))
        throw new Error("Only an approved mission that has not finished can be paused.");
      await query(
        `update wf_missions set status = 'paused', updated_at = now() where id = $1::uuid`,
        [data.missionId] as never,
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        type: "mission.paused",
        actorKind: "user",
        actorId: userId,
        data: { from: locked.status },
      });
    });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

/** Resumes a paused mission. It re-enters the queue; the plan approval still applies. */
export const resumeMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<MissionBundle> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);

    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      const locked = await lockMission(query, workspace.id, data.missionId);
      if (locked.status !== "paused") throw new Error("This mission is not paused.");
      await query(
        `update wf_missions set status = 'queued', updated_at = now() where id = $1::uuid`,
        [data.missionId] as never,
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        type: "mission.resumed",
        actorKind: "user",
        actorId: userId,
      });
    });
    await (
      await import("@/lib/workforce/worker.server")
    ).kickWorker({ workspaceId: workspace.id, missionId: data.missionId });
    return loadMissionBundle(supabase, workspace.id, data.missionId);
  });

/**
 * Emergency stop for the whole workspace: no mission step starts while it is
 * set. Missions keep their status, so resuming continues where they were.
 */
export const setWorkspaceStopped = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ stopped: z.boolean(), reason: z.string().max(400).optional() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<WfWorkspace> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);

    const reason = data.reason?.trim() || "Stopped by the owner";

    const { neonTransaction } = await import("@/lib/db/neon.server");
    const row = await neonTransaction(async (_tx, query) => {
      const rows = await query(
        data.stopped
          ? `update wf_workspaces set stopped_at = coalesce(stopped_at, now()), stopped_by = $2,
                stop_reason = $3, updated_at = now()
              where id = $1::uuid returning *`
          : `update wf_workspaces set stopped_at = null, stopped_by = null, stop_reason = null,
                updated_at = now()
              where id = $1::uuid returning *`,
        (data.stopped ? [workspace.id, userId, reason] : [workspace.id]) as never,
      );
      await appendEvent(query, {
        workspaceId: workspace.id,
        type: data.stopped ? "workspace.stopped" : "workspace.resumed",
        actorKind: "user",
        actorId: userId,
        data: data.stopped ? { reason } : {},
      });
      return rows[0]!;
    });
    if (!data.stopped)
      await (
        await import("@/lib/workforce/worker.server")
      ).kickWorker({ workspaceId: workspace.id });
    return mapWorkspace(row as never);
  });

/** Founder-supplied evidence for a mission. `available` is false until migration 0027 is applied. */
export const getMissionEvidence = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ missionId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<EvidenceList> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { listEvidence } = await import("@/lib/workforce/evidence.server");
    return neonTransaction((_tx, query) => listEvidence(query, workspace.id, data.missionId));
  });

const evidenceInput = z.discriminatedUnion("kind", [
  z.object({
    missionId: z.string().uuid(),
    kind: z.literal("note"),
    title: z.string().max(200),
    text: z.string().max(MAX_EVIDENCE_NOTE_CHARS + 1000),
  }),
  z.object({
    missionId: z.string().uuid(),
    kind: z.literal("file"),
    title: z.string().max(200),
    fileName: z.string().min(1).max(255),
    mediaType: z.string().max(200),
    byteSize: z.number().int().nonnegative(),
    // Sent only for files within the size limit; base64 of at most MAX_EVIDENCE_FILE_BYTES.
    base64: z
      .string()
      .max(Math.ceil(MAX_EVIDENCE_FILE_BYTES / 3) * 4)
      .optional(),
  }),
]);

/**
 * Adds a note or an uploaded text file. A file the server cannot read is still
 * recorded, as unreadable with the reason, so it is reported and not skipped.
 */
export const addMissionEvidence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => evidenceInput.parse(data))
  .handler(async ({ context, data }): Promise<EvidenceList> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const reading =
      data.kind === "note"
        ? readNote(data.text)
        : readFile({
            fileName: data.fileName,
            mediaType: data.mediaType,
            byteSize: data.byteSize,
            bytes: data.base64 === undefined ? null : Buffer.from(data.base64, "base64"),
          });
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { addEvidence, listEvidence } = await import("@/lib/workforce/evidence.server");
    return neonTransaction(async (_tx, query) => {
      if (!(await listEvidence(query, workspace.id, data.missionId)).available)
        throw new Error("Evidence needs a database update that has not been applied yet.");
      await addEvidence(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        actorId: userId,
        kind: data.kind,
        title: data.title,
        reading,
        ...(data.kind === "file"
          ? { file: { name: data.fileName, mediaType: data.mediaType, byteSize: data.byteSize } }
          : {}),
      });
      return listEvidence(query, workspace.id, data.missionId);
    });
  });

/** Removes evidence from a mission that has not finished. The record is kept as provenance. */
export const removeMissionEvidence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ missionId: z.string().uuid(), evidenceId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<EvidenceList> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { listEvidence, removeEvidence } = await import("@/lib/workforce/evidence.server");
    return neonTransaction(async (_tx, query) => {
      await removeEvidence(query, {
        workspaceId: workspace.id,
        missionId: data.missionId,
        evidenceId: data.evidenceId,
        actorId: userId,
      });
      return listEvidence(query, workspace.id, data.missionId);
    });
  });

export type ProductMemoryView = {
  project: WfProject;
  available: boolean;
  entries: Array<ProductMemoryEntry & { staleReason: string | null }>;
  /** False until migration 0029 is applied. */
  conflictsAvailable: boolean;
  conflicts: MemoryConflict[];
};

/** A product's memory, current and retired, with entries that may no longer hold marked. */
export const getProductMemory = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ projectId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<ProductMemoryView> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    const project = await wfDb(supabase)
      .from("wf_projects")
      .select("*")
      .eq("id", data.projectId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (project.error) throw new Error(project.error.message);
    if (!project.data) throw new Error("Project not found.");
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { listProductMemory } = await import("@/lib/workforce/product-memory.server");
    const { listConflicts } = await import("@/lib/workforce/product-memory.server");
    const [memory, conflicts] = await neonTransaction(
      async (_tx, query) =>
        [
          await listProductMemory(query, workspace.id, data.projectId),
          await listConflicts(query, workspace.id, data.projectId),
        ] as const,
    );
    const withdrawn = withdrawnSourceTitles(memory.entries);
    return {
      project: mapProject(project.data),
      available: memory.available,
      entries: memory.entries.map((e) => ({
        ...e,
        staleReason: e.retiredAt ? null : staleness(e, withdrawn).reason,
      })),
      conflictsAvailable: conflicts.available,
      conflicts: conflicts.conflicts,
    };
  });

/** Resolves the caller's project, or throws: every memory write is scoped through it. */
async function ownedProject(
  supabase: Parameters<typeof wfDb>[0],
  workspaceId: string,
  projectId: string,
) {
  const project = await wfDb(supabase)
    .from("wf_projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (project.error) throw new Error(project.error.message);
  if (!project.data) throw new Error("Project not found.");
}

/** Marks two current memory entries as conflicting. Both stay; nothing is merged. */
export const flagMemoryConflict = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        entryA: z.string().uuid(),
        entryB: z.string().uuid(),
        note: z.string().max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<MemoryConflict> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    await ownedProject(supabase, workspace.id, data.projectId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { flagConflict } = await import("@/lib/workforce/product-memory.server");
    return neonTransaction((_tx, query) =>
      flagConflict(query, {
        workspaceId: workspace.id,
        projectId: data.projectId,
        entryA: data.entryA,
        entryB: data.entryB,
        note: data.note ?? null,
        actorId: userId,
      }),
    );
  });

/** Records how the founder resolved a conflict. Both entries stay as history. */
export const resolveMemoryConflict = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        conflictId: z.string().uuid(),
        resolution: z.string().min(3).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<void> => {
    const { supabase, userId } = context;
    const { workspace } = await ensureWorkspace(supabase, userId);
    await ownedProject(supabase, workspace.id, data.projectId);
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const { resolveConflict } = await import("@/lib/workforce/product-memory.server");
    await neonTransaction((_tx, query) =>
      resolveConflict(query, {
        workspaceId: workspace.id,
        projectId: data.projectId,
        conflictId: data.conflictId,
        resolution: data.resolution,
        actorId: userId,
      }),
    );
  });
