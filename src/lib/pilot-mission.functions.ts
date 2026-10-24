import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Db } from "@/lib/db/builder";
import { requireAuth } from "@/lib/auth/middleware";
import { wfDb } from "@/lib/workforce/db";
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
import {
  nextRequiredAction,
  scopeHash,
  spendKey,
  workspaceAllowsSpend,
  type SupervisedMission,
} from "./pilot-mission/types";

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
  if (!res.data) throw new Error("Open the Command Centre once to create your workspace.");
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

const briefSchema = z.object({
  question: z.string().max(2000),
  audience: z.string().max(400),
  outcome: z.string().max(2000),
  constraints: z.string().max(2000).optional().default(""),
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
};

function view(mission: SupervisedMission, usageWarning: string | null): SupervisedMissionView {
  return { mission, next: nextRequiredAction(mission), usageWarning };
}

export const getSupervisedMissionHome = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      const workspace = await workspaceFor(context.supabase, context.userId);
      const { service } = await serviceFor();
      const missions = await service.list(workspace.id);
      return {
        ready: true as const,
        reason: null,
        providerLabel: providerLabel(),
        usage: { ceiling: workspace.usageCeiling, consumed: workspace.usageConsumed },
        missions: missions.map((mission) => ({
          id: mission.id,
          question: mission.brief.question,
          stage: mission.stage,
          nextTitle: nextRequiredAction(mission).title,
          updatedAt: mission.updatedAt,
          usageConsumed: mission.usageConsumed,
          usageCeiling: mission.usageCeiling,
        })),
      };
    } catch (error) {
      if (error instanceof MissionStoreUnavailableError) {
        return {
          ready: false as const,
          reason: error.message,
          providerLabel: providerLabel(),
          usage: null,
          missions: [],
        };
      }
      throw error;
    }
  });

export const startSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => briefSchema.parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const remaining = Math.max(0, workspace.usageCeiling - workspace.usageConsumed);
    const mission = await service.create({
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      ownerUserId: context.userId,
      brief: { ...data, constraints: data.constraints },
      usageCeiling: remaining,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const getSupervisedMission = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { db, service } = await serviceFor();
    const mission = await service.get(workspace.id, data.id);
    if (!mission) throw new Error("Mission not found.");
    return view(mission, await settleUsage(db, mission));
  });

export const saveSupervisedEvidence = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), items: evidenceSchema }).parse(data),
  )
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.saveEvidence({
      workspaceId: workspace.id,
      id: data.id,
      items: data.items,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const reviseSupervisedBrief = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), brief: briefSchema }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.reviseBrief({
      workspaceId: workspace.id,
      id: data.id,
      brief: data.brief,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const runSupervisedComparison = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { db, service } = await serviceFor();
    const current = await service.get(workspace.id, data.id);
    if (!current) throw new Error("Mission not found.");
    const key = spendKey(scopeHash(current.brief, current.evidence));
    const alreadyRecorded = current.spendRecords.some((spend) => spend.key === key);
    const plan = generationPlan(process.env, missionScreenText(current));
    if (
      !workspaceAllowsSpend({
        ceiling: workspace.usageCeiling,
        consumed: workspace.usageConsumed,
        cost: plan.cost,
        alreadyRecorded,
      })
    ) {
      throw new UsageLimitError("Workspace usage ceiling reached. This step was not run.");
    }
    const outcome = await service.runAlternatives({
      workspaceId: workspace.id,
      id: data.id,
      workerId: `${context.userId}:${crypto.randomUUID()}`,
      nowMs: Date.now(),
      generator: { cost: plan.cost, run: (mission) => generateComparison(mission) },
    });
    return view(outcome.mission, await settleUsage(db, outcome.mission));
  });

export const decideSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.literal("compare_options"),
        version: z.number().int(),
        scopeHash: z.string().min(16).max(128),
        optionId: z.string().min(1).max(40),
        choice: z.enum(["accept", "request_more_evidence"]),
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

export const prepareSupervisedArtefact = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.prepareArtefact({
      workspaceId: workspace.id,
      id: data.id,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const exportSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.exportMission({
      workspaceId: workspace.id,
      id: data.id,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });

export const cancelSupervisedMission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SupervisedMissionView> => {
    const workspace = await workspaceFor(context.supabase, context.userId);
    const { service } = await serviceFor();
    const mission = await service.cancel({
      workspaceId: workspace.id,
      id: data.id,
      nowMs: Date.now(),
    });
    return view(mission, null);
  });
