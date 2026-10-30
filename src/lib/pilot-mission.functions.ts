import { scopeHash } from "./pilot-mission/scope.server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Db } from "@/lib/db/builder";
import { requireAuth } from "@/lib/auth/middleware";
import { wfDb } from "@/lib/workforce/db";
import { runAccountedComparison } from "./pilot-mission/comparison.server";
import {
  generateComparison,
  generationPlan,
  missionScreenText,
  providerLabel,
} from "./pilot-mission/generate.server";
import { createMissionStore, postWorkspaceSpend } from "./pilot-mission/repository.server";
import {
  MissionStoreUnavailableError,
  SupervisedMissionService,
  UsageLimitError,
} from "./pilot-mission/service";
import { projectShelfItems } from "./pilot-mission/build-beats";
import { commerceHardStopMessage } from "./pilot-mission/commerce";
import { learningLinks } from "./pilot-mission/learning";
import {
  assertCanStartInvestigation,
  PILOT_ACTIVATION_MIGRATION_HINT,
  type InvestigationAllowanceLoad,
  type PilotAllowanceSnapshot,
} from "./pilot/paid-availability";
import {
  planResearchMode,
  researchProviderReadiness,
  RESEARCH_MODES,
  type ResearchMode,
} from "./pilot-mission/research-mode";
import { studioInboxFields } from "./pilot-mission/studio-inbox";
import { nextRequiredAction, type SupervisedMission } from "./pilot-mission/types";
import {
  bindSupervisedResearchWorkerAfterApproval,
  invalidateSupervisedWorkerLinksAfterBriefChange,
  withWorkerLinkDocument,
} from "./pilot-mission/workforce-adapter.server";

type DbClient = { from: (table: string) => unknown };

async function database(): Promise<Db> {
  const { neonDb } = await import("@/lib/db/neon.server");
  return neonDb();
}

async function workspaceFor(supabase: DbClient, userId: string) {
  const res = await wfDb(supabase)
    .from("wf_workspaces")
    .select("id, usage_ceiling, usage_consumed")
    .eq("owner_id", userId)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) throw new Error("Open Studio once to create your workspace.");
  return {
    id: String(res.data.id),
    usageCeiling: Number(res.data.usage_ceiling),
    usageConsumed: Number(res.data.usage_consumed),
  };
}

async function serviceFor(): Promise<{ db: Db; service: SupervisedMissionService }> {
  const db = await database();
  return { db, service: new SupervisedMissionService(createMissionStore(db)) };
}

async function settleUsage(db: Db, mission: SupervisedMission): Promise<string | null> {
  try {
    for (const spend of mission.spendRecords) {
      if (spend.units > 0) await postWorkspaceSpend(db, mission, spend);
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Workspace usage was not updated.";
  }
}

async function loadInvestigationAllowance(
  workspaceId: string,
): Promise<InvestigationAllowanceLoad> {
  try {
    const db = await database();
    const res = await db
      .from("psi_pilot_activations")
      .select("mission_allowance, missions_consumed")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (res.error) {
      const msg = res.error.message ?? "Database error";
      if (/unknown table/i.test(msg)) {
        return { status: "failed", reason: PILOT_ACTIVATION_MIGRATION_HINT };
      }
      if (/expected at most 1 row/i.test(msg)) {
        return {
          status: "failed",
          reason:
            "Multiple pilot activations exist for this workspace; an operator must reconcile the record.",
        };
      }
      return {
        status: "failed",
        reason: "Investigation allowance could not be read from storage.",
      };
    }
    if (!res.data) return { status: "demo" };
    const row = res.data as Record<string, unknown>;
    const missionAllowance = Number(row["mission_allowance"]);
    const missionsConsumed = Number(row["missions_consumed"]);
    if (!Number.isFinite(missionAllowance) || !Number.isFinite(missionsConsumed)) {
      return {
        status: "failed",
        reason: "Investigation allowance on this workspace has invalid stored values.",
      };
    }
    return {
      status: "active",
      snapshot: {
        missionAllowance,
        missionsConsumed,
        remaining: Math.max(0, missionAllowance - missionsConsumed),
      },
    };
  } catch {
    return {
      status: "failed",
      reason: "Investigation allowance could not be read from storage.",
    };
  }
}

function pilotAllowanceSnapshot(load: InvestigationAllowanceLoad): PilotAllowanceSnapshot | null {
  return load.status === "active" ? load.snapshot : null;
}

const briefFields = {
  question: z.string().max(2000),
  audience: z.string().max(400).optional().default(""),
  outcome: z.string().max(2000).optional().default(""),
  constraints: z.string().max(2000).optional().default(""),
};
const briefSchema = z.object({
  question: z.string().max(2000),
  audience: z.string().max(400),
  outcome: z.string().max(2000),
  constraints: z.string().max(2000).optional().default(""),
});
const startBriefSchema = z.object({
  ...briefFields,
  /** Research-first default: combined, with honest gaps when web tools are missing. */
  researchMode: z.enum(RESEARCH_MODES).optional().default("combined"),
  /** Attach to an existing product shelf. Plan is never auto-approved. */
  projectId: z.string().uuid().optional().nullable(),
  /** Optional founder paste — text-only supplied evidence (no file upload). */
  intakeEvidenceNote: z.string().trim().max(2000).optional().nullable(),
});

const evidenceSchema = z
  .array(
    z.object({
      statement: z.string().max(2000),
      source: z.string().max(500).optional().default(""),
      classification: z.string().max(40),
    }),
  )
  .max(20);

export type SupervisedMissionView = {
  mission: SupervisedMission;
  next: ReturnType<typeof nextRequiredAction>;
  usageWarning: string | null;
  comparisonScope: string;
  modelConfigured: boolean;
  research: ReturnType<typeof planResearchMode>;
};

function view(mission: SupervisedMission, usageWarning: string | null): SupervisedMissionView {
  return {
    mission,
    next: nextRequiredAction(mission),
    usageWarning: usageWarning ?? commerceHardStopMessage(mission),
    comparisonScope: scopeHash(mission.brief, mission.evidence),
    modelConfigured: generationPlan(process.env, "").cost > 0,
    research: planResearchMode(mission.researchMode ?? "provided"),
  };
}

export const getSupervisedMissionHome = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      const workspace = await workspaceFor(context.supabase, context.userId);
      const { service } = await serviceFor();
      const missions = await service.list(workspace.id);
      const researchProvider = researchProviderReadiness();
      const allowanceLoad = await loadInvestigationAllowance(workspace.id);
      const investigationAllowance = pilotAllowanceSnapshot(allowanceLoad);
      const startGate = assertCanStartInvestigation(investigationAllowance);
      return {
        ready: true as const,
        reason: null,
        providerLabel: providerLabel(),
        researchProvider,
        usage: { ceiling: workspace.usageCeiling, consumed: workspace.usageConsumed },
        investigationAllowance,
        investigationAllowanceLoad:
          allowanceLoad.status === "active"
            ? ("active" as const)
            : allowanceLoad.status === "demo"
              ? ("demo" as const)
              : ("failed" as const),
        investigationAllowanceLoadReason:
          allowanceLoad.status === "failed" ? allowanceLoad.reason : null,
        canStartInvestigation: startGate.ok,
        startInvestigationBlockedReason: startGate.ok ? null : startGate.message,
        missions: missions.map((mission) => {
          const next = nextRequiredAction(mission);
          const { investigationPaused, openQuestionCount, researchPassQueued } =
            studioInboxFields(mission);
          return {
            id: mission.id,
            question: mission.brief.question,
            stage: mission.stage,
            nextTitle: next.title,
            next,
            investigationPaused,
            openQuestionCount,
            researchPassQueued,
            objective: mission.brief.outcome,
            generation: mission.proposal?.generation.label ?? "No comparison recorded",
            decisionRecorded: !!mission.approval,
            outputReady: !!mission.artefact,
            observationRecorded: !!mission.observation,
            jobStatus: mission.job.status,
            hasFollowUp: mission.followUp?.status === "approved",
            updatedAt: mission.updatedAt,
            usageConsumed: mission.usageConsumed,
            usageCeiling: mission.usageCeiling,
            favourite: Boolean(mission.studioMeta?.favourite),
            archived: Boolean(mission.studioMeta?.archived),
            monitoringStatus: mission.watchtower?.enabled
              ? mission.watchtower.lastSuccessfulCheckAt || mission.watchtower.nextScheduledCheckAt
                ? `Last ${mission.watchtower.lastSuccessfulCheckAt ?? "none"} · next ${mission.watchtower.nextScheduledCheckAt ?? "none"}`
                : `Preferences (${mission.watchtower.frequency}) — runner not live`
              : "Monitoring off",
            links: learningLinks(mission),
          };
        }),
      };
    } catch (error) {
      if (error instanceof MissionStoreUnavailableError) {
        return {
          ready: false as const,
          reason: error.message,
          providerLabel: providerLabel(),
          researchProvider: researchProviderReadiness(),
          usage: null,
          investigationAllowance: null,
          investigationAllowanceLoad: "failed" as const,
          investigationAllowanceLoadReason: error.message,
          canStartInvestigation: false,
          startInvestigationBlockedReason: error.message,
          missions: [],
        };
      }
      throw error;
    }
  });

/** Ensure a lightweight wf_projects shelf exists for supervised mission memory (additive). */
async function ensureMissionProjectMemory(input: {
  workspaceId: string;
  userId: string;
  question: string;
}): Promise<string | null> {
  try {
    const { adminDb } = await import("@/lib/workforce/access.server");
    const writeDb = await adminDb();
    const existing = await writeDb
      .from("wf_projects")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error) return null;
    if (existing.data?.id) return String(existing.data.id);
    const name = input.question.trim().slice(0, 80) || "Product investigation";
    const inserted = await writeDb
      .from("wf_projects")
      .insert({
        workspace_id: input.workspaceId,
        name,
        description: "Auto-created product memory for a supervised mission family.",
        created_by: input.userId,
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data?.id) return null;
    return String(inserted.data.id);
  } catch {
    return null;
  }
}

/** Attach to a founder-chosen shelf, or fall back to auto-create. Never auto-approves. */
async function resolveMissionProjectId(input: {
  workspaceId: string;
  userId: string;
  question: string;
  projectId?: string | null;
}): Promise<string | null> {
  if (input.projectId) {
    const { adminDb } = await import("@/lib/workforce/access.server");
    const writeDb = await adminDb();
    const row = await writeDb
      .from("wf_projects")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .eq("id", input.projectId)
      .maybeSingle();
    if (row.error) throw new Error(row.error.message);
    if (!row.data?.id) throw new Error("Project not found in this workspace.");
    return String(row.data.id);
  }
  return ensureMissionProjectMemory({
    workspaceId: input.workspaceId,
    userId: input.userId,
    question: input.question,
  });
}

export const startSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => startBriefSchema.parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const startGate = assertCanStartInvestigation(
      pilotAllowanceSnapshot(await loadInvestigationAllowance(workspace.id)),
    );
    if (!startGate.ok) throw new Error(startGate.message);
    const { service } = await serviceFor();
    const remaining = Math.max(0, workspace.usageCeiling - workspace.usageConsumed);
    const projectId = await resolveMissionProjectId({
      workspaceId: workspace.id,
      userId: context.userId,
      question: data.question,
      ...(data.projectId !== undefined ? { projectId: data.projectId } : {}),
    });
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      ownerUserId: context.userId,
      brief: {
        question: data.question,
        audience: data.audience,
        outcome: data.outcome,
        constraints: data.constraints,
      },
      researchMode: data.researchMode as ResearchMode,
      usageCeiling: remaining,
      nowMs: Date.now(),
      projectId,
      intakeEvidenceNote: data.intakeEvidenceNote ?? null,
    });
    return view(mission, null);
  });

export const getSupervisedMission = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { db, service } = await serviceFor();
    let mission = await service.get(workspace.id, data.id);
    if (!mission) throw new Error("Mission not found.");
    if (mission.researchPassQueuedAt && !mission.researchPassCompletedAt) {
      mission = await service.runQueuedResearchPass({
        workspaceId: workspace.id,
        id: data.id,
        workerId: `reload-${context.userId}`,
        nowMs: Date.now(),
      });
    }
    return view(mission, await settleUsage(db, mission));
  });

export const saveSupervisedEvidence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        items: evidenceSchema,
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.saveEvidence({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      items: data.items,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const reviseSupervisedBrief = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        brief: briefSchema,
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.reviseBrief({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      brief: data.brief,
      nowMs: Date.now(),
    });
    await invalidateSupervisedWorkerLinksAfterBriefChange({
      workspaceId: workspace.id,
      supervisedMissionId: mission.id,
    });
    return view(mission, null);
  });

export const runSupervisedComparison = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        expectedScope: z.string().min(16).max(128),
        allowModel: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { db, service } = await serviceFor();
    const current = await service.get(workspace.id, data.id);
    if (!current) throw new Error("Mission not found.");
    const plan = generationPlan(process.env, missionScreenText(current));
    if (data.expectedScope !== scopeHash(current.brief, current.evidence))
      throw new Error("The brief or evidence changed. Review the current scope before comparing.");
    if (plan.cost > 0 && !data.allowModel)
      throw new Error("Confirm provider use and the allowance reservation before comparing.");
    const outcome = await runAccountedComparison(service, {
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      workerId: `${context.userId}:${crypto.randomUUID()}`,
      expectedScope: data.expectedScope,
      nowMs: Date.now(),
      generator: {
        cost: plan.cost,
        run: generateComparison,
      },
    });
    return view(outcome.mission, await settleUsage(db, outcome.mission));
  });

export const decideSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        action: z.literal("compare_options"),
        version: z.number().int(),
        scopeHash: z.string().min(16).max(128),
        optionId: z.string().min(1).max(40),
        choice: z.enum([
          "authorise_bounded_test",
          "authorise_revise",
          "authorise_gather_evidence",
          "close_case",
          "founder_requested_continuation",
          "accept",
          "request_more_evidence",
        ]),
        note: z.string().max(2000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.decide({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      claim: {
        action: data.action,
        version: data.version,
        scopeHash: data.scopeHash,
        optionId: data.optionId,
      },
      choice: data.choice,
      note: data.note,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const recordSupervisedCaseStepGate = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        gate: z.enum(["proceed", "revise", "pause", "stop"]),
        note: z.string().max(2000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.recordCaseStepGate({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      gate: data.gate,
      note: data.note,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const saveSupervisedStudioMeta = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        favourite: z.boolean().optional(),
        archived: z.boolean().optional(),
        notifyWhenReady: z.boolean().optional(),
        investigationPaused: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const studioMetaInput: Parameters<SupervisedMissionService["saveStudioMeta"]>[0] = {
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      actorId: context.userId,
      nowMs: Date.now(),
    };
    if (data.favourite !== undefined) studioMetaInput.favourite = data.favourite;
    if (data.archived !== undefined) studioMetaInput.archived = data.archived;
    if (data.notifyWhenReady !== undefined) studioMetaInput.notifyWhenReady = data.notifyWhenReady;
    if (data.investigationPaused !== undefined) {
      studioMetaInput.investigationPaused = data.investigationPaused;
    }
    const mission = await service.saveStudioMeta(studioMetaInput);
    return view(mission, null);
  });

export const saveSupervisedWatchtower = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        enabled: z.boolean(),
        topics: z.array(z.string().max(200)).max(12),
        competitors: z.array(z.string().max(200)).max(12),
        sourcesNote: z.string().max(2000).optional().default(""),
        frequency: z.enum(["off", "weekly", "monthly"]),
        geography: z.string().max(200).optional().default(""),
        budgetCeilingUnits: z.number().int().min(0).max(100),
        notify: z.enum(["off", "digest", "important"]),
        pauseUntil: z.string().max(40).nullable().optional().default(null),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.saveWatchtower({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      enabled: data.enabled,
      topics: data.topics,
      competitors: data.competitors,
      sourcesNote: data.sourcesNote,
      frequency: data.frequency,
      geography: data.geography,
      budgetCeilingUnits: data.budgetCeilingUnits,
      notify: data.notify,
      pauseUntil: data.pauseUntil,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const prepareSupervisedArtefact = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.prepareArtefact({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const exportSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.exportMission({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

/** Full ZIP: decision pack + evidence + prototype (when present) + honesty manifest. */
export const exportSupervisedMissionZip = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      files: Array<{ path: string; content: string }>;
      title: string;
      filename: string;
    }> => {
      const workspace = await workspaceFor(context.supabase, context.userId);
      const { service } = await serviceFor();
      const mission = await service.get(workspace.id, data.id);
      if (!mission) throw new Error("Mission not found in this workspace.");
      if (!mission.artefact) {
        throw new Error("Prepare the decision pack before downloading the ZIP.");
      }
      if (!mission.exportBody) {
        throw new Error(
          "Export the decision pack (Markdown and PDF) before downloading the ZIP archive.",
        );
      }
      const { buildSupervisedZip } = await import("@/lib/pilot-mission/supervised-zip");
      return buildSupervisedZip(mission);
    },
  );

/** PT-3 executive pack (Markdown only). */
export const exportSupervisedExecutivePack = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ markdown: string; filename: string }> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.get(workspace.id, data.id);
    if (!mission) throw new Error("Mission not found in this workspace.");
    const { buildExecutivePackMarkdown } = await import("@/lib/pilot-mission/executive-pack");
    return {
      markdown: buildExecutivePackMarkdown(mission),
      filename: `executive-pack-${mission.id.slice(0, 8)}.md`,
    };
  });

/** PT-3 full project archive ZIP. */
export const exportSupervisedFullArchive = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      files: Array<{ path: string; content: string }>;
      title: string;
      filename: string;
    }> => {
      const workspace = await workspaceFor(context.supabase, context.userId);
      const { service } = await serviceFor();
      const mission = await service.get(workspace.id, data.id);
      if (!mission) throw new Error("Mission not found in this workspace.");
      if (!mission.artefact) {
        throw new Error("Prepare the decision pack before downloading the full archive.");
      }
      const { buildFullArchiveZip } = await import("@/lib/pilot-mission/executive-pack");
      return buildFullArchiveZip(mission);
    },
  );

/** P5 — human gate then sandboxed HTML prototype + static verify. */
export const approveSupervisedPrototype = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.approvePrototypeBuild({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const cancelSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.cancel({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

const expectationSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  hypothesis: z.string().max(2000),
  expectedMetric: z.string().max(500),
  baseline: z.string().max(500),
  observationWindow: z.string().max(500),
});

const observationSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  result: z.string().max(2000),
  evidence: z.string().max(2000),
  source: z.string().max(500),
});

const reviewSchema = z.object({
  id: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  reading: z.enum(["consistent", "different", "uncertain"]),
  uncertainty: z.string().max(2000),
  followUp: briefSchema,
});

export const recordSupervisedExpectation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => expectationSchema.parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.recordExpectation({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      hypothesis: data.hypothesis,
      expectedMetric: data.expectedMetric,
      baseline: data.baseline,
      observationWindow: data.observationWindow,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const recordSupervisedObservation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => observationSchema.parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.recordObservation({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      result: data.result,
      evidence: data.evidence,
      source: data.source,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const recordSupervisedReview = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.recordReview({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      reading: data.reading,
      uncertainty: data.uncertainty,
      followUp: data.followUp,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const approveSupervisedPlan = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    let mission = await service.approvePlan({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      actorId: context.userId,
      nowMs: Date.now(),
      deferResearchPass: true,
    });
    const link = await bindSupervisedResearchWorkerAfterApproval({
      workspaceId: workspace.id,
      mission,
      actorId: context.userId,
    });
    if (link) {
      const { db } = await serviceFor();
      const store = createMissionStore(db);
      const patched = withWorkerLinkDocument(mission, link);
      patched.version = mission.version + 1;
      patched.updatedAt = new Date().toISOString();
      try {
        mission = await store.save(patched, mission.version);
      } catch {
        mission = withWorkerLinkDocument(mission, link);
      }
    }
    return view(mission, null);
  });

export const setSupervisedResearchMode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        expectedVersion: z.number().int().positive(),
        mode: z.enum(RESEARCH_MODES),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.setResearchMode({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      mode: data.mode,
      actorId: context.userId,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const approveSupervisedFollowUp = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.approveFollowUp({
      workspaceId: workspace.id,
      id: data.id,
      expectedVersion: data.expectedVersion,
      actorId: context.userId,
      followUpMissionId: crypto.randomUUID(),
      usageCeiling: Math.max(0, workspace.usageCeiling - workspace.usageConsumed),
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

/** P3 — read-only product memory shelf: missions + artefacts + decisions per project. */
export type ProjectBuildShelf = {
  projectId: string;
  name: string;
  description: string | null;
  missions: ReturnType<typeof projectShelfItems>[];
};

export const getSupervisedProjectShelf = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ProjectBuildShelf[]> => {
    try {
      const workspace = await workspaceFor(context.supabase, context.userId);
      const { service } = await serviceFor();
      const missions = await service.list(workspace.id);
      const db = wfDb(context.supabase);
      const projectsRes = await db
        .from("wf_projects")
        .select("id, name, description")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });
      if (projectsRes.error) throw new Error(projectsRes.error.message);
      const projects = (projectsRes.data ?? []) as Array<{
        id: string;
        name: string;
        description: string | null;
      }>;
      const byProject = new Map<string, SupervisedMission[]>();
      for (const mission of missions) {
        if (!mission.projectId) continue;
        const list = byProject.get(mission.projectId) ?? [];
        list.push(mission);
        byProject.set(mission.projectId, list);
      }
      const shelves: ProjectBuildShelf[] = projects.map((p) => ({
        projectId: p.id,
        name: p.name,
        description: p.description,
        missions: (byProject.get(p.id) ?? []).map(projectShelfItems),
      }));
      // Include orphan attached missions whose project row is missing from the list.
      for (const [projectId, attached] of byProject) {
        if (shelves.some((s) => s.projectId === projectId)) continue;
        shelves.push({
          projectId,
          name: attached[0]?.brief.question.slice(0, 80) || "Product memory",
          description: "Auto-attached supervised mission family",
          missions: attached.map(projectShelfItems),
        });
      }
      return shelves;
    } catch (error) {
      if (error instanceof MissionStoreUnavailableError) return [];
      throw error;
    }
  });
