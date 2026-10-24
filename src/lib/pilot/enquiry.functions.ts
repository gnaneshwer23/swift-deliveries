import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import type { Db } from "@/lib/db/builder";
import { isMissingRelationError } from "@/lib/workforce/db";
import type { ProductBrief } from "@/lib/marketing/product-resources";
import {
  ActivationConflictError,
  ActivationStoreUnavailableError,
  activateEnquiry,
  isPilotOperator,
  type ActivationRepository,
  type PilotActivation,
} from "./activation";
import {
  claimEnquiry,
  isPilotPlan,
  submitEnquiry,
  validateFollowUp,
  type FollowUpStatus,
  type PilotPlan,
  type PilotRepository,
  type StoredPilotRequest,
} from "./model";

const briefSchema = z.object({
  product: z.string().max(4000).optional().default(""),
  audience: z.string().max(4000).optional().default(""),
  problem: z.string().max(4000).optional().default(""),
  objective: z.string().max(4000).optional().default(""),
  constraints: z.string().max(4000).optional().default(""),
  evidence: z.string().max(4000).optional().default(""),
});

const submitSchema = z.object({
  plan: z.string().max(40),
  contactName: z.string().max(200),
  contactEmail: z.string().max(320),
  organisation: z.string().max(200).optional().default(""),
  brief: briefSchema,
  consent: z.boolean(),
  companyWebsite: z.string().max(200).optional().default(""),
});

const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function asBrief(value: unknown): ProductBrief {
  const brief =
    typeof value === "string"
      ? (JSON.parse(value) as Record<string, unknown>)
      : (value as Record<string, unknown> | null);
  const text = (key: keyof ProductBrief) =>
    typeof brief?.[key] === "string" ? (brief[key] as string) : "";
  return {
    product: text("product"),
    audience: text("audience"),
    problem: text("problem"),
    objective: text("objective"),
    constraints: text("constraints"),
    evidence: text("evidence"),
  };
}

function mapRow(row: Record<string, unknown> | null): StoredPilotRequest | null {
  if (!row || typeof row["id"] !== "string" || typeof row["reference"] !== "string") return null;
  const plan = row["plan"];
  if (typeof plan !== "string" || !isPilotPlan(plan)) return null;
  return {
    id: row["id"],
    reference: row["reference"],
    plan,
    contactName: String(row["contact_name"] ?? ""),
    contactEmail: String(row["contact_email"] ?? ""),
    organisation: String(row["organisation"] ?? ""),
    brief: asBrief(row["brief"]),
    consentAt: String(row["consent_at"] ?? ""),
    status: String(row["status"] ?? "received") as FollowUpStatus,
    followUpNote: String(row["follow_up_note"] ?? ""),
    ownerUserId: typeof row["owner_user_id"] === "string" ? row["owner_user_id"] : null,
    claimTokenHash: String(row["claim_token_hash"] ?? ""),
    briefFingerprint: String(row["brief_fingerprint"] ?? ""),
    createdAt: String(row["created_at"] ?? ""),
  };
}

function pilotRepository(db: Db): PilotRepository {
  return {
    async recentByEmail(email) {
      const res = await db
        .from("psi_pilot_requests")
        .select("*")
        .eq("contact_email", email)
        .order("created_at", { ascending: false })
        .limit(20);
      if (res.error) throw new Error(res.error.message);
      return ((res.data ?? []) as Record<string, unknown>[]).flatMap((row) => {
        const mapped = mapRow(row);
        return mapped ? [mapped] : [];
      });
    },
    async insert(row) {
      const res = await db
        .from("psi_pilot_requests")
        .insert({
          reference: row.reference,
          plan: row.plan,
          contact_name: row.contactName,
          contact_email: row.contactEmail,
          organisation: row.organisation,
          brief: row.brief,
          consent_at: row.consentAt,
          claim_token_hash: row.claimTokenHash,
          brief_fingerprint: row.briefFingerprint,
        })
        .select("*")
        .single();
      if (res.error || !res.data) throw new Error(res.error?.message ?? "Insert failed");
      const mapped = mapRow(res.data as Record<string, unknown>);
      if (!mapped) throw new Error("Insert failed");
      return mapped;
    },
    async replaceClaimToken(id, claimTokenHash) {
      const res = await db
        .from("psi_pilot_requests")
        .update({ claim_token_hash: claimTokenHash, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    async findByClaimHash(hash) {
      const res = await db
        .from("psi_pilot_requests")
        .select("*")
        .eq("claim_token_hash", hash)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return mapRow(res.data as Record<string, unknown> | null);
    },
    async assignOwner(id, userId) {
      const res = await db
        .from("psi_pilot_requests")
        .update({ owner_user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("owner_user_id", null)
        .select("id")
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return Boolean(res.data);
    },
    async latestOwned(userId) {
      const res = await db
        .from("psi_pilot_requests")
        .select("*")
        .eq("owner_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (res.error) throw new Error(res.error.message);
      const rows = (res.data ?? []) as Record<string, unknown>[];
      return mapRow(rows[0] ?? null);
    },
    async listRecent(limit) {
      const res = await db
        .from("psi_pilot_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (res.error) throw new Error(res.error.message);
      return ((res.data ?? []) as Record<string, unknown>[]).flatMap((row) => {
        const mapped = mapRow(row);
        return mapped ? [mapped] : [];
      });
    },
    async updateFollowUp(id, patch) {
      const res = await db
        .from("psi_pilot_requests")
        .update({
          status: patch.status,
          follow_up_note: patch.followUpNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return mapRow(res.data as Record<string, unknown> | null);
    },
  };
}

async function database(): Promise<Db> {
  const { neonDb } = await import("@/lib/db/neon.server");
  return neonDb();
}

async function clientKey(): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  return (
    request?.headers.get("cf-connecting-ip") ??
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function missingActivationStore(
  error: { message?: string | undefined; code?: string | undefined } | null,
): boolean {
  if (!error) return false;
  const probe: { message?: string; code?: string } = {};
  if (typeof error.message === "string") probe.message = error.message;
  if (typeof error.code === "string") probe.code = error.code;
  return (
    isMissingRelationError(probe) ||
    /unknown table: psi_pilot_activations/i.test(error.message ?? "")
  );
}

function mapActivation(row: Record<string, unknown> | null): PilotActivation | null {
  if (!row || typeof row["id"] !== "string" || typeof row["request_id"] !== "string") return null;
  if (row["payment_taken"] === true) return null;
  const plan = row["plan"];
  const allowance = Number(row["mission_allowance"]);
  const consumed = Number(row["missions_consumed"]);
  const workspaceId = row["workspace_id"];
  if (typeof plan !== "string" || !isPilotPlan(plan)) return null;
  if (typeof workspaceId !== "string") return null;
  if (!Number.isInteger(allowance) || !Number.isInteger(consumed)) return null;
  return {
    id: row["id"],
    requestId: row["request_id"],
    workspaceId: workspaceId.toLowerCase(),
    plan,
    missionAllowance: allowance,
    missionsConsumed: consumed,
    paymentTaken: false,
    exhaustion: "block_next_billable_comparison",
    activatedBy: String(row["activated_by"] ?? ""),
    activatedAt: String(row["activated_at"] ?? ""),
  };
}

export function activationRepository(db: Db): ActivationRepository {
  return {
    async findRequest(id) {
      const res = await db.from("psi_pilot_requests").select("*").eq("id", id).maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return mapRow(res.data as Record<string, unknown> | null);
    },
    async findByRequest(requestId) {
      const res = await db
        .from("psi_pilot_activations")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      if (res.error) {
        if (missingActivationStore(res.error)) return null;
        throw new Error(res.error.message);
      }
      return mapActivation(res.data as Record<string, unknown> | null);
    },
    async findByWorkspace(workspaceId) {
      const res = await db
        .from("psi_pilot_activations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (res.error) {
        if (missingActivationStore(res.error)) return null;
        throw new Error(res.error.message);
      }
      return mapActivation(res.data as Record<string, unknown> | null);
    },
    async insert(row) {
      const res = await db
        .from("psi_pilot_activations")
        .insert({
          id: row.id,
          request_id: row.requestId,
          workspace_id: row.workspaceId,
          plan: row.plan,
          mission_allowance: row.missionAllowance,
          missions_consumed: 0,
          payment_taken: false,
          exhaustion: row.exhaustion,
          activated_by: row.activatedBy,
          activated_at: row.activatedAt,
        })
        .select("*")
        .maybeSingle();
      if (res.error || !res.data) {
        if (missingActivationStore(res.error)) throw new ActivationStoreUnavailableError();
        if (res.error?.code === "23505" || /duplicate|unique/i.test(res.error?.message ?? "")) {
          throw new ActivationConflictError();
        }
        throw new Error(res.error?.message ?? "Insert failed");
      }
      const mapped = mapActivation(res.data as Record<string, unknown>);
      if (!mapped) throw new Error("Insert failed");
      return mapped;
    },
    async advanceConsumption(workspaceId, expectedConsumed) {
      const res = await db
        .from("psi_pilot_activations")
        .update({ missions_consumed: expectedConsumed + 1 })
        .eq("workspace_id", workspaceId)
        .eq("missions_consumed", expectedConsumed)
        .select("*")
        .maybeSingle();
      if (res.error) {
        if (missingActivationStore(res.error)) throw new ActivationStoreUnavailableError();
        throw new Error(res.error.message);
      }
      return mapActivation(res.data as Record<string, unknown> | null);
    },
  };
}

async function workspaceExists(db: Db, workspaceId: string): Promise<boolean> {
  const res = await db.from("wf_workspaces").select("id").eq("id", workspaceId).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  const row = res.data as { id?: string } | null;
  return typeof row?.id === "string";
}

async function operatorAllowed(db: Db, userId: string, email: string | null): Promise<boolean> {
  const res = await db.from("user_roles").select("role").eq("user_id", userId);
  const roles =
    res.error || !Array.isArray(res.data)
      ? []
      : res.data.flatMap((row) => {
          const role = (row as { role?: string }).role;
          return typeof role === "string" ? [role] : [];
        });
  if (res.error && !(email && email.trim())) return false;
  return isPilotOperator({
    email,
    configuredEmails: process.env["PSI_OPERATOR_EMAILS"],
    roles,
  });
}

function publicActivation(row: PilotActivation | null): OperatorActivation | null {
  if (!row) return null;
  return {
    workspaceId: row.workspaceId,
    plan: row.plan,
    missionAllowance: row.missionAllowance,
    missionsConsumed: row.missionsConsumed,
    paymentTaken: false,
    exhaustion: "block_next_billable_comparison",
  };
}

async function listActivations(db: Db, ids: string[]): Promise<Map<string, PilotActivation>> {
  const found = new Map<string, PilotActivation>();
  if (!ids.length) return found;
  const res = await db.from("psi_pilot_activations").select("*").in("request_id", ids);
  if (res.error) {
    if (missingActivationStore(res.error)) return found;
    throw new Error(res.error.message);
  }
  for (const row of (res.data ?? []) as Record<string, unknown>[]) {
    const mapped = mapActivation(row);
    if (mapped) found.set(mapped.requestId, mapped);
  }
  return found;
}

async function suggestedWorkspaces(db: Db, ownerIds: string[]): Promise<Map<string, string[]>> {
  const found = new Map<string, string[]>();
  const unique = [...new Set(ownerIds)];
  if (!unique.length) return found;
  const res = await db.from("wf_workspaces").select("id, owner_id").in("owner_id", unique);
  if (res.error || !Array.isArray(res.data)) return found;
  for (const row of res.data as Record<string, unknown>[]) {
    const ownerId = row["owner_id"];
    const id = row["id"];
    if (typeof ownerId !== "string" || typeof id !== "string") continue;
    const list = found.get(ownerId) ?? [];
    list.push(id);
    found.set(ownerId, list);
  }
  return found;
}

export type PilotContinuity = {
  reference: string;
  plan: PilotPlan;
  brief: ProductBrief;
  status: FollowUpStatus;
};

export const submitPilotEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const parsed = submitSchema.safeParse(data);
    if (!parsed.success) return { ok: false as const, message: "Check the form and try again." };
    try {
      const db = await database();
      return await submitEnquiry(parsed.data, {
        repo: pilotRepository(db),
        now: () => Date.now(),
        ipKey: await clientKey(),
        ipBuckets,
      });
    } catch {
      return {
        ok: false as const,
        message: "We could not save your request. Nothing was confirmed. Try again later.",
      };
    }
  });

export const claimPilotRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => z.object({ token: z.string().min(64).max(128) }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      return await claimEnquiry(pilotRepository(await database()), data.token, {
        id: context.userId,
        email: context.userEmail,
      });
    } catch {
      return { ok: false as const, reason: "unavailable" as const };
    }
  });

export const getMyPilotContinuity = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PilotContinuity | null> => {
    try {
      const row = await pilotRepository(await database()).latestOwned(context.userId);
      if (!row) return null;
      return { reference: row.reference, plan: row.plan, brief: row.brief, status: row.status };
    } catch {
      return null;
    }
  });

export const getPilotOperatorAccess = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    try {
      return {
        authorised: await operatorAllowed(await database(), context.userId, context.userEmail),
      };
    } catch {
      return { authorised: false };
    }
  });

export type OperatorActivation = {
  workspaceId: string;
  plan: PilotPlan;
  missionAllowance: number;
  missionsConsumed: number;
  paymentTaken: false;
  exhaustion: "block_next_billable_comparison";
};

export type OperatorPilotRequest = {
  id: string;
  reference: string;
  plan: PilotPlan;
  contactName: string;
  contactEmail: string;
  organisation: string;
  brief: ProductBrief;
  status: FollowUpStatus;
  followUpNote: string;
  linkedAccount: boolean;
  createdAt: string;
  activation: OperatorActivation | null;
  suggestedWorkspaceIds: string[];
};

export const listPilotRequests = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const db = await database();
    if (!(await operatorAllowed(db, context.userId, context.userEmail))) {
      return { authorised: false as const, requests: [] as OperatorPilotRequest[] };
    }
    const rows = await pilotRepository(db).listRecent(100);
    const activations = await listActivations(
      db,
      rows.map((row) => row.id),
    );
    const suggested = await suggestedWorkspaces(
      db,
      rows.flatMap((row) => (row.ownerUserId ? [row.ownerUserId] : [])),
    );
    return {
      authorised: true as const,
      requests: rows.map((row) => ({
        id: row.id,
        reference: row.reference,
        plan: row.plan,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        organisation: row.organisation,
        brief: row.brief,
        status: row.status,
        followUpNote: row.followUpNote,
        linkedAccount: Boolean(row.ownerUserId),
        createdAt: row.createdAt,
        activation: publicActivation(activations.get(row.id) ?? null),
        suggestedWorkspaceIds: row.ownerUserId ? (suggested.get(row.ownerUserId) ?? []) : [],
      })),
    };
  });

export const updatePilotRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.string().max(40),
        followUpNote: z.string().max(4000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const parsed = validateFollowUp(data);
    if (!parsed.ok) return { ok: false as const, message: parsed.message };
    const db = await database();
    if (!(await operatorAllowed(db, context.userId, context.userEmail))) {
      return { ok: false as const, message: "You are not authorised to update pilot requests." };
    }
    try {
      const updated = await pilotRepository(db).updateFollowUp(data.id, parsed);
      if (!updated) return { ok: false as const, message: "That request could not be updated." };
      return { ok: true as const, reference: updated.reference, status: updated.status };
    } catch {
      return { ok: false as const, message: "The follow-up could not be saved." };
    }
  });

export const activatePilotRequest = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        workspaceId: z.string().uuid(),
        plan: z.enum(["builder", "founder", "studio"]),
        missionAllowance: z.number().int().min(1).max(24),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const db = await database();
    const authorised = await operatorAllowed(db, context.userId, context.userEmail);
    try {
      const result = await activateEnquiry(
        {
          authorised,
          requestId: data.id,
          workspaceId: data.workspaceId,
          plan: data.plan,
          missionAllowance: data.missionAllowance,
          actorId: context.userId,
        },
        activationRepository(db),
        () => new Date().toISOString(),
        { workspaceExists: (workspaceId) => workspaceExists(db, workspaceId) },
      );
      if (!result.ok) return result;
      return {
        ok: true as const,
        already: result.already,
        activation: publicActivation(result.activation),
      };
    } catch (error) {
      if (error instanceof ActivationStoreUnavailableError) {
        return { ok: false as const, message: error.message };
      }
      return { ok: false as const, message: "The activation was not saved." };
    }
  });
