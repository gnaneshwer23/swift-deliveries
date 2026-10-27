/**
 * Transactional mission writes (server only). Every function here runs inside
 * a caller's transaction (`neonTransaction`), so a plan, its tasks, its
 * approval and its event commit together or not at all.
 *
 * Plans are versioned: each save bumps the version and records a fingerprint
 * (plan-hash.ts). Earlier approvals are invalidated, never deleted, and a new
 * pending approval is bound to the exact version, fingerprint and cost shown.
 */
import type { Executor } from "@/lib/db/builder";
import { encodePlanAcceptanceCriteria, encodeTaskDescription } from "./capability-persistence";
import { planHash } from "./plan-hash";
import {
  PRE_EXECUTION_STATUSES,
  TERMINAL_MISSION_STATUSES,
  type GeneratedPlan,
  type MissionStatus,
  type PlannedTask,
} from "./types";

/** Statuses in which the plan may still be changed: nothing has run yet. */
export const PRE_EXECUTION = PRE_EXECUTION_STATUSES;

/** How long a pending plan approval stays usable. */
export const APPROVAL_TTL_DAYS = 7;

export type MissionEventInput = {
  workspaceId: string;
  missionId?: string | null;
  taskId?: string | null;
  type: string;
  actorKind: "user" | "worker" | "system";
  actorId?: string | null;
  data?: Record<string, unknown>;
};

/** Appends one event to the mission log. Within a transaction it commits with the change it records. */
export async function appendEvent(query: Executor, event: MissionEventInput): Promise<number> {
  const rows = await query(
    `insert into wf_mission_events (workspace_id, mission_id, task_id, type, actor_kind, actor_id, data)
     values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::jsonb) returning id`,
    [
      event.workspaceId,
      event.missionId ?? null,
      event.taskId ?? null,
      event.type,
      event.actorKind,
      event.actorId ?? null,
      JSON.stringify(event.data ?? {}),
    ] as never,
  );
  return Number(rows[0]!["id"]);
}

/** Locks the mission row for the rest of the transaction; throws if it is not in this workspace. */
export async function lockMission(
  query: Executor,
  workspaceId: string,
  missionId: string,
): Promise<{ status: MissionStatus; requestText: string }> {
  const rows = await query(
    `select status, request_text from wf_missions where id = $1::uuid and workspace_id = $2::uuid for update`,
    [missionId, workspaceId] as never,
  );
  if (!rows[0]) throw new Error("Mission not found.");
  return {
    status: rows[0]["status"] as MissionStatus,
    requestText: rows[0]["request_text"] as string,
  };
}

/** Marks every live plan approval superseded. They stay on record and authorise nothing. */
export async function invalidatePlanApprovals(
  query: Executor,
  missionId: string,
  reason: string,
): Promise<void> {
  await query(
    `update wf_approvals set invalidated_at = now(), invalidated_reason = $2
       where mission_id = $1::uuid and invalidated_at is null`,
    [missionId, reason] as never,
  );
}

function taskMeta(t: PlannedTask) {
  return {
    key: t.key,
    dependsOn: t.dependsOn ?? [],
    stage: t.stage ?? null,
    gate: Boolean(t.gate),
    requiredSections: t.requiredSections ?? [],
    produces: t.produces ?? null,
  };
}

/**
 * Saves a new version of the mission's plan and replaces its tasks. Call only
 * before execution (PRE_EXECUTION) with the mission locked. Returns the new
 * version and fingerprint; a pending approval is opened when there are tasks.
 */
export async function savePlanVersion(
  query: Executor,
  input: {
    workspaceId: string;
    missionId: string;
    requestText: string;
    plan: GeneratedPlan;
    actorId: string;
    reason: string;
  },
): Promise<{ version: number; hash: string }> {
  const { workspaceId, missionId, plan } = input;
  const hash = planHash({ requestText: input.requestText, plan });
  const saved = await query(
    `insert into wf_mission_plans (mission_id, workspace_id, summary, estimated_usage,
        required_permission, includes_external_actions, clarification_questions,
        acceptance_criteria, version, plan_hash)
     values ($1::uuid, $2::uuid, $3, $4::int, $5, $6::boolean, $7::jsonb, $8::jsonb, 1, $9)
     on conflict (mission_id) do update set
        summary = excluded.summary,
        estimated_usage = excluded.estimated_usage,
        required_permission = excluded.required_permission,
        includes_external_actions = excluded.includes_external_actions,
        clarification_questions = excluded.clarification_questions,
        acceptance_criteria = excluded.acceptance_criteria,
        version = wf_mission_plans.version + 1,
        plan_hash = excluded.plan_hash,
        updated_at = now()
     returning id, version`,
    [
      missionId,
      workspaceId,
      plan.summary,
      plan.estimatedUsage,
      plan.tasks.length ? plan.requiredPermission : "plan",
      plan.includesExternalActions,
      JSON.stringify(plan.clarificationQuestions),
      JSON.stringify(encodePlanAcceptanceCriteria(plan)),
      hash,
    ] as never,
  );
  const planId = saved[0]!["id"] as string;
  const version = Number(saved[0]!["version"]);

  await query(`delete from wf_mission_tasks where mission_id = $1::uuid`, [missionId] as never);
  for (const [index, t] of plan.tasks.entries()) {
    await query(
      `insert into wf_mission_tasks (mission_id, workspace_id, plan_id, sort_order, title,
          description, acceptance_criteria, status, permission_required, is_external,
          estimated_usage, task_key, depends_on, capability_ids)
       values ($1::uuid, $2::uuid, $3::uuid, $4::int, $5, $6, $7, 'pending', $8, $9::boolean,
               $10::int, $11, $12::text[], $13::text[])`,
      [
        missionId,
        workspaceId,
        planId,
        index,
        t.title,
        // metadata stays encoded too, so readers from before 0024 keep working
        encodeTaskDescription(t.description, t.capabilityIds, taskMeta(t)),
        t.acceptanceCriteria,
        t.permissionRequired,
        t.isExternal,
        t.estimatedUsage,
        t.key,
        t.dependsOn ?? [],
        t.capabilityIds,
      ] as never,
    );
  }

  await invalidatePlanApprovals(query, missionId, input.reason);
  if (plan.tasks.length) {
    await query(
      `insert into wf_approvals (mission_id, workspace_id, kind, status, plan_version,
          payload_hash, cost_limit, expires_at)
       values ($1::uuid, $2::uuid, 'plan', 'pending', $3::int, $4, $5::int,
               now() + make_interval(days => $6::int))`,
      [missionId, workspaceId, version, hash, plan.estimatedUsage, APPROVAL_TTL_DAYS] as never,
    );
  }

  await appendEvent(query, {
    workspaceId,
    missionId,
    type: plan.tasks.length ? "plan.proposed" : "plan.needs_clarification",
    actorKind: "user",
    actorId: input.actorId,
    data: {
      version,
      hash,
      tasks: plan.tasks.length,
      estimatedUsage: plan.estimatedUsage,
      reason: input.reason,
    },
  });
  return { version, hash };
}

/**
 * Approves the exact plan the owner saw. Fails unless the pending approval is
 * for this version and fingerprint, is not invalidated and has not expired.
 */
export async function approvePlanVersion(
  query: Executor,
  input: {
    workspaceId: string;
    missionId: string;
    planVersion: number;
    /** Null only for plans saved before migration 0024, which carry no fingerprint. */
    planHash: string | null;
    actorId: string;
    approveExternal: boolean;
  },
): Promise<void> {
  const current = await query(
    `select version, plan_hash, estimated_usage from wf_mission_plans where mission_id = $1::uuid for update`,
    [input.missionId] as never,
  );
  const plan = current[0];
  if (!plan) throw new Error("This mission has no plan to approve.");
  if (
    Number(plan["version"]) !== input.planVersion ||
    ((plan["plan_hash"] as string | null) ?? null) !== input.planHash
  ) {
    throw new Error(
      "The plan changed since you opened it. Review the current plan before approving.",
    );
  }
  const approved = await query(
    `update wf_approvals set status = 'approved', decided_by = $4, decided_at = now(),
        note = $5
      where mission_id = $1::uuid and kind = 'plan' and status = 'pending'
        and payload_hash is not distinct from $3
        and (plan_version = $2::int or (payload_hash is null and plan_version is null))
        and invalidated_at is null and (expires_at is null or expires_at > now())
      returning id`,
    [
      input.missionId,
      input.planVersion,
      input.planHash,
      input.actorId,
      input.approveExternal ? "Plan and outside actions approved" : "Plan approved",
    ] as never,
  );
  if (!approved.length) {
    throw new Error(
      "This approval has expired or was replaced. Review the current plan before approving.",
    );
  }
  if (input.approveExternal) {
    await query(
      `insert into wf_approvals (mission_id, workspace_id, kind, status, decided_by, decided_at,
          note, plan_version, payload_hash, cost_limit)
       values ($1::uuid, $2::uuid, 'external_action', 'approved', $3, now(),
               'Outside actions approved for this plan version', $4::int, $5, $6::int)`,
      [
        input.missionId,
        input.workspaceId,
        input.actorId,
        input.planVersion,
        input.planHash,
        Number(plan["estimated_usage"]),
      ] as never,
    );
  }
  await query(
    `update wf_missions set status = 'queued', external_actions_approved = $2::boolean,
        permission_ceiling = $3, updated_at = now()
      where id = $1::uuid`,
    [
      input.missionId,
      input.approveExternal,
      input.approveExternal ? "act_externally" : "execute_internally",
    ] as never,
  );
  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: input.missionId,
    type: "plan.approved",
    actorKind: "user",
    actorId: input.actorId,
    data: {
      version: input.planVersion,
      hash: input.planHash,
      externalActions: input.approveExternal,
    },
  });
}

/**
 * True when the mission's current plan carries a live approval bound to it.
 * Plans saved before migration 0024 have no fingerprint; their legacy
 * approvals (no version) still count, so existing missions keep running.
 */
export function hasLivePlanApproval(
  plan: { version: number; planHash: string | null } | null,
  approvals: ReadonlyArray<{
    kind: string;
    status: string;
    planVersion: number | null;
    payloadHash: string | null;
    invalidatedAt: string | null;
  }>,
): boolean {
  if (!plan) return false;
  return approvals.some(
    (a) =>
      a.kind === "plan" &&
      a.status === "approved" &&
      !a.invalidatedAt &&
      (plan.planHash === null
        ? a.planVersion === null
        : a.planVersion === plan.version && a.payloadHash === plan.planHash),
  );
}

/**
 * Records approval of outside actions for the plan version that is running.
 * Requires the plan itself to carry a live approval for that same version.
 */
export async function approveExternalForPlan(
  query: Executor,
  input: {
    workspaceId: string;
    missionId: string;
    planVersion: number;
    planHash: string | null;
    actorId: string;
  },
): Promise<void> {
  const current = await query(
    `select version, plan_hash, estimated_usage from wf_mission_plans where mission_id = $1::uuid`,
    [input.missionId] as never,
  );
  const plan = current[0];
  if (
    !plan ||
    Number(plan["version"]) !== input.planVersion ||
    ((plan["plan_hash"] as string | null) ?? null) !== input.planHash
  ) {
    throw new Error("The plan changed since you opened it. Review the current plan first.");
  }
  const approvals = await query(
    `select kind, status, plan_version, payload_hash, invalidated_at from wf_approvals
      where mission_id = $1::uuid`,
    [input.missionId] as never,
  );
  const live = hasLivePlanApproval(
    { version: input.planVersion, planHash: input.planHash },
    approvals.map((a) => ({
      kind: a["kind"] as string,
      status: a["status"] as string,
      planVersion: a["plan_version"] === null ? null : Number(a["plan_version"]),
      payloadHash: (a["payload_hash"] as string | null) ?? null,
      invalidatedAt: a["invalidated_at"] ? String(a["invalidated_at"]) : null,
    })),
  );
  if (!live) throw new Error("Approve the plan before approving its outside actions.");
  await query(
    `insert into wf_approvals (mission_id, workspace_id, kind, status, decided_by, decided_at,
        note, plan_version, payload_hash, cost_limit)
     values ($1::uuid, $2::uuid, 'external_action', 'approved', $3, now(),
             'Outside actions approved for this plan version', $4::int, $5, $6::int)`,
    [
      input.missionId,
      input.workspaceId,
      input.actorId,
      input.planVersion,
      input.planHash,
      Number(plan["estimated_usage"]),
    ] as never,
  );
  await query(
    `update wf_missions set external_actions_approved = true, permission_ceiling = 'act_externally',
        status = 'queued', updated_at = now()
      where id = $1::uuid`,
    [input.missionId] as never,
  );
  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: input.missionId,
    type: "external_actions.approved",
    actorKind: "user",
    actorId: input.actorId,
    data: { version: input.planVersion, hash: input.planHash },
  });
}

/** Mission statuses from which nothing more can happen. */
export const TERMINAL = TERMINAL_MISSION_STATUSES;

/** Statuses a running mission may be paused from. */
export const PAUSABLE: readonly MissionStatus[] = ["queued", "running", "blocked"];
