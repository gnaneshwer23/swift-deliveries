import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Stakeholder = { initials: string; name: string; role: string; trust: string };
export type Guidance = { dimension: string; hint: string };

export type ExperienceTask = {
  id: string;
  key: string;
  week: number;
  sortOrder: number;
  title: string;
  phaseLabel: string;
  brief: string;
  context: string;
  stakeholders: Stakeholder[];
  sections: string[];
  guidance: Guidance[];
  capabilityKey: string;
  minWords: number;
  unlocked: boolean;
  submittedAt: string | null;
  draft: { body: string; sections: number[] } | null;
};

export type ExperienceScenario = {
  id: string;
  key: string;
  name: string;
  summary: string;
  companyName: string;
  companyStage: string;
  companyMark: string;
  roleTitle: string;
  durationLabel: string;
  frameworkLabel: string;
  enrolled: boolean;
  state: "not_started" | "active" | "completed";
  tasks: ExperienceTask[];
  submittedCount: number;
};

export type ExperienceWorkspace = { scenarios: ExperienceScenario[] };

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Everything the Experience surfaces read. Owner-scoped by RLS. */
export const getExperienceWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ExperienceWorkspace> => {
    const { supabase, userId } = context;

    const { data: scenarios, error } = await supabase
      .from("experience_scenarios")
      .select(
        "id, key, name, summary, company_name, company_stage, company_mark, role_title, duration_label, framework_id, capability_frameworks(key, version)",
      )
      .eq("enabled", true)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!scenarios || scenarios.length === 0) return { scenarios: [] };

    const scenarioIds = scenarios.map((s) => s.id);

    const [{ data: tasks }, { data: enrolments }, { data: submissions }, { data: drafts }] =
      await Promise.all([
        supabase
          .from("experience_tasks")
          .select(
            "id, scenario_id, key, week, sort_order, title, phase_label, brief, context, stakeholders, sections, guidance, capability_key, min_words",
          )
          .in("scenario_id", scenarioIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("experience_enrolments")
          .select("id, scenario_id, state")
          .eq("owner_id", userId),
        supabase
          .from("experience_submissions")
          .select("task_id, submitted_at")
          .eq("owner_id", userId),
        supabase.from("experience_task_drafts").select("task_id, body, sections").eq("owner_id", userId),
      ]);

    const enrolmentByScenario = new Map((enrolments ?? []).map((e) => [e.scenario_id, e]));
    const submittedAtByTask = new Map((submissions ?? []).map((s) => [s.task_id, s.submitted_at]));
    const draftByTask = new Map((drafts ?? []).map((d) => [d.task_id, d]));

    return {
      scenarios: scenarios.map((s) => {
        const enrolment = enrolmentByScenario.get(s.id);
        const own = (tasks ?? []).filter((t) => t.scenario_id === s.id);
        let previousSubmitted = true;
        const mapped: ExperienceTask[] = own.map((t) => {
          const submittedAt = submittedAtByTask.get(t.id) ?? null;
          const draft = draftByTask.get(t.id);
          const unlocked = Boolean(enrolment) && (previousSubmitted || submittedAt !== null);
          previousSubmitted = submittedAt !== null;
          return {
            id: t.id,
            key: t.key,
            week: t.week,
            sortOrder: t.sort_order,
            title: t.title,
            phaseLabel: t.phase_label,
            brief: t.brief,
            context: t.context,
            stakeholders: asArray<Stakeholder>(t.stakeholders),
            sections: asArray<string>(t.sections),
            guidance: asArray<Guidance>(t.guidance),
            capabilityKey: t.capability_key,
            minWords: t.min_words,
            unlocked,
            submittedAt,
            draft: draft ? { body: draft.body, sections: asArray<number>(draft.sections) } : null,
          };
        });
        const submittedCount = mapped.filter((t) => t.submittedAt).length;
        const framework = s.capability_frameworks;
        return {
          id: s.id,
          key: s.key,
          name: s.name,
          summary: s.summary,
          companyName: s.company_name,
          companyStage: s.company_stage,
          companyMark: s.company_mark,
          roleTitle: s.role_title,
          durationLabel: s.duration_label,
          frameworkLabel: framework ? `${framework.key}@${framework.version}` : "",
          enrolled: Boolean(enrolment),
          state: !enrolment ? "not_started" : enrolment.state === "completed" ? "completed" : "active",
          tasks: mapped,
          submittedCount,
        };
      }),
    };
  });

/** Join a scenario. Creates nothing else — no evidence until work is submitted. */
export const joinExperienceScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ scenarioId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("experience_enrolments")
      .insert({ owner_id: context.userId, scenario_id: data.scenarioId });
    if (error && !error.message.includes("duplicate key")) throw new Error(error.message);
    return { ok: true };
  });

const draftSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().max(20000),
  sections: z.array(z.number().int().min(0).max(50)).max(50),
});

/** Private working draft. Never evidence — drafts are editable and unjudged. */
export const saveExperienceDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => draftSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("experience_task_drafts").upsert(
      {
        owner_id: context.userId,
        task_id: data.taskId,
        body: data.body,
        sections: data.sections,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,task_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Submitting locks the work: an artefact, an immutable version of it, and one
 * append-only ledger entry citing that version. No capability write, no
 * Verified promotion — the Capability Engine judges separately.
 */
export const submitExperienceTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        taskId: z.string().uuid(),
        body: z.string().trim().min(1, "Write your response before submitting."),
        sections: z.array(z.number().int().min(0).max(50)).max(50).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: task } = await supabase
      .from("experience_tasks")
      .select(
        "id, key, title, capability_key, min_words, sort_order, scenario_id, sections, experience_scenarios(key, company_name, name, capability_frameworks(key, version))",
      )
      .eq("id", data.taskId)
      .maybeSingle();
    if (!task) throw new Error("That task is not available.");

    const words = data.body.trim().split(/\s+/).filter(Boolean).length;
    if (words < task.min_words) {
      throw new Error(`This task needs at least ${task.min_words} words. You have ${words}.`);
    }

    const { data: enrolment } = await supabase
      .from("experience_enrolments")
      .select("id")
      .eq("owner_id", userId)
      .eq("scenario_id", task.scenario_id)
      .maybeSingle();
    if (!enrolment) throw new Error("Join the scenario before submitting work.");

    const { data: scenarioTasks } = await supabase
      .from("experience_tasks")
      .select("id, sort_order")
      .eq("scenario_id", task.scenario_id)
      .order("sort_order", { ascending: true });
    const { data: existing } = await supabase
      .from("experience_submissions")
      .select("task_id")
      .eq("owner_id", userId);
    const submittedIds = new Set((existing ?? []).map((s) => s.task_id));
    if (submittedIds.has(task.id)) throw new Error("This task is already submitted and locked.");
    const earlier = (scenarioTasks ?? []).filter((t) => t.sort_order < task.sort_order);
    if (earlier.some((t) => !submittedIds.has(t.id))) {
      throw new Error("Finish the earlier tasks in this scenario first.");
    }

    const scenario = task.experience_scenarios;
    const framework = scenario?.capability_frameworks;

    const { data: artefact, error: artefactError } = await supabase
      .from("artefacts")
      .insert({
        owner_id: userId,
        title: `${scenario?.company_name ?? "Experience"} — ${task.title}`,
        kind: "document",
        description: `Experience simulation artefact for ${scenario?.name ?? "a scenario"}.`,
      })
      .select("id")
      .single();
    if (artefactError || !artefact) throw new Error(artefactError?.message ?? "Could not save the work.");

    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.body));
    const sha256 = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: version, error: versionError } = await supabase
      .from("artefact_versions")
      .insert({
        artefact_id: artefact.id,
        owner_id: userId,
        version: 1,
        body: data.body,
        content: {
          scenario_key: scenario?.key ?? null,
          task_key: task.key,
          sections_completed: data.sections,
          word_count: words,
          sha256,
          human_submitted: true,
        },
      })
      .select("id")
      .single();
    if (versionError || !version) throw new Error(versionError?.message ?? "Could not lock the artefact.");

    const { error: ledgerError } = await supabase.from("evidence_ledger").insert({
      owner_id: userId,
      artefact_version_id: version.id,
      source: "experience_sim",
      strength: "observed",
      capability_key: task.capability_key,
      summary: `${task.title} submitted in ${scenario?.company_name ?? "an Experience scenario"} (${words} words).`,
      provenance: {
        recorded_via: "experience_simulation",
        scenario_key: scenario?.key ?? null,
        task_key: task.key,
        framework_version: framework ? `${framework.key}@${framework.version}` : null,
        artefact_id: artefact.id,
        sha256,
        human_submitted: true,
      },
    });
    if (ledgerError) throw new Error(ledgerError.message);

    const { error: submissionError } = await supabase.from("experience_submissions").insert({
      owner_id: userId,
      enrolment_id: enrolment.id,
      task_id: task.id,
      artefact_version_id: version.id,
      word_count: words,
      sections_completed: data.sections.length,
    });
    if (submissionError) throw new Error(submissionError.message);

    await supabase.from("experience_task_drafts").delete().eq("owner_id", userId).eq("task_id", task.id);

    const allDone = (scenarioTasks ?? []).every((t) => t.id === task.id || submittedIds.has(t.id));
    if (allDone) {
      await supabase
        .from("experience_enrolments")
        .update({ state: "completed", completed_at: new Date().toISOString() })
        .eq("id", enrolment.id);
    }

    return { ok: true, scenarioCompleted: allDone, capabilityKey: task.capability_key };
  });
