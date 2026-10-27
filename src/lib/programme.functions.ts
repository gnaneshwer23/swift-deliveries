import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { wfDb } from "@/lib/workforce/db";
import {
  createProgramme,
  decideGate,
  deliverableContext,
  executeItem,
  planNextStep,
  programmeMetrics,
  reputation,
  requiresCitations,
  settle,
} from "@/lib/programme/engine";
import { buildProgrammeExport } from "@/lib/programme/export";
import { buildOptionPrompt, parseGeneratedOptions } from "@/lib/programme/options";
import {
  buildSources,
  checkCitations,
  citationProblem,
  researchQueries,
  sourceRegister,
  sourcesForPrompt,
  type Source,
} from "@/lib/programme/research";
import type { DecisionOption, ProgrammeRecord, ProgrammeState } from "@/lib/programme/types";

type DbClient = { from: (table: string) => any };

/** Service-role writes; callers authorise via the user-scoped client first. Lazy: never in the client bundle. */
async function adminDb() {
  const { neonDb } = await import("@/lib/db/neon.server");
  return wfDb(neonDb());
}

let probe: { at: number; ok: boolean } | null = null;
async function programmesSupported(): Promise<boolean> {
  if (probe && Date.now() - probe.at < 60_000) return probe.ok;
  const { neonDb } = await import("@/lib/db/neon.server");
  const res = await neonDb().rpc("wf_schema_version");
  probe = { at: Date.now(), ok: !res.error && Number(res.data) >= 3 };
  return probe.ok;
}

async function requireSupport() {
  if (!(await programmesSupported())) {
    throw new Error(
      "Programmes need the latest workforce migrations (20261022100000 and 20261022120000). Ask an admin to apply them.",
    );
  }
}

async function workspaceIdFor(supabase: DbClient, userId: string): Promise<string> {
  const res = await wfDb(supabase)
    .from("wf_workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  if (!res.data) throw new Error("Open the Command Centre once to create your workspace.");
  return res.data.id as string;
}

function mapRecord(row: any): ProgrammeRecord {
  return {
    kind: row.kind,
    itemKey: row.item_key ?? null,
    title: row.title,
    body: row.body,
    format: row.format,
    actor: row.actor,
    data: row.data ?? {},
    createdAt: row.created_at,
  };
}

async function load(supabase: DbClient, workspaceId: string, id: string) {
  const db = wfDb(supabase);
  const row = await db
    .from("wf_programmes")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (row.error) throw new Error(row.error.message);
  if (!row.data) throw new Error("Programme not found.");
  const recs = await db
    .from("wf_programme_records")
    .select("*")
    .eq("programme_id", id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(5000);
  if (recs.error) throw new Error(recs.error.message);
  const state = { ...(row.data.state as ProgrammeState), version: row.data.version as number };
  return { state, records: (recs.data ?? []).map(mapRecord) };
}

/** Optimistic-concurrency save: state first (version-checked), then append records in order. */
async function persist(
  workspaceId: string,
  before: ProgrammeState,
  after: ProgrammeState,
  records: ProgrammeRecord[],
) {
  const writeDb = await adminDb();
  const next = { ...after, version: before.version + 1 };
  const upd = await writeDb
    .from("wf_programmes")
    .update({
      state: next,
      status: next.status,
      version: next.version,
      title: next.title,
      budget_ceiling: next.budget.ceiling,
      budget_consumed: next.budget.consumed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", before.id)
    .eq("workspace_id", workspaceId)
    .eq("version", before.version)
    .select("id");
  if (upd.error) throw new Error(upd.error.message);
  if (!(upd.data ?? []).length) {
    throw new Error("The programme was updated by another session. Refresh and try again.");
  }
  if (records.length) {
    const base = Date.now();
    const ins = await writeDb.from("wf_programme_records").insert(
      records.map((r, i) => ({
        programme_id: before.id,
        workspace_id: workspaceId,
        kind: r.kind,
        item_key: r.itemKey,
        title: r.title.slice(0, 500),
        body: r.body,
        format: r.format,
        actor: r.actor,
        data: r.data,
        created_at: new Date(base + i).toISOString(),
      })),
    );
    if (ins.error) throw new Error(ins.error.message);
  }
  return next;
}

export type ProgrammeView = {
  state: ProgrammeState;
  records: ProgrammeRecord[];
  metrics: ReturnType<typeof programmeMetrics>;
  reputation: ReturnType<typeof reputation>;
  modelMode: { enabled: boolean; model: string | null };
  search: string | null;
};

async function view(state: ProgrammeState, records: ProgrammeRecord[]): Promise<ProgrammeView> {
  const { modelModeStatus } = await import("@/lib/workforce/model-runner.server");
  const mm = modelModeStatus();
  return {
    state,
    records,
    metrics: programmeMetrics(state, records),
    reputation: reputation(records),
    modelMode: { enabled: mm.enabled, model: mm.model },
    search:
      (await import("@/lib/programme/research-provider.server")).resolveSearchProvider()?.name ??
      null,
  };
}

const idSchema = z.object({ id: z.string().uuid() });

export const getProgrammeFeatures = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async () => {
    const { modelModeStatus } = await import("@/lib/workforce/model-runner.server");
    const { resolveSearchProvider } = await import("@/lib/programme/research-provider.server");
    return {
      supported: await programmesSupported().catch(() => false),
      modelMode: modelModeStatus(),
      search: resolveSearchProvider()?.name ?? null,
    };
  });

export type ProgrammeSummary = {
  id: string;
  title: string;
  status: ProgrammeState["status"];
  budget: { ceiling: number; consumed: number };
  progress: number;
  updatedAt: string;
};

export const listProgrammes = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ProgrammeSummary[]> => {
    if (!(await programmesSupported().catch(() => false))) return [];
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const res = await wfDb(context.supabase)
      .from("wf_programmes")
      .select("id, title, status, budget_ceiling, budget_consumed, state, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (res.error) throw new Error(res.error.message);
    return (res.data ?? []).map((r: any) => {
      const items = (r.state as ProgrammeState).roadmap.items;
      return {
        id: r.id as string,
        title: r.title as string,
        status: r.status as ProgrammeState["status"],
        budget: { ceiling: r.budget_ceiling as number, consumed: r.budget_consumed as number },
        progress: items.filter((i) => i.status === "completed").length / Math.max(1, items.length),
        updatedAt: r.updated_at as string,
      };
    });
  });

const businessCaseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  idea: z.string().trim().min(20).max(4000),
  targetUsers: z.string().trim().min(2).max(400),
  problem: z.string().trim().min(5).max(2000),
  goals: z.string().trim().min(5).max(2000),
  constraints: z.string().trim().max(2000).default(""),
  timelineWeeks: z.number().int().min(6).max(52),
  budgetCredits: z.number().int().min(100).max(2000),
});

export const createProgrammeRun = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => businessCaseSchema.parse(data))
  .handler(async ({ context, data }) => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const state = createProgramme(id, data, now);
    const writeDb = await adminDb();
    const ins = await writeDb.from("wf_programmes").insert({
      id,
      workspace_id: workspaceId,
      created_by: context.userId,
      title: state.title,
      status: state.status,
      business_case: data,
      state,
      version: state.version,
      budget_ceiling: state.budget.ceiling,
      budget_consumed: 0,
    });
    if (ins.error) throw new Error(ins.error.message);
    await writeDb.from("wf_programme_records").insert({
      programme_id: id,
      workspace_id: workspaceId,
      kind: "event",
      item_key: null,
      title: "Programme created from business case",
      body: `${state.roadmap.items.length} work items across ${state.roadmap.phases.length} phases and ${state.roadmap.milestones.length} milestones; ${data.timelineWeeks} weeks; ${data.budgetCredits} credits.`,
      format: "markdown",
      actor: context.userId,
      data: { type: "created" },
    });
    return { id };
  });

export const getProgramme = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ context, data }): Promise<ProgrammeView> => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    return view(state, records);
  });

export const advanceProgramme = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(
    async ({ context, data }): Promise<ProgrammeView & { done: boolean; note: string | null }> => {
      await requireSupport();
      const workspaceId = await workspaceIdFor(context.supabase, context.userId);
      const { state, records } = await load(context.supabase, workspaceId, data.id);
      if (state.status === "cancelled" || state.status === "completed") {
        return { ...(await view(state, records)), done: true, note: null };
      }
      const now = new Date().toISOString();
      const plan = planNextStep(state, records);

      if (plan.type !== "execute") {
        const settled = settle(state, plan, now);
        const saved =
          settled.status !== state.status ? await persist(workspaceId, state, settled, []) : state;
        const note =
          plan.type === "gate"
            ? `Waiting for you: ${plan.item.title}`
            : plan.type === "budget"
              ? `Budget reached: ${plan.item.title} needs ${plan.item.estimatedCredits} credits.`
              : `Programme ${settled.status.replace("_", " ")}.`;
        return { ...(await view(saved, records)), done: true, note };
      }

      const item = plan.item;
      const bc = state.businessCase;
      const { generateStageContent, generateJson, modelModeStatus } =
        await import("@/lib/workforce/model-runner.server");
      const modelOn = modelModeStatus().enabled;
      const notes: string[] = [];

      // Step 1 — research with citations: retrieve sources before research deliverables.
      let sources: Source[] | undefined;
      const queries =
        item.kind === "deliverable" ? researchQueries(item.key, bc, new Date().getFullYear()) : [];
      const { containsLikelyPersonalIdentifiers } = await import("@/lib/workforce/privacy");
      if (
        queries.length &&
        containsLikelyPersonalIdentifiers(`${bc.idea} ${bc.problem} ${bc.targetUsers} ${bc.goals}`)
      ) {
        notes.push(
          "Web research skipped: the business case appears to contain personal identifiers.",
        );
      } else if (queries.length) {
        const { searchWeb } = await import("@/lib/programme/research-provider.server");
        const results = await Promise.all(queries.map((q) => searchWeb(q, 5)));
        const provider = results.find((r) => r.provider)?.provider ?? null;
        if (provider) {
          sources = buildSources(
            results.flatMap((r, i) => r.results.map((x) => ({ ...x, query: queries[i]! }))),
            { itemKey: item.key, provider, existing: sourceRegister(records), now: new Date() },
          );
          const errors = results.filter((r) => r.error).map((r) => r.error);
          if (errors.length) notes.push(`Search issues: ${[...new Set(errors)].join(", ")}`);
        }
      }
      const register = [...sourceRegister(records), ...(sources ?? [])];

      let generated;
      if (modelOn && item.kind === "deliverable" && item.produces !== "verification_report") {
        const ctx = deliverableContext(state, records, item);
        const cite = requiresCitations(item.key, register);
        const known = new Set(register.map((x) => x.id));
        generated = await generateStageContent({
          mission: {
            title: bc.name,
            requestText: `${bc.idea}\nProblem: ${bc.problem}`,
            clarificationAnswers: {
              users: bc.targetUsers,
              goals: bc.goals,
              constraints: bc.constraints,
            },
          },
          task: {
            title: item.title,
            description: `${item.description}\nAdopted decisions: ${ctx.decisions.map((d) => `${d.key} = ${d.label} (${d.status})`).join("; ") || "none yet"}.${ctx.feedback.length ? `\nOperator feedback to address: ${ctx.feedback.join(" | ")}` : ""}`,
            acceptanceCriteria:
              "Reference the adopted decisions by name; label claims as fact (with source), assumption or inference.",
            requiredSections: item.requiredSections ?? [],
            produces: item.produces === "prototype" ? "prototype_html" : "note",
          },
          upstream: [
            ...(register.length
              ? [
                  {
                    kind: "note" as const,
                    title: "Source register",
                    content: sourcesForPrompt(register, 20),
                    contentFormat: "markdown" as const,
                    taskKey: null,
                    requiredSections: [],
                  },
                ]
              : []),
            ...ctx.upstreamArtefacts.map((a) => ({
              kind: "note" as const,
              title: a.title,
              content: a.body,
              contentFormat: a.format === "html" ? ("html" as const) : ("markdown" as const),
              taskKey: a.itemKey,
              requiredSections: [],
            })),
          ],
          ...(cite
            ? {
                extraInstructions:
                  "Every line containing a number, percentage or currency must cite a source from the Source register as [S#], or be explicitly labelled as an assumption, estimate or target. Never cite an id that is not in the register. End with a '## Sources' section listing the ids you cited.",
                extraCheck: (content: string) => citationProblem(checkCitations(content, known)),
              }
            : {}),
        });
      }

      // A configured model that failed never becomes a simulated deliverable.
      if (generated?.failure) {
        return {
          ...(await view(state, records)),
          done: false,
          note: `The model could not produce "${item.title}": ${generated.failure.detail}. Nothing was saved; run the step again.`,
        };
      }

      // Step 2 — model-proposed decision options; evidence from cited sources.
      let decisionOptions: { options: DecisionOption[]; model: string } | undefined;
      let decisionOptionsNote: string | undefined;
      if (modelOn && item.kind === "meeting" && item.decision) {
        const ctx = deliverableContext(state, records, item);
        const prompt = buildOptionPrompt({
          spec: item.decision,
          bc,
          decisionsSoFar: ctx.decisions.map((d) => `${d.key} = ${d.label} (${d.status})`),
          dossier: ctx.upstreamArtefacts
            .filter((a) => a.format !== "html")
            .map((a) => `### ${a.title}\n${a.body}`)
            .join("\n\n"),
          sources: register,
        });
        const res = await generateJson({
          ...prompt,
          screenText: `${bc.idea} ${bc.problem} ${bc.targetUsers} ${bc.goals} ${bc.constraints}`,
          validate: (text) => {
            const parsed = parseGeneratedOptions(text, register);
            return parsed.ok ? { ok: true, value: parsed.options } : parsed;
          },
        });
        if (res.ok) decisionOptions = { options: res.value, model: res.model };
        else decisionOptionsNote = res.reason;
      }

      const result = executeItem(state, records, item, {
        now,
        ...(generated ? { generated } : {}),
        ...(sources ? { sources } : {}),
        ...(decisionOptions ? { decisionOptions } : {}),
        ...(decisionOptionsNote ? { decisionOptionsNote } : {}),
      });
      const allRecords = [...records, ...result.records];
      const settled = settle(result.state, planNextStep(result.state, allRecords), now);
      const saved = await persist(workspaceId, state, settled, result.records);
      const savedRecords = (await load(context.supabase, workspaceId, data.id)).records;
      return {
        ...(await view(saved, savedRecords)),
        done: settled.status !== "active",
        note: [result.failed, ...notes].filter(Boolean).join(" ") || null,
      };
    },
  );

export const decideProgrammeGate = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        gateKey: z.string().min(1).max(80),
        approve: z.boolean(),
        choices: z.record(z.string(), z.string()).default({}),
        note: z.string().max(2000).default(""),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<ProgrammeView> => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    const now = new Date().toISOString();
    const result = decideGate(state, records, data.gateKey, {
      approve: data.approve,
      choices: data.choices,
      note: data.note.trim(),
      actor: context.userId,
      now,
    });
    const settled = settle(
      result.state,
      planNextStep(result.state, [...records, ...result.records]),
      now,
    );
    const saved = await persist(workspaceId, state, settled, result.records);
    return view(saved, (await load(context.supabase, workspaceId, data.id)).records);
  });

export const addProgrammeBudget = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z.object({ id: z.string().uuid(), credits: z.number().int().min(10).max(1000) }).parse(data),
  )
  .handler(async ({ context, data }): Promise<ProgrammeView> => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    if (state.budget.ceiling + data.credits > 5000)
      throw new Error("Programme budget cannot exceed 5,000 credits.");
    const now = new Date().toISOString();
    const raised = {
      ...state,
      budget: { ...state.budget, ceiling: state.budget.ceiling + data.credits },
      updatedAt: now,
    };
    const rec: ProgrammeRecord = {
      kind: "event",
      itemKey: null,
      title: `Budget raised by ${data.credits} credits`,
      body: `New ceiling ${raised.budget.ceiling} credits.`,
      format: "markdown",
      actor: context.userId,
      data: { type: "budget_raised", credits: data.credits },
      createdAt: now,
    };
    const settled = settle(raised, planNextStep(raised, records), now);
    const saved = await persist(workspaceId, state, settled, [rec]);
    return view(saved, [...records, rec]);
  });

export const addInterviewNotes = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        interviewee: z.string().trim().min(2).max(120),
        notes: z.string().trim().min(20).max(20000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<ProgrammeView> => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    const now = new Date().toISOString();
    const rec: ProgrammeRecord = {
      kind: "human_input",
      itemKey: "interviews",
      title: `Real interview: ${data.interviewee}`,
      body: data.notes,
      format: "markdown",
      actor: context.userId,
      data: { type: "interview_notes", interviewee: data.interviewee },
      createdAt: now,
    };
    const saved = await persist(workspaceId, state, { ...state, updatedAt: now }, [rec]);
    return view(saved, [...records, rec]);
  });

export const cancelProgramme = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ context, data }): Promise<ProgrammeView> => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    const now = new Date().toISOString();
    const rec: ProgrammeRecord = {
      kind: "event",
      itemKey: null,
      title: "Programme cancelled",
      body: "Cancelled by the operator.",
      format: "markdown",
      actor: context.userId,
      data: { type: "cancelled" },
      createdAt: now,
    };
    const saved = await persist(
      workspaceId,
      state,
      { ...state, status: "cancelled", updatedAt: now },
      [rec],
    );
    return view(saved, [...records, rec]);
  });

export const exportProgramme = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((data: unknown) => idSchema.parse(data))
  .handler(async ({ context, data }) => {
    await requireSupport();
    const workspaceId = await workspaceIdFor(context.supabase, context.userId);
    const { state, records } = await load(context.supabase, workspaceId, data.id);
    return { files: buildProgrammeExport(state, records), title: state.title };
  });
