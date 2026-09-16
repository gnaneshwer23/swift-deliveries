import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CoachingExercise = {
  id: string;
  programmeId: string;
  title: string;
  instructions: string;
  artefactType: string;
  capabilityName: string;
};

export type CoachingProgramme = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  framework: string;
  exercises: CoachingExercise[];
};

export type CoachingSubmission = {
  id: string;
  ownerName: string;
  exerciseTitle: string;
  programmeName: string;
  artefactTitle: string;
  body: string;
  intakeMethod: string;
  externalUrl: string | null;
  storagePath: string | null;
  contentHash: string;
  selfConfidence: number | null;
  state: string;
  attempt: number;
  submittedAt: string;
  review: { decision: string; coachNote: string; createdAt: string } | null;
};

export type CoachingWorkspace = {
  isCoach: boolean;
  hasEnabledProgramme: boolean;
  programmes: CoachingProgramme[];
  mySubmissions: CoachingSubmission[];
  reviewQueue: CoachingSubmission[];
};

/** Candidate catalogue/history and the review queue allowed by RLS. */
export const getCoachingWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoachingWorkspace> => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isCoach = (roles ?? []).some((row) => row.role === "moderator" || row.role === "admin");

    const [{ data: programmes }, { data: exercises }, { data: submissions, error }] = await Promise.all([
      supabase
        .from("coaching_programmes")
        .select("id, name, description, enabled, capability_frameworks(key, version)")
        .order("name"),
      supabase
        .from("coaching_exercises")
        .select("id, programme_id, title, instructions, artefact_type, sort_order, framework_capabilities(name)")
        .order("sort_order"),
      supabase
        .from("coaching_submissions")
        .select("id, owner_id, exercise_id, artefact_version_id, intake_method, external_url, storage_path, content_hash, self_confidence, state, attempt, submitted_at")
        .order("submitted_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);

    const rows = submissions ?? [];
    const versionIds = rows.map((row) => row.artefact_version_id);
    const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
    const submissionIds = rows.map((row) => row.id);
    const [{ data: versions }, { data: reviews }, { data: profiles }] = await Promise.all([
      versionIds.length
        ? supabase.from("artefact_versions").select("id, artefact_id, body, artefacts(title)").in("id", versionIds)
        : Promise.resolve({ data: [] }),
      submissionIds.length
        ? supabase.from("coach_reviews").select("submission_id, decision, coach_note, created_at").in("submission_id", submissionIds)
        : Promise.resolve({ data: [] }),
      ownerIds.length
        ? supabase.from("profiles").select("id, full_name, display_name").in("id", ownerIds)
        : Promise.resolve({ data: [] }),
    ]);

    const exerciseById = new Map((exercises ?? []).map((exercise) => [exercise.id, exercise]));
    const programmeById = new Map((programmes ?? []).map((programme) => [programme.id, programme]));
    const versionById = new Map((versions ?? []).map((version) => [version.id, version]));
    const reviewBySubmission = new Map((reviews ?? []).map((review) => [review.submission_id, review]));
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    const mapped = rows.map((row): CoachingSubmission => {
      const exercise = exerciseById.get(row.exercise_id);
      const programme = exercise ? programmeById.get(exercise.programme_id) : undefined;
      const version = versionById.get(row.artefact_version_id);
      const artefact = version?.artefacts;
      const review = reviewBySubmission.get(row.id);
      const profile = profileById.get(row.owner_id);
      return {
        id: row.id,
        ownerName: profile?.display_name ?? profile?.full_name ?? "DeliverX member",
        exerciseTitle: exercise?.title ?? "Coaching exercise",
        programmeName: programme?.name ?? "Coaching programme",
        artefactTitle: artefact?.title ?? "Submitted artefact",
        body: version?.body ?? "",
        intakeMethod: row.intake_method,
        externalUrl: row.external_url,
        storagePath: row.storage_path,
        contentHash: row.content_hash,
        selfConfidence: row.self_confidence,
        state: row.state,
        attempt: row.attempt,
        submittedAt: row.submitted_at,
        review: review
          ? { decision: review.decision, coachNote: review.coach_note, createdAt: review.created_at }
          : null,
      };
    });

    return {
      isCoach,
      hasEnabledProgramme: (programmes ?? []).some((programme) => programme.enabled),
      programmes: (programmes ?? []).map((programme) => ({
        id: programme.id,
        name: programme.name,
        description: programme.description,
        enabled: programme.enabled,
        framework: `${programme.capability_frameworks?.key ?? "framework"}@${programme.capability_frameworks?.version ?? "unknown"}`,
        exercises: (exercises ?? [])
          .filter((exercise) => exercise.programme_id === programme.id)
          .map((exercise) => ({
            id: exercise.id,
            programmeId: exercise.programme_id,
            title: exercise.title,
            instructions: exercise.instructions,
            artefactType: exercise.artefact_type,
            capabilityName: exercise.framework_capabilities?.name ?? "Framework criterion",
          })),
      })),
      mySubmissions: mapped.filter((row, index) => rows[index]?.owner_id === userId),
      reviewQueue: isCoach
        ? mapped.filter((row, index) => rows[index]?.owner_id !== userId && row.state === "pending")
        : [],
    };
  });

const submitSchema = z.object({
  exerciseId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(20).max(20000),
  intakeMethod: z.enum(["structured_response", "file_upload", "external_link"]),
  externalUrl: z.string().url().startsWith("https://").max(2000).nullable(),
  storagePath: z.string().max(500).nullable(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  selfConfidence: z.number().int().min(1).max(5).nullable(),
});

export const submitCoachingEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: submissionId, error } = await context.supabase.rpc("create_coaching_submission", {
      _exercise_id: data.exerciseId,
      _title: data.title,
      _body: data.body,
      _intake_method: data.intakeMethod,
      _content_hash: data.contentHash,
      ...(data.externalUrl ? { _external_url: data.externalUrl } : {}),
      ...(data.storagePath ? { _storage_path: data.storagePath } : {}),
      ...(data.selfConfidence === null ? {} : { _self_confidence: data.selfConfidence }),
    });
    if (error || !submissionId) throw new Error(error?.message ?? "Could not submit this work.");
    return { submissionId };
  });

export const reviewCoachingSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ submissionId: z.string().uuid(), decision: z.enum(["confirmed", "rejected"]), coachNote: z.string().trim().min(3).max(2000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: reviewId, error } = await context.supabase.rpc("review_coaching_submission", {
      _submission_id: data.submissionId,
      _decision: data.decision,
      _coach_note: data.coachNote,
    });
    if (error || !reviewId) throw new Error(error?.message ?? "Could not save this review.");
    return { reviewId };
  });

export type CoachQueueItem = CoachingSubmission & { waitingHours: number };

export type CoachReviewWorkspace = {
  isCoach: boolean;
  stats: { waiting: number; reviewedThisWeek: number; averageWaitHours: number | null };
  programmes: { id: string; name: string }[];
  queue: CoachQueueItem[];
  history: (CoachingSubmission & { decidedAt: string; decision: string; coachNote: string })[];
};

/**
 * The coach's own surface: the queue of work waiting on a decision plus the
 * coach's past decisions. Reviewing your own work stays impossible, and
 * decisions stay permanent — this only reads and presents.
 */
export const getCoachReviewWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoachReviewWorkspace> => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isCoach = (roles ?? []).some((row) => row.role === "moderator" || row.role === "admin");
    if (!isCoach) {
      return { isCoach: false, stats: { waiting: 0, reviewedThisWeek: 0, averageWaitHours: null }, programmes: [], queue: [], history: [] };
    }

    const [{ data: submissions }, { data: myReviews }, { data: programmes }, { data: exercises }] =
      await Promise.all([
        supabase
          .from("coaching_submissions")
          .select("id, owner_id, exercise_id, artefact_version_id, intake_method, external_url, storage_path, content_hash, self_confidence, state, attempt, submitted_at, reviewed_at")
          .order("submitted_at", { ascending: true }),
        supabase
          .from("coach_reviews")
          .select("submission_id, decision, coach_note, created_at")
          .eq("coach_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("coaching_programmes").select("id, name").order("name"),
        supabase
          .from("coaching_exercises")
          .select("id, programme_id, title, framework_capabilities(name)")
          .order("sort_order"),
      ]);

    const rows = submissions ?? [];
    const reviewsBySubmission = new Map((myReviews ?? []).map((row) => [row.submission_id, row]));
    const relevant = rows.filter(
      (row) => (row.state === "pending" && row.owner_id !== userId) || reviewsBySubmission.has(row.id),
    );

    const versionIds = relevant.map((row) => row.artefact_version_id);
    const ownerIds = [...new Set(relevant.map((row) => row.owner_id))];
    const [{ data: versions }, { data: profiles }] = await Promise.all([
      versionIds.length
        ? supabase.from("artefact_versions").select("id, body, artefacts(title)").in("id", versionIds)
        : Promise.resolve({ data: [] }),
      ownerIds.length
        ? supabase.from("profiles").select("id, full_name, display_name").in("id", ownerIds)
        : Promise.resolve({ data: [] }),
    ]);

    const exerciseById = new Map((exercises ?? []).map((row) => [row.id, row]));
    const programmeById = new Map((programmes ?? []).map((row) => [row.id, row]));
    const versionById = new Map((versions ?? []).map((row) => [row.id, row]));
    const profileById = new Map((profiles ?? []).map((row) => [row.id, row]));

    const map = (row: (typeof relevant)[number]): CoachingSubmission => {
      const exercise = exerciseById.get(row.exercise_id);
      const programme = exercise ? programmeById.get(exercise.programme_id) : undefined;
      const version = versionById.get(row.artefact_version_id);
      const profile = profileById.get(row.owner_id);
      const review = reviewsBySubmission.get(row.id);
      return {
        id: row.id,
        ownerName: profile?.display_name ?? profile?.full_name ?? "DeliverX member",
        exerciseTitle: exercise?.title ?? "Coaching exercise",
        programmeName: programme?.name ?? "Coaching programme",
        artefactTitle: version?.artefacts?.title ?? "Submitted artefact",
        body: version?.body ?? "",
        intakeMethod: row.intake_method,
        externalUrl: row.external_url,
        storagePath: row.storage_path,
        contentHash: row.content_hash,
        selfConfidence: row.self_confidence,
        state: row.state,
        attempt: row.attempt,
        submittedAt: row.submitted_at,
        review: review
          ? { decision: review.decision, coachNote: review.coach_note, createdAt: review.created_at }
          : null,
      };
    };

    const now = Date.now();
    const queue: CoachQueueItem[] = relevant
      .filter((row) => row.state === "pending" && row.owner_id !== userId)
      .map((row) => ({
        ...map(row),
        waitingHours: Math.max(0, Math.round((now - new Date(row.submitted_at).getTime()) / 3_600_000)),
      }));

    const weekAgo = now - 7 * 24 * 3_600_000;
    const history = relevant
      .filter((row) => reviewsBySubmission.has(row.id))
      .map((row) => {
        const review = reviewsBySubmission.get(row.id)!;
        return {
          ...map(row),
          decidedAt: review.created_at,
          decision: review.decision,
          coachNote: review.coach_note,
        };
      })
      .sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1));

    return {
      isCoach: true,
      stats: {
        waiting: queue.length,
        reviewedThisWeek: history.filter((row) => new Date(row.decidedAt).getTime() >= weekAgo).length,
        averageWaitHours: queue.length
          ? Math.round(queue.reduce((total, row) => total + row.waitingHours, 0) / queue.length)
          : null,
      },
      programmes: (programmes ?? []).map((row) => ({ id: row.id, name: row.name })),
      queue,
      history,
    };
  });
