import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

export type InterviewLab = {
  capabilities: Array<{ key: string; level: number; band: string }>;
  sessions: Array<{
    id: string;
    roleTarget: string;
    focusCapabilityKey: string | null;
    status: string;
    createdAt: string;
    questions: Array<{
      id: string;
      prompt: string;
      origin: string;
      capabilityKey: string | null;
      answer: { id: string; body: string; selfRating: number | null } | null;
    }>;
  }>;
};

export const getInterviewLab = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InterviewLab> => {
    const { supabase, userId } = context;
    const [judgements, sessions] = await Promise.all([
      supabase
        .from("capability_judgements")
        .select("capability_key,level,band,created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("interview_sessions")
        .select("id,role_target,focus_capability_key,status,created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (judgements.error) throw new Error(judgements.error.message);
    if (sessions.error) throw new Error(sessions.error.message);

    const seen = new Set<string>();
    const capabilities: InterviewLab["capabilities"] = [];
    for (const row of judgements.data ?? []) {
      if (seen.has(row.capability_key)) continue;
      seen.add(row.capability_key);
      capabilities.push({ key: row.capability_key, level: row.level, band: row.band });
    }

    const sessionIds = (sessions.data ?? []).map((s) => s.id);
    let questions: Array<{
      id: string;
      session_id: string;
      prompt: string;
      origin: string;
      capability_key: string | null;
      sort_order: number;
    }> = [];
    let answers: Array<{ id: string; question_id: string; body: string; self_rating: number | null }> = [];
    if (sessionIds.length) {
      const [q, a] = await Promise.all([
        supabase
          .from("interview_questions")
          .select("id,session_id,prompt,origin,capability_key,sort_order")
          .in("session_id", sessionIds)
          .order("sort_order"),
        supabase.from("interview_answers").select("id,question_id,body,self_rating").eq("owner_id", userId),
      ]);
      if (q.error) throw new Error(q.error.message);
      if (a.error) throw new Error(a.error.message);
      questions = q.data ?? [];
      answers = a.data ?? [];
    }

    return {
      capabilities,
      sessions: (sessions.data ?? []).map((s) => ({
        id: s.id,
        roleTarget: s.role_target,
        focusCapabilityKey: s.focus_capability_key,
        status: s.status,
        createdAt: s.created_at,
        questions: questions
          .filter((q) => q.session_id === s.id)
          .map((q) => {
            const answer = answers.find((a) => a.question_id === q.id);
            return {
              id: q.id,
              prompt: q.prompt,
              origin: q.origin,
              capabilityKey: q.capability_key,
              answer: answer
                ? { id: answer.id, body: answer.body, selfRating: answer.self_rating }
                : null,
            };
          }),
      })),
    };
  });

export const createInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        roleTarget: z.string().trim().min(2).max(120),
        focusCapabilityKey: z.string().trim().max(80).nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ sessionId: string; questionCount: number }> => {
    const { supabase, userId } = context;

    const [judgements, evidence] = await Promise.all([
      supabase
        .from("capability_judgements")
        .select("capability_key,level,band,rationale")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("evidence_ledger")
        .select("summary,strength,capability_key,occurred_at")
        .eq("owner_id", userId)
        .neq("strength", "self_reported")
        .order("occurred_at", { ascending: false })
        .limit(25),
    ]);
    if (judgements.error) throw new Error(judgements.error.message);
    if (evidence.error) throw new Error(evidence.error.message);
    if (!(evidence.data ?? []).length) {
      throw new Error(
        "Interview Lab works from your recorded work. Complete an Experience task or submit a workspace artefact first.",
      );
    }

    const capabilityKeys = Array.from(
      new Set([
        ...(judgements.data ?? []).map((j) => j.capability_key),
        ...(evidence.data ?? []).map((e) => e.capability_key).filter((k): k is string => Boolean(k)),
      ]),
    );
    const evidenceContext = [
      ...(judgements.data ?? []).map(
        (j) => `Judged capability ${j.capability_key}: level ${j.level} (${j.band} confidence). ${j.rationale}`,
      ),
      ...(evidence.data ?? []).map(
        (e) => `Evidence (${e.strength}${e.capability_key ? `, ${e.capability_key}` : ""}): ${e.summary}`,
      ),
    ].join("\n");

    const { generateInterviewQuestions } = await import("./interview-ai.server");
    const drafts = await generateInterviewQuestions({
      roleTarget: data.roleTarget,
      focusCapabilityKey: data.focusCapabilityKey,
      evidenceContext,
      capabilityKeys,
    });

    const { data: session, error } = await supabase
      .from("interview_sessions")
      .insert({
        owner_id: userId,
        role_target: data.roleTarget,
        focus_capability_key: data.focusCapabilityKey,
      })
      .select("id")
      .single();
    if (error || !session) throw new Error(error?.message ?? "Could not start the session.");

    const { error: insertError } = await supabase.from("interview_questions").insert(
      drafts.map((d, index) => ({
        session_id: session.id,
        owner_id: userId,
        prompt: d.prompt,
        origin: "ai_draft",
        capability_key: d.capabilityKey,
        sort_order: index,
      })),
    );
    if (insertError) throw new Error(insertError.message);

    return { sessionId: session.id, questionCount: drafts.length };
  });

export const addInterviewQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ sessionId: uuid, prompt: z.string().trim().min(10).max(600) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("interview_questions")
      .select("id", { count: "exact", head: true })
      .eq("session_id", data.sessionId);
    const { error } = await supabase.from("interview_questions").insert({
      session_id: data.sessionId,
      owner_id: userId,
      prompt: data.prompt,
      origin: "user_added",
      sort_order: count ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveInterviewAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        questionId: uuid,
        body: z.string().trim().min(20).max(6000),
        selfRating: z.number().int().min(1).max(5).nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("interview_answers")
      .upsert(
        {
          question_id: data.questionId,
          owner_id: userId,
          body: data.body,
          self_rating: data.selfRating,
        },
        { onConflict: "question_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeInterviewSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ sessionId: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("interview_sessions")
      .update({ status: "closed" })
      .eq("id", data.sessionId)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ApplicationBoard = {
  applications: Array<{
    id: string;
    company: string;
    roleTitle: string;
    source: string;
    stage: string;
    appliedAt: string | null;
    nextStep: string;
    nextStepAt: string | null;
    notes: string;
    portfolioShareId: string | null;
  }>;
  shares: Array<{ id: string; label: string; token: string; expiresAt: string; revokedAt: string | null }>;
};

export const getApplicationBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApplicationBoard> => {
    const { supabase, userId } = context;
    const [apps, shares] = await Promise.all([
      supabase
        .from("job_applications")
        .select("id,company,role_title,source,stage,applied_at,next_step,next_step_at,notes,portfolio_share_id")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("portfolio_shares")
        .select("id,label,token,expires_at,revoked_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (apps.error) throw new Error(apps.error.message);
    if (shares.error) throw new Error(shares.error.message);
    return {
      applications: (apps.data ?? []).map((a) => ({
        id: a.id,
        company: a.company,
        roleTitle: a.role_title,
        source: a.source,
        stage: a.stage,
        appliedAt: a.applied_at,
        nextStep: a.next_step,
        nextStepAt: a.next_step_at,
        notes: a.notes,
        portfolioShareId: a.portfolio_share_id,
      })),
      shares: (shares.data ?? []).map((s) => ({
        id: s.id,
        label: s.label,
        token: s.token,
        expiresAt: s.expires_at,
        revokedAt: s.revoked_at,
      })),
    };
  });

const STAGES = ["saved", "applied", "interviewing", "offer", "closed"] as const;

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        company: z.string().trim().min(2).max(120),
        roleTitle: z.string().trim().min(2).max(120),
        source: z.string().trim().min(2).max(60).default("direct"),
        notes: z.string().trim().max(2000).default(""),
        portfolioShareId: uuid.nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // One row per open pursuit: re-adding the same company and role is a
    // duplicate, not a second application.
    const existing = await supabase
      .from("job_applications")
      .select("id")
      .eq("owner_id", userId)
      .neq("stage", "closed")
      .ilike("company", data.company)
      .ilike("role_title", data.roleTitle)
      .limit(1);
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data?.length) return { ok: true, duplicate: true as const };

    const { error } = await supabase.from("job_applications").insert({
      owner_id: userId,
      company: data.company,
      role_title: data.roleTitle,
      source: data.source,
      notes: data.notes,
      portfolio_share_id: data.portfolioShareId,
    });
    if (error) throw new Error(error.message);
    return { ok: true, duplicate: false as const };
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: uuid,
        stage: z.enum(STAGES).optional(),
        nextStep: z.string().trim().max(300).optional(),
        notes: z.string().trim().max(2000).optional(),
        portfolioShareId: uuid.nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: {
      stage?: string;
      applied_at?: string;
      next_step?: string;
      notes?: string;
      portfolio_share_id?: string | null;
    } = {};
    if (data.stage) {
      patch.stage = data.stage;
      if (data.stage === "applied") patch.applied_at = new Date().toISOString();
    }
    if (data.nextStep !== undefined) patch.next_step = data.nextStep;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.portfolioShareId !== undefined) patch.portfolio_share_id = data.portfolioShareId;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await supabase
      .from("job_applications")
      .update(patch)
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type PerformanceReviewBoard = {
  isCoach: boolean;
  mine: Array<{
    id: string;
    periodLabel: string;
    selfSummary: string;
    status: string;
    reviewerSummary: string | null;
    reviewerDecision: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
  }>;
  queue: Array<{ id: string; periodLabel: string; selfSummary: string; submittedAt: string | null; status: string }>;
};

export const getPerformanceReviewBoard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PerformanceReviewBoard> => {
    const { supabase, userId } = context;
    const [roles, mine] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("performance_reviews")
        .select("id,period_label,self_summary,status,reviewer_summary,reviewer_decision,submitted_at,reviewed_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (mine.error) throw new Error(mine.error.message);
    const isCoach = (roles.data ?? []).some((r) => r.role === "moderator" || r.role === "admin");

    let queue: PerformanceReviewBoard["queue"] = [];
    if (isCoach) {
      const { data, error } = await supabase
        .from("performance_reviews")
        .select("id,period_label,self_summary,submitted_at,status,owner_id")
        .eq("status", "submitted")
        .neq("owner_id", userId)
        .order("submitted_at");
      if (error) throw new Error(error.message);
      queue = (data ?? []).map((r) => ({
        id: r.id,
        periodLabel: r.period_label,
        selfSummary: r.self_summary,
        submittedAt: r.submitted_at,
        status: r.status,
      }));
    }

    return {
      isCoach,
      mine: (mine.data ?? []).map((r) => ({
        id: r.id,
        periodLabel: r.period_label,
        selfSummary: r.self_summary,
        status: r.status,
        reviewerSummary: r.reviewer_summary,
        reviewerDecision: r.reviewer_decision,
        submittedAt: r.submitted_at,
        reviewedAt: r.reviewed_at,
      })),
      queue,
    };
  });

export const createPerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        periodLabel: z.string().trim().min(2).max(80),
        selfSummary: z.string().trim().min(40).max(6000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("performance_reviews").insert({
      owner_id: userId,
      period_label: data.periodLabel,
      self_summary: data.selfSummary,
      status: "draft",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ id: uuid, selfSummary: z.string().trim().min(40).max(6000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("performance_reviews")
      .update({ self_summary: data.selfSummary })
      .eq("id", data.id)
      .eq("owner_id", userId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitPerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: uuid }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("performance_reviews")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_id", userId)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const decidePerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: uuid,
        decision: z.enum(["confirmed", "returned"]),
        summary: z.string().trim().min(10).max(4000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("review_performance_review", {
      _review_id: data.id,
      _decision: data.decision,
      _summary: data.summary,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
