/**
 * Programme engine — pure state transitions, persisted by the server.
 *
 * One call advances one work item. The scheduler follows the dependency
 * graph; gates stop the programme until the operator decides; budget is a
 * deterministic hard stop. Rejecting at a gate sends the phase back for
 * rework (bounded), the way a real team would — not a silent failure.
 */
import { listDepartments } from "@/lib/workforce/registry";
import { runnableTasks, unreachableTasks } from "@/lib/workforce/graph";
import type { GeneratedContent } from "@/lib/workforce/executor";
import { generateRoadmap } from "./blueprint";
import {
  prototypeHtml,
  reviewDeliverable,
  simulatedDeliverable,
  verificationReport,
  type EffectiveDecision,
} from "./deliverables";
import { runInterviewProgramme } from "./interviews";
import { meetingMarkdown, runMeeting } from "./meetings";
import { displayName, member } from "./roster";
import { extractHtmlDocument, checkMarkdownContract } from "@/lib/workforce/contracts";
import {
  checkCitations,
  evidenceExcerpts,
  sourceRegister,
  sourcesRecord,
  type Source,
} from "./research";
import {
  PHASES,
  type BusinessCase,
  type DecisionOption,
  type DecisionRecord,
  type JsonRecord,
  type ProgrammeRecord,
  type ProgrammeState,
  type ProgrammeStatus,
  type WorkItem,
} from "./types";

export const MAX_REWORK_PER_GATE = 2;

/** Deliverables whose factual claims must cite sources once any sources exist. */
export const RESEARCH_ITEMS = new Set([
  "business_case",
  "market_research",
  "tech_radar",
  "business_model",
]);

export function requiresCitations(itemKey: string, register: Source[]): boolean {
  return RESEARCH_ITEMS.has(itemKey) && register.length > 0;
}

export function createProgramme(id: string, bc: BusinessCase, now: string): ProgrammeState {
  return {
    id,
    title: bc.name,
    businessCase: bc,
    roadmap: generateRoadmap(bc, id),
    status: "active",
    budget: { ceiling: bc.budgetCredits, consumed: 0 },
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export function latestDecisions(records: ProgrammeRecord[]): DecisionRecord[] {
  const byKey = new Map<string, DecisionRecord>();
  for (const r of records) {
    if (r.kind === "decision")
      byKey.set((r.data as unknown as DecisionRecord).key, r.data as unknown as DecisionRecord);
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function finalOptionId(d: DecisionRecord): string | null {
  return d.human?.optionId ?? d.chosenOptionId;
}

export function decisionStatus(d: DecisionRecord): string {
  if (d.human)
    return d.human.decision === "overridden" ? "overridden by operator" : "ratified by operator";
  if (d.outcome === "escalated") return "escalated — provisional until operator decides";
  return d.needsHumanRatification ? "adopted — awaiting ratification" : "adopted";
}

export function effectiveDecisions(records: ProgrammeRecord[]): EffectiveDecision[] {
  return latestDecisions(records)
    .filter((d) => finalOptionId(d))
    .map((d) => ({
      key: d.key,
      question: d.question,
      label: d.options.find((o) => o.id === finalOptionId(d))?.label ?? "—",
      status: d.human ? "final" : d.needsHumanRatification ? "provisional" : "final",
    }));
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export type StepPlan =
  | { type: "execute"; item: WorkItem }
  | { type: "gate"; item: WorkItem; pendingDecisions: DecisionRecord[] }
  | { type: "budget"; item: WorkItem }
  | { type: "finished"; status: ProgrammeStatus };

function closure(items: WorkItem[], key: string): Set<string> {
  const byKey = new Map(items.map((i) => [i.key, i]));
  const out = new Set<string>();
  const visit = (k: string) => {
    for (const d of byKey.get(k)?.dependsOn ?? []) {
      if (!out.has(d)) {
        out.add(d);
        visit(d);
      }
    }
  };
  visit(key);
  return out;
}

export function pendingDecisionsFor(
  state: ProgrammeState,
  records: ProgrammeRecord[],
  gate: WorkItem,
): DecisionRecord[] {
  const upstream = closure(state.roadmap.items, gate.key);
  const decisionKeys = new Set(
    state.roadmap.items
      .filter((i) => upstream.has(i.key) && i.decision)
      .map((i) => i.decision!.key),
  );
  return latestDecisions(records).filter(
    (d) => decisionKeys.has(d.key) && d.needsHumanRatification && !d.human,
  );
}

export function planNextStep(state: ProgrammeState, records: ProgrammeRecord[]): StepPlan {
  if (state.status === "cancelled") return { type: "finished", status: "cancelled" };
  const items = state.roadmap.items;
  const runnable = runnableTasks(items.map((i) => ({ ...i, sortOrder: items.indexOf(i) })));
  const next = runnable.find((i) => i.kind !== "gate");
  if (next) {
    const item = items.find((i) => i.key === next.key)!;
    if (state.budget.consumed + item.estimatedCredits > state.budget.ceiling)
      return { type: "budget", item };
    return { type: "execute", item };
  }
  const gate = runnable.find((i) => i.kind === "gate");
  if (gate) {
    const item = items.find((i) => i.key === gate.key)!;
    return { type: "gate", item, pendingDecisions: pendingDecisionsFor(state, records, item) };
  }
  const failed = items.some((i) => i.status === "failed");
  const allDone = items.every((i) => i.status === "completed" || i.status === "skipped");
  return {
    type: "finished",
    status: allDone ? "completed" : failed ? "partially_completed" : "partially_completed",
  };
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

function rec(
  kind: ProgrammeRecord["kind"],
  itemKey: string | null,
  title: string,
  body: string,
  actor: string,
  now: string,
  data: JsonRecord = {},
  format: ProgrammeRecord["format"] = "markdown",
): ProgrammeRecord {
  return { kind, itemKey, title, body, format, actor, data, createdAt: now };
}

function withItem(
  state: ProgrammeState,
  key: string,
  patch: Partial<WorkItem>,
  now: string,
): ProgrammeState {
  return {
    ...state,
    updatedAt: now,
    roadmap: {
      ...state.roadmap,
      items: state.roadmap.items.map((i) => (i.key === key ? { ...i, ...patch } : i)),
    },
  };
}

function gateFeedback(records: ProgrammeRecord[], phase: string): string[] {
  return records
    .filter(
      (r) =>
        r.kind === "human_input" && r.data["phase"] === phase && r.data["type"] === "gate_feedback",
    )
    .map((r) => r.body);
}

export type ExecuteResult = { state: ProgrammeState; records: ProgrammeRecord[]; failed?: string };

/** Inputs a model needs for a deliverable (server calls the model, then passes `generated`). */
export function deliverableContext(
  state: ProgrammeState,
  records: ProgrammeRecord[],
  item: WorkItem,
) {
  const upstream = closure(state.roadmap.items, item.key);
  const artefacts = records.filter(
    (r) => r.kind === "artefact" && r.itemKey && upstream.has(r.itemKey),
  );
  const latest = new Map<string, ProgrammeRecord>();
  for (const a of artefacts) latest.set(a.itemKey!, a);
  const decisions = effectiveDecisions(records);
  return {
    upstreamArtefacts: [...latest.values()],
    decisions,
    feedback: gateFeedback(records, item.phase),
  };
}

export function executeItem(
  state: ProgrammeState,
  records: ProgrammeRecord[],
  item: WorkItem,
  ctx: {
    now: string;
    generated?: GeneratedContent;
    /** Sources retrieved for this item (appended to the register). */
    sources?: Source[];
    /** Model-proposed options for this item's decision. */
    decisionOptions?: { options: DecisionOption[]; model: string };
    /** Why model options were not used, when they were attempted. */
    decisionOptionsNote?: string;
  },
): ExecuteResult {
  const { now } = ctx;
  const bc = state.businessCase;
  const register = [...sourceRegister(records), ...(ctx.sources ?? [])];
  const knownIds = new Set(register.map((x) => x.id));
  const out: ProgrammeRecord[] = [];
  const charge = (s: ProgrammeState) => ({
    ...s,
    budget: { ...s.budget, consumed: s.budget.consumed + item.estimatedCredits },
  });

  if (item.kind === "meeting") {
    const spec =
      item.decision && ctx.decisionOptions
        ? { ...item.decision, options: ctx.decisionOptions.options }
        : item.decision
          ? {
              ...item.decision,
              options: item.decision.options.map((o) => ({
                ...o,
                origin: o.origin ?? ("template" as const),
              })),
            }
          : undefined;
    const { meeting, decision } = runMeeting(spec ? { ...item, decision: spec } : item, state);
    if (decision && ctx.decisionOptionsNote) {
      decision.challenge.note += ` Model-proposed options were not used: ${ctx.decisionOptionsNote}.`;
    }
    out.push(
      rec(
        "meeting",
        item.key,
        item.title,
        meetingMarkdown(item.title, meeting, decision),
        item.owner,
        now,
        meeting as unknown as JsonRecord,
      ),
    );
    if (decision) {
      out.push(
        rec(
          "decision",
          item.key,
          decision.question,
          decision.rationale,
          decision.owner,
          now,
          decision as unknown as JsonRecord,
          "json",
        ),
      );
    }
    const next = withItem(
      charge(state),
      item.key,
      { status: "completed", actualCredits: item.actualCredits + item.estimatedCredits },
      now,
    );
    return { state: next, records: out };
  }

  if (item.kind === "interviews") {
    const interviews = runInterviewProgramme(bc, state.id, item.owner, item.team);
    out.push(
      rec(
        "interviews",
        item.key,
        item.title,
        interviews.synthesis,
        item.owner,
        now,
        interviews as unknown as JsonRecord,
      ),
    );
    return {
      state: withItem(
        charge(state),
        item.key,
        { status: "completed", actualCredits: item.actualCredits + item.estimatedCredits },
        now,
      ),
      records: out,
    };
  }

  if (item.kind === "deliverable") {
    if (ctx.sources?.length) out.push(sourcesRecord(item.key, item.title, ctx.sources, now));
    const { upstreamArtefacts, decisions, feedback } = deliverableContext(state, records, item);
    let body: string;
    let format: ProgrammeRecord["format"] = "markdown";
    let generation = "simulated";

    if (item.produces === "verification_report") {
      const allArtefacts = new Map<string, ProgrammeRecord>();
      for (const r of records.filter((x) => x.kind === "artefact" && x.itemKey))
        allArtefacts.set(r.itemKey!, r);
      const report = verificationReport(
        state.roadmap.items,
        [...allArtefacts.values()].map((a) => ({
          itemKey: a.itemKey!,
          body: a.body,
          format: a.format,
          generation: String(a.data["generation"] ?? ""),
        })),
        knownIds,
      );
      body = report.body;
      generation = "deterministic";
      if (!report.passed) {
        out.push(
          rec("artefact", item.key, item.title, body, item.owner, now, {
            generation,
            produces: item.produces,
          }),
        );
        return {
          state: withItem(
            charge(state),
            item.key,
            { status: "failed", actualCredits: item.actualCredits + item.estimatedCredits },
            now,
          ),
          records: out,
          failed: "Verification failed; release is blocked.",
        };
      }
    } else if (item.produces === "prototype") {
      const html =
        ctx.generated?.mode === "model" ? extractHtmlDocument(ctx.generated.content) : null;
      body = html ?? prototypeHtml(bc, decisions);
      format = "html";
      generation = html ? `model:${ctx.generated!.model}` : "simulated";
    } else if (
      ctx.generated?.mode === "model" &&
      checkMarkdownContract(ctx.generated.content, item.requiredSections ?? []).ok &&
      (!requiresCitations(item.key, register) || checkCitations(ctx.generated.content, knownIds).ok)
    ) {
      body = ctx.generated.content;
      generation = `model:${ctx.generated.model}`;
    } else {
      body = simulatedDeliverable(item, bc, decisions, {
        milestones: state.roadmap.milestones.map((m) => `- Week ${m.week}: ${m.title}`).join("\n"),
        upstreamTitles: upstreamArtefacts.map((a) => a.title),
      });
      body += evidenceExcerpts(ctx.sources ?? []);
      if (ctx.generated?.mode === "model")
        generation = "simulated (model output failed its contract or citation check)";
      else if (ctx.generated?.note) generation = `simulated (${ctx.generated.note})`;
    }
    if (feedback.length && format === "markdown") {
      body += `\n## Operator feedback addressed\n${feedback.map((f) => `- ${f}`).join("\n")}\n`;
    }

    out.push(
      rec(
        "artefact",
        item.key,
        item.title,
        body,
        item.owner,
        now,
        { generation, produces: item.produces ?? null, team: item.team },
        format,
      ),
    );
    if (item.produces !== "verification_report") {
      const review = reviewDeliverable(item, body, decisions);
      out.push(
        rec(
          "review",
          item.key,
          `Peer review: ${item.title}`,
          `${displayName(review.reviewer)} scored ${review.score}/100 — ${review.verdict}. ${review.findings.join(" ")}`,
          review.reviewer,
          now,
          review as unknown as JsonRecord,
        ),
      );
    }
    return {
      state: withItem(
        charge(state),
        item.key,
        { status: "completed", actualCredits: item.actualCredits + item.estimatedCredits },
        now,
      ),
      records: out,
    };
  }

  throw new Error(`Gate ${item.key} cannot be executed by the workforce.`);
}

// ---------------------------------------------------------------------------
// Human gates
// ---------------------------------------------------------------------------

export type GateDecisionInput = {
  approve: boolean;
  /** Operator's chosen option per pending decision (defaults to the panel's choice). */
  choices: Record<string, string>;
  note: string;
  actor: string;
  now: string;
};

export function decideGate(
  state: ProgrammeState,
  records: ProgrammeRecord[],
  gateKey: string,
  input: GateDecisionInput,
): { state: ProgrammeState; records: ProgrammeRecord[] } {
  const gate = state.roadmap.items.find((i) => i.key === gateKey);
  if (!gate || gate.kind !== "gate") throw new Error("Gate not found.");
  const plan = planNextStep(state, records);
  if (plan.type !== "gate" || plan.item.key !== gateKey)
    throw new Error("This gate is not open for a decision.");
  const out: ProgrammeRecord[] = [];
  const now = input.now;

  if (input.approve) {
    for (const d of plan.pendingDecisions) {
      const chosen = input.choices[d.key] ?? d.chosenOptionId;
      if (!chosen || !d.options.some((o) => o.id === chosen)) {
        throw new Error(`Choose an option for ${d.key}: ${d.question}`);
      }
      const updated: DecisionRecord = {
        ...d,
        human: {
          decision: chosen === d.chosenOptionId ? "ratified" : "overridden",
          optionId: chosen,
          note: input.note,
          at: now,
        },
      };
      out.push(
        rec(
          "decision",
          null,
          d.question,
          `${updated.human!.decision} by operator`,
          input.actor,
          now,
          updated as unknown as JsonRecord,
          "json",
        ),
      );
    }
    out.push(
      rec(
        "event",
        gate.key,
        `${gate.title} — approved`,
        input.note || "Approved.",
        input.actor,
        now,
        { type: "gate_approved" },
      ),
    );
    return {
      state: { ...withItem(state, gate.key, { status: "completed" }, now), status: "active" },
      records: out,
    };
  }

  // Reject → bounded rework of the gate's phase.
  const reworks = records.filter(
    (r) => r.kind === "event" && r.itemKey === gate.key && r.data["type"] === "gate_rework",
  ).length;
  out.push(
    rec(
      "human_input",
      gate.key,
      `Rework requested at ${gate.title}`,
      input.note || "Rework requested without a note.",
      input.actor,
      now,
      {
        type: "gate_feedback",
        phase: gate.phase,
      },
    ),
  );
  if (reworks >= MAX_REWORK_PER_GATE) {
    out.push(
      rec(
        "event",
        gate.key,
        `${gate.title} — rejected (rework limit reached)`,
        input.note,
        input.actor,
        now,
        { type: "gate_rejected" },
      ),
    );
    return {
      state: { ...withItem(state, gate.key, { status: "failed" }, now), status: "active" },
      records: out,
    };
  }
  const upstream = closure(state.roadmap.items, gate.key);
  let next = state;
  for (const i of state.roadmap.items) {
    if (upstream.has(i.key) && i.phase === gate.phase && i.kind !== "gate")
      next = withItem(next, i.key, { status: "pending" }, now);
  }
  out.push(
    rec(
      "event",
      gate.key,
      `${gate.title} — sent back for rework (${reworks + 1}/${MAX_REWORK_PER_GATE})`,
      input.note,
      input.actor,
      now,
      { type: "gate_rework" },
    ),
  );
  return { state: { ...next, status: "active" }, records: out };
}

/** Marks items downstream of a failure as blocked and settles the programme status. */
export function settle(state: ProgrammeState, plan: StepPlan, now: string): ProgrammeState {
  if (plan.type === "gate") return { ...state, status: "awaiting_human", updatedAt: now };
  if (plan.type === "budget") return { ...state, status: "awaiting_human", updatedAt: now };
  if (plan.type !== "finished") return { ...state, status: "active", updatedAt: now };
  const dead = new Set(
    unreachableTasks(state.roadmap.items.map((i, idx) => ({ ...i, sortOrder: idx }))).map(
      (i) => i.key,
    ),
  );
  return {
    ...state,
    status: plan.status,
    updatedAt: now,
    roadmap: {
      ...state.roadmap,
      items: state.roadmap.items.map((i) => (dead.has(i.key) ? { ...i, status: "blocked" } : i)),
    },
  };
}

// ---------------------------------------------------------------------------
// Insight: reputation and dashboard metrics
// ---------------------------------------------------------------------------

export type RoleReputation = {
  id: string;
  name: string;
  department: string;
  trials: number;
  hits: number;
  score: number;
  influence: number;
};

/**
 * Judgement track record: a role scores when its final position matched the
 * decision that stood (after operator ratification/override), and when its
 * deliverables pass peer review. Laplace-smoothed so new roles start at 0.5.
 */
export function reputation(records: ProgrammeRecord[]): RoleReputation[] {
  const tally = new Map<string, { trials: number; hits: number; influence: number }>();
  const bump = (id: string, hit: boolean) => {
    const t = tally.get(id) ?? { trials: 0, hits: 0, influence: 0 };
    t.trials += 1;
    if (hit) t.hits += 1;
    tally.set(id, t);
  };
  for (const d of latestDecisions(records)) {
    const final = finalOptionId(d);
    const settled = d.human || !d.needsHumanRatification;
    if (!final || !settled) continue;
    for (const p of d.round2) bump(p.capabilityId, p.optionId === final);
    for (const p of d.round2.filter((x) => x.persuadedBy)) {
      const t = tally.get(p.persuadedBy!) ?? { trials: 0, hits: 0, influence: 0 };
      t.influence += 1;
      tally.set(p.persuadedBy!, t);
    }
  }
  for (const r of records.filter((x) => x.kind === "review")) {
    const item = r.itemKey;
    const author = records.find((a) => a.kind === "artefact" && a.itemKey === item)?.actor;
    if (author) bump(author, r.data["verdict"] === "approve");
  }
  return [...tally.entries()]
    .map(([id, t]) => ({
      id,
      name: member(id).name,
      department: member(id).department,
      trials: t.trials,
      hits: t.hits,
      influence: t.influence,
      score: Number(((t.hits + 1) / (t.trials + 2)).toFixed(2)),
    }))
    .sort((a, b) => b.score - a.score || b.trials - a.trials);
}

export function programmeMetrics(state: ProgrammeState, records: ProgrammeRecord[]) {
  const items = state.roadmap.items;
  const done = items.filter((i) => i.status === "completed");
  const engaged = new Set<string>();
  const contributions = new Map<string, number>();
  for (const i of done) {
    const people = new Set([
      i.owner,
      ...i.team,
      ...(i.reviewer ? [i.reviewer] : []),
      ...(i.decision?.panel ?? []),
    ]);
    if (i.kind === "gate") continue;
    people.forEach((p) => {
      engaged.add(p);
      contributions.set(p, (contributions.get(p) ?? 0) + 1);
    });
  }
  const departments = listDepartments().map((d) => ({
    number: d.number,
    name: d.name,
    engaged: d.capability_ids.filter((id) => engaged.has(id)).length,
    contributions: d.capability_ids.reduce((s, id) => s + (contributions.get(id) ?? 0), 0),
  }));
  const decisions = latestDecisions(records);
  const reviews = records.filter((r) => r.kind === "review");
  const plan = planNextStep(state, records);
  return {
    progress: items.length ? done.length / items.length : 0,
    itemsDone: done.length,
    itemsTotal: items.length,
    phases: PHASES.map((p) => {
      const inPhase = items.filter((i) => i.phase === p);
      const c = inPhase.filter((i) => i.status === "completed").length;
      const phase = state.roadmap.phases.find((x) => x.key === p)!;
      return {
        key: p,
        name: phase.name,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        done: c,
        total: inPhase.length,
        state: inPhase.some((i) => i.status === "failed")
          ? "failed"
          : c === inPhase.length
            ? "done"
            : c > 0 || inPhase.some((i) => i.status === "running")
              ? "active"
              : "pending",
      };
    }),
    milestones: state.roadmap.milestones.map((m) => ({
      ...m,
      reached: m.itemKeys.every((k) => items.find((i) => i.key === k)?.status === "completed"),
    })),
    budget: state.budget,
    engagedRoles: engaged.size,
    departments,
    meetings: records.filter((r) => r.kind === "meeting").length,
    deliverables: new Set(records.filter((r) => r.kind === "artefact").map((r) => r.itemKey)).size,
    decisions: {
      total: decisions.length,
      adopted: decisions.filter((d) => d.outcome === "adopted").length,
      escalated: decisions.filter((d) => d.outcome === "escalated").length,
      overridden: decisions.filter((d) => d.human?.decision === "overridden").length,
      vetoes: decisions.reduce((s, d) => s + d.vetoes.length, 0),
      mindChanges: decisions.reduce((s, d) => s + d.round2.filter((p) => p.revisedFrom).length, 0),
    },
    reviewAverage: reviews.length
      ? Math.round(reviews.reduce((s, r) => s + Number(r.data["score"] ?? 0), 0) / reviews.length)
      : null,
    realInterviewNotes: records.filter(
      (r) => r.kind === "human_input" && r.data["type"] === "interview_notes",
    ).length,
    next: plan,
  };
}
