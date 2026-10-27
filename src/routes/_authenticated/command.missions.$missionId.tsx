import { createFileRoute, Link } from "@tanstack/react-router";
import { EVALUATION_LABELS, roleEvaluation } from "@/lib/workforce/registry/evaluations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { MissionActivity } from "@/components/command/mission-activity";
import { MissionEvidence } from "@/components/command/mission-evidence";
import { missionBundleQuery } from "@/lib/workforce-queries";
import {
  answerClarifications,
  approveExternalActions,
  approveMissionPlan,
  cancelMission,
  decideStageGate,
  markArtefactHumanReviewed,
  pauseMission,
  rejectMissionPlan,
  resumeMission,
  reviseMissionScope,
  runMissionStep,
} from "@/lib/workforce.functions";
import {
  EVIDENCE_LABEL_DISPLAY,
  INTENT_LABELS,
  LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
  PERMISSION_LABELS,
  QUALITY_LABEL_DISPLAY,
  STATUS_LABELS,
  TERMINAL_MISSION_STATUSES,
  type LifecycleStage,
  type PermissionLevel,
  type QualityLabel,
  type WfArtefact,
  type WfMissionTask,
} from "@/lib/workforce/types";
import { GENERATION_SOURCE_PREFIX } from "@/lib/workforce/stage-artefacts";
import { CheckCircle2, Edit3, History, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Mission — Command Centre — DeliverX" },
      {
        name: "description",
        content: "Clarify, approve, revise, run, and review a supervised AI mission.",
      },
    ],
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(missionBundleQuery(params.missionId));
  },
  component: MissionDetail,
});

function MissionDetail() {
  const { missionId } = Route.useParams();
  const query = useQuery(missionBundleQuery(missionId));
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [approveExternal, setApproveExternal] = useState(false);
  const [selectedArtefactId, setSelectedArtefactId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [revisedText, setRevisedText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [runNote, setRunNote] = useState<string | null>(null);
  const [gateNote, setGateNote] = useState("");
  const [activityKey, setActivityKey] = useState(0);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["command", "mission", missionId] });
    await queryClient.invalidateQueries({ queryKey: ["command", "bootstrap"] });
  };

  const clarify = useMutation({
    mutationFn: () => answerClarifications({ data: { missionId, answers } }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Clarification failed"),
  });

  const revise = useMutation({
    mutationFn: () =>
      reviseMissionScope({
        data: { missionId, requestText: revisedText.trim() },
      }),
    onSuccess: async () => {
      setActionError(null);
      setIsEditingScope(false);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Scope revision failed"),
  });

  // Approvals name the exact plan version shown, so a plan changed elsewhere is never approved blind.
  const shownPlan = () => {
    const plan = query.data?.plan;
    if (!plan) throw new Error("This mission has no plan to approve.");
    return { planVersion: plan.version, planHash: plan.planHash };
  };

  const approve = useMutation({
    mutationFn: () =>
      approveMissionPlan({
        data: { missionId, ...shownPlan(), approveExternalActions: approveExternal },
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Approval failed"),
  });

  const rejectPlan = useMutation({
    mutationFn: () =>
      rejectMissionPlan({
        data: {
          missionId,
          note: rejectReason.trim() || "Plan rejected by operator for scope revision",
        },
      }),
    onSuccess: async () => {
      setActionError(null);
      setShowRejectBox(false);
      setRejectReason("");
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Plan rejection failed"),
  });

  const approveExt = useMutation({
    mutationFn: () => approveExternalActions({ data: { missionId, ...shownPlan() } }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "External approval failed"),
  });

  const step = useMutation({
    mutationFn: () => runMissionStep({ data: { missionId } }),
    onSuccess: async (result) => {
      setActionError(null);
      setRunNote(result.note ?? null);
      await invalidate();
    },
    onError: (e) => {
      setActionError(e instanceof Error ? e.message : "Execution failed");
    },
  });

  const markReviewed = useMutation({
    mutationFn: (artefactId: string) =>
      markArtefactHumanReviewed({
        data: { missionId, artefactId },
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Human review sign-off failed"),
  });

  const cancel = useMutation({
    mutationFn: () => cancelMission({ data: { missionId } }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Cancel failed"),
  });

  const pauseOrResume = useMutation({
    mutationFn: (paused: boolean) =>
      paused ? resumeMission({ data: { missionId } }) : pauseMission({ data: { missionId } }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Pause or resume failed"),
  });

  const decideGate = useMutation({
    mutationFn: (input: { taskId: string; decision: "approve" | "reject" }) =>
      decideStageGate({
        data: {
          missionId,
          taskId: input.taskId,
          decision: input.decision,
          note: gateNote.trim() || undefined,
        },
      }),
    onSuccess: async () => {
      setGateNote("");
      setActionError(null);
      setRunNote(null);
      await invalidate();
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Gate decision failed"),
  });

  const data = query.data;
  const selectedArtefact = useMemo(() => {
    if (!data?.artefacts.length) return null;
    const id = selectedArtefactId ?? data.artefacts[data.artefacts.length - 1]?.id;
    return data.artefacts.find((a) => a.id === id) ?? data.artefacts[0] ?? null;
  }, [data, selectedArtefactId]);

  if (query.isLoading) {
    return (
      <CommandShell title="Mission" subtitle="Loading…">
        <p className="cc-muted">Fetching plan, tasks, and artefacts…</p>
      </CommandShell>
    );
  }

  if (query.isError || !data) {
    return (
      <CommandShell title="Mission" subtitle="Unavailable">
        <div className="cc-panel">
          <p className="cc-error">
            {query.error instanceof Error ? query.error.message : "Mission not found"}
          </p>
          <Link to="/command" className="cc-btn cc-btn-secondary mt-4 inline-flex">
            Back to Command Centre
          </Link>
        </div>
      </CommandShell>
    );
  }

  const { mission, plan, tasks, artefacts, approvals, workspace, auditEvents = [] } = data;
  const pendingQuestions = plan?.clarificationQuestions ?? [];
  const ladder: PermissionLevel[] = ["plan", "create", "execute_internally", "act_externally"];
  const canEditScope = [
    "draft",
    "needs_clarification",
    "planned",
    "awaiting_approval",
    "blocked",
  ].includes(mission.status);

  const lifecycleStages = [
    { id: "intake", label: "Mission", desc: INTENT_LABELS[mission.intent] },
    {
      id: "clarify",
      label: "Clarify",
      desc: mission.status === "needs_clarification" ? "Action required" : "Resolved",
    },
    { id: "plan", label: "Plan", desc: plan ? `${tasks.length} tasks` : "Drafting" },
    {
      id: "approve",
      label: "Approve",
      desc:
        mission.status === "awaiting_approval" || mission.status === "planned"
          ? "Human gate"
          : approvals.some((a) => a.kind === "plan" && a.status === "approved")
            ? "Approved"
            : approvals.some((a) => a.kind === "plan" && a.status === "rejected")
              ? "Rejected"
              : "Pending",
    },
    {
      id: "execute",
      label: "Execute",
      desc: `${tasks.filter((t) => t.status === "completed").length}/${tasks.length} complete`,
    },
    {
      id: "deliver",
      label: "Deliver",
      desc: mission.deliveryReport ? "Report ready" : `${artefacts.length} artefacts`,
    },
  ] as const;

  const activeStageIndex =
    mission.status === "draft"
      ? 0
      : mission.status === "needs_clarification"
        ? 1
        : mission.status === "planned" || mission.status === "awaiting_approval"
          ? 3
          : mission.status === "queued" ||
              mission.status === "running" ||
              mission.status === "blocked" ||
              mission.status === "paused"
            ? 4
            : 5;

  return (
    <CommandShell
      title={mission.title}
      subtitle={`${INTENT_LABELS[mission.intent]} · ${STATUS_LABELS[mission.status]} · ${workspace.usageConsumed}/${workspace.usageCeiling} workspace credits`}
      usage={{
        consumed: workspace.usageConsumed,
        ceiling: workspace.usageCeiling,
      }}
    >
      {/* 6-Stage Supervised Mission Lifecycle Stepper */}
      <nav className="cc-mission-stepper" aria-label="Mission lifecycle progress">
        {lifecycleStages.map((stage, idx) => {
          const state =
            idx < activeStageIndex ? "done" : idx === activeStageIndex ? "active" : "upcoming";
          return (
            <div key={stage.id} className={`cc-mission-step is-${state}`}>
              <span className="cc-mission-step-num">{idx + 1}</span>
              <div>
                <strong>{stage.label}</strong>
                <small>{stage.desc}</small>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="cc-mission-layout">
        <div className="cc-mission-main">
          {/* Request + Scope Revision Panel */}
          <section className="cc-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="cc-kicker">Mission Brief · {INTENT_LABELS[mission.intent]}</p>
                {!isEditingScope ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {mission.requestText}
                  </p>
                ) : (
                  <div className="mt-2">
                    <textarea
                      className="cc-input cc-textarea"
                      rows={3}
                      value={revisedText}
                      onChange={(e) => setRevisedText(e.target.value)}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="cc-btn cc-btn-primary"
                        disabled={revise.isPending || revisedText.trim().length < 3}
                        onClick={() => revise.mutate()}
                      >
                        {revise.isPending ? "Re-planning…" : "Save scope & regenerate plan"}
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn-ghost"
                        onClick={() => setIsEditingScope(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEditScope && !isEditingScope ? (
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary text-xs"
                    onClick={() => {
                      setRevisedText(mission.requestText);
                      setIsEditingScope(true);
                    }}
                  >
                    <Edit3 className="size-3.5" />
                    Revise scope
                  </button>
                ) : null}
                <span className={`cc-status cc-status-${mission.status}`}>
                  {STATUS_LABELS[mission.status]}
                </span>
              </div>
            </div>
          </section>

          {/* 1. Clarification Stage */}
          {mission.status === "needs_clarification" ? (
            <section className="cc-panel cc-panel-active-gate">
              <h2 className="cc-panel-title">Clarification needed before planning</h2>
              <p className="cc-muted mb-4">
                Answer the required questions (or click <strong>Revise scope</strong> above) so the
                planner can draft a concrete task graph.
              </p>
              {pendingQuestions.map((q) => (
                <div key={q.id} className="mb-3">
                  <label className="cc-label" htmlFor={q.id}>
                    {q.prompt}
                    {q.required ? " *" : ""}
                  </label>
                  <input
                    id={q.id}
                    className="cc-input"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                </div>
              ))}
              <button
                type="button"
                className="cc-btn cc-btn-primary mt-2"
                disabled={clarify.isPending}
                onClick={() => clarify.mutate()}
              >
                {clarify.isPending ? "Updating plan…" : "Submit answers & generate plan →"}
              </button>
            </section>
          ) : null}

          {/* 2. Plan & Mandatory Human Approval Gate */}
          {plan && mission.status !== "needs_clarification" ? (
            <section
              className={`cc-panel${
                mission.status === "awaiting_approval" || mission.status === "planned"
                  ? " cc-panel-active-gate"
                  : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="cc-panel-title mb-0">Proposed Plan &amp; Capability Assignment</h2>
                <span className="cc-chip">
                  Est. {plan.estimatedUsage} credits · {PERMISSION_LABELS[plan.requiredPermission]}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{plan.summary}</p>
              <div className="cc-plan-meta mt-4">
                <div>
                  <span className="cc-muted">Estimated usage</span>
                  <strong>{plan.estimatedUsage} credits</strong>
                </div>
                <div>
                  <span className="cc-muted">Required permission</span>
                  <strong>{PERMISSION_LABELS[plan.requiredPermission]}</strong>
                </div>
                <div>
                  <span className="cc-muted">External actions</span>
                  <strong>{plan.includesExternalActions ? "Included (gated)" : "None"}</strong>
                </div>
              </div>

              {plan.assignedCapabilities.length > 0 ? (
                <>
                  <h3 className="cc-subhead">Assigned Available capabilities</h3>
                  <ul className="cc-cap-assign-list">
                    {plan.assignedCapabilities.map((c) => (
                      <li key={c.capability_id}>
                        <code>{c.capability_id}</code>
                        <span>
                          {c.name}
                          <small className="cc-muted"> — {c.role_in_plan}</small>
                        </span>
                        <span className="cc-chip cc-chip-available">
                          Available · {EVALUATION_LABELS[roleEvaluation(c.capability_id).status]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {plan.capabilityLimitations.length > 0 ? (
                <div className="cc-limitation mt-4">
                  <h3 className="cc-subhead mt-0">Capability limitations</h3>
                  {plan.capabilityLimitations.map((lim) => (
                    <div key={lim.code + (lim.requested_department ?? lim.message.slice(0, 24))}>
                      <p className="text-sm leading-relaxed">{lim.message}</p>
                      {lim.alternative ? (
                        <p className="cc-muted mt-1 text-xs">{lim.alternative.summary}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <h3 className="cc-subhead">Acceptance criteria</h3>
              <ul className="cc-bullets">
                {plan.acceptanceCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>

              {mission.status === "awaiting_approval" || mission.status === "planned" ? (
                <div className="cc-approval-gate-box mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800 mb-2">
                    <ShieldCheck className="size-4" />
                    Mandatory Human Approval Gate
                  </div>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={approveExternal}
                      onChange={(e) => setApproveExternal(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Also approve <strong>Act externally</strong> for this mission
                      {plan.includesExternalActions
                        ? " (required for email/deploy/share tasks)"
                        : " (optional — none planned)"}
                      .
                    </span>
                  </label>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="cc-btn cc-btn-primary"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate()}
                    >
                      {approve.isPending ? "Approving…" : "Approve plan & queue execution →"}
                    </button>
                    <button
                      type="button"
                      className="cc-btn cc-btn-secondary"
                      onClick={() => {
                        setRevisedText(mission.requestText);
                        setIsEditingScope(true);
                      }}
                    >
                      <Edit3 className="size-3.5" />
                      Revise scope
                    </button>
                    <button
                      type="button"
                      className="cc-btn cc-btn-ghost text-red-700"
                      onClick={() => setShowRejectBox((prev) => !prev)}
                    >
                      <XCircle className="size-3.5" />
                      Reject plan
                    </button>
                  </div>

                  {showRejectBox ? (
                    <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--x-border)" }}>
                      <label className="cc-label" htmlFor="reject-reason">
                        Rejection reason (recorded in `wf_approvals` &amp; `wf_audit_events`)
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          id="reject-reason"
                          className="cc-input"
                          placeholder="e.g. Scope too broad — restrict to internal prototype only"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button
                          type="button"
                          className="cc-btn cc-btn-secondary text-red-700"
                          disabled={rejectPlan.isPending}
                          onClick={() => rejectPlan.mutate()}
                        >
                          {rejectPlan.isPending ? "Rejecting…" : "Confirm rejection"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <MissionActivity
            missionId={missionId}
            active={mission.status === "queued" || mission.status === "running"}
            tasks={tasks}
            onProgress={() =>
              void queryClient.invalidateQueries({ queryKey: ["command", "mission", missionId] })
            }
            refreshKey={activityKey}
          />

          <MissionEvidence
            missionId={missionId}
            editable={!TERMINAL_MISSION_STATUSES.includes(mission.status)}
            onChanged={() => setActivityKey((k) => k + 1)}
          />
          <p className="text-sm -mt-2 mb-4">
            <Link
              to="/command/product-memory/$projectId"
              params={{ projectId: mission.projectId }}
              className="underline"
            >
              What this product has learned across missions
            </Link>
          </p>

          {/* 3. Task Graph & Step Execution */}
          <section className="cc-panel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="cc-panel-title mb-0">Task graph ({tasks.length})</h2>
              <div className="flex flex-wrap gap-2">
                {(mission.status === "queued" ||
                  mission.status === "running" ||
                  mission.status === "blocked") && (
                  <button
                    type="button"
                    className="cc-btn cc-btn-primary"
                    disabled={step.isPending}
                    onClick={() => step.mutate()}
                  >
                    {step.isPending ? "Running…" : "Run a step now"}
                  </button>
                )}
                {(mission.status === "blocked" || mission.status === "queued") &&
                !mission.externalActionsApproved &&
                tasks.some((t) => t.isExternal && t.status === "blocked") ? (
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary"
                    disabled={approveExt.isPending}
                    onClick={() => approveExt.mutate()}
                  >
                    Approve Act externally
                  </button>
                ) : null}
                {["queued", "running", "blocked", "paused"].includes(mission.status) ? (
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary"
                    disabled={pauseOrResume.isPending}
                    onClick={() => pauseOrResume.mutate(mission.status === "paused")}
                  >
                    {mission.status === "paused" ? "Resume mission" : "Pause mission"}
                  </button>
                ) : null}
                {!["completed", "partially_completed", "cancelled", "failed"].includes(
                  mission.status,
                ) ? (
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
            {!tasks.length ? (
              <p className="cc-muted mt-4">Tasks appear after clarifications are complete.</p>
            ) : (
              <>
                {mission.intent === "build" ? <StageTrack tasks={tasks} /> : null}
                {runNote ? <p className="cc-muted mt-3 text-sm">{runNote}</p> : null}
                <ol className="cc-task-list mt-4">
                  {tasks.map((t) => (
                    <li key={t.id} className={`cc-task cc-task-${t.status}`}>
                      <div className="cc-task-head">
                        <strong>
                          {t.sortOrder + 1}. {t.title}
                        </strong>
                        <span>
                          {t.gate && t.status === "blocked" ? "awaiting your decision" : t.status}
                        </span>
                      </div>
                      {t.stage || t.dependsOn.length ? (
                        <p className="cc-task-meta">
                          {t.stage ? LIFECYCLE_STAGE_LABELS[t.stage] : ""}
                          {t.dependsOn.length
                            ? `${t.stage ? " · " : ""}after ${t.dependsOn
                                .map((k) => tasks.find((x) => x.key === k)?.title ?? k)
                                .join(", ")}`
                            : ""}
                        </p>
                      ) : null}
                      {t.gate && t.status === "blocked" ? (
                        <div className="cc-gate-box">
                          <p className="text-sm">
                            Review the upstream artefacts, then approve to let the workforce
                            continue or reject to stop downstream stages. Approving marks those
                            artefacts Human-reviewed.
                          </p>
                          <label className="cc-label mt-2" htmlFor={`gate-note-${t.id}`}>
                            Decision note (optional, recorded in the audit trail)
                          </label>
                          <input
                            id={`gate-note-${t.id}`}
                            className="cc-input"
                            value={gateNote}
                            onChange={(e) => setGateNote(e.target.value)}
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="cc-btn cc-btn-primary"
                              disabled={decideGate.isPending || mission.status === "paused"}
                              onClick={() =>
                                decideGate.mutate({ taskId: t.id, decision: "approve" })
                              }
                            >
                              <CheckCircle2 className="size-4" /> Approve &amp; continue
                            </button>
                            <button
                              type="button"
                              className="cc-btn cc-btn-ghost"
                              disabled={decideGate.isPending || mission.status === "paused"}
                              onClick={() =>
                                decideGate.mutate({ taskId: t.id, decision: "reject" })
                              }
                            >
                              <XCircle className="size-4" /> Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <p className="cc-muted">{t.description}</p>
                      <p className="cc-task-meta">
                        {PERMISSION_LABELS[t.permissionRequired]}
                        {t.isExternal ? " · external" : ""} · est. {t.estimatedUsage}
                        {t.actualUsage ? ` · used ${t.actualUsage}` : ""}
                        {t.capabilityIds.length ? ` · ${t.capabilityIds.join(", ")}` : ""}
                      </p>
                      <p className="text-xs mt-1">
                        <em>Acceptance:</em> {t.acceptanceCriteria}
                      </p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>

          {/* 4. Delivery Report */}
          {mission.deliveryReport ? (
            <section className="cc-panel cc-panel-active-gate">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h2 className="cc-panel-title mb-0">Delivery Report</h2>
                <span className="cc-chip">Spent: {mission.deliveryReport.usageSpent} credits</span>
              </div>
              <h3 className="text-base font-semibold">{mission.deliveryReport.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed">{mission.deliveryReport.summary}</p>
              <h3 className="cc-subhead">Outcomes</h3>
              <ul className="cc-bullets">
                {mission.deliveryReport.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              {mission.deliveryReport.openRisks.length > 0 ? (
                <>
                  <h3 className="cc-subhead">Limitations &amp; open risks</h3>
                  <ul className="cc-bullets">
                    {mission.deliveryReport.openRisks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <h3 className="cc-subhead">Discrete quality labels</h3>
              <div className="flex flex-wrap gap-2">
                {mission.deliveryReport.qualitySummary.map((q) => (
                  <span key={q} className="cc-chip">
                    {QUALITY_LABEL_DISPLAY[q as QualityLabel] ?? q}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {actionError ? <p className="cc-error">{actionError}</p> : null}
        </div>

        <aside className="cc-mission-side">
          {/* Artefacts & Operator Sign-off */}
          <section className="cc-panel">
            <div className="flex items-center justify-between gap-2">
              <h2 id="mission-outputs" className="cc-panel-title mb-0">
                Artefacts ({artefacts.length})
              </h2>
            </div>
            {!artefacts.length ? (
              <p className="cc-muted mt-2">Artefacts appear as tasks complete.</p>
            ) : (
              <ul className="cc-artefact-list mt-3">
                {artefacts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={selectedArtefact?.id === a.id ? "active" : ""}
                      onClick={() => setSelectedArtefactId(a.id)}
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedArtefact ? (
              <div className="cc-artefact-view mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap gap-1.5">
                    <GenerationBadge artefact={selectedArtefact} />
                    {selectedArtefact.qualityLabels.map((q) => (
                      <span key={q} className="cc-chip">
                        {QUALITY_LABEL_DISPLAY[q]}
                      </span>
                    ))}
                  </div>
                  {!selectedArtefact.qualityLabels.includes("human_reviewed") ? (
                    <button
                      type="button"
                      className="cc-btn cc-btn-secondary text-xs py-1 px-2.5"
                      disabled={markReviewed.isPending}
                      onClick={() => markReviewed.mutate(selectedArtefact.id)}
                    >
                      <CheckCircle2 className="size-3.5 text-emerald-700" />
                      {markReviewed.isPending ? "Recording…" : "Mark Human-reviewed"}
                    </button>
                  ) : null}
                </div>
                {selectedArtefact.evidenceItems.length ? (
                  <ul className="cc-evidence mb-3">
                    {selectedArtefact.evidenceItems.map((e, i) => (
                      <li key={`${e.classification}-${i}`}>
                        <strong>{EVIDENCE_LABEL_DISPLAY[e.classification]}</strong>
                        <span>{e.statement}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {selectedArtefact.contentFormat === "html" ? (
                  <iframe
                    title={selectedArtefact.title}
                    className="cc-proto-frame"
                    srcDoc={selectedArtefact.content}
                    sandbox="allow-scripts"
                  />
                ) : (
                  <pre className="cc-artefact-pre">{selectedArtefact.content}</pre>
                )}
              </div>
            ) : null}
          </section>

          {/* Permission Ladder */}
          <section className="cc-panel">
            <h2 className="cc-panel-title">Permission ladder</h2>
            <ul className="cc-ladder">
              {ladder.map((level, idx) => {
                const active =
                  ladder.indexOf(mission.permissionCeiling) >= idx ||
                  (mission.externalActionsApproved && level === "act_externally");
                return (
                  <li key={level} className={active ? "active" : ""}>
                    <span>{idx + 1}</span>
                    <div>
                      <strong>{PERMISSION_LABELS[level]}</strong>
                      {level === "act_externally" ? (
                        <small>
                          {mission.externalActionsApproved
                            ? "Explicitly approved"
                            : "Requires explicit approval"}
                        </small>
                      ) : (
                        <small>{active ? "In ceiling" : "Above ceiling"}</small>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Approvals & Immutable Audit Trail */}
          <section className="cc-panel">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="cc-panel-title mb-0">Approvals &amp; Audit Trail</h2>
              <History className="size-4 text-slate-500" />
            </div>
            {approvals.length > 0 ? (
              <ul className="cc-bullets mb-3">
                {approvals.map((a) => (
                  <li key={a.id}>
                    <strong>{a.kind === "plan" ? "Plan gate" : "Act externally"}</strong> —{" "}
                    <span className=" uppercase text-xs font-semibold">{a.status}</span>
                    {a.note ? ` (${a.note})` : ""}
                  </li>
                ))}
              </ul>
            ) : null}

            {auditEvents.length === 0 ? (
              <p className="cc-muted text-xs">No audit events recorded yet.</p>
            ) : (
              <ul className="cc-audit-list" aria-label="Mission audit log">
                {auditEvents.map((ev) => (
                  <li key={ev.id} className="cc-audit-item">
                    <div className="flex items-center justify-between gap-2">
                      <code>{ev.eventType}</code>
                      <small>
                        {new Date(ev.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <span className="cc-muted text-xs">Entity: {ev.entityType}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link to="/command" className="cc-btn cc-btn-secondary w-full justify-center">
            ← Back to Command Centre
          </Link>
        </aside>
      </div>
    </CommandShell>
  );
}

function stageState(tasks: WfMissionTask[], stage: LifecycleStage): string {
  const inStage = tasks.filter((t) => t.stage === stage);
  if (!inStage.length) return "idle";
  if (inStage.some((t) => t.status === "failed")) return "failed";
  if (inStage.some((t) => t.gate && t.status === "blocked")) return "gate";
  if (inStage.every((t) => t.status === "completed" || t.status === "skipped")) return "done";
  if (inStage.some((t) => t.status === "completed" || t.status === "running")) return "active";
  return "idle";
}

const STAGE_STATE_TEXT: Record<string, string> = {
  idle: "Not started",
  active: "In progress",
  done: "Complete",
  gate: "Awaiting approval",
  failed: "Stopped",
};

function StageTrack({ tasks }: { tasks: WfMissionTask[] }) {
  return (
    <ol className="cc-stage-track" aria-label="Product lifecycle stages">
      {LIFECYCLE_STAGES.map((stage) => {
        const state = stageState(tasks, stage);
        return (
          <li key={stage} className="cc-stage" data-state={state}>
            <strong>{LIFECYCLE_STAGE_LABELS[stage]}</strong>
            {STAGE_STATE_TEXT[state]}
          </li>
        );
      })}
    </ol>
  );
}

function GenerationBadge({ artefact }: { artefact: WfArtefact }) {
  const source = artefact.evidenceItems.find((e) =>
    e.source?.startsWith(GENERATION_SOURCE_PREFIX),
  )?.source;
  if (!source) return null;
  const isModel = source.startsWith(`${GENERATION_SOURCE_PREFIX}model:`);
  return (
    <span className="cc-gen-badge" data-mode={isModel ? "model" : "simulated"}>
      {isModel
        ? `Model: ${source.slice(`${GENERATION_SOURCE_PREFIX}model:`.length)}`
        : "Simulated draft"}
    </span>
  );
}
