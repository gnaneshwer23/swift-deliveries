import { SupervisedBriefEditor } from "@/components/command/supervised-brief-editor";
import { useVersionedDraft } from "@/hooks/use-versioned-draft";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { CaseRoomPanel } from "@/components/command/case-room-panel";
import { CommerceDisclosurePanel } from "@/components/command/commerce-disclosure-panel";
import { LearnerLensPanel } from "@/components/command/learner-lens-panel";
import { MissionTheatre } from "@/components/command/mission-theatre";
import { QuietMissionBar } from "@/components/command/quiet-mission-bar";
import { HonestyPosturePanel } from "@/components/command/honesty-posture-panel";
import { PathArtefactsPanel } from "@/components/command/path-artefacts-panel";
import { ProjectRoomNav } from "@/components/command/project-room-nav";
import { MissionInspectionStrip } from "@/components/command/mission-inspection-strip";
import { InvestigationStageShell } from "@/components/command/investigation-stage-shell";
import { CaseRoom } from "@/components/command/case-room";
import { PlanReview } from "@/components/command/plan-review";
import { DecisionPanel } from "@/components/command/decision-panel";
import { NextStepPanel } from "@/components/command/next-step-panel";
import { MeetingNotesPanel } from "@/components/command/meeting-notes-panel";
import { BeginDeliveryPanel } from "@/components/command/begin-delivery-panel";
import { useDeliveryBuild } from "@/hooks/use-delivery-build";
import { InvestigationScopeReview } from "@/components/command/investigation-scope-review";
import { InvestigationTeamFormation } from "@/components/command/investigation-team-formation";
import { PmDiscussionScreen } from "@/components/command/pm-discussion-screen";
import { TeamActivityPanel } from "@/components/command/team-activity-panel";
import { SupervisedLearningLoop } from "@/components/command/supervised-learning-loop";
import { WatchtowerPanel } from "@/components/command/watchtower-panel";
import {
  approveSupervisedPlan,
  approveSupervisedPrototype,
  cancelSupervisedMission,
  decideSupervisedMission,
  exportSupervisedExecutivePack,
  exportSupervisedFullArchive,
  exportSupervisedMission,
  exportSupervisedMissionZip,
  getSupervisedMission,
  prepareSupervisedArtefact,
  runSupervisedComparison,
  saveSupervisedEvidence,
  setSupervisedResearchMode,
} from "@/lib/pilot-mission.functions";
import { decisionPackFilenames } from "@/lib/pilot-mission/decision-pack";
import { createZip } from "@/lib/programme/zip";
import { type ResearchMode } from "@/lib/pilot-mission/research-mode";
import { type DecisionChoice, type SupervisedMission } from "@/lib/pilot-mission/types";
import {
  buildContinuationPlanMarkdown,
  continuationPlanFilename,
} from "@/lib/pilot-mission/continuation-plan";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  deriveAgentRecommendation,
  normalizeDecisionChoice,
  researchTeamLines,
  type HumanNextPath,
} from "@/lib/pilot-mission/verdict";

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
    // While specialists work, refresh so new events reach the stage and Aria returns on her own.
    refetchInterval: (q) => {
      const m = q.state.data?.mission;
      const working =
        m && ((m.researchPassQueuedAt && !m.researchPassCompletedAt) || m.job.status === "leased");
      return working ? 5000 : false;
    },
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

  // The linked delivery build (after Begin delivery), read from the delivery engine.
  const build = useDeliveryBuild(query.data?.mission.delivery?.wfMissionId ?? null);

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
  const theatre = (
    <div id="pr-briefings">
      <QuietMissionBar
        mission={mission}
        downloadSlot={
          mission.artefact || mission.exportBody ? (
            <ExportButton
              recordVersion={mission.version}
              missionId={missionId}
              existingMd={mission.exportBody}
              existingPdf={mission.exportPdfBase64}
              onError={onError}
              compact
            />
          ) : null
        }
      />
      <MissionTheatre
        quiet
        hideInvestigationCanvas
        mission={mission}
        missionId={missionId}
        onDone={invalidate}
        onError={onError}
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
    </div>
  );

  return (
    <CommandShell
      title={mission.brief.question}
      hideHeading
      foyerMode
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
      <div className="ps-quiet-mission-page">
        <div className="ps-theatre-page-meta mb-2 flex flex-wrap items-center justify-between gap-3">
          <Link to="/command" className="cc-muted text-sm">
            ← Studio
          </Link>
          <div className="flex flex-wrap items-center gap-2">
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
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        <CaseRoom
          mission={mission}
          {...(build ? { build } : {})}
          panels={{
            plan: (
              <PlanReview
                mission={mission}
                onApprove={() => approvePlan.mutate()}
                approving={approvePlan.isPending}
                canApprove={open}
                error={error}
                editSlot={
                  <InvestigationScopeReview
                    mission={mission}
                    missionId={missionId}
                    missionOpen={open}
                    usageWarning={usageWarning}
                    research={query.data.research}
                    onDone={invalidate}
                    onError={onError}
                  />
                }
              />
            ),
            work: (
              <NextStepPanel
                mission={mission}
                actions={{
                  nextId: next.id,
                  compare: {
                    run: () => compare.mutate(),
                    pending: compare.isPending,
                    modelConfigured: query.data.modelConfigured,
                    consented: consentedScope === query.data.comparisonScope,
                    setConsented: (on) => setConsentedScope(on ? query.data.comparisonScope : null),
                  },
                  prepare: { run: () => prepare.mutate(), pending: prepare.isPending },
                  exportSlot: (
                    <ExportButton
                      recordVersion={mission.version}
                      missionId={missionId}
                      existingMd={mission.exportBody}
                      existingPdf={mission.exportPdfBase64}
                      onError={onError}
                    />
                  ),
                  error,
                  onDone: invalidate,
                  onError,
                }}
              />
            ),
            decide: (
              <DecisionPanel
                mission={mission}
                missionId={missionId}
                onDone={invalidate}
                onError={onError}
              />
            ),
            delivery: <BeginDeliveryPanel mission={mission} onDone={invalidate} />,
            meetings: <MeetingNotesPanel mission={mission} onDone={invalidate} />,
          }}
        />

        <details
          className="room-record"
          id="mission-record"
          // A deep link into the record (e.g. #mission-evidence) opens it.
          open={Boolean(recordSection) || undefined}
        >
          <summary>Open the full project record</summary>
          <MissionInspectionStrip mission={mission} missionId={missionId} />

          <InvestigationStageShell
            mission={mission}
            missionId={missionId}
            recordHash={recordSection ? `#${recordSection}` : ""}
            onDone={invalidate}
            onError={onError}
            scopeContext={{
              missionOpen: open,
              usageWarning,
              research: query.data.research,
            }}
            pathSlot={
              mission.proposal ? (
                <StepFourDiscussion
                  mission={mission}
                  missionId={missionId}
                  onDone={invalidate}
                  onError={onError}
                />
              ) : null
            }
            downloadsSlot={
              mission.artefact || mission.exportBody ? (
                <ExportButton
                  recordVersion={mission.version}
                  missionId={missionId}
                  existingMd={mission.exportBody}
                  existingPdf={mission.exportPdfBase64}
                  onError={onError}
                />
              ) : null
            }
            theatre={theatre}
          />

          <details className="ps-quiet-inspect" id="mission-inspect">
            <summary>Inspect full record</summary>

            <details className="ps-quiet-inspect mt-3" id="mission-team-activity">
              <summary>View team activity</summary>
              <TeamActivityPanel mission={mission} />
            </details>

            <ProjectRoomNav mission={mission} />

            <div
              id="pr-evidence"
              className="ps-record-anchor"
              data-active={recordSection === "mission-evidence" || recordSection === "pr-evidence"}
            >
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
                          {item.source ? (
                            <p className="cc-muted text-sm">Source: {item.source}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </div>
            <SupervisedBriefEditor
              recordVersion={mission.version}
              missionId={missionId}
              initial={mission.brief}
              locked={!open || Boolean(mission.team?.approvedAt)}
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
              {mission.team || (mission.activity?.length ?? 0) > 0 ? (
                <section className="cc-panel" aria-label="Research team" id="pr-team">
                  <h2 className="cc-panel-title">Research team</h2>
                  <p className="cc-muted text-sm">
                    Specialists assigned to investigate this idea. Activity is persisted task
                    events—not staged chat.
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {researchTeamLines(mission)
                      .slice(0, 12)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                  {(mission.activity?.length ?? 0) > 0 ? (
                    <ol className="mt-4 grid gap-1 text-sm cc-muted">
                      {[...(mission.activity ?? [])]
                        .slice(-8)
                        .reverse()
                        .map((event) => (
                          <li key={`${event.at}-${event.kind}-${event.summary.slice(0, 24)}`}>
                            {event.actor} · {event.kind}: {event.summary}
                          </li>
                        ))}
                    </ol>
                  ) : null}
                </section>
              ) : null}
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
                </section>
              ) : null}
              {mission.approval ? (
                <section className="cc-panel" id="decision" aria-label="Decision">
                  <h2 className="cc-panel-title">Recommendation and next path</h2>
                  <p>
                    {mission.approval.agentRecommendation
                      ? `Agent: ${AGENT_RECOMMENDATION_LABELS[mission.approval.agentRecommendation]}. `
                      : ""}
                    Human path:{" "}
                    {HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]}.
                    Option {mission.approval.optionId}
                    {mission.approval.disagreesWithRecommendation
                      ? " — path differs from recommendation (recommendation remains on the record)."
                      : ""}
                  </p>
                  {mission.approval.note ? (
                    <p className="cc-muted">{mission.approval.note}</p>
                  ) : null}
                  <p className="cc-muted text-sm">
                    Bound to {mission.approval.action} version {mission.approval.version}.
                  </p>
                </section>
              ) : null}
              {mission.continuationPlan ? (
                <section className="cc-panel" id="continuation-plan" aria-label="Continuation plan">
                  <h2 className="cc-panel-title">{mission.continuationPlan.title}</h2>
                  <p className="cc-muted text-sm">{mission.continuationPlan.summary}</p>
                  <p className="cc-muted mt-2 text-sm">
                    Continuation team for this path — distinct from the Act A research team. Size
                    follows the work.
                  </p>
                  {mission.continuationPlan.executionBlocked ? (
                    <p className="cc-error mt-2 text-sm" role="status">
                      Execution blocked: {mission.continuationPlan.executionBlockedReason}
                    </p>
                  ) : null}
                  <h3 className="mt-4 text-sm font-medium">Roles</h3>
                  <ul className="mt-2 grid gap-3 text-sm">
                    {mission.continuationPlan.roles.map((role) => (
                      <li key={`${role.capabilityId ?? "human"}-${role.label}`}>
                        <strong>{role.label}</strong>
                        {role.capabilityId ? (
                          <span className="cc-muted"> ({role.capabilityId})</span>
                        ) : null}
                        <p className="cc-muted">{role.responsibility}</p>
                        <p className="cc-muted text-xs">Why: {role.why}</p>
                      </li>
                    ))}
                  </ul>
                  <h3 className="mt-4 text-sm font-medium">Roadmap</h3>
                  <ol className="mt-2 grid gap-2 text-sm">
                    {mission.continuationPlan.roadmap.map((step) => (
                      <li key={step.id}>
                        <strong>{step.title}</strong> · {step.ownerLabel}
                        {step.blocked ? (
                          <span className="cc-error"> — blocked: {step.blockedReason}</span>
                        ) : null}
                        <p className="cc-muted">{step.detail}</p>
                      </li>
                    ))}
                  </ol>
                  <h3 className="mt-4 text-sm font-medium">Planned artefacts</h3>
                  <ul className="mt-2 grid gap-1 text-sm">
                    {mission.continuationPlan.plannedArtefacts.map((artefact) => (
                      <li key={artefact.type}>
                        {artefact.type} · {artefact.ownerLabel} — {artefact.note}
                      </li>
                    ))}
                  </ul>
                  {mission.continuationPlan.unresolvedRisks.length ? (
                    <>
                      <h3 className="mt-4 text-sm font-medium">Unresolved risks</h3>
                      <ul className="mt-2 grid gap-1 text-sm cc-muted">
                        {mission.continuationPlan.unresolvedRisks.map((risk) => (
                          <li key={risk.slice(0, 48)}>{risk}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary mt-4"
                    onClick={() => {
                      const md = buildContinuationPlanMarkdown(mission, mission.continuationPlan!);
                      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = continuationPlanFilename(mission.id);
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download continuation plan
                  </button>
                </section>
              ) : null}
              {mission.caseRoom ? (
                <div id="pr-flow">
                  <div id="pr-artefacts">
                    <CaseRoomPanel
                      mission={mission}
                      recordVersion={mission.version}
                      missionId={missionId}
                      onDone={invalidate}
                      onError={onError}
                    />
                  </div>
                </div>
              ) : (
                <div id="pr-flow" />
              )}
              <div id="pr-decisions">
                <PathArtefactsPanel mission={mission} />
              </div>
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
              id="pr-build"
              className="ps-record-anchor"
              data-active={recordSection === "mission-delivery" || recordSection === "pr-build"}
            >
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
                    <pre className="mt-3 whitespace-pre-wrap text-sm">
                      {mission.artefact.decisionBrief}
                    </pre>
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
                        <details
                          key={`${entry.recordVersion}-${entry.archivedAt}`}
                          className="cc-card"
                        >
                          <summary className="cursor-pointer font-medium">
                            Version {entry.recordVersion} · {entry.reason}
                          </summary>
                          <pre className="mt-3 whitespace-pre-wrap text-sm">
                            {entry.pack.decisionBrief}
                          </pre>
                        </details>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
            <div
              id="pr-outcomes"
              className="ps-record-anchor"
              data-active={recordSection === "mission-feedback" || recordSection === "pr-outcomes"}
            >
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
                <CommerceDisclosurePanel mission={mission} />
                <LearnerLensPanel mission={mission} />
                <SupervisedLearningLoop mission={mission} onDone={invalidate} onError={onError} />
                <HonestyPosturePanel mission={mission} />
              </div>
            </div>
            <WatchtowerPanel
              mission={mission}
              recordVersion={mission.version}
              missionId={missionId}
              onDone={invalidate}
              onError={onError}
            />
          </details>
        </details>
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

type PathChoice = {
  id: HumanNextPath;
  title: string;
  detail: string;
};

const PATH_CHOICES: PathChoice[] = [
  {
    id: "authorise_bounded_test",
    title: "Approve this direction",
    detail: "Save the recommendation and prepare the next bounded plan.",
  },
  {
    id: "authorise_gather_evidence",
    title: "Request more research",
    detail: "Investigate named unknowns before committing.",
  },
  {
    id: "authorise_revise",
    title: "Make changes",
    detail: "Reframe the audience, problem, or first-version scope.",
  },
  { id: "close_case", title: "Close this idea", detail: "Keep the findings and stop this case." },
  {
    id: "founder_requested_continuation",
    title: "Continue with open risks",
    detail: "Proceed on your chosen path while keeping disagreement visible.",
  },
];

function StepFourDiscussion({
  mission,
  missionId,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const proposal = mission.proposal;
  if (!proposal) return null;

  return (
    <PmDiscussionScreen
      mission={mission}
      missionId={missionId}
      onDone={onDone}
      onError={onError}
      advancedDecisionSlot={
        <DecisionForm
          recordVersion={mission.version}
          key={proposal.scopeHash}
          missionId={missionId}
          mission={mission}
          action={proposal.action}
          version={proposal.version}
          scopeHash={proposal.scopeHash}
          options={proposal.options.map((option) => ({
            id: option.id,
            title: option.title,
            tradeoff: option.tradeoff,
          }))}
          onDone={onDone}
          onError={onError}
        />
      }
    />
  );
}

function DecisionForm({
  recordVersion,
  missionId,
  mission,
  action,
  version,
  scopeHash,
  options,
  onDone,
  onError,
}: {
  recordVersion: number;
  missionId: string;
  mission: SupervisedMission;
  action: "compare_options";
  version: number;
  scopeHash: string;
  options: Array<{ id: string; title: string; tradeoff: string }>;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const draft = deriveAgentRecommendation(mission);
  const [optionId, setOptionId] = useState("");
  const [choice, setChoice] = useState<HumanNextPath | null>(null);
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
          choice: choice as DecisionChoice,
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
      <div className="cc-panel" aria-label="Agent recommendation">
        <p className="text-sm font-medium">
          Agent recommendation: {AGENT_RECOMMENDATION_LABELS[draft.recommendation]}
        </p>
        <p className="cc-muted text-sm">{draft.rationale}</p>
        {draft.executionLimited ? (
          <p className="cc-muted text-sm">
            Execution limitation — not an evidence-based market pause.
          </p>
        ) : null}
      </div>
      <fieldset className="ps-step-four-choice-group">
        <legend>Choose the option you want to discuss</legend>
        <div className="ps-step-four-option-grid">
          {options.map((option) => (
            <label
              className="ps-step-four-option"
              data-selected={optionId === option.id ? "true" : undefined}
              key={option.id}
            >
              <input
                type="radio"
                name="decision-option"
                value={option.id}
                checked={optionId === option.id}
                onChange={() => setOptionId(option.id)}
              />
              <span>
                <strong>{option.title}</strong>
                <small>{option.tradeoff || "Trade-offs are not recorded for this option."}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="ps-step-four-choice-group">
        <legend>Choose your next step</legend>
        <div className="ps-step-four-path-grid">
          {PATH_CHOICES.map((path) => (
            <label
              className="ps-step-four-option"
              data-selected={choice === path.id ? "true" : undefined}
              key={path.id}
            >
              <input
                type="radio"
                name="decision-path"
                value={path.id}
                checked={choice === path.id}
                onChange={() => setChoice(path.id)}
              />
              <span>
                <strong>{path.title}</strong>
                <small>{path.detail}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="cc-label" htmlFor="decision-note">
        What should the PM take into account?
      </label>
      <textarea
        id="decision-note"
        className="cc-input cc-textarea"
        rows={3}
        maxLength={2000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a question, requested change, or reason for your choice. This note is saved with your decision."
      />
      <p className="cc-muted text-xs">
        Nothing proceeds until you confirm. Your choice and note are saved against option version{" "}
        {version} and its evidence scope.
      </p>
      <button
        type="submit"
        className="cc-btn cc-btn-primary"
        disabled={decide.isPending || !optionId || !choice}
      >
        {decide.isPending ? "Saving decision…" : "Save my decision"}
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
  compact = false,
}: {
  recordVersion: number;
  missionId: string;
  existingMd: string | null;
  existingPdf: string | null;
  onError: (error: unknown) => void;
  compact?: boolean;
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
  const downloadZip = (files: Array<{ path: string; content: string }>, filename: string) => {
    const archive = createZip(files);
    const url = URL.createObjectURL(
      new Blob([archive.buffer as ArrayBuffer], { type: "application/zip" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const zip = useMutation({
    mutationFn: () => exportSupervisedMissionZip({ data: { id: missionId } }),
    onSuccess: ({ files, filename }) => downloadZip(files, filename),
    onError,
  });
  const executive = useMutation({
    mutationFn: () => exportSupervisedExecutivePack({ data: { id: missionId } }),
    onSuccess: ({ markdown, filename }) => {
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError,
  });
  const fullArchive = useMutation({
    mutationFn: () => exportSupervisedFullArchive({ data: { id: missionId } }),
    onSuccess: ({ files, filename }) => downloadZip(files, filename),
    onError,
  });
  return (
    <div className={`ps-quiet-downloads${compact ? " ps-quiet-downloads-compact" : ""}`}>
      <button
        type="button"
        className="cc-btn cc-btn-primary"
        disabled={save.isPending}
        onClick={() => {
          if (existingMd) downloadPack(existingMd, existingPdf, names);
          else save.mutate();
        }}
      >
        {save.isPending
          ? "Exporting…"
          : compact
            ? "Decision pack"
            : "Download decision pack (PDF + Markdown)"}
      </button>
      <button
        type="button"
        className="cc-btn cc-btn-secondary"
        disabled={executive.isPending}
        onClick={() => executive.mutate()}
      >
        {executive.isPending ? "Preparing…" : "Executive + roadmap"}
      </button>
      <button
        type="button"
        className="cc-btn cc-btn-secondary"
        disabled={fullArchive.isPending || !existingMd}
        onClick={() => fullArchive.mutate()}
      >
        {fullArchive.isPending ? "Packaging…" : "Full archive"}
      </button>
      {!compact ? (
        <button
          type="button"
          className="cc-btn cc-btn-secondary"
          disabled={zip.isPending || !existingMd}
          onClick={() => zip.mutate()}
        >
          {zip.isPending ? "Packaging…" : "Decision ZIP"}
        </button>
      ) : null}
      {!compact ? (
        <p className="cc-muted text-xs basis-full">
          Downloads include a decision roadmap (human gates, agent tasks, recommendation, path,
          artefacts) with honest simulated vs model labels. Linked URLs and secrets are never
          bundled.
        </p>
      ) : (
        <p className="cc-muted text-xs basis-full mb-0">
          Roadmap and evidence trail are in the pack — not on this screen.
        </p>
      )}
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
