import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Download, RotateCcw, StepForward, XCircle } from "lucide-react";
import { CommandShell } from "@/components/command/command-shell";
import { programmeQuery } from "@/lib/programme-queries";
import {
  addInterviewNotes,
  addProgrammeBudget,
  advanceProgramme,
  cancelProgramme,
  decideProgrammeGate,
  exportProgramme,
  type ProgrammeView,
} from "@/lib/programme.functions";
import { decisionStatus, finalOptionId, latestDecisions } from "@/lib/programme/engine";
import { sourceRegister } from "@/lib/programme/research";
import { displayName, member } from "@/lib/programme/roster";
import { createZip } from "@/lib/programme/zip";
import {
  CRITERIA,
  CRITERION_LABELS,
  PHASE_LABELS,
  type DecisionRecord,
  type InterviewRecord,
  type MeetingRecord,
  type ProgrammeRecord,
} from "@/lib/programme/types";

export const Route = createFileRoute("/_authenticated/command/programmes/$programmeId")({
  head: () => ({ meta: [{ title: "Programme dashboard — DeliverX" }] }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(programmeQuery(params.programmeId));
  },
  component: ProgrammeDashboard,
});

const TABS = [
  ["items", "Work plan"],
  ["decisions", "Decisions"],
  ["meetings", "Meetings"],
  ["deliverables", "Deliverables"],
  ["interviews", "Research & interviews"],
  ["workforce", "Workforce"],
  ["activity", "Activity"],
] as const;
type Tab = (typeof TABS)[number][0];

const STATUS_TEXT: Record<string, string> = {
  active: "Running",
  awaiting_human: "Needs your decision",
  completed: "Completed",
  partially_completed: "Partially completed",
  cancelled: "Cancelled",
  draft: "Draft",
};

function ProgrammeDashboard() {
  const { programmeId } = Route.useParams();
  const query = useQuery(programmeQuery(programmeId));
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("items");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setData = (v: ProgrammeView) =>
    queryClient.setQueryData(programmeQuery(programmeId).queryKey, v);
  const onError = (e: unknown) => {
    setError(e instanceof Error ? e.message : "Something went wrong");
  };

  const step = useMutation({
    mutationFn: () => advanceProgramme({ data: { id: programmeId } }),
    onSuccess: (r) => {
      setError(null);
      setNote(r.note);
      setData(r);
    },
    onError,
  });

  const download = useMutation({
    mutationFn: () => exportProgramme({ data: { id: programmeId } }),
    onSuccess: ({ files, title }) => {
      const zip = createZip(files);
      const url = URL.createObjectURL(
        new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "programme"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError,
  });

  const cancel = useMutation({
    mutationFn: () => cancelProgramme({ data: { id: programmeId } }),
    onSuccess: setData,
    onError,
  });

  if (query.isLoading || !query.data) {
    return (
      <CommandShell title="Programme" subtitle="Loading…">
        <p className="cc-muted">
          {query.isError ? (query.error as Error).message : "Loading programme…"}
        </p>
      </CommandShell>
    );
  }

  const { state, records, metrics, reputation, modelMode } = query.data;
  const running = state.status === "active";

  return (
    <CommandShell
      title={state.title}
      subtitle={state.businessCase.idea.slice(0, 160)}
      usage={{ consumed: state.budget.consumed, ceiling: state.budget.ceiling }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/command/programmes" className="cc-muted text-sm">
            ← Programmes
          </Link>
          <span className="cc-chip">{STATUS_TEXT[state.status] ?? state.status}</span>
          <span className="cc-gen-badge" data-mode={modelMode.enabled ? "model" : "simulated"}>
            {modelMode.enabled ? `Model: ${modelMode.model}` : "Simulated mode"}
          </span>
          <span className="cc-gen-badge" data-mode={query.data.search ? "model" : "simulated"}>
            {query.data.search ? `Research: ${query.data.search}` : "No web research"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <>
              <button
                type="button"
                className="cc-btn cc-btn-primary"
                disabled={step.isPending}
                onClick={() => step.mutate()}
              >
                <StepForward className="size-4" />{" "}
                {step.isPending ? "Running…" : "Run next server step"}
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            disabled={download.isPending}
            onClick={() => download.mutate()}
          >
            <Download className="size-4" />{" "}
            {download.isPending ? "Packaging…" : "Download project (.zip)"}
          </button>
          {!["completed", "cancelled"].includes(state.status) ? (
            <button
              type="button"
              className="cc-btn cc-btn-ghost"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="cc-error mb-3">{error}</p> : null}
      {note ? <p className="cc-muted mb-3 text-sm">{note}</p> : null}

      <AttentionPanel
        view={query.data}
        programmeId={programmeId}
        onUpdate={setData}
        onError={onError}
      />

      <FounderBriefing view={query.data} />

      <section className="cc-kpi-strip" aria-label="Programme summary">
        <Kpi
          label="Progress"
          value={`${Math.round(metrics.progress * 100)}%`}
          sub={`${metrics.itemsDone}/${metrics.itemsTotal} work items`}
        />
        <Kpi
          label="Workforce engaged"
          value={`${metrics.engagedRoles}`}
          small="/ 150"
          sub={`${metrics.departments.filter((d) => d.engaged).length}/15 departments`}
        />
        <Kpi
          label="Decisions"
          value={`${metrics.decisions.total}`}
          sub={`${metrics.decisions.adopted} adopted · ${metrics.decisions.escalated} escalated · ${metrics.decisions.vetoes} vetoes · ${metrics.decisions.mindChanges} changed minds`}
        />
        <Kpi
          label="Meetings & deliverables"
          value={`${metrics.meetings} · ${metrics.deliverables}`}
          sub={`Peer review avg ${metrics.reviewAverage ?? "—"}/100`}
        />
      </section>

      <RoadmapTimeline view={query.data} />

      <div className="pg-tabs" role="tablist" aria-label="Programme views">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="cc-panel" role="tabpanel">
        {tab === "items" ? <WorkPlan view={query.data} /> : null}
        {tab === "decisions" ? <Decisions records={records} /> : null}
        {tab === "meetings" ? (
          <RecordBrowser
            records={records.filter((r) => r.kind === "meeting")}
            empty="No meetings yet."
          />
        ) : null}
        {tab === "deliverables" ? <Deliverables records={records} /> : null}
        {tab === "interviews" ? (
          <Interviews
            records={records}
            programmeId={programmeId}
            onUpdate={setData}
            onError={onError}
          />
        ) : null}
        {tab === "workforce" ? <Workforce view={query.data} reputation={reputation} /> : null}
        {tab === "activity" ? <Activity records={records} /> : null}
      </section>
    </CommandShell>
  );
}

function Kpi({
  label,
  value,
  small,
  sub,
}: {
  label: string;
  value: string;
  small?: string;
  sub: string;
}) {
  return (
    <div className="cc-kpi-card">
      <span className="cc-kpi-label">{label}</span>
      <strong className="cc-kpi-value">
        {value} {small ? <small>{small}</small> : null}
      </strong>
      <span className="cc-kpi-sub">{sub}</span>
    </div>
  );
}

function AttentionPanel({
  view,
  programmeId,
  onUpdate,
  onError,
}: {
  view: ProgrammeView;
  programmeId: string;
  onUpdate: (v: ProgrammeView) => void;
  onError: (e: unknown) => void;
}) {
  const next = view.metrics.next;
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [gateNote, setGateNote] = useState("");
  const decide = useMutation({
    mutationFn: (approve: boolean) =>
      decideProgrammeGate({
        data: {
          id: programmeId,
          gateKey: next.type === "gate" ? next.item.key : "",
          approve,
          choices,
          note: gateNote,
        },
      }),
    onSuccess: (v) => {
      setChoices({});
      setGateNote("");
      onUpdate(v);
    },
    onError,
  });
  const budget = useMutation({
    mutationFn: () => addProgrammeBudget({ data: { id: programmeId, credits: 100 } }),
    onSuccess: onUpdate,
    onError,
  });

  if (next.type === "budget") {
    return (
      <section className="cc-panel cc-panel-active-gate">
        <h2 className="cc-panel-title">Budget reached</h2>
        <p className="cc-muted">
          “{next.item.title}” needs {next.item.estimatedCredits} credits;{" "}
          {view.state.budget.ceiling - view.state.budget.consumed} remain.
        </p>
        <button
          type="button"
          className="cc-btn cc-btn-primary mt-2"
          disabled={budget.isPending}
          onClick={() => budget.mutate()}
        >
          Add 100 credits
        </button>
      </section>
    );
  }
  if (next.type !== "gate") return null;

  return (
    <section className="cc-panel cc-panel-active-gate" aria-label="Decision required">
      <h2 className="cc-panel-title">{next.item.title}</h2>
      <p className="cc-muted text-sm">{next.item.description}</p>
      {next.pendingDecisions.map((d) => {
        const selected = choices[d.key] ?? d.chosenOptionId ?? "";
        return (
          <fieldset key={d.key} className="pg-decision-pick">
            <legend>
              <strong>{d.key}</strong> — {d.question}{" "}
              <span className="cc-chip">
                {d.outcome === "adopted"
                  ? `panel adopted (${Math.round(d.confidence * 100)}%)`
                  : "panel split — your call"}
              </span>
            </legend>
            {d.options.map((o) => {
              const t = d.tally.find((x) => x.optionId === o.id);
              return (
                <label key={o.id} className="pg-option">
                  <input
                    type="radio"
                    name={d.key}
                    value={o.id}
                    checked={selected === o.id}
                    disabled={t?.vetoed}
                    onChange={() => setChoices((c) => ({ ...c, [d.key]: o.id }))}
                  />
                  <span>
                    <strong>{o.label}</strong> — {o.summary}
                    <span className="pg-bar small">
                      <span style={{ width: `${Math.round((t?.share ?? 0) * 100)}%` }} />
                    </span>
                    <small className="cc-muted">
                      {Math.round((t?.share ?? 0) * 100)}% weighted support
                      {t?.vetoed ? " · vetoed" : ""}
                    </small>
                  </span>
                </label>
              );
            })}
            <p className="text-xs cc-muted mt-1">{d.rationale}</p>
          </fieldset>
        );
      })}
      <label className="cc-label mt-3" htmlFor="gate-note">
        Note to the workforce (required when sending back for rework)
        <input
          id="gate-note"
          className="cc-input"
          value={gateNote}
          onChange={(e) => setGateNote(e.target.value)}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="cc-btn cc-btn-primary"
          disabled={decide.isPending}
          onClick={() => decide.mutate(true)}
        >
          <CheckCircle2 className="size-4" /> Approve &amp; continue
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-ghost"
          disabled={decide.isPending || !gateNote.trim()}
          onClick={() => decide.mutate(false)}
        >
          <RotateCcw className="size-4" /> Send back for rework
        </button>
      </div>
    </section>
  );
}

function RoadmapTimeline({ view }: { view: ProgrammeView }) {
  const weeks = view.state.businessCase.timelineWeeks;
  return (
    <section className="cc-panel" aria-label="Roadmap">
      <h2 className="cc-panel-title">Roadmap · {weeks} weeks</h2>
      <div
        className="pg-timeline"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {view.metrics.phases.map((p) => (
          <div
            key={p.key}
            className="pg-phase"
            data-state={p.state}
            style={{ gridColumn: `${p.startWeek} / ${p.endWeek + 1}` }}
            title={`${p.name}: weeks ${p.startWeek}–${p.endWeek}, ${p.done}/${p.total} done`}
          >
            <strong>{p.name}</strong>
            <span>
              {p.done}/{p.total}
            </span>
            <span className="pg-bar small">
              <span style={{ width: `${Math.round((p.done / Math.max(1, p.total)) * 100)}%` }} />
            </span>
          </div>
        ))}
      </div>
      <ol className="pg-milestones">
        {view.metrics.milestones.map((m) => (
          <li key={m.key} data-reached={m.reached}>
            {m.reached ? <CheckCircle2 className="size-3.5" /> : <span className="pg-dot" />} Wk{" "}
            {m.week} · {m.title}
          </li>
        ))}
      </ol>
    </section>
  );
}

function WorkPlan({ view }: { view: ProgrammeView }) {
  const items = view.state.roadmap.items;
  return (
    <div className="pg-table-wrap">
      <table className="pg-table">
        <thead>
          <tr>
            <th>Wk</th>
            <th>Phase</th>
            <th>Work item</th>
            <th>Owner</th>
            <th>Team</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.key} data-status={i.status}>
              <td>{i.week}</td>
              <td>{PHASE_LABELS[i.phase]}</td>
              <td>
                <strong>{i.title}</strong>
                <div className="cc-muted text-xs">
                  {i.kind}
                  {i.decision ? ` · decides ${i.decision.key}` : ""}
                  {i.dependsOn.length ? ` · after ${i.dependsOn.join(", ")}` : ""}
                </div>
              </td>
              <td className="text-xs">{displayName(i.owner)}</td>
              <td className="text-xs">
                {i.team.length +
                  (i.decision ? i.decision.panel.filter((p) => !i.team.includes(p)).length : 0)}
              </td>
              <td>
                <span className="pg-status" data-status={i.status}>
                  {i.kind === "gate" && i.status === "pending" ? "awaiting" : i.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Decisions({ records }: { records: ProgrammeRecord[] }) {
  const decisions = latestDecisions(records);
  const [selected, setSelected] = useState<string | null>(null);
  const d = decisions.find((x) => x.key === selected) ?? decisions[0];
  if (!d) return <p className="cc-muted">Decisions appear when the panels meet.</p>;
  return (
    <div className="pg-split">
      <ul className="cc-artefact-list">
        {decisions.map((x) => (
          <li key={x.key}>
            <button
              type="button"
              className={x.key === d.key ? "active" : ""}
              onClick={() => setSelected(x.key)}
            >
              {x.key} — {x.options.find((o) => o.id === finalOptionId(x))?.label ?? "pending"}
            </button>
          </li>
        ))}
      </ul>
      <DecisionDetail d={d} />
    </div>
  );
}

function DecisionDetail({ d }: { d: DecisionRecord }) {
  const label = (id: string | null | undefined) => d.options.find((o) => o.id === id)?.label ?? "—";
  return (
    <div>
      <h3 className="text-base font-semibold">{d.question}</h3>
      <p className="text-sm mt-1">
        <span className="cc-chip">{decisionStatus(d)}</span>{" "}
        <strong>{label(finalOptionId(d))}</strong> · owner {displayName(d.owner)}
      </p>
      <p className="cc-muted text-sm mt-1">{d.rationale}</p>
      {d.human?.note ? <p className="text-sm mt-1">Your note: “{d.human.note}”</p> : null}

      <h4 className="cc-subhead">Weighted tally (after critique)</h4>
      {d.tally.map((t) => (
        <div key={t.optionId} className="pg-tally">
          <span>
            {label(t.optionId)}
            {t.vetoed ? " (vetoed)" : ""}
          </span>
          <span className="pg-bar">
            <span style={{ width: `${Math.round(t.share * 100)}%` }} />
          </span>
          <span>{Math.round(t.share * 100)}%</span>
        </div>
      ))}

      {d.vetoes.length ? (
        <>
          <h4 className="cc-subhead">Vetoes</h4>
          <ul className="cc-bullets">
            {d.vetoes.map((v, i) => (
              <li key={i}>
                {displayName(v.capabilityId)} blocked <strong>{label(v.optionId)}</strong>:{" "}
                {v.reason}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h4 className="cc-subhead">Positions — independent first, then after hearing the panel</h4>
      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Round 1</th>
              <th>Round 2</th>
              <th>Weight</th>
              <th>Reasoning</th>
            </tr>
          </thead>
          <tbody>
            {d.round2.map((p) => {
              const r1 = d.round1.find((x) => x.capabilityId === p.capabilityId)!;
              return (
                <tr key={p.capabilityId}>
                  <td className="text-xs">
                    {displayName(p.capabilityId)}
                    <div className="cc-muted">{member(p.capabilityId).department}</div>
                  </td>
                  <td className="text-xs">
                    {label(r1.optionId)} ({Math.round(r1.confidence * 100)}%)
                  </td>
                  <td className="text-xs">
                    {p.revisedFrom ? <strong>{label(p.optionId)}</strong> : label(p.optionId)}
                    {p.persuadedBy ? (
                      <div className="cc-muted">persuaded by {displayName(p.persuadedBy)}</div>
                    ) : null}
                  </td>
                  <td className="text-xs">{p.weight}</td>
                  <td className="text-xs">
                    {p.rationale} {p.concern}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h4 className="cc-subhead">Option scores</h4>
      <p className="cc-muted text-xs">
        Strength of evidence is computed from the quality of the sources an option cites — never
        scored by a model.
      </p>
      <div className="pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>Option</th>
              {CRITERIA.map((c) => (
                <th key={c}>{CRITERION_LABELS[c]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.options.map((o) => (
              <tr key={o.id}>
                <td className="text-xs">
                  {o.label}
                  <div className="cc-muted">
                    {o.origin === "model" ? "model-proposed" : "blueprint template"}
                    {o.sourceIds?.length ? ` · cites ${o.sourceIds.join(", ")}` : ""}
                  </div>
                  {o.assumptions?.length ? (
                    <div className="cc-muted">Assumes: {o.assumptions.join("; ")}</div>
                  ) : null}
                </td>
                {CRITERIA.map((c) => (
                  <td key={c} className="text-xs">
                    {o.scores[c].toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4 className="cc-subhead">Red-team challenge</h4>
      <p className="text-sm">
        {displayName(d.challenge.by)}: {d.challenge.note}
      </p>
      <h4 className="cc-subhead">Sensitivity &amp; review</h4>
      <p className="text-sm">
        {d.sensitivity.robust
          ? "Robust — the choice holds if any single criterion is ignored."
          : `Sensitive — the choice changes if ${d.sensitivity.flipsWithout.join(", ")} is ignored.`}{" "}
        <span className="cc-muted">Review condition: {d.reviewCondition}</span>
      </p>
      {d.dissent.length ? (
        <>
          <h4 className="cc-subhead">Recorded dissent</h4>
          <ul className="cc-bullets">
            {d.dissent.map((x) => (
              <li key={x.capabilityId} className="text-sm">
                {x.note}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function RecordBrowser({ records, empty }: { records: ProgrammeRecord[]; empty: string }) {
  const [idx, setIdx] = useState(records.length - 1);
  const r = records[Math.min(Math.max(idx, 0), records.length - 1)];
  if (!r) return <p className="cc-muted">{empty}</p>;
  const meeting = r.kind === "meeting" ? (r.data as unknown as MeetingRecord) : null;
  return (
    <div className="pg-split">
      <ul className="cc-artefact-list">
        {records.map((x, i) => (
          <li key={`${x.itemKey}-${i}`}>
            <button type="button" className={x === r ? "active" : ""} onClick={() => setIdx(i)}>
              {x.title}
            </button>
          </li>
        ))}
      </ul>
      <div>
        {meeting ? (
          <p className="cc-muted text-xs mb-2">
            Week {meeting.week} · {meeting.attendees.length} attendees · {meeting.transcript.length}{" "}
            contributions · {meeting.actionItems.length} actions
          </p>
        ) : null}
        {r.format === "html" ? (
          <iframe
            title={r.title}
            className="cc-proto-frame"
            srcDoc={r.body}
            sandbox="allow-scripts"
          />
        ) : (
          <pre className="cc-artefact-pre">{r.body}</pre>
        )}
      </div>
    </div>
  );
}

function Deliverables({ records }: { records: ProgrammeRecord[] }) {
  const latest = useMemo(() => {
    const m = new Map<string, ProgrammeRecord>();
    for (const r of records.filter((x) => x.kind === "artefact" && x.itemKey)) m.set(r.itemKey!, r);
    return [...m.values()];
  }, [records]);
  const reviews = new Map(records.filter((r) => r.kind === "review").map((r) => [r.itemKey, r]));
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        {latest.map((a) => {
          const rv = reviews.get(a.itemKey);
          const gen = String(a.data["generation"] ?? "simulated");
          return (
            <span key={a.itemKey} className="cc-chip" title={rv?.body ?? ""}>
              {a.title} ·{" "}
              {gen.startsWith("model")
                ? "model"
                : gen === "deterministic"
                  ? "automated"
                  : "simulated"}
              {rv ? ` · review ${String(rv.data["score"])}` : ""}
            </span>
          );
        })}
      </div>
      <RecordBrowser
        records={latest}
        empty="Deliverables appear as the workforce completes them."
      />
    </>
  );
}

function Interviews({
  records,
  programmeId,
  onUpdate,
  onError,
}: {
  records: ProgrammeRecord[];
  programmeId: string;
  onUpdate: (v: ProgrammeView) => void;
  onError: (e: unknown) => void;
}) {
  const rec = records.filter((r) => r.kind === "interviews").at(-1);
  const data = rec ? (rec.data as unknown as InterviewRecord) : null;
  const real = records.filter(
    (r) => r.kind === "human_input" && r.data["type"] === "interview_notes",
  );
  const [who, setWho] = useState("");
  const [notes, setNotes] = useState("");
  const add = useMutation({
    mutationFn: () => addInterviewNotes({ data: { id: programmeId, interviewee: who, notes } }),
    onSuccess: (v) => {
      setWho("");
      setNotes("");
      onUpdate(v);
    },
    onError,
  });
  const sources = sourceRegister(records);
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="cc-subhead">Source register ({sources.length})</h3>
        {sources.length ? (
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Quality</th>
                  <th>Used for</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((x) => (
                  <tr key={x.id}>
                    <td className="text-xs">{x.id}</td>
                    <td className="text-xs">
                      <a
                        href={x.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline"
                      >
                        {x.title}
                      </a>
                      <div className="cc-muted">
                        {x.publisher}
                        {x.publishedAt ? ` · ${x.publishedAt.slice(0, 10)}` : " · undated"} · via{" "}
                        {x.provider}
                      </div>
                    </td>
                    <td className="text-xs" title={x.qualityReasons.join("; ")}>
                      {x.quality} ({x.score.toFixed(2)})
                    </td>
                    <td className="text-xs">{x.itemKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="cc-muted text-sm">
            No sources yet. Research runs during discovery when a search provider (EXA_API_KEY,
            TAVILY_API_KEY or BRAVE_SEARCH_API_KEY) is configured; without one, research
            deliverables contain no external evidence.
          </p>
        )}
      </div>
      <p className="cc-limitation text-sm">
        Synthetic personas are rehearsal material for sharpening questions — never evidence.
        Hypotheses only gain evidence from notes of real conversations ({real.length} added).
      </p>
      {data ? (
        <>
          <div>
            <h3 className="cc-subhead">Hypotheses</h3>
            <ul className="cc-bullets">
              {data.hypotheses.map((h) => (
                <li key={h.id}>
                  <strong>{h.id}</strong> {h.statement}{" "}
                  <span className="cc-chip">
                    {real.length ? "real evidence added — your judgement" : "synthetic signal only"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="cc-subhead">Synthesis</h3>
            <pre className="cc-artefact-pre">{data.synthesis}</pre>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">
              Rehearsal sessions ({data.sessions.length} synthetic personas)
            </summary>
            {data.sessions.map((s) => {
              const persona = data.personas.find((p) => p.id === s.personaId)!;
              return (
                <div key={s.personaId} className="mt-3">
                  <strong className="text-sm">
                    {persona.name} — {persona.segment}
                  </strong>{" "}
                  <span className="cc-muted text-xs">interviewer {displayName(s.interviewer)}</span>
                  <ul className="text-sm mt-1">
                    {s.turns.map((t, i) => (
                      <li key={i}>
                        <strong>{t.kind === "question" ? "Q" : "A"}:</strong> {t.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </details>
        </>
      ) : (
        <p className="cc-muted">The interview programme runs during discovery.</p>
      )}
      <div>
        <h3 className="cc-subhead">Add notes from a real interview</h3>
        <label className="cc-label" htmlFor="iv-who">
          Interviewee (role or pseudonym — avoid personal identifiers)
          <input
            id="iv-who"
            className="cc-input"
            value={who}
            onChange={(e) => setWho(e.target.value)}
          />
        </label>
        <label className="cc-label mt-2" htmlFor="iv-notes">
          Notes
          <textarea
            id="iv-notes"
            className="cc-input"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="cc-btn cc-btn-secondary mt-2"
          disabled={add.isPending || who.trim().length < 2 || notes.trim().length < 20}
          onClick={() => add.mutate()}
        >
          Save interview notes
        </button>
        {real.length ? (
          <ul className="cc-bullets mt-3">
            {real.map((r, i) => (
              <li key={i}>
                <strong>{r.title}</strong>: {r.body.slice(0, 200)}
                {r.body.length > 200 ? "…" : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function Workforce({
  view,
  reputation,
}: {
  view: ProgrammeView;
  reputation: ProgrammeView["reputation"];
}) {
  const max = Math.max(1, ...view.metrics.departments.map((d) => d.contributions));
  return (
    <div className="grid gap-5">
      <div>
        <h3 className="cc-subhead">Department engagement</h3>
        <div className="pg-heat">
          {view.metrics.departments.map((d) => (
            <div
              key={d.number}
              className="pg-heat-cell"
              style={{ ["--heat" as string]: String(d.contributions / max) }}
            >
              <strong>{d.name}</strong>
              <span>
                {d.engaged}/10 roles · {d.contributions} contributions
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="cc-subhead">Judgement track record</h3>
        <p className="cc-muted text-xs mb-2">
          A role scores when its final position matched the decision that stood after your
          ratification, and when its deliverables pass peer review. Smoothed so every role starts at
          0.50.
        </p>
        <div className="pg-table-wrap">
          <table className="pg-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Department</th>
                <th>Score</th>
                <th>Judgements</th>
                <th>Persuaded others</th>
              </tr>
            </thead>
            <tbody>
              {reputation.slice(0, 25).map((r) => (
                <tr key={r.id}>
                  <td className="text-xs">
                    {r.name} ({r.id})
                  </td>
                  <td className="text-xs">{r.department}</td>
                  <td className="text-xs">{r.score.toFixed(2)}</td>
                  <td className="text-xs">
                    {r.hits}/{r.trials}
                  </td>
                  <td className="text-xs">{r.influence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Activity({ records }: { records: ProgrammeRecord[] }) {
  return (
    <ol className="pg-activity">
      {[...records]
        .reverse()
        .slice(0, 80)
        .map((r, i) => (
          <li key={i}>
            <span className="cc-chip">{r.kind}</span> <strong>{r.title}</strong>
            <span className="cc-muted text-xs">
              {" "}
              · {r.actor.startsWith("DX-") ? displayName(r.actor) : "you"} ·{" "}
              {new Date(r.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      {records.length === 0 ? (
        <li className="cc-muted">
          <XCircle className="inline size-3.5" /> Nothing yet — press Run workforce.
        </li>
      ) : null}
    </ol>
  );
}

/** Answers the five founder questions from persisted programme data only. */
function FounderBriefing({ view }: { view: ProgrammeView }) {
  const { state, records, metrics } = view;
  const decisions = latestDecisions(records);
  const label = (d: DecisionRecord) =>
    d.options.find((o) => o.id === finalOptionId(d))?.label ?? "pending";
  const segment = decisions.find((d) => d.key.startsWith("D1"));
  const dissent = decisions.reduce((s, d) => s + d.dissent.length, 0);
  const artefacts = new Map<string, ProgrammeRecord>();
  for (const r of records.filter((x) => x.kind === "artefact" && x.itemKey))
    artefacts.set(r.itemKey!, r);
  const simulated = [...artefacts.values()].filter((a) =>
    String(a.data["generation"] ?? "simulated").startsWith("simulated"),
  ).length;
  const verification = artefacts.get("verification");
  const gatesApproved = state.roadmap.items.filter(
    (i) => i.kind === "gate" && i.status === "completed",
  ).length;
  const gates = state.roadmap.items.filter((i) => i.kind === "gate").length;
  const next = metrics.next;
  const gaps = decisions.filter((d) => d.challenge?.evidenceGap).length;
  return (
    <section className="cc-panel pg-brief" aria-label="Founder briefing">
      <dl>
        <div>
          <dt>What are we building, and why?</dt>
          <dd>
            {state.businessCase.name} for{" "}
            {segment ? label(segment) : state.businessCase.targetUsers} —{" "}
            {state.businessCase.problem.slice(0, 120)}
          </dd>
        </div>
        <div>
          <dt>What evidence supports our decisions?</dt>
          <dd>
            {metrics.realInterviewNotes} real interview(s); {simulated}/{artefacts.size}{" "}
            deliverables are simulated drafts; {gaps} decision(s) flagged with evidence gaps.
          </dd>
        </div>
        <div>
          <dt>Who contributed, disagreed or changed their mind?</dt>
          <dd>
            {metrics.engagedRoles}/150 roles engaged · {dissent} dissenting positions recorded ·{" "}
            {metrics.decisions.mindChanges} changes of mind · {metrics.decisions.vetoes} vetoes
          </dd>
        </div>
        <div>
          <dt>What is completed, tested and approved?</dt>
          <dd>
            {metrics.itemsDone}/{metrics.itemsTotal} work items · verification{" "}
            {verification
              ? verification.body.includes("**PASS**")
                ? "passed (static checks)"
                : "failed"
              : "not run yet"}{" "}
            · {gatesApproved}/{gates} founder gates approved
          </dd>
        </div>
        <div>
          <dt>What remains, what is at risk, what next?</dt>
          <dd>
            {next.type === "execute"
              ? `Next: ${next.item.title} (${displayName(next.item.owner)})`
              : next.type === "gate"
                ? `Waiting for you: ${next.item.title}`
                : next.type === "budget"
                  ? "Budget reached — add credits to continue"
                  : `Programme ${next.status.replace("_", " ")}`}
            {" · "}
            {
              state.roadmap.items.filter((i) => i.status === "failed" || i.status === "blocked")
                .length
            }{" "}
            failed/blocked items
          </dd>
        </div>
      </dl>
    </section>
  );
}
