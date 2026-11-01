/**
 * The company record: how the project was run, as a company would keep it — who was on the
 * team, every recorded event in order, a work order per task, the owner's decisions, the
 * handoffs between stages and the usage ledger, plus one offline page to browse it all.
 *
 * Built only from saved records (the project document, the build's tasks and outputs, the
 * build event log and the run ledger). Where a record is missing, the gap is listed — a time,
 * a cost or a step is never filled in.
 */
import { checkMarkdownContract, checkPrototypeHtml } from "@/lib/workforce/contracts";
import { describeEvent } from "@/lib/workforce/event-labels";
import { getCapability } from "@/lib/workforce/registry/load";
import type { MissionBundle, WfMissionEvent } from "@/lib/workforce/types";
import { BUILD_STATUS_LABEL, buildDeliveryRoom, type BuildStage } from "./delivery-room";
import { outputPath } from "./delivery-package";
import { MEETING_KIND_LABEL, MEETING_READER_LABEL } from "./meeting-notes";
import type { SupervisedMission } from "./types";
import { AGENT_RECOMMENDATION_LABELS, HUMAN_NEXT_PATH_LABELS, type HumanNextPath } from "./verdict";
import { buildWorkroom } from "./workroom";

/** One execution attempt of a build task, from the run ledger (`wf_task_runs`). */
export type TaskRunRecord = {
  taskId: string;
  attempt: number;
  status: string;
  workerId: string | null;
  provider: string | null;
  model: string | null;
  modelCalls: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  roleId: string | null;
  instructionVersion: string | null;
  failureClass: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type CompanyRecordInput = {
  mission: SupervisedMission;
  delivery: MissionBundle | null;
  /** The build event log; null when it could not be read for this export. */
  events: WfMissionEvent[] | null;
  /** True when the event log was cut at the export's read limit. */
  eventsCapped?: boolean;
  /** The run ledger; null when it could not be read for this export. */
  runs: TaskRunRecord[] | null;
  exportedAt: string;
};

export type CompanyRecordFile = { path: string; content: string; note: string };

export type TimelineEntry = {
  at: string;
  who: string;
  role: string;
  what: string;
  /** Which saved record the line comes from. */
  source: "Project log" | "Decision record" | "Build log";
  /** A file in this download the event produced, when there is one. */
  file: string | null;
};

export type CompanyRecord = {
  files: CompanyRecordFile[];
  summary: {
    timelineEntries: number;
    workOrders: number;
    decisions: number;
    handoffs: number;
    runs: number | null;
    gaps: string[];
  };
};

export const COMPANY_RECORD_NOTE =
  "Built only from saved records. Missing records are listed as gaps, never filled in.";

// ---------- small formatting helpers ----------

const cell = (s: string | number | null | undefined) =>
  String(s ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim() || "—";

const csv = (s: string | number | null | undefined) => {
  const v = s === null || s === undefined ? "" : String(s);
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const valid = (iso: string | null | undefined): iso is string =>
  Boolean(iso) && !Number.isNaN(Date.parse(iso!));

/** "1h 4m 9s" between two recorded times, or null when either is missing. */
export function durationBetween(start: string | null, end: string | null): string | null {
  if (!valid(start) || !valid(end)) return null;
  const ms = Date.parse(end) - Date.parse(start);
  if (ms < 0) return null;
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [h ? `${h}h` : "", m ? `${m}m` : "", `${s % 60}s`].filter(Boolean);
  return parts.join(" ");
}

/** First 12 characters of a recorded hash; older records may not have one. */
const shortHash = (h: string | null | undefined) => (h ? h.slice(0, 12) : "not recorded");

const roleName = (id: string) => getCapability(id)?.name ?? id;

/** Who a project-log actor was: the owner, a catalogue role, or the system. */
function activityActor(actor: string): { who: string; role: string } {
  if (actor === "human") return { who: "You", role: "Project owner" };
  if (actor === "system") return { who: "System", role: "DeliverX" };
  return { who: roleName(actor), role: actor };
}

const pathLabel = (choice: string) =>
  HUMAN_NEXT_PATH_LABELS[choice as HumanNextPath] ??
  (choice === "accept"
    ? "Accept (older record)"
    : choice === "request_more_evidence"
      ? "Request more evidence (older record)"
      : choice);

// ---------- the record ----------

type Stage = BuildStage & { index: number; path: string | null };

export function buildCompanyRecord(input: CompanyRecordInput): CompanyRecord {
  const { mission, delivery, exportedAt } = input;
  const gaps: string[] = [];
  const room = delivery ? buildDeliveryRoom(delivery) : null;
  const workroom = delivery ? buildWorkroom(delivery) : null;
  const stages: Stage[] = (room?.stages ?? []).map((s, i) => ({
    ...s,
    index: i,
    path: outputPath(s, i),
  }));
  const stageById = new Map(stages.map((s) => [s.taskId, s]));
  const taskById = new Map((delivery?.tasks ?? []).map((t) => [t.id, t]));
  const cardById = new Map((workroom?.cards ?? []).map((c) => [c.taskId, c]));
  const events = [...(input.events ?? [])].sort((a, b) => a.id - b.id);
  const runs = input.runs ?? [];

  if (mission.delivery && !delivery) {
    gaps.push(
      "The build could not be read for this export, so its work orders, handoffs and usage are missing.",
    );
  }
  if (delivery && input.events === null) {
    gaps.push(
      "The build event log could not be read for this export; the timeline has no build events.",
    );
  }
  if (input.eventsCapped) {
    gaps.push(
      `The build event log was cut at ${events.length} events for this export; later events are not in the timeline.`,
    );
  }
  if (delivery && input.runs === null) {
    gaps.push(
      "The run ledger could not be read for this export, so per-run model, token and latency records are missing.",
    );
  }

  // ----- timeline -----
  const timeline: TimelineEntry[] = [];
  for (const a of mission.activity ?? []) {
    if (!valid(a.at)) continue;
    const actor = activityActor(a.actor);
    timeline.push({ at: a.at, ...actor, what: a.summary, source: "Project log", file: null });
  }
  const you = { who: "You", role: "Project owner" };
  if (mission.approval && valid(mission.approval.decidedAt)) {
    const option = mission.proposal?.options.find((o) => o.id === mission.approval!.optionId);
    timeline.push({
      at: mission.approval.decidedAt,
      ...you,
      what: `Decided: ${pathLabel(mission.approval.choice)}${option ? ` — option “${option.title}”` : ""}`,
      source: "Decision record",
      file: "decision-pack/decision-pack.md",
    });
  }
  if (mission.expectation && valid(mission.expectation.recordedAt)) {
    timeline.push({
      at: mission.expectation.recordedAt,
      ...you,
      what: `Recorded what you expect to see: ${mission.expectation.expectedMetric}`,
      source: "Decision record",
      file: null,
    });
  }
  if (mission.observation && valid(mission.observation.suppliedAt)) {
    timeline.push({
      at: mission.observation.suppliedAt,
      ...you,
      what: `Recorded what happened (owner-supplied, not measured by DeliverX): ${mission.observation.result}`,
      source: "Decision record",
      file: null,
    });
  }
  for (const r of mission.reviews ?? []) {
    if (!valid(r.createdAt)) continue;
    timeline.push({
      at: r.createdAt,
      who: "System",
      role: "DeliverX",
      what: `Outcome review ${r.version}: reading “${r.reading}” of your recorded result`,
      source: "Decision record",
      file: null,
    });
  }
  if (mission.followUp) {
    if (valid(mission.followUp.proposedAt)) {
      timeline.push({
        at: mission.followUp.proposedAt,
        who: "System",
        role: "DeliverX",
        what: `Follow-up project proposed: ${mission.followUp.brief.question}`,
        source: "Decision record",
        file: null,
      });
    }
    if (valid(mission.followUp.approvedAt)) {
      timeline.push({
        at: mission.followUp.approvedAt,
        ...you,
        what: "Approved the follow-up project",
        source: "Decision record",
        file: null,
      });
    }
  }
  for (const m of mission.meetings ?? []) {
    for (const p of m.proposals) {
      if (p.status === "proposed" || !valid(p.decidedAt)) continue;
      timeline.push({
        at: p.decidedAt,
        ...you,
        what: `${p.status === "accepted" ? "Accepted" : "Dismissed"} ${MEETING_KIND_LABEL[p.kind].toLowerCase()} from “${m.title}”: ${p.text}`,
        source: "Decision record",
        file: "meetings.md",
      });
    }
  }
  for (const e of events) {
    if (!valid(e.createdAt)) continue;
    const stage = e.taskId ? stageById.get(e.taskId) : undefined;
    const line = describeEvent(e, stage?.title ?? null);
    const actor =
      e.actorKind === "user"
        ? you
        : e.actorKind === "worker" && stage && !stage.gate
          ? { who: stage.owner, role: stage.role }
          : e.actorKind === "worker"
            ? { who: "Worker", role: "Build engine" }
            : { who: "System", role: "Build engine" };
    timeline.push({
      at: e.createdAt,
      ...actor,
      what: line.text,
      source: "Build log",
      file: e.type === "task.completed" && stage?.path ? stage.path : null,
    });
  }
  // Stable: equal times keep their record order.
  timeline.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  // ----- decisions -----
  const decisions: string[] = [];
  if (mission.team) {
    decisions.push(
      mission.team.approvedAt
        ? `### ${mission.team.approvedAt} · Approved the investigation plan\n\n- Team: ${mission.team.capabilityIds.map(roleName).join(", ") || "none"}\n- Usage ceiling: ${mission.usageCeiling} units`
        : "### Investigation plan · not approved yet",
    );
  }
  for (const inv of mission.invalidatedApprovals ?? []) {
    decisions.push(
      `### ${inv.decidedAt} · Earlier decision withdrawn\n\n- Was: ${pathLabel(inv.choice)}\n- Why it no longer stands: ${inv.reason}`,
    );
  }
  if (mission.approval) {
    const a = mission.approval;
    const option = mission.proposal?.options.find((o) => o.id === a.optionId);
    decisions.push(
      [
        `### ${a.decidedAt} · Decision`,
        "",
        `- Your decision: ${pathLabel(a.choice)}`,
        option ? `- Option: ${option.title} — ${option.tradeoff}` : `- Option id: ${a.optionId}`,
        `- Your reason: ${(a.note ?? "").trim() || "No reason written"}`,
        a.agentRecommendation
          ? `- The team recommended: ${AGENT_RECOMMENDATION_LABELS[a.agentRecommendation]}${a.recommendationRationale ? ` — ${a.recommendationRationale}` : ""}`
          : "- The team’s recommendation: not recorded on this decision",
        a.disagreesWithRecommendation ? "- You went against the team’s recommendation." : "",
        a.executionLimited
          ? "- The recommendation was limited by what the team could run, not by evidence."
          : "",
        `- Bound to plan version ${a.version} (scope ${shortHash(a.scopeHash)})`,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  if (mission.prototype) {
    decisions.push(
      `### ${mission.prototype.approvedAt} · Approved the prototype build\n\n- Built by: ${mission.prototype.ownerLabel}\n- How it was made: ${mission.prototype.honesty.label}`,
    );
  }
  if (mission.delivery) {
    decisions.push(
      `### ${mission.delivery.approvedAt} · Began delivery\n\n- Approved build plan version ${mission.delivery.planVersion} (hash ${shortHash(mission.delivery.planHash)})\n- Later stages still wait for your gates.`,
    );
  }
  for (const ap of delivery?.approvals ?? []) {
    const what = ap.kind === "plan" ? "Build plan" : "External action";
    decisions.push(
      `### ${ap.decidedAt ?? ap.createdAt} · ${what}: ${ap.status}\n\n${
        [
          ap.planVersion !== null ? `- Plan version: ${ap.planVersion}` : "",
          ap.costLimit !== null ? `- Usage limit approved: ${ap.costLimit} units` : "",
          ap.note ? `- Note: ${ap.note}` : "",
          ap.invalidatedAt
            ? `- Withdrawn ${ap.invalidatedAt}: ${ap.invalidatedReason ?? "no reason recorded"}`
            : "",
        ]
          .filter(Boolean)
          .join("\n") || "- No further detail recorded"
      }`,
    );
  }
  for (const e of events) {
    if (e.type !== "gate.approved" && e.type !== "gate.rejected") continue;
    const stage = e.taskId ? stageById.get(e.taskId) : undefined;
    const note = typeof e.data["note"] === "string" ? e.data["note"] : "";
    decisions.push(
      `### ${e.createdAt} · Gate ${e.type === "gate.approved" ? "approved" : "sent back"}: ${stage?.title ?? "a gate"}\n\n- Your note: ${note.trim() || "No note written"}`,
    );
  }
  if (mission.expectation) {
    const x = mission.expectation;
    decisions.push(
      `### ${x.recordedAt} · Set what success looks like\n\n- Hypothesis: ${x.hypothesis}\n- Metric: ${x.expectedMetric}\n- Baseline: ${x.baseline}\n- Window: ${x.observationWindow}`,
    );
  }
  if (mission.observation) {
    const o = mission.observation;
    decisions.push(
      `### ${o.suppliedAt} · Recorded what happened\n\n- Result: ${o.result}\n- Evidence: ${o.evidence || "none given"}\n- Source: ${o.source || "none given"}\n- ${o.label}`,
    );
  }
  const meetingDecisions = (mission.meetings ?? []).flatMap((m) =>
    m.proposals
      .filter((p) => p.status !== "proposed")
      .map(
        (p) =>
          `- ${p.decidedAt ?? "time not recorded"} · ${p.status === "accepted" ? "Accepted" : "Dismissed"} ${MEETING_KIND_LABEL[p.kind].toLowerCase()} (“${m.title}”, line ${p.line}): ${p.text}`,
      ),
  );
  if (meetingDecisions.length) {
    decisions.push(
      `### Meeting proposals you decided\n\nRead from your notes by the ${MEETING_READER_LABEL}.\n\n${meetingDecisions.join("\n")}`,
    );
  }

  // ----- work orders -----
  const workOrders: CompanyRecordFile[] = [];
  const runsFor = (taskId: string) =>
    runs.filter((r) => r.taskId === taskId).sort((a, b) => a.attempt - b.attempt);
  const eventsFor = (taskId: string) => events.filter((e) => e.taskId === taskId);
  const checkFor = (s: Stage): string => {
    const out = s.output;
    if (!out) return "No output saved, so nothing was checked.";
    const task = taskById.get(s.taskId);
    if (out.format === "markdown" && task?.requiredSections.length) {
      const r = checkMarkdownContract(out.content, task.requiredSections);
      const total = task.requiredSections.length;
      const passed = total - r.missing.length - r.empty.length;
      return `Handoff contract: ${passed} of ${total} required sections present${r.ok ? "" : ` — ${[...r.missing.map((m) => `missing ${m}`), ...r.empty.map((m) => `empty ${m}`)].join(", ")}`}`;
    }
    if (out.format === "html") {
      const checks = checkPrototypeHtml(out.content);
      const failed = checks.filter((c) => !c.passed);
      return `Prototype checks: ${checks.length - failed.length} of ${checks.length} passed${failed.length ? ` — failed: ${failed.map((c) => c.label).join(", ")}` : ""}`;
    }
    return "No automatic check applies to this output.";
  };
  const woPath = (s: Stage) =>
    `company/work-orders/${String(s.index + 1).padStart(2, "0")}-${s.key.replace(/[^a-z0-9_-]/gi, "-")}.md`;

  let missingStarts = 0;
  for (const s of stages) {
    const task = taskById.get(s.taskId)!;
    const card = cardById.get(s.taskId);
    const taskRuns = runsFor(s.taskId);
    const started = task.startedAt ?? taskRuns[0]?.startedAt ?? null;
    const duration = durationBetween(started, task.completedAt);
    if (!s.gate && task.completedAt && !started) missingStarts += 1;
    const rows: Array<[string, string]> = [
      [
        "Owner",
        s.gate ? "You (owner decision — agents never pass a gate)" : `${s.owner} · ${s.role}`,
      ],
      ["Catalogue role id", task.capabilityIds.join(", ") || "—"],
      ["Lifecycle stage", card?.stage ?? "—"],
      ["Status", BUILD_STATUS_LABEL[s.status]],
      ["Started", started ?? "Not recorded"],
      ["Finished", task.completedAt ?? "Not finished"],
      [
        "Time taken",
        duration ?? (task.completedAt ? "Not recorded (no start time saved)" : "Not finished"),
      ],
      ["Usage budget", `${task.estimatedUsage} units`],
      ["Usage used", `${task.actualUsage} units`],
      ["Permission", task.permissionRequired.replace(/_/g, " ")],
    ];
    const buildsOn = card?.plan.buildsOn ?? [];
    const runLines = taskRuns.length
      ? taskRuns
          .map(
            (r) =>
              `| ${r.attempt} | ${cell(r.status)} | ${cell(r.startedAt)} | ${cell(r.finishedAt)} | ${cell(durationBetween(r.startedAt, r.finishedAt))} | ${cell(r.model ? `${r.provider ?? "?"} · ${r.model}` : "No model call")} | ${cell(r.modelCalls)} | ${cell(r.inputTokens)} / ${cell(r.outputTokens)} | ${cell(r.latencyMs)} | ${cell(r.failureClass)} |`,
          )
          .join("\n")
      : null;
    const evLines = eventsFor(s.taskId)
      .map((e) => `- ${e.createdAt} · ${describeEvent(e, s.title).text}`)
      .join("\n");
    workOrders.push({
      path: woPath(s),
      note: `Work order: ${s.title}`,
      content: [
        `# Work order ${String(s.index + 1).padStart(2, "0")} — ${s.title}`,
        "",
        "| Field | Record |",
        "| --- | --- |",
        ...rows.map(([k, v]) => `| ${k} | ${cell(v)} |`),
        "",
        "## Brief",
        "",
        (task.description ?? "").trim() || "No brief recorded.",
        "",
        "## Must include",
        "",
        task.requiredSections.length
          ? task.requiredSections.map((r) => `- ${r}`).join("\n")
          : "- No required sections.",
        "",
        "## Acceptance check",
        "",
        (task.acceptanceCriteria ?? "").trim() || "No acceptance check recorded.",
        "",
        "## Builds on",
        "",
        buildsOn.length
          ? buildsOn
              .map(
                (b) =>
                  `- ${b.title}${b.owner ? ` (${b.owner})` : ""} — ${b.done ? "done" : "not done"}`,
              )
              .join("\n")
          : "- Nothing; this is a starting task.",
        "",
        "## Unblocks",
        "",
        card?.plan.unblocks.length
          ? card.plan.unblocks.map((u) => `- ${u}`).join("\n")
          : "- Nothing after it.",
        "",
        "## Output",
        "",
        s.output
          ? [
              `- File: \`${s.path ?? "not saved as a file"}\``,
              `- How it was made: ${s.output.production}`,
              `- Quality labels: ${s.output.quality.length ? s.output.quality.join(", ") : "none recorded"}`,
              `- ${checkFor(s)}`,
            ].join("\n")
          : s.gate
            ? "- A gate produces your decision, not a file. See `company/decisions.md`."
            : "- No output saved yet.",
        "",
        "## Runs",
        "",
        runLines
          ? `| Attempt | Status | Started | Finished | Took | Model | Model calls | Tokens in / out | Latency ms | Failure |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${runLines}`
          : input.runs === null
            ? "The run ledger could not be read for this export."
            : s.gate
              ? "Gates are not run by the worker."
              : "No run recorded for this task.",
        "",
        "## Event log",
        "",
        evLines ||
          (input.events === null
            ? "The build event log could not be read for this export."
            : "No events recorded for this task."),
        "",
      ].join("\n"),
    });
  }
  if (missingStarts) {
    gaps.push(
      `${missingStarts} finished task${missingStarts === 1 ? " has" : "s have"} no saved start time, so ${missingStarts === 1 ? "its" : "their"} time taken is not shown.`,
    );
  }

  // ----- handoffs -----
  const byKey = new Map((delivery?.tasks ?? []).map((t) => [t.key, t]));
  const handoffRows: string[] = [];
  for (const s of stages) {
    const task = taskById.get(s.taskId)!;
    for (const k of task.dependsOn) {
      const upTask = byKey.get(k);
      const up = upTask ? stageById.get(upTask.id) : undefined;
      if (!upTask || !up) continue;
      const handed = upTask.completedAt;
      const picked = task.startedAt ?? runsFor(task.id)[0]?.startedAt ?? null;
      const state =
        upTask.status === "skipped"
          ? "Upstream skipped (counts as satisfied)"
          : !handed
            ? "Not handed over yet"
            : s.gate
              ? s.status === "done"
                ? "Reviewed by you"
                : "Waiting for your review"
              : picked
                ? "Picked up"
                : s.status === "done"
                  ? "Picked up (start time not saved)"
                  : "Handed over, not picked up yet";
      handoffRows.push(
        `| ${cell(up.gate ? "You" : `${up.owner} · ${up.role}`)} | ${cell(s.gate ? "You" : `${s.owner} · ${s.role}`)} | ${cell(up.output ? `${up.output.title}${up.path ? ` (\`${up.path}\`)` : ""}` : up.gate ? "Your approval" : "No output saved")} | ${cell(up.output ? checkFor(up) : "—")} | ${cell(handed ?? "—")} | ${cell(picked ?? "—")} | ${cell(state)} |`,
      );
    }
  }

  // ----- usage ledger -----
  const usageRows: string[][] = [];
  for (const r of mission.spendRecords ?? []) {
    usageRows.push([
      "investigation",
      r.key,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      String(r.units),
      "",
      "",
      r.reason,
    ]);
  }
  for (const s of stages) {
    const task = taskById.get(s.taskId)!;
    usageRows.push([
      "build-task",
      s.title,
      s.gate ? "You" : `${s.owner} · ${s.role}`,
      "",
      BUILD_STATUS_LABEL[s.status],
      "",
      "",
      "",
      "",
      "",
      String(task.estimatedUsage),
      String(task.actualUsage),
      task.startedAt ?? "",
      task.completedAt ?? "",
      "",
    ]);
    for (const r of runsFor(s.taskId)) {
      usageRows.push([
        "build-run",
        s.title,
        s.gate ? "You" : `${s.owner} · ${s.role}`,
        String(r.attempt),
        r.status,
        r.provider ?? "",
        r.model ?? "",
        r.modelCalls === null ? "" : String(r.modelCalls),
        r.inputTokens === null ? "" : String(r.inputTokens),
        r.outputTokens === null ? "" : String(r.outputTokens),
        "",
        "",
        r.startedAt,
        r.finishedAt ?? "",
        [r.failureClass, r.instructionVersion ? `instructions ${r.instructionVersion}` : ""]
          .filter(Boolean)
          .join("; "),
      ]);
    }
  }
  const usageCsv = [
    [
      "kind",
      "item",
      "who",
      "attempt",
      "status",
      "provider",
      "model",
      "model_calls",
      "input_tokens",
      "output_tokens",
      "budget_units",
      "used_units",
      "started_at",
      "finished_at",
      "note",
    ],
    ...usageRows,
  ]
    .map((r) => r.map(csv).join(","))
    .join("\n");
  const buildBudget = workroom?.usage.budget ?? 0;
  const buildUsed = workroom?.usage.used ?? 0;
  const totalCalls = runs.reduce((n, r) => n + (r.modelCalls ?? 0), 0);
  const totalIn = runs.reduce((n, r) => n + (r.inputTokens ?? 0), 0);
  const totalOut = runs.reduce((n, r) => n + (r.outputTokens ?? 0), 0);
  const perRole = (workroom?.team ?? [])
    .map(
      (t) =>
        `| ${cell(t.name)} | ${cell(t.role)} | ${t.tasks.done} of ${t.tasks.total} | ${t.usage.budget} | ${t.usage.used} |`,
    )
    .join("\n");
  const usageMd = `# Usage ledger

Usage is counted in DeliverX units, the same units as your usage ceiling. Money is not recorded here: DeliverX does not store a price per unit.

## Investigation

- Usage ceiling: ${mission.usageCeiling} units
- Used: ${mission.usageConsumed} units
${(mission.spendRecords ?? []).length ? `\n| Record | Units | Why |\n| --- | --- | --- |\n${mission.spendRecords.map((r) => `| ${cell(r.key)} | ${r.units} | ${cell(r.reason)} |`).join("\n")}` : "\nNo usage records saved for the investigation."}

## The build

${
  delivery
    ? `- Budget across tasks: ${buildBudget} units
- Used across tasks: ${buildUsed} units
- Runs recorded: ${input.runs === null ? "the run ledger could not be read" : runs.length}
- Model calls recorded: ${input.runs === null ? "—" : totalCalls}
- Tokens recorded: ${input.runs === null ? "—" : `${totalIn} in / ${totalOut} out`}

| Team member | Role | Tasks done | Budget | Used |
| --- | --- | --- | --- | --- |
${perRole || "| — | — | — | — | — |"}`
    : mission.delivery
      ? "The build could not be read for this export."
      : "Delivery has not started."
}

Every row, including each run, is in \`usage-ledger.csv\`.
`;

  // ----- org chart -----
  const invTeam = mission.team;
  const planned = (invTeam?.catalogueRosterIds ?? []).filter(
    (id) => !invTeam?.capabilityIds.includes(id),
  );
  const invTasks = (invTeam?.tasks ?? []).filter((t) => t.capabilityId);
  const orgMd = `# Org chart

How this project was staffed. Only roles that actually had work are listed as team members.

## Owner

- **You** — set the question, approve every plan, make the decision and pass every gate. Agents and the scheduler can wait on a gate but never pass one.

## Investigation team${invTeam?.approvedAt ? ` (approved ${invTeam.approvedAt})` : invTeam ? " (plan not approved)" : ""}

${
  invTeam
    ? invTeam.capabilityIds
        .map((id) => {
          const owned = invTasks.filter((t) => t.capabilityId === id).map((t) => t.title);
          return `- **${roleName(id)}** (${id})${owned.length ? ` — ${owned.join("; ")}` : ""}`;
        })
        .join("\n") || "- No specialists assigned."
    : "- No investigation team was planned."
}
${planned.length ? `\nIn the catalogue roster for this size of project but planned, not available — they did no work:\n\n${planned.map((id) => `- ${roleName(id)} (${id})`).join("\n")}\n` : ""}
## Build team

${
  workroom
    ? workroom.team
        .map(
          (t) =>
            `- **${t.name}** · ${t.role} — ${t.tasks.done} of ${t.tasks.total} tasks done${t.current ? `, working on “${t.current}”` : ""}`,
        )
        .join("\n") || "- No specialist work on the build."
    : mission.delivery
      ? "- The build could not be read for this export."
      : "- Delivery has not started."
}

Agent names (Aria, Scout, Lumen…) are display names for catalogue roles; the real role follows each name.

## Tools, not team members

- **${MEETING_READER_LABEL}** — reads your meeting notes into proposals you accept or dismiss.
- **Handoff contract check** (deterministic) — an output passes to the next stage only with its required sections.
- **Scheduler** — starts a task only when everything it builds on is done and approved.
`;

  // ----- timeline files -----
  const timelineMd = `# Timeline

Every recorded event, oldest first. Times are UTC, as saved. Source says which record the line comes from.

| When (UTC) | Who | Role | What | Source | File |
| --- | --- | --- | --- | --- | --- |
${timeline.map((t) => `| ${cell(t.at)} | ${cell(t.who)} | ${cell(t.role)} | ${cell(t.what)} | ${t.source} | ${t.file ? `\`${t.file}\`` : "—"} |`).join("\n") || "| — | — | — | Nothing recorded yet | — | — |"}
`;
  const timelineCsv = [
    ["at", "who", "role", "what", "source", "file"],
    ...timeline.map((t) => [t.at, t.who, t.role, t.what, t.source, t.file ?? ""]),
  ]
    .map((r) => r.map(csv).join(","))
    .join("\n");

  const decisionsMd = `# Decision log

Every decision you made on this project, with the reason you gave. Agents draft and recommend; only you decide.

${decisions.join("\n\n") || "No decisions recorded yet."}
`;

  const handoffsMd = `# Handoffs

Each line is one stage passing its work to the next. A stage only starts when everything it builds on is done and, for gates, approved by you.

${
  handoffRows.length
    ? `| From | To | What was handed over | Check on it | Handed over (UTC) | Picked up (UTC) | State |\n| --- | --- | --- | --- | --- | --- | --- |\n${handoffRows.join("\n")}`
    : delivery
      ? "No handoffs on this build."
      : "Delivery has not started, so there are no build handoffs."
}
`;

  const readme = `# The company record

How “${mission.brief.question}” was run, kept the way a company keeps its records.

- **Exported at:** ${exportedAt}
- ${COMPANY_RECORD_NOTE}

| File | What it holds |
| --- | --- |
| \`org-chart.md\` | Who was on the team, what each role owned, and roles that did no work |
| \`timeline.md\` / \`timeline.csv\` | ${timeline.length} recorded events: who, when, what, which file |
| \`work-orders/\` | ${workOrders.length} work orders: brief, owner, start and finish, time taken, usage, runs, checks, how the output was made |
| \`decisions.md\` | ${decisions.length} decision entries, with your reasons |
| \`handoffs.md\` | ${handoffRows.length} handoffs between stages, with the check on each |
| \`usage-ledger.md\` / \`usage-ledger.csv\` | Usage against your ceiling, per task, per role and per run |
| \`record.html\` | All of the above on one page that opens offline in any browser |

## Gaps in this record

${gaps.length ? gaps.map((g) => `- ${g}`).join("\n") : "- None found: every section above was read from a saved record."}

## What this record is not

- Not a recording of agents talking. It shows what was saved: events, outputs, checks and decisions.
- Not a measurement of outcomes. Results you recorded are labelled owner-supplied.
- Simulated drafts are labelled as simulated wherever they appear.
`;

  const html = renderRecordHtml({
    title: mission.brief.question,
    exportedAt,
    gaps,
    timeline,
    stages,
    taskById,
    checkFor,
    runsFor,
    decisionsMd: decisions,
    handoffsMd,
    orgMd,
    usageMd,
  });

  const files: CompanyRecordFile[] = [
    {
      path: "company/README.md",
      content: readme,
      note: "Company record: what is here and the gaps",
    },
    {
      path: "company/org-chart.md",
      content: orgMd,
      note: "Who was on the team and what each owned",
    },
    {
      path: "company/timeline.md",
      content: timelineMd,
      note: `${timeline.length} recorded events, oldest first`,
    },
    { path: "company/timeline.csv", content: timelineCsv, note: "The timeline as a spreadsheet" },
    ...workOrders,
    { path: "company/decisions.md", content: decisionsMd, note: "Your decisions with reasons" },
    { path: "company/handoffs.md", content: handoffsMd, note: "Stage handoffs with checks" },
    { path: "company/usage-ledger.md", content: usageMd, note: "Usage per task, role and run" },
    {
      path: "company/usage-ledger.csv",
      content: usageCsv,
      note: "The usage ledger as a spreadsheet",
    },
    { path: "company/record.html", content: html, note: "The whole record on one offline page" },
  ];

  return {
    files,
    summary: {
      timelineEntries: timeline.length,
      workOrders: workOrders.length,
      decisions: decisions.length,
      handoffs: handoffRows.length,
      runs: input.runs === null ? null : runs.length,
      gaps,
    },
  };
}

// ---------- offline page ----------

/** Minimal Markdown to HTML for the record's own generated text (headings, lists, tables). */
function mdToHtml(md: string): string {
  const out: string[] = [];
  const lines = md.split("\n");
  let i = 0;
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  while (i < lines.length) {
    const line = lines[i]!;
    if (/^\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i]!)) rows.push(lines[i++]!);
      const split = (r: string) =>
        r
          .replace(/^\||\|$/g, "")
          .split(/(?<!\\)\|/)
          .map((c) => c.trim().replace(/\\\|/g, "|"));
      const [head, , ...body] = rows;
      out.push(
        `<div class="tbl"><table><thead><tr>${split(head!)
          .map((c) => `<th>${inline(c)}</th>`)
          .join("")}</tr></thead><tbody>${body
          .map(
            (r) =>
              `<tr>${split(r)
                .map((c) => `<td>${inline(c)}</td>`)
                .join("")}</tr>`,
          )
          .join("")}</tbody></table></div>`,
      );
      continue;
    }
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i]!)) items.push(lines[i++]!.slice(2));
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }
    const h = /^(#{1,3}) (.+)$/.exec(line);
    const lvl = h ? h[1]!.length + 1 : 0;
    if (h) out.push(`<h${lvl}>${inline(h[2]!)}</h${lvl}>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    i++;
  }
  return out.join("\n");
}

function renderRecordHtml(r: {
  title: string;
  exportedAt: string;
  gaps: string[];
  timeline: TimelineEntry[];
  stages: Stage[];
  taskById: Map<string, MissionBundle["tasks"][number]>;
  checkFor: (s: Stage) => string;
  runsFor: (taskId: string) => TaskRunRecord[];
  decisionsMd: string[];
  handoffsMd: string;
  orgMd: string;
  usageMd: string;
}): string {
  const orders = r.stages
    .map((s) => {
      const t = r.taskById.get(s.taskId)!;
      const started = t.startedAt ?? r.runsFor(s.taskId)[0]?.startedAt ?? null;
      return `<details><summary><b>${String(s.index + 1).padStart(2, "0")} · ${esc(s.title)}</b> <span class="muted">${esc(s.gate ? "You" : `${s.owner} · ${s.role}`)} · ${esc(BUILD_STATUS_LABEL[s.status])}</span></summary>
<dl><dt>Brief</dt><dd>${esc(t.description || "—")}</dd>
<dt>Started</dt><dd>${esc(started ?? "Not recorded")}</dd>
<dt>Finished</dt><dd>${esc(t.completedAt ?? "Not finished")}</dd>
<dt>Time taken</dt><dd>${esc(durationBetween(started, t.completedAt) ?? "Not recorded")}</dd>
<dt>Usage</dt><dd>${t.actualUsage} of ${t.estimatedUsage} units</dd>
<dt>Output</dt><dd>${s.output ? `${esc(s.output.title)} — ${esc(s.output.production)}${s.path ? ` (<code>${esc(s.path)}</code>)` : ""}` : "—"}</dd>
<dt>Check</dt><dd>${esc(r.checkFor(s))}</dd>
<dt>Runs</dt><dd>${r.runsFor(s.taskId).length}</dd></dl></details>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Company record — ${esc(r.title)}</title>
<style>
:root{--ink:#1e1b4b;--muted:#64748b;--line:#e2e8f0;--bg:#f8fafc;--accent:#4f46e5}
*{box-sizing:border-box}body{margin:0;font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);background:var(--bg)}
header{background:#fff;border-bottom:1px solid var(--line);padding:24px 32px}header h1{margin:0 0 4px;font-size:22px}
nav{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--line);padding:8px 32px;display:flex;gap:16px;flex-wrap:wrap;z-index:1}
nav a{color:var(--accent);text-decoration:none;font-weight:600}main{max-width:1180px;margin:0 auto;padding:24px 32px}
section{background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px 24px;margin-bottom:20px}
h2{margin:0 0 12px;font-size:18px}h3{font-size:15px;margin:16px 0 6px}h4{font-size:14px;margin:12px 0 4px}
.muted{color:var(--muted);font-weight:400}.tbl{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{background:var(--bg);font-weight:600}
code{font:12px ui-monospace,Menlo,monospace;background:var(--bg);padding:1px 4px;border-radius:4px}
details{border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:8px 0}summary{cursor:pointer}
dl{display:grid;grid-template-columns:120px 1fr;gap:4px 12px;margin:10px 0 0}dt{color:var(--muted)}dd{margin:0}
.gap{background:#fffbeb;border-color:#fde68a}
</style></head><body>
<header><h1>Company record</h1><div class="muted">${esc(r.title)} · exported ${esc(r.exportedAt)} · ${esc(COMPANY_RECORD_NOTE)}</div></header>
<nav><a href="#gaps">Gaps</a><a href="#org">Org chart</a><a href="#timeline">Timeline</a><a href="#orders">Work orders</a><a href="#decisions">Decisions</a><a href="#handoffs">Handoffs</a><a href="#usage">Usage</a></nav>
<main>
<section id="gaps" class="${r.gaps.length ? "gap" : ""}"><h2>Gaps in this record</h2>${r.gaps.length ? `<ul>${r.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul>` : "<p>None found: every section was read from a saved record.</p>"}</section>
<section id="org">${mdToHtml(r.orgMd)}</section>
<section id="timeline"><h2>Timeline <span class="muted">${r.timeline.length} events · UTC</span></h2><div class="tbl"><table><thead><tr><th>When</th><th>Who</th><th>What</th><th>Source</th><th>File</th></tr></thead><tbody>
${r.timeline.map((t) => `<tr><td><code>${esc(t.at)}</code></td><td>${esc(t.who)}<div class="muted">${esc(t.role)}</div></td><td>${esc(t.what)}</td><td>${t.source}</td><td>${t.file ? `<code>${esc(t.file)}</code>` : "—"}</td></tr>`).join("\n") || '<tr><td colspan="5">Nothing recorded yet.</td></tr>'}
</tbody></table></div></section>
<section id="orders"><h2>Work orders <span class="muted">${r.stages.length}</span></h2>${orders || "<p>Delivery has not started.</p>"}</section>
<section id="decisions"><h2>Decisions</h2>${r.decisionsMd.length ? mdToHtml(r.decisionsMd.join("\n\n").replace(/^### /gm, "## ")) : "<p>No decisions recorded yet.</p>"}</section>
<section id="handoffs">${mdToHtml(r.handoffsMd)}</section>
<section id="usage">${mdToHtml(r.usageMd)}</section>
</main></body></html>
`;
}
