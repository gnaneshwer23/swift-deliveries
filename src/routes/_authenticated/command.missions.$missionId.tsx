import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { missionBundleQuery } from "@/lib/workforce-queries";
import {
  answerClarifications,
  approveExternalActions,
  approveMissionPlan,
  cancelMission,
  runMissionStep,
} from "@/lib/workforce.functions";
import {
  EVIDENCE_LABEL_DISPLAY,
  INTENT_LABELS,
  PERMISSION_LABELS,
  QUALITY_LABEL_DISPLAY,
  STATUS_LABELS,
  type PermissionLevel,
  type QualityLabel,
} from "@/lib/workforce/types";

export const Route = createFileRoute("/_authenticated/command/missions/$missionId")({
  head: () => ({
    meta: [
      { title: "Mission — Command Centre — DeliverX" },
      {
        name: "description",
        content: "Clarify, approve, run, and review a supervised AI mission.",
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
  const [autoRunning, setAutoRunning] = useState(false);

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

  const approve = useMutation({
    mutationFn: () =>
      approveMissionPlan({
        data: { missionId, approveExternalActions: approveExternal },
      }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
      setAutoRunning(true);
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Approval failed"),
  });

  const approveExt = useMutation({
    mutationFn: () => approveExternalActions({ data: { missionId } }),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
      setAutoRunning(true);
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "External approval failed"),
  });

  const step = useMutation({
    mutationFn: () => runMissionStep({ data: { missionId } }),
    onSuccess: async (result) => {
      setActionError(null);
      await invalidate();
      if (result.done) setAutoRunning(false);
    },
    onError: (e) => {
      setAutoRunning(false);
      setActionError(e instanceof Error ? e.message : "Execution failed");
    },
  });

  const cancel = useMutation({
    mutationFn: () => cancelMission({ data: { missionId } }),
    onSuccess: async () => {
      setAutoRunning(false);
      await invalidate();
    },
  });

  useEffect(() => {
    if (!autoRunning || !query.data) return;
    const status = query.data.mission.status;
    if (status !== "queued" && status !== "running") {
      if (status !== "blocked") setAutoRunning(false);
      return;
    }
    if (step.isPending) return;
    const timer = window.setTimeout(() => step.mutate(), 450);
    return () => window.clearTimeout(timer);
  }, [autoRunning, query.data?.mission.status, query.data?.tasks, step.isPending]);

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

  const { mission, plan, tasks, artefacts, approvals, workspace } = data;
  const pendingQuestions = plan?.clarificationQuestions ?? [];
  const ladder: PermissionLevel[] = ["plan", "create", "execute_internally", "act_externally"];

  return (
    <CommandShell
      title={mission.title}
      subtitle={`${INTENT_LABELS[mission.intent]} · ${STATUS_LABELS[mission.status]}`}
      usage={{
        consumed: workspace.usageConsumed,
        ceiling: workspace.usageCeiling,
      }}
    >
      <div className="cc-mission-layout">
        <div className="cc-mission-main">
          <section className="cc-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="cc-kicker">Request</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{mission.requestText}</p>
              </div>
              <span className={`cc-status cc-status-${mission.status}`}>
                {STATUS_LABELS[mission.status]}
              </span>
            </div>
          </section>

          {mission.status === "needs_clarification" ? (
            <section className="cc-panel">
              <h2 className="cc-panel-title">Clarification needed</h2>
              <p className="cc-muted mb-4">
                Answer the required questions so we can produce a plan worth approving.
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
                {clarify.isPending ? "Updating plan…" : "Submit answers & generate plan"}
              </button>
            </section>
          ) : null}

          {plan && mission.status !== "needs_clarification" ? (
            <section className="cc-panel">
              <h2 className="cc-panel-title">Plan</h2>
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
                        <span className="cc-chip cc-chip-available">Available</span>
                      </li>
                    ))}
                  </ul>
                  <p className="cc-muted text-xs mt-2">
                    Only Wave 1 Available roles are assigned.{" "}
                    <Link to="/command/capabilities" className="underline">
                      Browse registry
                    </Link>
                  </p>
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
                <div
                  className="mt-4 rounded-md border p-4"
                  style={{ borderColor: "var(--x-border)" }}
                >
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
                  <button
                    type="button"
                    className="cc-btn cc-btn-primary mt-3"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate()}
                  >
                    {approve.isPending ? "Approving…" : "Approve plan & queue"}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="cc-panel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="cc-panel-title mb-0">Task graph</h2>
              <div className="flex flex-wrap gap-2">
                {(mission.status === "queued" ||
                  mission.status === "running" ||
                  mission.status === "blocked") && (
                  <button
                    type="button"
                    className="cc-btn cc-btn-primary"
                    disabled={step.isPending || autoRunning}
                    onClick={() => {
                      setAutoRunning(true);
                      step.mutate();
                    }}
                  >
                    {autoRunning || step.isPending ? "Running…" : "Run next step"}
                  </button>
                )}
                {mission.status === "blocked" && !mission.externalActionsApproved ? (
                  <button
                    type="button"
                    className="cc-btn cc-btn-secondary"
                    disabled={approveExt.isPending}
                    onClick={() => approveExt.mutate()}
                  >
                    Approve Act externally
                  </button>
                ) : null}
                {!["completed", "cancelled", "failed"].includes(mission.status) ? (
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
            {!tasks.length ? (
              <p className="cc-muted mt-4">Tasks appear after clarifications are complete.</p>
            ) : (
              <ol className="cc-task-list mt-4">
                {tasks.map((t) => (
                  <li key={t.id} className={`cc-task cc-task-${t.status}`}>
                    <div className="cc-task-head">
                      <strong>
                        {t.sortOrder + 1}. {t.title}
                      </strong>
                      <span>{t.status}</span>
                    </div>
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
            )}
          </section>

          {mission.deliveryReport ? (
            <section className="cc-panel">
              <h2 className="cc-panel-title">Delivery report</h2>
              <h3 className="text-base font-semibold">{mission.deliveryReport.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed">{mission.deliveryReport.summary}</p>
              <h3 className="cc-subhead">Outcomes</h3>
              <ul className="cc-bullets">
                {mission.deliveryReport.outcomes.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
              <h3 className="cc-subhead">Quality labels</h3>
              <div className="flex flex-wrap gap-2">
                {mission.deliveryReport.qualitySummary.map((q) => (
                  <span key={q} className="cc-chip">
                    {QUALITY_LABEL_DISPLAY[q as QualityLabel] ?? q}
                  </span>
                ))}
              </div>
              <p className="cc-muted mt-3">
                Usage spent on this delivery: {mission.deliveryReport.usageSpent} credits
              </p>
            </section>
          ) : null}

          {actionError ? <p className="cc-error">{actionError}</p> : null}
        </div>

        <aside className="cc-mission-side">
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

          <section className="cc-panel">
            <h2 className="cc-panel-title">Approvals</h2>
            {!approvals.length ? (
              <p className="cc-muted">No approval records yet.</p>
            ) : (
              <ul className="cc-bullets">
                {approvals.map((a) => (
                  <li key={a.id}>
                    {a.kind === "plan" ? "Plan" : "Act externally"} — {a.status}
                    {a.decidedAt ? ` · ${new Date(a.decidedAt).toLocaleString()}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="cc-panel">
            <h2 className="cc-panel-title">Artefacts</h2>
            {!artefacts.length ? (
              <p className="cc-muted">Artefacts appear as tasks complete.</p>
            ) : (
              <ul className="cc-artefact-list">
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
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedArtefact.qualityLabels.map((q) => (
                    <span key={q} className="cc-chip">
                      {QUALITY_LABEL_DISPLAY[q]}
                    </span>
                  ))}
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
                    sandbox=""
                  />
                ) : (
                  <pre className="cc-artefact-pre">{selectedArtefact.content}</pre>
                )}
              </div>
            ) : null}
          </section>

          <Link to="/command" className="cc-btn cc-btn-secondary w-full justify-center">
            Back to Command Centre
          </Link>
        </aside>
      </div>
    </CommandShell>
  );
}
