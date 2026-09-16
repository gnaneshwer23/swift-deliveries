import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PILOT_FRAMEWORK = { key: "pm-core", version: "2026.1" } as const;

export type FrameworkCapability = {
  key: string;
  name: string;
  description: string | null;
};

export type LedgerEntry = {
  id: string;
  source: string;
  strength: string;
  capabilityKey: string | null;
  summary: string;
  artefactTitle: string | null;
  artefactVersion: number | null;
  occurredAt: string;
  coachConfirmed: boolean;
  coachNote: string | null;
  frameworkVersion: string | null;
};

export type ClaimRow = {
  id: string;
  capabilityKey: string;
  level: number | null;
  band: string | null;
  evidenceStrength: string;
  attestationStatus: string;
  readinessBasis: string;
  verified: boolean;
  attestation: { attestorName: string; state: string; token: string } | null;
};

export type EvidenceOverview = {
  framework: { id: string; key: string; version: string; name: string };
  capabilities: FrameworkCapability[];
  artefacts: { id: string; title: string; kind: string; latestVersion: number }[];
  ledger: LedgerEntry[];
  claims: ClaimRow[];
  latestRun: {
    id: string;
    runKind: string;
    createdAt: string;
    judgements: { capabilityKey: string; level: number; band: string; rationale: string }[];
  } | null;
  readiness: { percent: number; basis: "evidence_coverage_heuristic" | "mixed" };
};

/** Everything the evidence + capability surfaces read. Owner-scoped by RLS. */
export const getEvidenceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EvidenceOverview> => {
    const { supabase, userId } = context;

    const { data: framework, error: fwError } = await supabase
      .from("capability_frameworks")
      .select("id, key, version, name")
      .eq("key", PILOT_FRAMEWORK.key)
      .eq("version", PILOT_FRAMEWORK.version)
      .single();
    if (fwError || !framework) throw new Error("The capability framework is unavailable.");

    const [{ data: caps }, { data: artefacts }, { data: versions }, { data: ledger }, { data: claims }, { data: runs }] =
      await Promise.all([
        supabase
          .from("framework_capabilities")
          .select("key, name, description, sort_order")
          .eq("framework_id", framework.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("artefacts")
          .select("id, title, kind")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("artefact_versions")
          .select("id, artefact_id, version")
          .eq("owner_id", userId),
        supabase
          .from("evidence_ledger")
          .select("id, source, strength, capability_key, summary, occurred_at, artefact_version_id, provenance")
          .eq("owner_id", userId)
          .order("occurred_at", { ascending: false })
          .limit(100),
        supabase
          .from("snapshot_claims")
          .select(
            "id, capability_key, level, band, evidence_strength, attestation_status, readiness_basis, verified",
          )
          .eq("owner_id", userId),
        supabase
          .from("score_runs")
          .select("id, run_kind, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

    const artefactById = new Map((artefacts ?? []).map((a) => [a.id, a]));
    const versionById = new Map((versions ?? []).map((v) => [v.id, v]));

    const latestVersionByArtefact = new Map<string, number>();
    for (const v of versions ?? []) {
      const current = latestVersionByArtefact.get(v.artefact_id) ?? 0;
      if (v.version > current) latestVersionByArtefact.set(v.artefact_id, v.version);
    }

    const claimIds = (claims ?? []).map((c) => c.id);
    const attestationByClaim = new Map<string, ClaimRow["attestation"]>();
    if (claimIds.length > 0) {
      const { data: atts } = await supabase
        .from("attestations")
        .select("claim_id, attestor_name, state, token, requested_at")
        .in("claim_id", claimIds)
        .order("requested_at", { ascending: false });
      for (const a of atts ?? []) {
        if (!attestationByClaim.has(a.claim_id)) {
          attestationByClaim.set(a.claim_id, {
            attestorName: a.attestor_name,
            state: a.state,
            token: a.token,
          });
        }
      }
    }

    let latestRun: EvidenceOverview["latestRun"] = null;
    const run = runs?.[0];
    if (run) {
      const { data: judgements } = await supabase
        .from("capability_judgements")
        .select("capability_key, level, band, rationale")
        .eq("score_run_id", run.id);
      latestRun = {
        id: run.id,
        runKind: run.run_kind,
        createdAt: run.created_at,
        judgements: (judgements ?? []).map((j) => ({
          capabilityKey: j.capability_key,
          level: j.level,
          band: j.band,
          rationale: j.rationale,
        })),
      };
    }

    const capabilityList = (caps ?? []).map((c) => ({
      key: c.key,
      name: c.name,
      description: c.description,
    }));

    const covered = new Set(
      (ledger ?? [])
        .filter((e) => e.capability_key && e.strength !== "self_reported")
        .map((e) => e.capability_key as string),
    );
    const percent =
      capabilityList.length === 0
        ? 0
        : Math.round((covered.size / capabilityList.length) * 100);

    return {
      framework,
      capabilities: capabilityList,
      artefacts: (artefacts ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        kind: a.kind,
        latestVersion: latestVersionByArtefact.get(a.id) ?? 0,
      })),
      ledger: (ledger ?? []).map((e) => {
        const version = e.artefact_version_id ? versionById.get(e.artefact_version_id) : undefined;
        const artefact = version ? artefactById.get(version.artefact_id) : undefined;
        const provenance = e.provenance && typeof e.provenance === "object" && !Array.isArray(e.provenance) ? e.provenance : {};
        return {
          id: e.id,
          source: e.source,
          strength: e.strength,
          capabilityKey: e.capability_key,
          summary: e.summary,
          artefactTitle: artefact?.title ?? null,
          artefactVersion: version?.version ?? null,
          occurredAt: e.occurred_at,
          coachConfirmed: provenance["coach_confirmed"] === true,
          coachNote: typeof provenance["coach_note"] === "string" ? provenance["coach_note"] : null,
          frameworkVersion: typeof provenance["framework_version"] === "string" ? provenance["framework_version"] : null,
        };
      }),
      claims: (claims ?? []).map((c) => ({
        id: c.id,
        capabilityKey: c.capability_key,
        level: c.level,
        band: c.band,
        evidenceStrength: c.evidence_strength,
        attestationStatus: c.attestation_status,
        readinessBasis: c.readiness_basis,
        verified: c.verified === true,
        attestation: attestationByClaim.get(c.id) ?? null,
      })),
      latestRun,
      readiness: {
        percent,
        basis: latestRun ? "mixed" : "evidence_coverage_heuristic",
      },
    };
  });

const artefactSchema = z.object({
  title: z.string().trim().min(3, "Give the work a title").max(160),
  kind: z.enum(["document", "decision", "meeting", "analysis", "reflection"]),
  body: z.string().trim().min(20, "Describe what you actually did (20+ characters)").max(8000),
  capabilityKey: z.string().trim().min(1).max(60),
  source: z.enum(["experience_sim", "workspace_contribution", "assessment"]),
  summary: z.string().trim().min(10, "Summarise the proof").max(400),
});

/**
 * Records real work: an artefact, an immutable version of it, and a ledger
 * entry citing that version. Never touches capability or Verified.
 */
export const recordWorkEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => artefactSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: artefact, error: artefactError } = await supabase
      .from("artefacts")
      .insert({ owner_id: userId, title: data.title, kind: data.kind })
      .select("id")
      .single();
    if (artefactError || !artefact) throw new Error(artefactError?.message ?? "Could not save the work.");

    const { data: version, error: versionError } = await supabase
      .from("artefact_versions")
      .insert({ artefact_id: artefact.id, owner_id: userId, version: 1, body: data.body })
      .select("id")
      .single();
    if (versionError || !version) throw new Error(versionError?.message ?? "Could not save the version.");

    const { error: ledgerError } = await supabase.from("evidence_ledger").insert({
      owner_id: userId,
      artefact_version_id: version.id,
      source: data.source,
      strength: data.source === "assessment" ? "assessed" : "observed",
      capability_key: data.capabilityKey,
      summary: data.summary,
      provenance: { recorded_via: "workspace_evidence_form", artefact_id: artefact.id },
    });
    if (ledgerError) throw new Error(ledgerError.message);

    return { artefactId: artefact.id };
  });

const selfReportSchema = z.object({
  capabilityKey: z.string().trim().min(1).max(60),
  summary: z.string().trim().min(10, "Say what you're claiming").max(400),
});

/** A labelled self-reported claim. Always stored at the weakest strength. */
export const recordSelfReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => selfReportSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("evidence_ledger").insert({
      owner_id: context.userId,
      source: "self_report",
      strength: "self_reported",
      capability_key: data.capabilityKey,
      summary: data.summary,
      provenance: { recorded_via: "self_report_form" },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * The Capability Engine. Only trusted server code writes score runs,
 * judgements and claims. Levels, bands and rationales come from the ledger
 * evidence, judged by Lovable AI, and every judgement cites the exact ledger
 * entries behind it. A run never sets Verified — only external attestation
 * does that.
 */
export const runCapabilityScoring = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        runKind: z.enum(["baseline", "interim", "final", "transfer"]),
        subjectUserId: z.string().uuid().nullish(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Coaches and admins may run scoring for someone else; everyone else only for themselves.
    let subjectId = userId;
    let coachInitiated = false;
    if (data.subjectUserId && data.subjectUserId !== userId) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isCoach = (roles ?? []).some((row) => row.role === "moderator" || row.role === "admin");
      if (!isCoach) throw new Error("Only a coach or admin can score someone else's evidence.");
      subjectId = data.subjectUserId;
      coachInitiated = true;
    }

    const { data: framework } = await supabase
      .from("capability_frameworks")
      .select("id, key, version")
      .eq("key", PILOT_FRAMEWORK.key)
      .eq("version", PILOT_FRAMEWORK.version)
      .single();
    if (!framework) throw new Error("The capability framework is unavailable.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: caps }, { data: evidence }] = await Promise.all([
      supabaseAdmin
        .from("framework_capabilities")
        .select("key, name, description, sort_order")
        .eq("framework_id", framework.id)
        .order("sort_order", { ascending: true }),
      supabaseAdmin
        .from("evidence_ledger")
        .select(
          "id, capability_key, strength, source, summary, occurred_at, provenance, artefact_version_id",
        )
        .eq("owner_id", subjectId)
        .order("occurred_at", { ascending: false })
        .limit(120),
    ]);

    const usable = (evidence ?? []).filter((row) => row.capability_key);
    if (usable.length === 0) {
      throw new Error(
        "There is no evidence to judge yet. Submit Experience work or coaching work first.",
      );
    }
    const strongEnough = usable.filter((row) => row.strength !== "self_reported");
    if (strongEnough.length === 0) {
      throw new Error(
        "Only self-reported claims are on record. Scoring needs work you actually submitted — an Experience task or a coach-confirmed exercise.",
      );
    }

    const versionIds = usable
      .map((row) => row.artefact_version_id)
      .filter((id): id is string => Boolean(id));
    const bodyByVersion = new Map<string, string>();
    if (versionIds.length > 0) {
      const { data: versions } = await supabaseAdmin
        .from("artefact_versions")
        .select("id, body")
        .in("id", versionIds);
      for (const version of versions ?? []) bodyByVersion.set(version.id, version.body);
    }

    const { judgeCapabilities } = await import("./ai-judge.server");
    const judgements = await judgeCapabilities(
      (caps ?? []).map((c) => ({ key: c.key, name: c.name, description: c.description })),
      usable.map((row) => {
        const provenance =
          row.provenance && typeof row.provenance === "object" && !Array.isArray(row.provenance)
            ? (row.provenance as Record<string, unknown>)
            : {};
        const body = row.artefact_version_id ? bodyByVersion.get(row.artefact_version_id) : undefined;
        return {
          id: row.id,
          capabilityKey: row.capability_key as string,
          strength: row.strength,
          source: row.source,
          summary: row.summary,
          occurredAt: row.occurred_at,
          coachConfirmed: provenance["coach_confirmed"] === true,
          excerpt: body ? body.slice(0, 2200) : null,
        };
      }),
    );

    if (judgements.length === 0) {
      throw new Error(
        "The evidence on record wasn't clear enough to judge. Add more detail to your submitted work and run this again.",
      );
    }

    const { data: run, error: runError } = await supabaseAdmin
      .from("score_runs")
      .insert({
        owner_id: subjectId,
        framework_id: framework.id,
        run_kind: data.runKind,
        notes: coachInitiated
          ? `Coach-initiated run against ${framework.key}@${framework.version}; judged from ledger evidence with written rationales.`
          : `Self-service run against ${framework.key}@${framework.version}; judged from ledger evidence with written rationales.`,
      })
      .select("id")
      .single();
    if (runError || !run) throw new Error(runError?.message ?? "Could not start the score run.");

    for (const judgement of judgements) {
      await supabaseAdmin.from("capability_judgements").insert({
        score_run_id: run.id,
        owner_id: subjectId,
        capability_key: judgement.capability_key,
        level: judgement.level,
        band: judgement.band,
        rationale: judgement.rationale,
        evidence_ids: judgement.evidence_ids,
      });

      const strengths = new Set(
        usable
          .filter((row) => judgement.evidence_ids.includes(row.id))
          .map((row) => row.strength as string),
      );
      const citedStrength = strengths.has("externally_verified")
        ? "externally_verified"
        : strengths.has("assessed")
          ? "assessed"
          : strengths.has("observed")
            ? "observed"
            : "self_reported";

      const { data: existing } = await supabaseAdmin
        .from("snapshot_claims")
        .select("id")
        .eq("owner_id", subjectId)
        .eq("framework_id", framework.id)
        .eq("capability_key", judgement.capability_key)
        .maybeSingle();

      if (existing) {
        // Never touch attestation state or Verified from a score run.
        await supabaseAdmin
          .from("snapshot_claims")
          .update({
            level: judgement.level,
            band: judgement.band,
            score_run_id: run.id,
            readiness_basis: "score_run",
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin.from("snapshot_claims").insert({
          owner_id: subjectId,
          framework_id: framework.id,
          capability_key: judgement.capability_key,
          level: judgement.level,
          band: judgement.band,
          score_run_id: run.id,
          evidence_strength: citedStrength,
          readiness_basis: "score_run",
        });
      }
    }

    return { runId: run.id, judged: judgements.length, coachInitiated };
  });

/** Owner asks an external person to confirm a claim. Verified stays off. */
export const requestAttestation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        claimId: z.string().uuid(),
        attestorName: z.string().trim().min(2, "Who will confirm this?").max(120),
        attestorEmail: z.string().trim().email("Enter a valid email address").max(255),
        relationship: z.string().trim().max(160).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error } = await supabase
      .from("attestations")
      .insert({
        claim_id: data.claimId,
        owner_id: userId,
        attestor_name: data.attestorName,
        attestor_email: data.attestorEmail,
        relationship: data.relationship || null,
      })
      .select("token")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not create the request.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("snapshot_claims")
      .update({ attestation_status: "attestation_requested" })
      .eq("id", data.claimId)
      .eq("owner_id", userId);

    return { token: row.token };
  });

/** Public: what the external attestor sees. No owner PII beyond their name. */
export const getAttestationRequest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: att } = await supabaseAdmin
      .from("attestations")
      .select("id, claim_id, attestor_name, state, owner_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!att) return { valid: false as const, reason: "not_found" as const };
    if (att.state !== "pending") return { valid: false as const, reason: "answered" as const };

    const { data: claim } = await supabaseAdmin
      .from("snapshot_claims")
      .select("capability_key, level")
      .eq("id", att.claim_id)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, display_name")
      .eq("id", att.owner_id)
      .maybeSingle();

    return {
      valid: true as const,
      attestorName: att.attestor_name,
      personName: profile?.full_name ?? profile?.display_name ?? "A DeliverX member",
      capabilityKey: claim?.capability_key ?? "",
      level: claim?.level ?? null,
    };
  });

/**
 * The only path to Verified: an external attestor confirms, which appends
 * external_verification evidence and lets the database compute Verified.
 */
export const respondToAttestation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().min(10).max(200),
        decision: z.enum(["confirmed", "declined", "disputed"]),
        statement: z.string().trim().max(1000).optional().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: att } = await supabaseAdmin
      .from("attestations")
      .select("id, claim_id, owner_id, state, attestor_name")
      .eq("token", data.token)
      .maybeSingle();
    if (!att || att.state !== "pending") throw new Error("This request is no longer open.");

    const { error: attError } = await supabaseAdmin
      .from("attestations")
      .update({
        state: data.decision,
        statement: data.statement || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", att.id);
    if (attError) throw new Error(attError.message);

    const { data: claim } = await supabaseAdmin
      .from("snapshot_claims")
      .select("capability_key")
      .eq("id", att.claim_id)
      .maybeSingle();

    if (data.decision === "confirmed") {
      await supabaseAdmin.from("evidence_ledger").insert({
        owner_id: att.owner_id,
        source: "external_verification",
        strength: "externally_verified",
        capability_key: claim?.capability_key ?? null,
        summary: `Externally confirmed by ${att.attestor_name}.`,
        provenance: { attestation_id: att.id, statement: data.statement || null },
      });

      await supabaseAdmin
        .from("snapshot_claims")
        .update({
          attestation_status: "externally_attested",
          evidence_strength: "externally_verified",
        })
        .eq("id", att.claim_id);
    } else if (data.decision === "disputed") {
      await supabaseAdmin
        .from("snapshot_claims")
        .update({ attestation_status: "disputed" })
        .eq("id", att.claim_id);
    } else {
      await supabaseAdmin
        .from("snapshot_claims")
        .update({ attestation_status: "unattested" })
        .eq("id", att.claim_id);
    }

    return { ok: true };
  });
