import { useVersionedDraft } from "@/hooks/use-versioned-draft";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { ConversationPanel } from "@/components/command/conversation-panel";
import { MissionTheatre } from "@/components/command/mission-theatre";
import { SupervisedLearningLoop } from "@/components/command/supervised-learning-loop";
import {
  approveSupervisedPlan,
  approveSupervisedPrototype,
  cancelSupervisedMission,
  decideSupervisedMission,
  exportSupervisedMission,
  exportSupervisedMissionZip,
  getSupervisedMission,
  prepareSupervisedArtefact,
  reviseSupervisedBrief,
  runSupervisedComparison,
  saveSupervisedEvidence,
  setSupervisedResearchMode,
} from "@/lib/pilot-mission.functions";
import { decisionPackFilenames } from "@/lib/pilot-mission/decision-pack";
import { createZip } from "@/lib/programme/zip";
import { type ResearchMode } from "@/lib/pilot-mission/research-mode";
import { type DecisionChoice } from "@/lib/pilot-mission/types";

export const Route = createFileRoute("/_authenticated/command/supervised/$missionId")({
  head: () => ({
    meta: [{ title: "Supervised mission — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: SupervisedMissionPage,
});

function SupervisedMissionPage() {
  const { missionId } = Route.useParams();
  const recordSection = useRouterState({ select: (state) => state.location.hash }).replace(
    /^#/,
    "",
  );
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["supervised", "mission", missionId],
    queryFn: () => getSupervisedMission({ data: { id: missionId } }),
  });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (
      !query.data ||
      !["mission-evidence", "mission-judgement", "mission-delivery", "mission-feedback"].includes(
        recordSection,
      )
    )
      return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(recordSection)
        ?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [query.data, recordSection]);
  const [consentedScope, setConsentedScope] = useState<string | null>(null);
  const invalidate = async () => {
    setError(null);
    await queryClient.invalidateQueries({ queryKey: ["supervised"] });
  };
  const onError = (err: unknown) =>
    setError(err instanceof Error ? err.message : "The mission could not be updated.");

  const approvePlan = useMutation({
    mutationFn: () =>
      approveSupervisedPlan({
        data: { id: missionId, expectedVersion: query.data?.mission.version ?? 0 },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });
  const setResearch = useMutation({
    mutationFn: (mode: ResearchMode) =>
      setSupervisedResearchMode({
        data: {
          id: missionId,
          expectedVersion: query.data?.mission.version ?? 0,
          mode,
        },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });
  const compare = useMutation({
    mutationFn: () =>
      runSupervisedComparison({
        data: {
          id: missionId,
          expectedVersion: query.data?.mission.version ?? 0,
          expectedScope: query.data?.comparisonScope ?? "",
          allowModel: consentedScope === query.data?.comparisonScope,
        },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });
  const prepare = useMutation({
    mutationFn: () =>
      prepareSupervisedArtefact({
        data: { id: missionId, expectedVersion: query.data?.mission.version ?? 0 },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });
  const approvePrototype = useMutation({
    mutationFn: () =>
      approveSupervisedPrototype({
        data: { id: missionId, expectedVersion: query.data?.mission.version ?? 0 },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });
  const cancel = useMutation({
    mutationFn: () =>
      cancelSupervisedMission({
        data: { id: missionId, expectedVersion: query.data?.mission.version ?? 0 },
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
    },
    onError,
  });

  if (query.isLoading) {
    return (
      <CommandShell title="Supervised mission" subtitle="Loading the saved mission…">
        <p className="cc-muted">Loading brief, evidence and outputs.</p>
      </CommandShell>
    );
  }
  if (query.isError || !query.data) {
    return (
      <CommandShell title="Supervised mission" subtitle="The mission could not be loaded">
        <p className="cc-error">
          {query.error instanceof Error ? query.error.message : "Mission not found."}
        </p>
        <Link
          to="/command"
          hash="supervised-brief"
          className="cc-btn cc-btn-secondary mt-4 inline-flex"
        >
          Back to the workspace
        </Link>
      </CommandShell>
    );
  }

  const { mission, next, usageWarning } = query.data;
  const open = mission.stage !== "cancelled" && mission.stage !== "exported";

  return (
    <CommandShell
      title={mission.brief.question}
      hideHeading
      {...(mission.usageCeiling > 0
        ? {
            usage: {
              consumed: mission.usageConsumed,
              ceiling: mission.usageCeiling,
              scope: "mission" as const,
            },
          }
        : {})}
    >
      <div className="ps-theatre-page-meta mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/command" hash="supervised-brief" className="cc-muted text-sm">
          ← Studio foyer
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="cc-muted text-xs">{next.title}</span>
          {mission.projectId ? (
            <Link
              to="/command/product-memory/$projectId"
              params={{ projectId: mission.projectId }}
              className="cc-muted text-sm"
            >
              Product memory
            </Link>
          ) : null}
          {open ? (
            <button
              type="button"
              className="cc-btn cc-btn-ghost"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel mission
            </button>
          ) : null}
        </div>
      </div>

      <MissionTheatre
        mission={mission}
        actions={{
          open,
          next,
          usageWarning,
          error,
          research: query.data.research,
          modelConfigured: query.data.modelConfigured,
          comparisonScope: query.data.comparisonScope,
          consentedScope,
          setConsentedScope,
          approvePending: approvePlan.isPending,
          onApprove: () => approvePlan.mutate(),
          setResearchPending: setResearch.isPending,
          onSetResearch: (mode) => setResearch.mutate(mode),
          comparePending: compare.isPending,
          onCompare: () => compare.mutate(),
          preparePending: prepare.isPending,
          onPrepare: () => prepare.mutate(),
          prototypePending: approvePrototype.isPending,
          onApprovePrototype: () => approvePrototype.mutate(),
          exportSlot:
            next.id === "export" || mission.exportBody ? (
              <ExportButton
                recordVersion={mission.version}
                missionId={missionId}
                existingMd={mission.exportBody}
                existingPdf={mission.exportPdfBase64}
                onError={onError}
              />
            ) : null,
        }}
      />

      <details className="ps-legacy mt-4">
        <summary>Talk to DeliverX (optional · revise beside the mission)</summary>
        <ConversationPanel currentMissionId={missionId} />
      </details>

      <div
        id="mission-evidence"
        className="ps-record-anchor"
        data-active={recordSection === "mission-evidence"}
      >
        <EvidenceEditor
          recordVersion={mission.version}
          missionId={missionId}
          initial={mission.evidence}
          locked={!open}
          onDone={invalidate}
          onError={onError}
        />
        {mission.evidence.length ? (
          <section className="cc-panel" aria-label="Evidence">
            <h2 className="cc-panel-title">Evidence</h2>
            <ul className="mt-3 grid gap-2">
              {mission.evidence.map((item) => (
                <li key={item.id}>
                  <strong>
                    {item.id} · {item.classification}
                  </strong>
                  <p>{item.statement}</p>
                  {item.source ? <p className="cc-muted text-sm">Source: {item.source}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <BriefEditor
        recordVersion={mission.version}
        missionId={missionId}
        initial={mission.brief}
        locked={!open}
        onDone={invalidate}
        onError={onError}
      />
      <div
        id="mission-judgement"
        className="ps-record-anchor"
        data-active={recordSection === "mission-judgement"}
      >
        {!mission.proposal && (
          <RecordStepPending
            title="Options and decision"
            detail="No comparison is stored yet. Follow the next required action to add evidence and compare options."
          />
        )}
        {mission.proposal ? (
          <section className="cc-panel" aria-label="Alternatives">
            <h2 className="cc-panel-title">Alternatives</h2>
            <p className="cc-muted text-sm">
              Proposal version {mission.proposal.version}. Scope{" "}
              {mission.proposal.scopeHash.slice(0, 12)}.
            </p>
            <ul className="mt-3 grid gap-3">
              {mission.proposal.options.map((option) => (
                <li key={option.id} className="cc-panel">
                  <strong>{option.title}</strong>
                  <p className="cc-muted">{option.tradeoff}</p>
                  <p className="cc-muted text-sm">Basis: {option.basis}</p>
                </li>
              ))}
            </ul>
            {mission.proposal.generation.gaps.length ? (
              <p className="cc-muted mt-3 text-sm">
                Gaps: {mission.proposal.generation.gaps.join(" · ")}
              </p>
            ) : null}
            {mission.stage === "alternatives" ||
            (mission.stage === "decision" && !mission.artefact) ? (
              <DecisionForm
                recordVersion={mission.version}
                key={mission.proposal.scopeHash}
                missionId={missionId}
                action={mission.proposal.action}
                version={mission.proposal.version}
                scopeHash={mission.proposal.scopeHash}
                options={mission.proposal.options.map((option) => ({
                  id: option.id,
                  title: option.title,
                }))}
                onDone={invalidate}
                onError={onError}
              />
            ) : null}
          </section>
        ) : null}
        {mission.approval ? (
          <section className="cc-panel" id="decision" aria-label="Decision">
            <h2 className="cc-panel-title">Owner decision</h2>
            <p>
              {mission.approval.choice === "accept" ? "Accepted" : "More evidence requested"}:{" "}
              {mission.approval.optionId}
            </p>
            {mission.approval.note ? <p className="cc-muted">{mission.approval.note}</p> : null}
            <p className="cc-muted text-sm">
              Bound to {mission.approval.action} version {mission.approval.version}.
            </p>
          </section>
        ) : null}
        {mission.invalidatedApprovals.length ? (
          <section className="cc-panel" aria-label="Cleared approvals">
            <h2 className="cc-panel-title">Cleared approvals</h2>
            <ul className="mt-2 grid gap-2">
              {mission.invalidatedApprovals.map((approval) => (
                <li key={`${approval.scopeHash}-${approval.decidedAt}`}>
                  <p>{approval.reason}</p>
                  <p className="cc-muted text-sm">
                    Version {approval.version} · {approval.optionId}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      <div
        id="mission-delivery"
        className="ps-record-anchor"
        data-active={recordSection === "mission-delivery"}
      >
        {!mission.artefact && (
          <RecordStepPending
            title="Decision pack"
            detail="No decision pack is stored yet. Record the owner decision and measurement plan before preparing reviewable work."
          />
        )}
        {mission.artefact ? (
          <section className="cc-panel" aria-label="Decision pack">
            <h2 className="cc-panel-title">{mission.artefact.title}</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm">{mission.artefact.decisionBrief}</pre>
            <pre className="mt-3 whitespace-pre-wrap text-sm">
              {mission.artefact.experimentBrief}
            </pre>
          </section>
        ) : null}
        {mission.archivedPacks?.length ? (
          <section className="cc-panel" aria-label="Archived decision packs">
            <h2 className="cc-panel-title">Previous pack versions</h2>
            <p className="cc-muted text-sm">
              Earlier packs remain attached to this mission when a measurement plan changes.
            </p>
            <div className="mt-3 grid gap-3">
              {mission.archivedPacks.map((entry) => (
                <details key={`${entry.recordVersion}-${entry.archivedAt}`} className="cc-card">
                  <summary className="cursor-pointer font-medium">
                    Version {entry.recordVersion} · {entry.reason}
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap text-sm">{entry.pack.decisionBrief}</pre>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div
        id="mission-feedback"
        className="ps-record-anchor"
        data-active={recordSection === "mission-feedback"}
      >
        {((!mission.approval && !mission.origin) || mission.stage === "cancelled") && (
          <RecordStepPending
            title="Outcome review"
            detail={
              mission.stage === "cancelled"
                ? "This mission is cancelled. Its saved record is retained; no follow-up is started."
                : "Record a decision before planning what to measure. Later, supply an observed result and review it before proposing another mission."
            }
          />
        )}
        <SupervisedLearningLoop mission={mission} onDone={invalidate} onError={onError} />
      </div>
    </CommandShell>
  );
}

function EvidenceEditor({
  recordVersion,
  missionId,
  initial,
  locked,
  onDone,
  onError,
}: {
  recordVersion: number;
  missionId: string;
  initial: Array<{ statement: string; source: string; classification: string }>;
  locked: boolean;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const draft = useVersionedDraft(
    initial.length
      ? initial.map((item) => ({
          statement: item.statement,
          source: item.source,
          classification: item.classification,
        }))
      : [{ statement: "", source: "", classification: "supplied" }],
    recordVersion,
  );
  const items = draft.value;
  const setItems = draft.setValue;
  const save = useMutation({
    mutationFn: () =>
      saveSupervisedEvidence({
        data: { id: missionId, expectedVersion: draft.expectedVersion, items },
      }),
    onSuccess: async (result) => {
      draft.saved(result.mission.version);
      await onDone();
    },
    onError,
  });
  if (locked) return null;
  return (
    <section className="cc-panel" aria-label="Edit evidence">
      {draft.stale && (
        <div role="alert" className="cc-error">
          The saved record changed. Your edits are kept here.{" "}
          <button className="cc-btn cc-btn-secondary" onClick={draft.reset}>
            Discard these edits and load saved values
          </button>
        </div>
      )}
      <h2 className="cc-panel-title">Evidence</h2>
      <p className="cc-muted text-sm">
        Saving a different brief or evidence clears the current proposal and any approval of it.
      </p>
      <div className="mt-3 grid gap-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2">
            <label className="cc-label" htmlFor={`evidence-${index}`}>
              Statement {index + 1}
            </label>
            <textarea
              id={`evidence-${index}`}
              className="cc-input cc-textarea"
              rows={2}
              value={item.statement}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, statement: event.target.value } : row,
                  ),
                )
              }
            />
            <input
              className="cc-input"
              aria-label={`Source ${index + 1}`}
              placeholder="Source"
              value={item.source}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, source: event.target.value } : row,
                  ),
                )
              }
            />
            <select
              className="cc-input"
              aria-label={`Classification ${index + 1}`}
              value={item.classification}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, classification: event.target.value } : row,
                  ),
                )
              }
            >
              <option value="supplied">Supplied</option>
              <option value="assumption">Assumption</option>
              <option value="gap">Gap</option>
            </select>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={() =>
              setItems((current) => [
                ...current,
                { statement: "", source: "", classification: "gap" },
              ])
            }
          >
            Add evidence
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save evidence"}
          </button>
        </div>
      </div>
    </section>
  );
}

function BriefEditor({
  recordVersion,
  missionId,
  initial,
  locked,
  onDone,
  onError,
}: {
  recordVersion: number;
  missionId: string;
  initial: { question: string; audience: string; outcome: string; constraints: string };
  locked: boolean;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const draft = useVersionedDraft(initial, recordVersion);
  const brief = draft.value;
  const setBrief = draft.setValue;
  const save = useMutation({
    mutationFn: () =>
      reviseSupervisedBrief({
        data: { id: missionId, expectedVersion: draft.expectedVersion, brief },
      }),
    onSuccess: async (result) => {
      draft.saved(result.mission.version);
      await onDone();
    },
    onError,
  });
  if (locked) return null;
  return (
    <details className="cc-panel" aria-label="Revise case statement">
      <summary>
        <strong>Revise case statement</strong>
        <span className="cc-muted block text-sm font-normal">
          Prefer letting research fill gaps. Changing the case clears the current proposal.
        </span>
      </summary>
      {draft.stale && (
        <div role="alert" className="cc-error mt-3">
          The saved record changed. Your edits are kept here.{" "}
          <button className="cc-btn cc-btn-secondary" onClick={draft.reset}>
            Discard these edits and load saved values
          </button>
        </div>
      )}
      <div className="mt-3 grid gap-2">
        <textarea
          className="cc-input cc-textarea"
          aria-label="Business case"
          rows={2}
          value={brief.question}
          onChange={(event) => setBrief({ ...brief, question: event.target.value })}
        />
        <input
          className="cc-input"
          aria-label="Audience"
          value={brief.audience}
          onChange={(event) => setBrief({ ...brief, audience: event.target.value })}
        />
        <input
          className="cc-input"
          aria-label="Outcome"
          value={brief.outcome}
          onChange={(event) => setBrief({ ...brief, outcome: event.target.value })}
        />
        <input
          className="cc-input"
          aria-label="Constraints"
          value={brief.constraints}
          onChange={(event) => setBrief({ ...brief, constraints: event.target.value })}
        />
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save case changes"}
        </button>
      </div>
    </details>
  );
}

function DecisionForm({
  recordVersion,
  missionId,
  action,
  version,
  scopeHash,
  options,
  onDone,
  onError,
}: {
  recordVersion: number;
  missionId: string;
  action: "compare_options";
  version: number;
  scopeHash: string;
  options: Array<{ id: string; title: string }>;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const [optionId, setOptionId] = useState(options[0]?.id ?? "");
  const [choice, setChoice] = useState<DecisionChoice>("accept");
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: () =>
      decideSupervisedMission({
        data: {
          id: missionId,
          expectedVersion: recordVersion,
          action,
          version,
          scopeHash,
          optionId,
          choice,
          note,
        },
      }),
    onSuccess: onDone,
    onError,
  });
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        decide.mutate();
      }}
    >
      <label className="cc-label" htmlFor="decision-option">
        Option
      </label>
      <select
        id="decision-option"
        className="cc-input"
        value={optionId}
        onChange={(event) => setOptionId(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.title}
          </option>
        ))}
      </select>
      <label className="cc-label" htmlFor="decision-choice">
        Decision
      </label>
      <select
        id="decision-choice"
        className="cc-input"
        value={choice}
        onChange={(event) => setChoice(event.target.value as DecisionChoice)}
      >
        <option value="accept">Accept this option</option>
        <option value="request_more_evidence">Request more evidence</option>
      </select>
      <textarea
        className="cc-input cc-textarea"
        aria-label="Decision note"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button
        type="submit"
        className="cc-btn cc-btn-primary"
        disabled={decide.isPending || !optionId}
      >
        {decide.isPending ? "Recording…" : "Record decision"}
      </button>
    </form>
  );
}

function ExportButton({
  recordVersion,
  missionId,
  existingMd,
  existingPdf,
  onError,
}: {
  recordVersion: number;
  missionId: string;
  existingMd: string | null;
  existingPdf: string | null;
  onError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const names = decisionPackFilenames(missionId);
  const save = useMutation({
    mutationFn: () =>
      exportSupervisedMission({ data: { id: missionId, expectedVersion: recordVersion } }),
    onSuccess: async (result) => {
      downloadPack(result.mission.exportBody, result.mission.exportPdfBase64, names);
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
    },
    onError,
  });
  const zip = useMutation({
    mutationFn: () => exportSupervisedMissionZip({ data: { id: missionId } }),
    onSuccess: ({ files, filename }) => {
      const archive = createZip(files);
      const url = URL.createObjectURL(
        new Blob([archive.buffer as ArrayBuffer], { type: "application/zip" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError,
  });
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        className="cc-btn cc-btn-primary"
        disabled={save.isPending}
        onClick={() => {
          if (existingMd) downloadPack(existingMd, existingPdf, names);
          else save.mutate();
        }}
      >
        {save.isPending ? "Exporting…" : "Download decision pack (PDF + Markdown)"}
      </button>
      <button
        type="button"
        className="cc-btn cc-btn-secondary"
        disabled={zip.isPending || !existingMd}
        onClick={() => zip.mutate()}
      >
        {zip.isPending ? "Packaging…" : "Download full pack (.zip)"}
      </button>
      <p className="cc-muted text-xs basis-full">
        ZIP includes decision pack, evidence register, prototype HTML when built, and an honesty
        manifest. Linked source URLs are referenced only — not fetched into the archive.
      </p>
    </div>
  );
}

function downloadPack(
  markdown: string | null,
  pdfBase64: string | null,
  names: { md: string; pdf: string },
) {
  if (markdown) {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = names.md;
    link.click();
    URL.revokeObjectURL(url);
  }
  if (pdfBase64) {
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = names.pdf;
    link.click();
    URL.revokeObjectURL(url);
  }
}

function RecordStepPending({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="cc-panel ps-record-pending">
      <h2 className="cc-panel-title">{title}</h2>
      <p className="cc-muted">{detail}</p>
      <a className="cc-btn cc-btn-secondary mt-3 inline-flex" href="#mission-next-action">
        See the next required action
      </a>
    </section>
  );
}

