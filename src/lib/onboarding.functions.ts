import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PILOT_FRAMEWORK = { key: "pm-core", version: "2026.1" } as const;

export const CLAIM_KINDS = [
  "identity",
  "target",
  "strength",
  "evidence_posture",
  "working_style",
] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export type SelfReportClaim = {
  kind: ClaimKind;
  key: string;
  value: string;
  capabilityKey: string | null;
};

export type PiOnboarding = {
  profile: { fullName: string; headline: string } | null;
  hasOrganisation: boolean;
  state: { currentStep: number; completed: boolean; skippedSteps: number[] };
  claims: SelfReportClaim[];
  capabilities: { key: string; name: string; description: string | null }[];
};

/** Everything the eight-step PI onboarding flow needs. Owner-scoped by RLS. */
export const getPiOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PiOnboarding> => {
    const { supabase, userId } = context;

    const { data: framework } = await supabase
      .from("capability_frameworks")
      .select("id")
      .eq("key", PILOT_FRAMEWORK.key)
      .eq("version", PILOT_FRAMEWORK.version)
      .maybeSingle();

    const [{ data: profile }, { data: state }, { data: claims }, { data: memberships }] =
      await Promise.all([
        supabase.from("profiles").select("full_name, headline").eq("id", userId).maybeSingle(),
        supabase
          .from("pi_onboarding_state")
          .select("current_step, completed, skipped_steps")
          .eq("owner_id", userId)
          .maybeSingle(),
        supabase
          .from("self_report_claims")
          .select("claim_kind, claim_key, claim_value, framework_capability_key")
          .eq("owner_id", userId),
        supabase
          .from("organisation_memberships")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1),
      ]);

    let capabilities: PiOnboarding["capabilities"] = [];
    if (framework) {
      const { data: caps } = await supabase
        .from("framework_capabilities")
        .select("key, name, description, sort_order")
        .eq("framework_id", framework.id)
        .order("sort_order", { ascending: true });
      capabilities = (caps ?? []).map((c) => ({
        key: c.key,
        name: c.name,
        description: c.description,
      }));
    }

    return {
      profile: profile
        ? { fullName: profile.full_name ?? "", headline: profile.headline ?? "" }
        : null,
      hasOrganisation: (memberships ?? []).length > 0,
      state: {
        currentStep: state?.current_step ?? 1,
        completed: state?.completed ?? false,
        skippedSteps: state?.skipped_steps ?? [],
      },
      claims: (claims ?? []).map((c) => ({
        kind: c.claim_kind as ClaimKind,
        key: c.claim_key,
        value: c.claim_value,
        capabilityKey: c.framework_capability_key,
      })),
      capabilities,
    };
  });

const stepSchema = z.object({
  step: z.number().int().min(1).max(8),
  skipped: z.boolean().optional().default(false),
  profile: z
    .object({
      fullName: z.string().trim().max(120),
      headline: z.string().trim().max(160),
    })
    .optional(),
  claims: z
    .array(
      z.object({
        kind: z.enum(CLAIM_KINDS),
        key: z.string().trim().min(1).max(80),
        value: z.string().trim().min(1).max(600),
        capabilityKey: z.string().trim().max(80).optional(),
      }),
    )
    .max(60)
    .optional()
    .default([]),
});

/**
 * Stores one onboarding step. Every stored answer is a self-reported Claim:
 * this never writes evidence, score runs, capability, or verified status.
 */
export const savePiOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => stepSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.profile && data.profile.fullName) {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: data.profile.fullName,
        display_name: data.profile.fullName.split(" ")[0] ?? data.profile.fullName,
        headline: data.profile.headline || null,
      });
      if (error) throw new Error(error.message);
    }

    if (data.claims.length > 0) {
      const { error } = await supabase.from("self_report_claims").upsert(
        data.claims.map((c) => ({
          owner_id: userId,
          claim_kind: c.kind,
          claim_key: c.key,
          claim_value: c.value,
          framework_capability_key: c.capabilityKey ?? null,
        })),
        { onConflict: "owner_id,claim_kind,claim_key" },
      );
      if (error) throw new Error(error.message);
    }

    const { data: existing } = await supabase
      .from("pi_onboarding_state")
      .select("current_step, skipped_steps")
      .eq("owner_id", userId)
      .maybeSingle();

    const skipped = new Set<number>(existing?.skipped_steps ?? []);
    if (data.skipped) skipped.add(data.step);
    else skipped.delete(data.step);

    const nextStep = Math.min(8, Math.max(existing?.current_step ?? 1, data.step + 1));

    const { error: stateError } = await supabase.from("pi_onboarding_state").upsert({
      owner_id: userId,
      current_step: nextStep,
      skipped_steps: [...skipped].sort((a, b) => a - b),
    });
    if (stateError) throw new Error(stateError.message);

    return { ok: true, currentStep: nextStep };
  });

/** Marks onboarding complete. Creates no evidence and no capability signal. */
export const completePiOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("pi_onboarding_state").upsert({
      owner_id: context.userId,
      current_step: 8,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type JourneyState = "A" | "B" | "C" | "D";

export type DailyBriefing = {
  onboardingCompleted: boolean;
  onboardingStep: number;
  journeyState: JourneyState;
  evidenceBySource: { source: string; count: number }[];
  evidenceTotal: number;
  judgedCapabilities: number;
  capabilityTotal: number;
  attestationsRequested: number;
  verifiedClaims: number;
  identity: SelfReportClaim[];
  targets: SelfReportClaim[];
  strengths: SelfReportClaim[];
  workingStyle: SelfReportClaim[];
  evidencePosture: SelfReportClaim[];
};

/**
 * Read-only briefing. Reads the ledger, judgements, claims and attestations
 * without writing anything: only the Capability Engine writes capability.
 */
export const getDailyBriefing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DailyBriefing> => {
    const { supabase, userId } = context;

    const { data: framework } = await supabase
      .from("capability_frameworks")
      .select("id")
      .eq("key", PILOT_FRAMEWORK.key)
      .eq("version", PILOT_FRAMEWORK.version)
      .maybeSingle();

    const [{ data: state }, { data: ledger }, { data: claims }, { data: selfClaims }] =
      await Promise.all([
        supabase
          .from("pi_onboarding_state")
          .select("current_step, completed")
          .eq("owner_id", userId)
          .maybeSingle(),
        supabase.from("evidence_ledger").select("source, capability_key").eq("owner_id", userId),
        supabase
          .from("snapshot_claims")
          .select("id, capability_key, level, verified, attestation_status")
          .eq("owner_id", userId),
        supabase
          .from("self_report_claims")
          .select("claim_kind, claim_key, claim_value, framework_capability_key")
          .eq("owner_id", userId)
          .order("created_at", { ascending: true }),
      ]);

    let capabilityTotal = 0;
    if (framework) {
      const { count } = await supabase
        .from("framework_capabilities")
        .select("id", { count: "exact", head: true })
        .eq("framework_id", framework.id);
      capabilityTotal = count ?? 0;
    }

    const bySource = new Map<string, number>();
    for (const row of ledger ?? []) {
      bySource.set(row.source, (bySource.get(row.source) ?? 0) + 1);
    }

    const judged = new Set(
      (claims ?? []).filter((c) => c.level !== null).map((c) => c.capability_key),
    );
    const verifiedClaims = (claims ?? []).filter((c) => c.verified === true).length;
    const attestationsRequested = (claims ?? []).filter(
      (c) => c.attestation_status !== "unattested",
    ).length;

    const evidenceTotal = ledger?.length ?? 0;
    const journeyState: JourneyState =
      verifiedClaims > 0 ? "D" : judged.size > 0 ? "C" : evidenceTotal > 0 ? "B" : "A";

    const pick = (kind: ClaimKind): SelfReportClaim[] =>
      (selfClaims ?? [])
        .filter((c) => c.claim_kind === kind)
        .map((c) => ({
          kind: c.claim_kind as ClaimKind,
          key: c.claim_key,
          value: c.claim_value,
          capabilityKey: c.framework_capability_key,
        }));

    return {
      onboardingCompleted: state?.completed ?? false,
      onboardingStep: state?.current_step ?? 1,
      journeyState,
      evidenceBySource: [...bySource.entries()].map(([source, count]) => ({ source, count })),
      evidenceTotal,
      judgedCapabilities: judged.size,
      capabilityTotal,
      attestationsRequested,
      verifiedClaims,
      identity: pick("identity"),
      targets: pick("target"),
      strengths: pick("strength"),
      workingStyle: pick("working_style"),
      evidencePosture: pick("evidence_posture"),
    };
  });
