/**
 * Durable mission worker (server only). A step runs in three parts:
 *
 * 1. Claim, in one transaction with the mission and workspace rows locked:
 *    re-check stop, pause, cancel and the plan approval, respect the
 *    concurrency limits, lease the task and open a run in `wf_task_runs`.
 * 2. Work, outside any transaction: the model call and the executor.
 * 3. Commit, in one transaction: only while this worker still holds the
 *    lease, charge usage, save the artefact, close the task and the run, and
 *    record the event. Either all of it lands or none of it does.
 *
 * A worker that dies between claim and commit leaves a lease that expires;
 * `recoverExpiredLeases` returns the task to the queue (or fails it after
 * MAX_ATTEMPTS) and marks the run abandoned. Nothing is charged for work that
 * was never committed.
 */
import { randomUUID } from "node:crypto";
import type { Executor } from "@/lib/db/builder";
import { adminDb, loadMissionBundle, neonServer, type DbClient } from "./access.server";
import {
  TRANSIENT_MODEL_FAILURES,
  buildDeliveryReport,
  executeTaskStep,
  isStructureCheck,
  nextMissionStatusAfterRun,
  type ExecuteStepResult,
  type GeneratedContent,
  type UpstreamArtefact,
} from "./executor";
import { runnableTasks, unreachableTasks } from "./graph";
import { evidenceForPrompt, includesResearchMaterial, type WfEvidence } from "./evidence";
import { listEvidence } from "./evidence.server";
import { extractMemory, memoryForPrompt } from "./product-memory";
import { listProductMemory, recordMemory } from "./product-memory.server";
import { appendEvent, hasLivePlanApproval } from "./plan-store.server";
import { leadRole, roleInstructions, stageForTask } from "./registry/instructions";
import { checkStageOutput, citableSources } from "./registry/output-checks";
import { canAfford } from "./usage";
import type { MissionBundle, WfMissionTask } from "./types";

/** How long a claimed task stays leased to one worker. */
export const LEASE_SECONDS = 300;
/** Tasks that may run at once in one workspace. */
export const MAX_RUNNING_PER_WORKSPACE = 2;
/** Claims of one task before an expired lease fails it instead of retrying. */
export const MAX_ATTEMPTS = 3;
/** Work started within this many milliseconds of the deadline is not begun. */
const STEP_HEADROOM_MS = 15_000;

const ACTIVE = ["queued", "running", "blocked"];

export type Actor = { kind: "user" | "worker"; id: string };

export type AdvanceResult = {
  /** Something changed: a task ran, a gate was raised, or the mission finished. */
  progressed: boolean;
  /** Nothing more can happen for this mission until something else changes. */
  done: boolean;
  note?: string;
};

type Tx = (work: (db: DbClient, query: Executor) => Promise<unknown>) => Promise<unknown>;

async function transaction<T>(work: (db: DbClient, query: Executor) => Promise<T>): Promise<T> {
  const { neonTransaction } = await neonServer();
  return (neonTransaction as Tx)(work) as Promise<T>;
}

/** Builder calls return errors instead of throwing; inside a transaction every error must abort it. */
function must<T extends { error?: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

async function auditTx(
  query: Executor,
  input: {
    workspaceId: string;
    missionId: string;
    actorId: string;
    eventType: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await query(
    `insert into wf_audit_events (workspace_id, mission_id, actor_id, event_type, entity_type, entity_id, metadata)
     values ($1::uuid, $2::uuid, $3, $4, $5, $6::uuid, $7::jsonb)`,
    [
      input.workspaceId,
      input.missionId,
      input.actorId,
      input.eventType,
      input.entityType,
      input.entityId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ] as never,
  );
}

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

/**
 * The lead role's instructions and output checks for a stage, when a defined
 * role leads it. Checked output that still fails after the corrective retry
 * is rejected by the model runner.
 */
export function roleGuidance(
  task: Pick<WfMissionTask, "key" | "capabilityIds">,
  upstream: UpstreamArtefact[],
  clarificationAnswers: Readonly<Record<string, string>> = {},
  evidence: readonly WfEvidence[] = [],
  /** Founder sources from earlier missions of the same product that are still current. */
  priorSources: readonly string[] = [],
):
  | {
      extraInstructions: string;
      extraCheck: (content: string) => string | null;
      instructionVersion: string;
    }
  | Record<string, never> {
  const stage = stageForTask(task.key);
  const lead = leadRole(task);
  const instructions = stage && lead ? roleInstructions(lead, stage) : null;
  if (!stage || !instructions) return {};
  const given = upstream.map((u) => u.content).join("\n\n");
  const shown = evidenceForPrompt(evidence);
  const usable = shown.used;
  const research = includesResearchMaterial(shown.sent);
  return {
    extraInstructions: instructions.text,
    instructionVersion: instructions.version,
    extraCheck: (content) => {
      // Only evidence the model was actually given can be cited, and only evidence recording
      // interviews, surveys or calls can excuse a claim of such research.
      const r = checkStageOutput(
        stage,
        content,
        {
          founderEvidence: research,
          sources: citableSources(clarificationAnswers, [
            ...upstream.map((u) => u.title),
            ...usable.map((e) => e.title),
            ...priorSources,
          ]),
        },
        given,
      );
      return r.ok ? null : r.failures.join("; ");
    },
  };
}

/** Upstream artefacts for a task: outputs of its transitive dependencies. */
export function upstreamFor(task: WfMissionTask, bundle: MissionBundle): UpstreamArtefact[] {
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

function reportMarkdown(report: ReturnType<typeof buildDeliveryReport>) {
  return `# ${report.headline}\n\n${report.summary}\n\n## Outcomes\n${report.outcomes.map((o) => `- ${o}`).join("\n")}\n\n## Open risks\n${report.openRisks.map((r) => `- ${r}`).join("\n")}\n\n## Usage spent\n${report.usageSpent} credits`;
}

/** Ends a mission that hit its usage ceiling, with a partial delivery report. Caller holds the mission lock. */
async function stopAtCeiling(db: DbClient, query: Executor, bundle: MissionBundle, actor: Actor) {
  const { mission } = bundle;
  const report = buildDeliveryReport({
    missionTitle: mission.title,
    intent: mission.intent,
    tasks: bundle.tasks,
    artefacts: bundle.artefacts,
    usageSpent: bundle.tasks.reduce((s, t) => s + t.actualUsage, 0),
    partial: true,
  });
  must(
    await db
      .from("wf_missions")
      .update({
        status: "partially_completed",
        delivery_report: report,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mission.id)
      .in("status", ACTIVE),
  );
  await appendEvent(query, {
    workspaceId: mission.workspaceId,
    missionId: mission.id,
    type: "mission.usage_ceiling",
    actorKind: actor.kind,
    actorId: actor.id,
  });
}

/** Moves tasks downstream of a failure to blocked, then records the mission's final status and report. */
async function finalise(
  db: DbClient,
  query: Executor,
  bundle: MissionBundle,
  actor: Actor,
): Promise<AdvanceResult> {
  const { mission } = bundle;
  const dead = unreachableTasks(bundle.tasks);
  if (dead.length) {
    must(
      await db
        .from("wf_mission_tasks")
        .update({ status: "blocked", updated_at: new Date().toISOString() })
        .in(
          "id",
          dead.map((t) => t.id),
        )
        .eq("status", "pending"),
    );
  }
  const fresh = await loadMissionBundle(db, mission.workspaceId, mission.id);
  const finalStatus = nextMissionStatusAfterRun({ tasks: fresh.tasks, hitCeiling: false });
  const report = buildDeliveryReport({
    missionTitle: mission.title,
    intent: mission.intent,
    tasks: fresh.tasks,
    artefacts: fresh.artefacts.filter((a) => a.kind !== "delivery_report"),
    usageSpent: fresh.tasks.reduce((sum, t) => sum + t.actualUsage, 0),
    partial: finalStatus !== "completed",
  });
  must(
    await db
      .from("wf_missions")
      .update({
        status: finalStatus,
        delivery_report: report,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mission.id)
      .in("status", ACTIVE),
  );
  if (finalStatus !== "blocked") {
    must(
      await db.from("wf_artefacts").insert({
        mission_id: mission.id,
        workspace_id: mission.workspaceId,
        kind: "delivery_report",
        title: report.headline,
        content: reportMarkdown(report),
        content_format: "markdown",
        quality_labels: report.qualitySummary,
        evidence_items: [],
      }),
    );
  }
  await appendEvent(query, {
    workspaceId: mission.workspaceId,
    missionId: mission.id,
    type: "mission.finished",
    actorKind: actor.kind,
    actorId: actor.id,
    data: { status: finalStatus },
  });
  return { progressed: true, done: true };
}

/** Locks the mission and its workspace for the rest of the transaction and reports whether work may start. */
async function lockForWork(query: Executor, workspaceId: string, missionId: string) {
  const rows = await query(
    `select m.status, w.stopped_at from wf_missions m
       join wf_workspaces w on w.id = m.workspace_id
      where m.id = $1::uuid and m.workspace_id = $2::uuid
      for update of m, w`,
    [missionId, workspaceId] as never,
  );
  const row = rows[0];
  if (!row) return "Mission not found.";
  if (row["stopped_at"]) return "Workspace stopped: no new work starts.";
  if (!ACTIVE.includes(row["status"] as string))
    return `Mission is ${String(row["status"]).replace(/_/g, " ")}: no new work starts.`;
  return null;
}

type Claim = { task: WfMissionTask; attempt: number; runKey: string };

/**
 * Advances one mission by one step. Safe to call from any number of workers
 * at once: claims and commits are serialised on the mission and workspace rows.
 */
export async function advanceMission(input: {
  workspaceId: string;
  missionId: string;
  actor: Actor;
  workerId: string;
}): Promise<AdvanceResult> {
  const { workspaceId, missionId, actor, workerId } = input;
  const reader = await adminDb();
  const bundle = await loadMissionBundle(reader, workspaceId, missionId);
  const { mission, tasks } = bundle;
  if (!ACTIVE.includes(mission.status)) return { progressed: false, done: true };
  // Work runs only under a live approval bound to the current plan version.
  if (!hasLivePlanApproval(bundle.plan, bundle.approvals)) {
    return {
      progressed: false,
      done: true,
      note: "The current plan has no live approval. Review and approve it before work continues.",
    };
  }

  // Approved external tasks re-enter the schedule; everything else follows the DAG.
  const retryable = (t: WfMissionTask) =>
    t.status === "blocked" && t.isExternal && mission.externalActionsApproved;
  const nodes = tasks.map((t) => ({
    ...t,
    status: retryable(t) ? ("pending" as const) : t.status,
  }));
  const runnable = runnableTasks(nodes);
  const candidates = runnable.filter((t) => !t.gate);
  const running = tasks.some((t) => t.status === "running");

  if (!candidates.length) {
    // Another worker's task may unlock more work or fail a branch: decide once it lands.
    if (running) return { progressed: false, done: false, note: "Waiting for work in progress." };
    return transaction(async (db, query) => {
      const refused = await lockForWork(query, workspaceId, missionId);
      if (refused) return { progressed: false, done: true, note: refused };
      const gate =
        runnable.find((t) => t.gate) ?? tasks.find((t) => t.gate && t.status === "blocked");
      if (gate) {
        if (gate.status !== "blocked") {
          must(
            await db
              .from("wf_mission_tasks")
              .update({ status: "blocked", updated_at: new Date().toISOString() })
              .eq("id", gate.id)
              .eq("status", "pending"),
          );
          await auditTx(query, {
            workspaceId,
            missionId,
            actorId: actor.id,
            eventType: "mission.awaiting_gate",
            entityType: "task",
            entityId: gate.id,
            metadata: { gate: gate.key },
          });
          await appendEvent(query, {
            workspaceId,
            missionId,
            taskId: gate.id,
            type: "gate.waiting",
            actorKind: actor.kind,
            actorId: actor.id,
            data: { gate: gate.key },
          });
        }
        must(
          await db
            .from("wf_missions")
            .update({ status: "blocked", updated_at: new Date().toISOString() })
            .eq("id", missionId)
            .in("status", ACTIVE),
        );
        return {
          progressed: gate.status !== "blocked",
          done: true,
          note: `Awaiting human gate: ${gate.title}`,
        };
      }
      return finalise(db, query, await loadMissionBundle(db, workspaceId, missionId), actor);
    });
  }

  // 1. Claim.
  const claim = await transaction(async (db, query): Promise<Claim | string> => {
    const refused = await lockForWork(query, workspaceId, missionId);
    if (refused) return refused;
    // The workspace row is locked, so these counts cannot change under us.
    const busy = await query(
      `select capability_ids from wf_mission_tasks
        where workspace_id = $1::uuid and status = 'running'
          and (lease_until is null or lease_until > now())`,
      [workspaceId] as never,
    );
    if (busy.length >= MAX_RUNNING_PER_WORKSPACE)
      return "This workspace is already running its limit of tasks.";
    const busySpecialists = new Set(busy.flatMap((r) => (r["capability_ids"] as string[]) ?? []));
    const next = candidates.find((t) => !t.capabilityIds.some((c) => busySpecialists.has(c)));
    if (!next) return "The specialists for the next tasks are busy.";
    // A task that has used all its attempts fails instead of being tried again.
    const spent = await query(
      `update wf_mission_tasks set status = 'failed', completed_at = now(), updated_at = now()
        where id = $1::uuid and status in ('pending', 'blocked') and attempt >= $2::int
        returning attempt`,
      [next.id, MAX_ATTEMPTS] as never,
    );
    if (spent.length) {
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: next.id,
        type: "task.failed",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt: Number(spent[0]!["attempt"]), reason: "max_attempts" },
      });
      return "exhausted";
    }
    const taken = await query(
      `update wf_mission_tasks
          set status = 'running', started_at = now(), attempt = attempt + 1,
              lease_owner = $2, lease_until = now() + make_interval(secs => $3::int), updated_at = now()
        where id = $1::uuid and status in ('pending', 'blocked') returning attempt`,
      [next.id, workerId, LEASE_SECONDS] as never,
    );
    if (!taken.length) return "Task already claimed by another run.";
    const attempt = Number(taken[0]!["attempt"]);
    const runKey = `${next.id}:${attempt}`;
    await query(
      `insert into wf_task_runs (workspace_id, mission_id, task_id, attempt, idempotency_key, worker_id)
       values ($1::uuid, $2::uuid, $3::uuid, $4::int, $5, $6)`,
      [workspaceId, missionId, next.id, attempt, runKey, workerId] as never,
    );
    must(
      await db
        .from("wf_missions")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", missionId),
    );
    await appendEvent(query, {
      workspaceId,
      missionId,
      taskId: next.id,
      type: "task.started",
      actorKind: actor.kind,
      actorId: actor.id,
      data: { attempt, worker: workerId },
    });
    return { task: tasks.find((t) => t.id === next.id)!, attempt, runKey };
  });
  if (claim === "exhausted")
    return { progressed: true, done: false, note: "A task used all its attempts and failed." };
  if (typeof claim === "string") return { progressed: false, done: false, note: claim };

  // 2. Work, outside any transaction.
  const { task, attempt, runKey } = claim;
  const started = Date.now();
  let generated: GeneratedContent | undefined;
  let result: ExecuteStepResult | undefined;
  const guidance = roleGuidance(task, []);
  let memoryIncluded = 0;
  const roleId = "extraInstructions" in guidance ? leadRole(task) : null;
  try {
    const live = must(
      await reader
        .from("wf_workspaces")
        .select("usage_ceiling, usage_consumed")
        .eq("id", workspaceId)
        .single(),
    ).data as { usage_ceiling: number; usage_consumed: number };
    const budget = { ceiling: live.usage_ceiling, consumed: live.usage_consumed };
    const upstream = task.produces
      ? upstreamFor(task, bundle)
      : isStructureCheck(task)
        ? savedPrototypes(bundle)
        : [];
    // Founder evidence and product memory as they stand when the step builds its prompt.
    const context = task.produces
      ? await transaction(async (_db, q) => ({
          evidence: (await listEvidence(q, workspaceId, missionId)).items,
          memory: (await listProductMemory(q, workspaceId, mission.projectId)).entries,
        }))
      : { evidence: [], memory: [] };
    const evidence = context.evidence;
    const memory = memoryForPrompt(context.memory, missionId);
    memoryIncluded = memory.included;
    // Only spend a model call when the step is affordable and permitted.
    generated =
      task.produces &&
      task.produces !== "test_report" &&
      canAfford(budget, task.estimatedUsage) &&
      !task.isExternal
        ? await (
            await import("./model-runner.server")
          ).generateStageContent({
            mission,
            task,
            upstream,
            evidence,
            ...(memory.text ? { productMemory: memory.text } : {}),
            ...roleGuidance(task, upstream, mission.clarificationAnswers, evidence, memory.citable),
          })
        : undefined;
    // A configured model that failed never turns into a simulated draft.
    if (!generated?.failure)
      result = executeTaskStep({
        mission,
        task: { ...task, status: "running" },
        budget,
        upstream,
        ...(generated ? { generated } : {}),
      });
  } catch (error) {
    // The task goes back to the queue; the run keeps the failure.
    await transaction(async (_db, query) => {
      await query(
        `update wf_mission_tasks set status = 'pending', lease_owner = null, lease_until = null,
            started_at = null, updated_at = now()
          where id = $1::uuid and lease_owner = $2 and attempt = $3::int and status = 'running'`,
        [task.id, workerId, attempt] as never,
      );
      await query(
        `update wf_task_runs set status = 'failed', failure_class = 'worker_error', detail = $2,
            latency_ms = $3::int, finished_at = now()
          where idempotency_key = $1 and status = 'running'`,
        [runKey, (error as Error).message.slice(0, 500), Date.now() - started] as never,
      );
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: "task.errored",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt },
      });
    });
    return { progressed: true, done: false, note: "The step hit an error and was put back." };
  }

  // 3. Commit, only while this worker still holds the lease.
  const latency = Date.now() - started;
  return transaction(async (db, query): Promise<AdvanceResult> => {
    const calls = generated?.calls ?? [];
    // A total only when every call reported it; a partial sum would understate usage.
    const sum = (k: "inputTokens" | "outputTokens") =>
      calls.length > 0 && calls.every((c) => c[k] !== null)
        ? calls.reduce((n, c) => n + (c[k] ?? 0), 0)
        : null;
    // Role and instructions are recorded only when a model actually received them.
    const modelSaw = calls.length > 0;
    const lastCall = calls.at(-1);
    const closeRun = (status: string, failureClass: string | null, detail?: string) =>
      query(
        `update wf_task_runs set status = $2, failure_class = $3, detail = $4, model = $5,
            provider = $6, latency_ms = $7::int, input_tokens = $8::int, output_tokens = $9::int,
            request_id = $10, model_calls = $11::int, role_id = $12, instruction_version = $13,
            finished_at = now()
          where idempotency_key = $1 and status = 'running'`,
        [
          runKey,
          status,
          failureClass,
          detail?.slice(0, 500) ?? null,
          lastCall?.model ?? null,
          lastCall?.provider ?? null,
          latency,
          sum("inputTokens"),
          sum("outputTokens"),
          [...calls].reverse().find((c) => c.requestId)?.requestId ?? null,
          calls.length,
          modelSaw ? roleId : null,
          modelSaw ? (generated?.instructionVersion ?? null) : null,
        ] as never,
      );
    const held = await query(
      `select status, lease_owner, attempt from wf_mission_tasks where id = $1::uuid for update`,
      [task.id] as never,
    );
    const row = held[0];
    if (
      !row ||
      row["status"] !== "running" ||
      row["lease_owner"] !== workerId ||
      Number(row["attempt"]) !== attempt
    ) {
      await closeRun("abandoned", "lease_lost");
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: "task.lease_lost",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt },
      });
      return { progressed: false, done: false, note: "Lease expired before the step finished." };
    }
    const missionRow = await query(
      `select status from wf_missions where id = $1::uuid for update`,
      [missionId] as never,
    );
    const release = () =>
      query(
        `update wf_mission_tasks set status = 'pending', lease_owner = null, lease_until = null,
            started_at = null, updated_at = now()
          where id = $1::uuid`,
        [task.id] as never,
      );
    if (missionRow[0]?.["status"] === "cancelled") {
      await release();
      await closeRun("abandoned", "mission_cancelled");
      return {
        progressed: false,
        done: true,
        note: "Mission was cancelled; the result was discarded.",
      };
    }

    if (!result) {
      // The model is configured but gave no accepted output: retry later or fail the task.
      const failure = generated!.failure!;
      const retry = TRANSIENT_MODEL_FAILURES.includes(failure.class) && attempt < MAX_ATTEMPTS;
      if (retry) await release();
      else
        must(
          await db
            .from("wf_mission_tasks")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              lease_owner: null,
              lease_until: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", task.id),
        );
      await closeRun("failed", failure.class, failure.detail);
      await auditTx(query, {
        workspaceId,
        missionId,
        actorId: actor.id,
        eventType: retry ? "task.model_retry" : "task.model_failed",
        entityType: "task",
        entityId: task.id,
        metadata: { failure: failure.class, detail: failure.detail },
      });
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: retry ? "task.requeued" : "task.failed",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt, reason: failure.class, detail: failure.detail, calls: calls.length },
      });
      return {
        progressed: true,
        done: false,
        note: retry
          ? `The model call failed (${failure.detail}); the step will be tried again.`
          : `The model could not produce this step: ${failure.detail}`,
      };
    }

    const charge = result.ok ? result.usageCharged : (result.usageCharged ?? 0);
    if (charge > 0) {
      const charged = await query(
        `update wf_workspaces set usage_consumed = usage_consumed + $2::int, updated_at = now()
          where id = $1::uuid and usage_consumed + $2::int <= usage_ceiling returning usage_consumed`,
        [workspaceId, charge] as never,
      );
      if (!charged.length) {
        // Lost a race for the last credits: nothing from this step is kept.
        await release();
        await closeRun("failed", "usage_ceiling");
        await stopAtCeiling(db, query, await loadMissionBundle(db, workspaceId, missionId), actor);
        return { progressed: true, done: true, note: "Usage ceiling reached." };
      }
      must(
        await db.from("wf_usage_records").insert({
          workspace_id: workspaceId,
          mission_id: missionId,
          task_id: task.id,
          amount: charge,
          label: task.title,
        }),
      );
    }

    const artefact = result.artefact ?? null;
    const artefactId = randomUUID();
    if (artefact) {
      must(
        await db.from("wf_artefacts").insert({
          id: artefactId,
          mission_id: artefact.missionId,
          workspace_id: artefact.workspaceId,
          task_id: artefact.taskId,
          kind: artefact.kind,
          title: artefact.title,
          content: artefact.content,
          content_format: artefact.contentFormat,
          quality_labels: artefact.qualityLabels,
          evidence_items: artefact.evidenceItems,
        }),
      );
    }
    // What an accepted, model-written artefact states joins the product's memory.
    // Simulated drafts are placeholders and are never remembered.
    if (
      artefact &&
      result.ok &&
      generated?.mode === "model" &&
      artefact.contentFormat === "markdown"
    )
      await recordMemory(
        query,
        {
          workspaceId,
          projectId: mission.projectId,
          missionId,
          originKind: "artefact",
          originId: artefactId,
        },
        extractMemory(artefact.content),
      );
    const now = new Date().toISOString();

    if (!result.ok) {
      const failed = result.reason === "contract_failed";
      must(
        await db
          .from("wf_mission_tasks")
          .update({
            status: failed ? "failed" : "blocked",
            actual_usage: charge,
            completed_at: failed ? now : null,
            lease_owner: null,
            lease_until: null,
            updated_at: now,
          })
          .eq("id", task.id),
      );
      await closeRun("failed", result.reason, result.detail);
      if (result.reason === "ceiling_reached") {
        await stopAtCeiling(db, query, await loadMissionBundle(db, workspaceId, missionId), actor);
      } else if (!failed) {
        must(
          await db
            .from("wf_missions")
            .update({ status: "blocked", updated_at: now })
            .eq("id", missionId)
            .in("status", ACTIVE),
        );
      }
      await auditTx(query, {
        workspaceId,
        missionId,
        actorId: actor.id,
        eventType: failed ? "task.contract_failed" : `mission.${result.reason}`,
        entityType: "task",
        entityId: task.id,
        metadata: result.detail ? { detail: result.detail } : {},
      });
      await appendEvent(query, {
        workspaceId,
        missionId,
        taskId: task.id,
        type: failed ? "task.failed" : "task.blocked",
        actorKind: actor.kind,
        actorId: actor.id,
        data: { attempt, reason: result.reason },
      });
      // A failed stage does not stop independent branches; the next step finalises.
      return {
        progressed: true,
        done: !failed,
        ...(result.detail ? { note: result.detail } : {}),
      };
    }

    must(
      await db
        .from("wf_mission_tasks")
        .update({
          status: "completed",
          actual_usage: result.usageCharged,
          evidence_notes: result.task.evidenceNotes,
          completed_at: result.task.completedAt,
          lease_owner: null,
          lease_until: null,
          updated_at: now,
        })
        .eq("id", task.id),
    );
    await closeRun("completed", null);
    const metadata = {
      usage: result.usageCharged,
      ...(generated ? { generation: generated.mode, model: generated.model ?? null } : {}),
      ...(roleId && modelSaw
        ? { role: roleId, instructions: generated?.instructionVersion ?? null }
        : {}),
      ...(calls.length ? { modelCalls: calls.length } : {}),
      ...(modelSaw && memoryIncluded ? { memoryEntries: memoryIncluded } : {}),
      ...(modelSaw && generated?.evidenceUsed?.length
        ? { evidence: generated.evidenceUsed.map((e) => ({ id: e.id, title: e.title })) }
        : {}),
    };
    await auditTx(query, {
      workspaceId,
      missionId,
      actorId: actor.id,
      eventType: "task.completed",
      entityType: "task",
      entityId: task.id,
      metadata,
    });
    await appendEvent(query, {
      workspaceId,
      missionId,
      taskId: task.id,
      type: "task.completed",
      actorKind: actor.kind,
      actorId: actor.id,
      data: { attempt, ...metadata },
    });
    // Completion is decided on the next step so gates and failures are evaluated on fresh state.
    return { progressed: true, done: false };
  });
}

/**
 * Returns tasks whose lease expired to the queue, or fails them after
 * MAX_ATTEMPTS, and marks their runs abandoned. Tasks left running by builds
 * from before leases existed are treated as expired after 30 minutes.
 */
export async function recoverExpiredLeases(query: Executor): Promise<number> {
  const rows = await query(
    `update wf_mission_tasks
        set status = case when attempt >= $1::int then 'failed' else 'pending' end,
            completed_at = case when attempt >= $1::int then now() else null end,
            started_at = case when attempt >= $1::int then started_at else null end,
            lease_owner = null, lease_until = null, updated_at = now()
      where status = 'running'
        and ((lease_until is not null and lease_until < now())
          or (lease_until is null and started_at < now() - interval '30 minutes'))
      returning id, mission_id, workspace_id, attempt, status`,
    [MAX_ATTEMPTS] as never,
  );
  for (const r of rows) {
    await query(
      `update wf_task_runs set status = 'abandoned', failure_class = 'lease_expired', finished_at = now()
        where task_id = $1::uuid and attempt = $2::int and status = 'running'`,
      [r["id"], r["attempt"]] as never,
    );
    await appendEvent(query, {
      workspaceId: r["workspace_id"] as string,
      missionId: r["mission_id"] as string,
      taskId: r["id"] as string,
      type: r["status"] === "failed" ? "task.failed" : "task.requeued",
      actorKind: "system",
      data: { attempt: Number(r["attempt"]), reason: "lease_expired" },
    });
  }
  return rows.length;
}

/**
 * Runs mission steps until the deadline or until nothing can progress. Scope
 * it to one workspace or mission to serve a nudge; leave it open for the cron.
 */
export async function runWorkerTick(opts: {
  deadline: number;
  workerId?: string;
  workspaceId?: string;
  missionId?: string;
}): Promise<{ steps: number; recovered: number }> {
  const workerId = opts.workerId ?? `worker:${randomUUID()}`;
  const recovered = await transaction((_db, query) => recoverExpiredLeases(query));
  const reader = await adminDb();
  let steps = 0;
  for (;;) {
    let query = reader
      .from("wf_missions")
      .select("id, workspace_id")
      .in("status", ["queued", "running"])
      .order("updated_at", { ascending: true })
      .limit(20);
    if (opts.workspaceId) query = query.eq("workspace_id", opts.workspaceId);
    if (opts.missionId) query = query.eq("id", opts.missionId);
    const missions = (must(await query).data ?? []) as Array<{ id: string; workspace_id: string }>;
    let progressed = false;
    for (const m of missions) {
      if (Date.now() > opts.deadline - STEP_HEADROOM_MS) return { steps, recovered };
      const r = await advanceMission({
        workspaceId: m.workspace_id,
        missionId: m.id,
        actor: { kind: "worker", id: workerId },
        workerId,
      });
      if (r.progressed) {
        steps++;
        progressed = true;
      }
    }
    if (!progressed) return { steps, recovered };
  }
}

/**
 * Starts work right after a change that makes it runnable (approval, resume,
 * a gate decision). On Vercel it continues after the response through the
 * platform's waitUntil; elsewhere it runs detached. Either way the scheduled
 * tick picks up anything left, and leases make a lost run safe.
 */
export async function kickWorker(scope: { workspaceId: string; missionId?: string }) {
  const work = runWorkerTick({ deadline: Date.now() + 50_000, ...scope }).catch(async (error) => {
    const { recordMonitoringEvent, describeUnknownError } = await import("@/lib/monitoring.server");
    await recordMonitoringEvent({
      kind: "server_error",
      severity: "error",
      source: "worker.kick",
      message: "Background mission work failed",
      detail: { error: describeUnknownError(error).message, ...scope },
    }).catch(() => undefined);
  });
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest() as Request & { waitUntil?: (p: Promise<unknown>) => void };
    if (typeof req?.waitUntil === "function") {
      req.waitUntil(work);
      return "background" as const;
    }
  } catch {
    // Not inside a request: the detached promise below still runs.
  }
  void work;
  return "detached" as const;
}
