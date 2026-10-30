/**
 * Phase A1 — Studio supervised investigation ↔ durable wf worker spine.
 * Human gates and usage authority stay on the supervised mission document.
 */
import { createHash } from "node:crypto";
import type { Executor } from "@/lib/db/builder";
import type { DbClient } from "@/lib/workforce/access.server";
import {
  appendEvent,
  approvePlanVersion,
  savePlanVersion,
} from "@/lib/workforce/plan-store.server";
import type { AdvanceResult, Actor } from "@/lib/workforce/worker.server";
import { MAX_ATTEMPTS } from "@/lib/workforce/worker.server";
import type { GeneratedPlan, WfMissionTask } from "@/lib/workforce/types";
import { createMissionStore } from "./repository.server";
import { scopeHash } from "./scope.server";
import { SupervisedMissionService } from "./service";
import type { SupervisedMission } from "./types";

export const SUPERVISED_RESEARCH_TASK_KEY = "studio_research_pass";
export const SUPERVISED_WF_LINK_KIND = "research_pass";

export type SupervisedWorkerLink = {
  wfMissionId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  teamScopeHash: string;
};

function isMissingLinkTable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /psi_supervised_wf_links/i.test(msg) && /(does not exist|unknown table)/i.test(msg);
}

export function supervisedTeamScopeHash(mission: SupervisedMission): string {
  const scope = scopeHash(mission.brief, mission.evidence);
  return createHash("sha256")
    .update(
      JSON.stringify({
        scope,
        teamApprovedAt: mission.team?.approvedAt ?? null,
        teamApprovedBy: mission.team?.approvedBy ?? null,
      }),
    )
    .digest("hex");
}

export function supervisedResearchWorkerPlan(question: string): GeneratedPlan {
  const trimmed = question.trim().slice(0, 280) || "Studio investigation";
  return {
    summary:
      "DeliverX Studio research pass — execution bound to an approved supervised mission (no duplicate human gate).",
    estimatedUsage: 0,
    requiredPermission: "execute_internally",
    includesExternalActions: false,
    clarificationQuestions: [],
    acceptanceCriteria: [
      "Supervised evidence register updated with findings and/or honest external gaps.",
    ],
    tasks: [
      {
        key: SUPERVISED_RESEARCH_TASK_KEY,
        title: "Studio research pass",
        description: `Research pass for: ${trimmed}`,
        capabilityIds: ["DX-018"],
        permissionRequired: "execute_internally",
        isExternal: false,
        estimatedUsage: 0,
        dependsOn: [],
        acceptanceCriteria:
          "Research pass completed on the linked supervised mission or failed with an honest error.",
        gate: false,
      },
    ],
    assignedCapabilities: [
      {
        capability_id: "DX-018",
        name: "Evidence Integrity",
        department: "Research",
        lifecycle_status: "Available",
        role_in_plan: "Registers research findings and honest gaps for Studio investigation.",
      },
    ],
    capabilityLimitations: [],
  };
}

function idempotencyKey(missionId: string, teamScopeHash: string): string {
  return `research_pass:${missionId}:${teamScopeHash}`;
}

async function ensureProjectId(
  query: Executor,
  workspaceId: string,
  ownerUserId: string,
  projectId: string | null,
): Promise<string> {
  if (projectId) return projectId;
  const rows = await query(
    `select id from wf_projects where workspace_id = $1::uuid order by created_at asc limit 1`,
    [workspaceId] as never,
  );
  if (rows[0]?.["id"]) return String(rows[0]["id"]);
  const created = await query(
    `insert into wf_projects (workspace_id, name, created_by)
     values ($1::uuid, $2, $3) returning id`,
    [workspaceId, "Studio investigations", ownerUserId] as never,
  );
  return String(created[0]!["id"]);
}

/** Enqueue a wf mission for an already-approved supervised research pass. Idempotent per scope hash. */
export async function queueSupervisedResearchWorkerJob(
  query: Executor,
  input: {
    workspaceId: string;
    mission: SupervisedMission;
    actorId: string;
  },
): Promise<SupervisedWorkerLink | null> {
  const mission = input.mission;
  if (!mission.team?.approvedAt) return null;
  const teamScopeHash = supervisedTeamScopeHash(mission);
  const key = idempotencyKey(mission.id, teamScopeHash);

  const existing = await query(
    `select wf_mission_id, status from psi_supervised_wf_links
      where idempotency_key = $1 limit 1`,
    [key] as never,
  );
  if (existing[0]) {
    return {
      wfMissionId: String(existing[0]["wf_mission_id"]),
      status: existing[0]["status"] as SupervisedWorkerLink["status"],
      teamScopeHash,
    };
  }

  await query(
    `update psi_supervised_wf_links set status = 'cancelled', updated_at = now()
      where supervised_mission_id = $1::uuid and link_kind = $2 and status in ('queued', 'running')
        and team_scope_hash <> $3`,
    [mission.id, SUPERVISED_WF_LINK_KIND, teamScopeHash] as never,
  );

  const projectId = await ensureProjectId(
    query,
    input.workspaceId,
    mission.ownerUserId,
    mission.projectId,
  );
  const requestText = mission.brief.question.trim().slice(0, 4000);
  const plan = supervisedResearchWorkerPlan(requestText);

  const missionRows = await query(
    `insert into wf_missions (workspace_id, project_id, intent, title, request_text, status,
        clarification_answers, permission_ceiling, created_by)
     values ($1::uuid, $2::uuid, 'investigate', $3, $4, 'awaiting_approval', '{}'::jsonb,
             'execute_internally', $5)
     returning id`,
    [
      input.workspaceId,
      projectId,
      `Studio: ${requestText.slice(0, 80)}`,
      requestText,
      input.actorId,
    ] as never,
  );
  const wfMissionId = String(missionRows[0]!["id"]);

  const { version, hash } = await savePlanVersion(query, {
    workspaceId: input.workspaceId,
    missionId: wfMissionId,
    requestText,
    plan,
    actorId: input.actorId,
    reason: "Studio supervised plan approval (mirrored binding)",
  });

  await approvePlanVersion(query, {
    workspaceId: input.workspaceId,
    missionId: wfMissionId,
    planVersion: version,
    planHash: hash,
    actorId: input.actorId,
    approveExternal: false,
  });

  await query(
    `insert into psi_supervised_wf_links
       (workspace_id, supervised_mission_id, wf_mission_id, link_kind, team_scope_hash,
        team_approved_at, idempotency_key, status)
     values ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::timestamptz, $7, 'queued')
     on conflict (supervised_mission_id, link_kind, team_scope_hash) do update
       set updated_at = now(), status = excluded.status
     returning wf_mission_id, status`,
    [
      input.workspaceId,
      mission.id,
      wfMissionId,
      SUPERVISED_WF_LINK_KIND,
      teamScopeHash,
      mission.team.approvedAt,
      key,
    ] as never,
  );

  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: wfMissionId,
    type: "studio.supervised.linked",
    actorKind: "system",
    actorId: input.actorId,
    data: {
      supervisedMissionId: mission.id,
      teamScopeHash,
      usageAuthority: "psi_supervised_missions",
    },
  });

  return { wfMissionId, status: "queued", teamScopeHash };
}

export async function cancelStaleSupervisedWorkerLinks(
  query: Executor,
  input: { workspaceId: string; supervisedMissionId: string; reason: string },
): Promise<void> {
  const rows = await query(
    `update psi_supervised_wf_links set status = 'cancelled', updated_at = now()
      where workspace_id = $1::uuid and supervised_mission_id = $2::uuid
        and status in ('queued', 'running')
      returning wf_mission_id`,
    [input.workspaceId, input.supervisedMissionId] as never,
  );
  for (const row of rows) {
    const wfMissionId = String(row["wf_mission_id"]);
    await query(
      `update wf_missions set status = 'cancelled', updated_at = now()
        where id = $1::uuid and status in ('queued', 'running', 'awaiting_approval', 'planned')`,
      [wfMissionId] as never,
    );
    await appendEvent(query, {
      workspaceId: input.workspaceId,
      missionId: wfMissionId,
      type: "studio.supervised.link_cancelled",
      actorKind: "system",
      data: { reason: input.reason, supervisedMissionId: input.supervisedMissionId },
    });
  }
}

export async function loadSupervisedLinkByWfMission(
  query: Executor,
  workspaceId: string,
  wfMissionId: string,
): Promise<{
  supervisedMissionId: string;
  linkId: string;
  status: SupervisedWorkerLink["status"];
} | null> {
  const rows = await query(
    `select id, supervised_mission_id, status from psi_supervised_wf_links
      where workspace_id = $1::uuid and wf_mission_id = $2::uuid and link_kind = $3
      order by created_at desc limit 1`,
    [workspaceId, wfMissionId, SUPERVISED_WF_LINK_KIND] as never,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    linkId: String(row["id"]),
    supervisedMissionId: String(row["supervised_mission_id"]),
    status: row["status"] as SupervisedWorkerLink["status"],
  };
}

async function mirrorResearchActivity(
  query: Executor,
  input: {
    workspaceId: string;
    wfMissionId: string;
    taskId: string;
    supervisedMissionId: string;
    kinds: string[];
  },
): Promise<void> {
  for (const kind of input.kinds) {
    await appendEvent(query, {
      workspaceId: input.workspaceId,
      missionId: input.wfMissionId,
      taskId: input.taskId,
      type: `studio.${kind}`,
      actorKind: "worker",
      data: { supervisedMissionId: input.supervisedMissionId },
    });
  }
}

/** Worker step: run supervised research pass and commit wf task without wf usage charge. */
export async function executeSupervisedResearchWorkerStep(input: {
  reader: DbClient;
  workspaceId: string;
  missionId: string;
  task: WfMissionTask;
  attempt: number;
  runKey: string;
  workerId: string;
  actor: Actor;
  started: number;
}): Promise<AdvanceResult> {
  const { workspaceId, missionId, task, attempt, runKey, workerId, actor, started } = input;
  const latency = () => Date.now() - started;

  let supervisedMissionId: string | undefined;
  let linkId: string | undefined;

  try {
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const link = await neonTransaction(async (_tx, query) =>
      loadSupervisedLinkByWfMission(query, workspaceId, missionId),
    );
    if (!link) {
      return {
        progressed: false,
        done: true,
        note: "No Studio supervised link for this worker mission.",
      };
    }
    const supervisedId = link.supervisedMissionId;
    const activeLinkId = link.linkId;
    supervisedMissionId = supervisedId;
    linkId = activeLinkId;

    await neonTransaction(async (_tx, query) => {
      await query(
        `update psi_supervised_wf_links set status = 'running', updated_at = now()
          where id = $1::uuid and status in ('queued', 'running')`,
        [activeLinkId] as never,
      );
    });

    const { neonDb } = await import("@/lib/db/neon.server");
    const db = await neonDb();
    const service = new SupervisedMissionService(createMissionStore(db));
    const after = await service.runQueuedResearchPass({
      workspaceId,
      id: supervisedId,
      workerId,
      nowMs: Date.now(),
    });

    const activityKinds = (after.activity ?? [])
      .slice(-6)
      .map((e) => e.kind)
      .filter((k) =>
        /research\.pass|research\.(cited|external_gap)|task\.(started|completed)/.test(k),
      );

    return neonTransaction(async (_tx, query): Promise<AdvanceResult> => {
      await query(
        `update wf_task_runs set status = 'completed', failure_class = null, detail = null,
            latency_ms = $2::int, finished_at = now()
          where idempotency_key = $1 and status = 'running'`,
        [runKey, latency()] as never,
      );
      await query(
        `update wf_mission_tasks set status = 'completed', completed_at = now(),
            lease_owner = null, lease_until = null, actual_usage = 0, updated_at = now()
          where id = $1::uuid`,
        [task.id] as never,
      );
      await query(
        `update wf_missions set status = 'completed', updated_at = now() where id = $1::uuid`,
        [missionId] as never,
      );
      await query(
        `update psi_supervised_wf_links set status = 'completed', updated_at = now() where id = $1::uuid`,
        [activeLinkId] as never,
      );
      await mirrorResearchActivity(query, {
        workspaceId,
        wfMissionId: missionId,
        taskId: task.id,
        supervisedMissionId: supervisedId,
        kinds: activityKinds.length ? activityKinds : ["research.pass.completed"],
      });
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: "task.completed",
        actorKind: actor.kind,
        actorId: actor.id,
        data: {
          attempt,
          studioSupervisedMissionId: supervisedId,
          researchPassCompletedAt: after.researchPassCompletedAt,
          provider: after.researchProvider,
        },
      });
      return {
        progressed: true,
        done: true,
        note: after.researchPassCompletedAt
          ? "Studio research pass completed on the supervised record."
          : "Studio research pass left queued on the supervised record.",
      };
    });
  } catch (error) {
    const detail = (error instanceof Error ? error.message : "Research pass failed.").slice(0, 500);
    const retry = attempt < MAX_ATTEMPTS;
    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) => {
      if (retry) {
        await query(
          `update wf_mission_tasks set status = 'pending', lease_owner = null, lease_until = null,
              started_at = null, updated_at = now() where id = $1::uuid`,
          [task.id] as never,
        );
      } else {
        await query(
          `update wf_mission_tasks set status = 'failed', completed_at = now(), lease_owner = null,
              lease_until = null, updated_at = now() where id = $1::uuid`,
          [task.id] as never,
        );
        await query(
          `update wf_missions set status = 'failed', updated_at = now() where id = $1::uuid`,
          [missionId] as never,
        );
        if (linkId!) {
          await query(
            `update psi_supervised_wf_links set status = 'failed', updated_at = now() where id = $1::uuid`,
            [linkId] as never,
          );
        }
      }
      await query(
        `update wf_task_runs set status = $2, failure_class = 'studio_research_pass', detail = $3,
            latency_ms = $4::int, finished_at = now()
          where idempotency_key = $1 and status = 'running'`,
        [runKey, retry ? "failed" : "failed", detail, latency()] as never,
      );
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: retry ? "task.requeued" : "task.failed",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt, detail, studio: true },
      });
    });
    return {
      progressed: true,
      done: !retry,
      note: retry ? `Research pass error; retrying (${detail})` : detail,
    };
  }
}

export async function bindSupervisedResearchWorkerAfterApproval(input: {
  workspaceId: string;
  mission: SupervisedMission;
  actorId: string;
}): Promise<SupervisedWorkerLink | null> {
  try {
    const { neonTransaction } = await import("@/lib/db/neon.server");
    const link = await neonTransaction(async (_tx, query) =>
      queueSupervisedResearchWorkerJob(query, input),
    );
    if (link?.wfMissionId) {
      const { kickWorker } = await import("@/lib/workforce/worker.server");
      await kickWorker({ workspaceId: input.workspaceId, missionId: link.wfMissionId });
    }
    return link;
  } catch (error) {
    if (isMissingLinkTable(error)) return null;
    console.error("Studio worker bind failed", error);
    return null;
  }
}

export async function invalidateSupervisedWorkerLinksAfterBriefChange(input: {
  workspaceId: string;
  supervisedMissionId: string;
}): Promise<void> {
  try {
    const { neonTransaction } = await import("@/lib/db/neon.server");
    await neonTransaction(async (_tx, query) =>
      cancelStaleSupervisedWorkerLinks(query, {
        workspaceId: input.workspaceId,
        supervisedMissionId: input.supervisedMissionId,
        reason: "brief_or_scope_changed",
      }),
    );
  } catch (error) {
    if (isMissingLinkTable(error)) return;
    console.error("Studio worker invalidate failed", error);
  }
}

export function withWorkerLinkDocument(
  mission: SupervisedMission,
  link: SupervisedWorkerLink | null,
): SupervisedMission {
  if (!link) return mission;
  return {
    ...mission,
    workerLink: {
      wfMissionId: link.wfMissionId,
      status: link.status,
      teamScopeHash: link.teamScopeHash,
    },
  };
}
