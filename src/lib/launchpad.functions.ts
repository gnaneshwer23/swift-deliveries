import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PILOT_FRAMEWORK = { key: "pm-core", version: "2026.1" } as const;

export type ReadinessCapability = {
  key: string;
  name: string;
  level: number | null;
  band: string | null;
  rationale: string | null;
  verified: boolean;
  attestationStatus: string;
  evidenceCount: number;
  strongestStrength: string | null;
  basis: "score_run" | "evidence_only" | "self_reported_only" | "no_evidence";
};

export type Story = {
  id: string;
  title: string;
  capabilityKey: string | null;
  source: string;
  strength: string;
  summary: string;
  occurredAt: string;
  coachConfirmed: boolean;
};

export type ShareLink = {
  id: string;
  label: string;
  token: string;
  includeSelfReported: boolean;
  expiresAt: string;
  revokedAt: string | null;
  viewCount: number;
  createdAt: string;
};

export type LaunchpadPack = {
  framework: { key: string; version: string; name: string };
  person: { name: string; headline: string | null };
  readiness: {
    percent: number;
    explainable: boolean;
    label: string;
    judgedCount: number;
    capabilityCount: number;
    verifiedCount: number;
  };
  capabilities: ReadinessCapability[];
  stories: Story[];
  shares: ShareLink[];
  lastRunAt: string | null;
};

const STRENGTH_RANK: Record<string, number> = {
  self_reported: 1,
  observed: 2,
  assessed: 3,
  externally_verified: 4,
};

/** Everything the Launchpad readiness pack shows. Owner-scoped by RLS. */
export const getLaunchpadPack = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LaunchpadPack> => {
    const { supabase, userId } = context;

    const { data: framework } = await supabase
      .from("capability_frameworks")
      .select("id, key, version, name")
      .eq("key", PILOT_FRAMEWORK.key)
      .eq("version", PILOT_FRAMEWORK.version)
      .single();
    if (!framework) throw new Error("The capability framework is unavailable.");

    const [{ data: caps }, { data: ledger }, { data: claims }, { data: runs }, { data: profile }, { data: shares }] =
      await Promise.all([
        supabase
          .from("framework_capabilities")
          .select("key, name, sort_order")
          .eq("framework_id", framework.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("evidence_ledger")
          .select("id, source, strength, capability_key, summary, occurred_at, provenance")
          .eq("owner_id", userId)
          .order("occurred_at", { ascending: false })
          .limit(200),
        supabase
          .from("snapshot_claims")
          .select("capability_key, level, band, attestation_status, readiness_basis, verified")
          .eq("owner_id", userId),
        supabase
          .from("score_runs")
          .select("id, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("profiles").select("full_name, display_name, headline").eq("id", userId).maybeSingle(),
        supabase
          .from("portfolio_shares")
          .select("id, label, token, include_self_reported, expires_at, revoked_at, view_count, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false }),
      ]);

    let judgements: { capability_key: string; level: number; band: string; rationale: string }[] = [];
    const run = runs?.[0];
    if (run) {
      const { data } = await supabase
        .from("capability_judgements")
        .select("capability_key, level, band, rationale")
        .eq("score_run_id", run.id);
      judgements = data ?? [];
    }

    const judgementByKey = new Map(judgements.map((j) => [j.capability_key, j]));
    const claimByKey = new Map((claims ?? []).map((c) => [c.capability_key, c]));

    const evidenceByKey = new Map<string, { count: number; strongest: string | null }>();
    for (const e of ledger ?? []) {
      if (!e.capability_key) continue;
      const bucket = evidenceByKey.get(e.capability_key) ?? { count: 0, strongest: null };
      bucket.count += 1;
      if (
        !bucket.strongest ||
        (STRENGTH_RANK[e.strength] ?? 0) > (STRENGTH_RANK[bucket.strongest] ?? 0)
      ) {
        bucket.strongest = e.strength;
      }
      evidenceByKey.set(e.capability_key, bucket);
    }

    const capabilities: ReadinessCapability[] = (caps ?? []).map((c) => {
      const judgement = judgementByKey.get(c.key);
      const claim = claimByKey.get(c.key);
      const evidence = evidenceByKey.get(c.key);
      const basis: ReadinessCapability["basis"] = judgement
        ? "score_run"
        : !evidence
          ? "no_evidence"
          : evidence.strongest === "self_reported"
            ? "self_reported_only"
            : "evidence_only";
      return {
        key: c.key,
        name: c.name,
        level: judgement?.level ?? claim?.level ?? null,
        band: judgement?.band ?? claim?.band ?? null,
        rationale: judgement?.rationale ?? null,
        verified: claim?.verified === true,
        attestationStatus: claim?.attestation_status ?? "unattested",
        evidenceCount: evidence?.count ?? 0,
        strongestStrength: evidence?.strongest ?? null,
        basis,
      };
    });

    const judgedCount = capabilities.filter((c) => c.basis === "score_run").length;
    const verifiedCount = capabilities.filter((c) => c.verified).length;
    const percent =
      capabilities.length === 0 ? 0 : Math.round((judgedCount / capabilities.length) * 100);
    const explainable = judgedCount > 0 && judgedCount === capabilities.filter((c) => c.evidenceCount > 0).length;

    const stories: Story[] = (ledger ?? [])
      .filter((e) => e.strength !== "self_reported")
      .slice(0, 12)
      .map((e) => {
        const provenance =
          e.provenance && typeof e.provenance === "object" && !Array.isArray(e.provenance)
            ? (e.provenance as Record<string, unknown>)
            : {};
        return {
          id: e.id,
          title: e.summary.split(":")[0]?.slice(0, 90) ?? e.summary.slice(0, 90),
          capabilityKey: e.capability_key,
          source: e.source,
          strength: e.strength,
          summary: e.summary,
          occurredAt: e.occurred_at,
          coachConfirmed: provenance["coach_confirmed"] === true,
        };
      });

    return {
      framework: { key: framework.key, version: framework.version, name: framework.name },
      person: {
        name: profile?.full_name ?? profile?.display_name ?? "You",
        headline: profile?.headline ?? null,
      },
      readiness: {
        percent,
        explainable,
        label: explainable
          ? "Explainable — every judged capability cites ledger entries"
          : "Heuristic — coverage only, not a full explainable judgement",
        judgedCount,
        capabilityCount: capabilities.length,
        verifiedCount,
      },
      capabilities,
      stories,
      shares: (shares ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        token: s.token,
        includeSelfReported: s.include_self_reported,
        expiresAt: s.expires_at,
        revokedAt: s.revoked_at,
        viewCount: s.view_count,
        createdAt: s.created_at,
      })),
      lastRunAt: run?.created_at ?? null,
    };
  });

/** Creates a private, expiring, revocable portfolio link. Nothing is public by default. */
export const createPortfolioShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        label: z.string().trim().min(2, "Name this link (e.g. the company)").max(120),
        includeSelfReported: z.boolean().optional().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("portfolio_shares")
      .insert({
        owner_id: context.userId,
        label: data.label,
        include_self_reported: data.includeSelfReported,
      })
      .select("token")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not create the link.");
    return { token: row.token };
  });

export const revokePortfolioShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("portfolio_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PublicPortfolio =
  | { valid: false; reason: "not_found" | "revoked" | "expired" }
  | {
      valid: true;
      label: string;
      person: { name: string; headline: string | null };
      framework: { key: string; version: string };
      readiness: { percent: number; explainable: boolean; label: string; verifiedCount: number };
      capabilities: {
        key: string;
        name: string;
        level: number | null;
        band: string | null;
        rationale: string | null;
        verified: boolean;
        evidenceCount: number;
        strongestStrength: string | null;
      }[];
      stories: { summary: string; source: string; strength: string; occurredAt: string; coachConfirmed: boolean }[];
    };

/**
 * Public read of a shared portfolio. Token-gated, expiring, revocable, and
 * never returns artefact bodies, emails or private notes.
 */
export const getPublicPortfolio = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(200) }).parse(data))
  .handler(async ({ data }): Promise<PublicPortfolio> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: share } = await supabaseAdmin
      .from("portfolio_shares")
      .select("id, owner_id, label, include_self_reported, expires_at, revoked_at, view_count")
      .eq("token", data.token)
      .maybeSingle();
    if (!share) return { valid: false, reason: "not_found" };
    if (share.revoked_at) return { valid: false, reason: "revoked" };
    if (new Date(share.expires_at).getTime() < Date.now()) return { valid: false, reason: "expired" };

    const ownerId = share.owner_id;

    const [{ data: framework }, { data: profile }, { data: claims }, { data: runs }, { data: ledger }] =
      await Promise.all([
        supabaseAdmin
          .from("capability_frameworks")
          .select("id, key, version")
          .eq("key", PILOT_FRAMEWORK.key)
          .eq("version", PILOT_FRAMEWORK.version)
          .single(),
        supabaseAdmin.from("profiles").select("full_name, display_name, headline").eq("id", ownerId).maybeSingle(),
        supabaseAdmin
          .from("snapshot_claims")
          .select("capability_key, level, band, verified")
          .eq("owner_id", ownerId),
        supabaseAdmin
          .from("score_runs")
          .select("id")
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabaseAdmin
          .from("evidence_ledger")
          .select("source, strength, capability_key, summary, occurred_at, provenance")
          .eq("owner_id", ownerId)
          .order("occurred_at", { ascending: false })
          .limit(100),
      ]);
    if (!framework) return { valid: false, reason: "not_found" };

    const { data: caps } = await supabaseAdmin
      .from("framework_capabilities")
      .select("key, name, sort_order")
      .eq("framework_id", framework.id)
      .order("sort_order", { ascending: true });

    let judgements: { capability_key: string; level: number; band: string; rationale: string }[] = [];
    if (runs?.[0]) {
      const { data } = await supabaseAdmin
        .from("capability_judgements")
        .select("capability_key, level, band, rationale")
        .eq("score_run_id", runs[0].id);
      judgements = data ?? [];
    }

    const visibleLedger = (ledger ?? []).filter(
      (e) => share.include_self_reported || e.strength !== "self_reported",
    );

    const judgementByKey = new Map(judgements.map((j) => [j.capability_key, j]));
    const claimByKey = new Map((claims ?? []).map((c) => [c.capability_key, c]));
    const evidenceByKey = new Map<string, { count: number; strongest: string | null }>();
    for (const e of visibleLedger) {
      if (!e.capability_key) continue;
      const bucket = evidenceByKey.get(e.capability_key) ?? { count: 0, strongest: null };
      bucket.count += 1;
      if (!bucket.strongest || (STRENGTH_RANK[e.strength] ?? 0) > (STRENGTH_RANK[bucket.strongest] ?? 0)) {
        bucket.strongest = e.strength;
      }
      evidenceByKey.set(e.capability_key, bucket);
    }

    const capabilities = (caps ?? []).map((c) => {
      const j = judgementByKey.get(c.key);
      const claim = claimByKey.get(c.key);
      const evidence = evidenceByKey.get(c.key);
      return {
        key: c.key,
        name: c.name,
        level: j?.level ?? claim?.level ?? null,
        band: j?.band ?? claim?.band ?? null,
        rationale: j?.rationale ?? null,
        verified: claim?.verified === true,
        evidenceCount: evidence?.count ?? 0,
        strongestStrength: evidence?.strongest ?? null,
      };
    });

    const judgedCount = capabilities.filter((c) => c.rationale).length;
    const withEvidence = capabilities.filter((c) => c.evidenceCount > 0).length;
    const explainable = judgedCount > 0 && judgedCount === withEvidence;

    await supabaseAdmin
      .from("portfolio_shares")
      .update({ view_count: share.view_count + 1 })
      .eq("id", share.id);

    return {
      valid: true,
      label: share.label,
      person: {
        name: profile?.full_name ?? profile?.display_name ?? "A DeliverX member",
        headline: profile?.headline ?? null,
      },
      framework: { key: framework.key, version: framework.version },
      readiness: {
        percent: capabilities.length === 0 ? 0 : Math.round((judgedCount / capabilities.length) * 100),
        explainable,
        label: explainable
          ? "Explainable — each judged capability cites ledger entries"
          : "Heuristic — coverage only, not a full explainable judgement",
        verifiedCount: capabilities.filter((c) => c.verified).length,
      },
      capabilities,
      stories: visibleLedger.slice(0, 12).map((e) => {
        const provenance =
          e.provenance && typeof e.provenance === "object" && !Array.isArray(e.provenance)
            ? (e.provenance as Record<string, unknown>)
            : {};
        return {
          summary: e.summary,
          source: e.source,
          strength: e.strength,
          occurredAt: e.occurred_at,
          coachConfirmed: provenance["coach_confirmed"] === true,
        };
      }),
    };
  });
