/**
 * Starts delivery for a decided Studio case: one transaction creates the workforce build
 * mission, saves and approves its plan (the owner's "Begin delivery" click), and records
 * the link on the case. A stale or repeated click rolls the whole transaction back.
 */
import type { Executor } from "@/lib/db/builder";
import { neonTransaction, type DbTransaction } from "@/lib/db/neon.server";
import {
  appendEvent,
  approvePlanVersion,
  savePlanVersion,
} from "@/lib/workforce/plan-store.server";
import { deriveMissionTitle, generateMissionPlan } from "@/lib/workforce/planner";
import { TERMINAL_MISSION_STATUSES } from "@/lib/workforce/types";
import { deliveryEligibility, deliveryRequest, withDelivery } from "./delivery";
import { createMissionStore } from "./repository.server";
import { MissionConflictError, MissionNotFoundError, SupervisedMissionService } from "./service";
import type { SupervisedMission } from "./types";
import { ensureProjectId } from "./workforce-adapter.server";

export class DeliveryNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryNotAllowedError";
  }
}

export async function startSupervisedDelivery(
  input: {
    workspaceId: string;
    id: string;
    expectedVersion: number;
    actorId: string;
    nowMs: number;
  },
  transact: DbTransaction = neonTransaction,
): Promise<{ mission: SupervisedMission; started: boolean }> {
  return transact(async (tx, query) => {
    const store = createMissionStore(tx, transact);
    const mission = await store.get(input.workspaceId, input.id);
    if (!mission) throw new MissionNotFoundError();
    // A repeated click after delivery started is not an error: it opens the same delivery.
    if (mission.delivery) return { mission, started: false };
    if (mission.version !== input.expectedVersion) throw new MissionConflictError();

    const eligibility = deliveryEligibility(mission);
    if (!eligibility.ok) throw new DeliveryNotAllowedError(eligibility.reason);

    const { requestText, clarificationAnswers } = deliveryRequest(mission);
    const plan = generateMissionPlan({ intent: "build", requestText, clarificationAnswers });
    if (!plan.tasks.length) {
      throw new DeliveryNotAllowedError(
        plan.clarificationQuestions[0]?.prompt ?? "The delivery plan could not be prepared.",
      );
    }

    const projectId = await ensureProjectId(
      query,
      input.workspaceId,
      mission.ownerUserId,
      mission.projectId,
    );
    const created = await query(
      `insert into wf_missions (workspace_id, project_id, intent, title, request_text, status,
          clarification_answers, permission_ceiling, created_by)
       values ($1::uuid, $2::uuid, 'build', $3, $4, 'awaiting_approval', $5::jsonb,
               'execute_internally', $6)
       returning id`,
      [
        input.workspaceId,
        projectId,
        deriveMissionTitle("build", mission.brief.question),
        requestText,
        JSON.stringify(clarificationAnswers),
        input.actorId,
      ] as never,
    );
    const wfMissionId = String(created[0]!["id"]);

    const { version, hash } = await savePlanVersion(query, {
      workspaceId: input.workspaceId,
      missionId: wfMissionId,
      requestText,
      plan,
      actorId: input.actorId,
      reason: "Studio Begin delivery",
    });
    // Outside actions are never approved here; they keep their own approval on the mission.
    await approvePlanVersion(query, {
      workspaceId: input.workspaceId,
      missionId: wfMissionId,
      planVersion: version,
      planHash: hash,
      actorId: input.actorId,
      approveExternal: false,
    });
    await appendEvent(query, {
      workspaceId: input.workspaceId,
      missionId: wfMissionId,
      type: "studio.supervised.delivery_linked",
      actorKind: "user",
      actorId: input.actorId,
      data: { supervisedMissionId: mission.id, optionId: mission.approval!.optionId },
    });

    const next = withDelivery(mission, {
      wfMissionId,
      planVersion: version,
      planHash: hash,
      optionId: mission.approval!.optionId,
      approvedAt: new Date(input.nowMs).toISOString(),
      approvedBy: input.actorId,
    });
    await store.save(next, mission.version);
    return { mission: next, started: true };
  });
}

/**
 * Cancels the case and its delivery in one transaction: the build mission is cancelled and its
 * pending approvals can never authorise anything later. Finished missions are left as they are.
 */
export async function cancelCaseAndDelivery(
  input: {
    workspaceId: string;
    id: string;
    expectedVersion: number;
    actorId: string;
    nowMs: number;
  },
  transact: DbTransaction = neonTransaction,
): Promise<SupervisedMission> {
  return transact(async (tx, query) => {
    const service = new SupervisedMissionService(createMissionStore(tx, transact));
    const mission = await service.cancel({
      workspaceId: input.workspaceId,
      id: input.id,
      expectedVersion: input.expectedVersion,
      nowMs: input.nowMs,
    });
    if (mission.delivery) {
      await cancelDeliveryMission(query, {
        workspaceId: input.workspaceId,
        wfMissionId: mission.delivery.wfMissionId,
        actorId: input.actorId,
      });
    }
    return mission;
  });
}

async function cancelDeliveryMission(
  query: Executor,
  input: { workspaceId: string; wfMissionId: string; actorId: string },
): Promise<void> {
  const rows = await query(
    `update wf_missions set status = 'cancelled', updated_at = now()
      where id = $1::uuid and workspace_id = $2::uuid
        and status <> all($3::text[])
      returning id`,
    [input.wfMissionId, input.workspaceId, [...TERMINAL_MISSION_STATUSES]] as never,
  );
  if (!rows.length) return;
  await query(
    `update wf_approvals set invalidated_at = now(), invalidated_reason = 'Studio case cancelled'
      where mission_id = $1::uuid and status = 'pending' and invalidated_at is null`,
    [input.wfMissionId] as never,
  );
  await appendEvent(query, {
    workspaceId: input.workspaceId,
    missionId: input.wfMissionId,
    type: "mission.cancelled",
    actorKind: "user",
    actorId: input.actorId,
    data: { reason: "studio_case_cancelled" },
  });
}
