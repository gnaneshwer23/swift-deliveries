import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { ComparisonReviews } from "@/components/command/comparison-reviews";
import { MANUAL_ACTIVATION_COPY, ALLOWANCE_EXHAUSTED_COPY } from "@/lib/pilot/commercial-copy";
import {
  activatePilotRequest,
  listPilotRequests,
  updatePilotRequest,
  type OperatorPilotRequest,
} from "@/lib/pilot/enquiry.functions";
import {
  FOLLOW_UP_LABELS,
  FOLLOW_UP_STATUSES,
  PILOT_PLAN_LABELS,
  PILOT_PLANS,
  type PilotPlan,
} from "@/lib/pilot/model";

export const Route = createFileRoute("/_authenticated/command/pilot-requests")({
  head: () => ({
    meta: [{ title: "Pilot requests — DeliverX" }, { name: "robots", content: "noindex" }],
  }),
  component: PilotRequestsPage,
});

function PilotRequestsPage() {
  const queue = useQuery({
    queryKey: ["pilot", "requests"],
    queryFn: () => listPilotRequests(),
  });
  return (
    <CommandShell
      title="Pilot requests"
      subtitle="Authorised follow-up and manual activation. Saving a status does not send a message or take payment."
    >
      {queue.isLoading ? <p className="cc-muted">Loading requests…</p> : null}
      {queue.isError ? (
        <p className="cc-error" role="alert">
          The request list could not be loaded.
        </p>
      ) : null}
      {queue.data && !queue.data.authorised ? (
        <section className="cc-panel">
          <h2 className="cc-panel-title">Not authorised</h2>
          <p className="cc-muted">
            Only an authorised operator can see pilot enquiries. Account creation does not grant
            this access.
          </p>
        </section>
      ) : null}
      {queue.data?.authorised && queue.data.requests.length === 0 ? (
        <section className="cc-panel">
          <h2 className="cc-panel-title">No requests yet</h2>
          <p className="cc-muted">Submitted enquiries will appear here after they are stored.</p>
        </section>
      ) : null}
      <ul className="cc-mission-list">
        {queue.data?.authorised
          ? queue.data.requests.map((request) => <RequestCard key={request.id} request={request} />)
          : null}
      </ul>
      {queue.data?.authorised && <ComparisonReviews />}
    </CommandShell>
  );
}

function RequestCard({ request }: { request: OperatorPilotRequest }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.followUpNote);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const save = useMutation({
    mutationFn: () => updatePilotRequest({ data: { id: request.id, status, followUpNote: note } }),
    onSuccess: async (result) => {
      setFailed(!result.ok);
      setMessage(result.ok ? `Saved ${result.reference}. No message was sent.` : result.message);
      if (result.ok) await queryClient.invalidateQueries({ queryKey: ["pilot", "requests"] });
    },
    onError: () => {
      setFailed(true);
      setMessage("The follow-up could not be saved.");
    },
  });
  return (
    <li className="cc-panel" style={{ marginBottom: 16 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>{request.reference}</strong>
        <span className="cc-chip">{FOLLOW_UP_LABELS[request.status]}</span>
      </div>
      <p className="cc-muted text-sm">
        {request.contactName} · {request.contactEmail}
        {request.organisation ? ` · ${request.organisation}` : ""} ·{" "}
        {PILOT_PLAN_LABELS[request.plan]}
        {request.linkedAccount ? " · linked to an account" : " · not linked to an account"}
      </p>
      <p>
        <strong>Question. </strong>
        {request.brief.problem}
      </p>
      <p className="cc-muted text-sm">
        Audience: {request.brief.audience}. Outcome: {request.brief.objective}. Evidence:{" "}
        {request.brief.evidence || "Not supplied."}
      </p>
      <label className="cc-label" htmlFor={`status-${request.id}`}>
        Follow-up status
        <select
          id={`status-${request.id}`}
          className="cc-input"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          {FOLLOW_UP_STATUSES.map((item) => (
            <option key={item} value={item}>
              {FOLLOW_UP_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="cc-label" htmlFor={`note-${request.id}`}>
        Note for the record
        <textarea
          id={`note-${request.id}`}
          className="cc-input"
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <p className="psi-fine-print">
        Scope agreed means the request can be discussed. It does not start billing, create a
        subscription, or activate a pilot. Saving this record does not send a message.
      </p>
      <button
        type="button"
        className="cc-btn cc-btn-primary"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Saving…" : "Save follow-up"}
      </button>
      {message ? (
        <p className={failed ? "cc-error" : "cc-muted"} role="status">
          {message}
        </p>
      ) : null}
      <ActivationPanel request={request} />
    </li>
  );
}

function ActivationPanel({ request }: { request: OperatorPilotRequest }) {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<PilotPlan>(request.activation?.plan ?? request.plan);
  const [allowance, setAllowance] = useState(String(request.activation?.missionAllowance ?? 1));
  const [workspaceId, setWorkspaceId] = useState(
    request.activation?.workspaceId ?? request.suggestedWorkspaceIds[0] ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      activatePilotRequest({
        data: {
          id: request.id,
          workspaceId,
          plan,
          missionAllowance: Number(allowance),
        },
      }),
    onSuccess: async (result) => {
      setFailed(!result.ok);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage(
        result.already
          ? "This enquiry is already activated. The allowance was not changed and no payment was taken."
          : "Manual activation recorded. No payment was taken.",
      );
      await queryClient.invalidateQueries({ queryKey: ["pilot", "requests"] });
    },
    onError: () => {
      setFailed(true);
      setMessage("The activation was not saved.");
    },
  });
  if (request.activation) {
    const row = request.activation;
    return (
      <div className="mt-4">
        <h3 className="cc-panel-title">Manual activation</h3>
        <p>
          {PILOT_PLAN_LABELS[row.plan]}. Workspace {row.workspaceId}. {row.missionsConsumed} of{" "}
          {row.missionAllowance} billable comparisons recorded.
        </p>
        <p className="psi-fine-print">
          {MANUAL_ACTIVATION_COPY} {ALLOWANCE_EXHAUSTED_COPY}
        </p>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <h3 className="cc-panel-title">Manual activation</h3>
      <p className="psi-fine-print">
        {MANUAL_ACTIVATION_COPY} {ALLOWANCE_EXHAUSTED_COPY}
      </p>
      {request.suggestedWorkspaceIds.length > 0 ? (
        <p className="cc-muted text-sm">
          Linked workspace{request.suggestedWorkspaceIds.length > 1 ? "s" : ""}:{" "}
          {request.suggestedWorkspaceIds.join(", ")}
        </p>
      ) : (
        <p className="cc-muted text-sm">
          No linked workspace was found. Enter the workspace id this allowance should cover.
        </p>
      )}
      <label className="cc-label" htmlFor={`plan-${request.id}`}>
        Scoped plan
        <select
          id={`plan-${request.id}`}
          className="cc-input"
          value={plan}
          onChange={(event) => setPlan(event.target.value as PilotPlan)}
        >
          {PILOT_PLANS.map((item) => (
            <option key={item} value={item}>
              {PILOT_PLAN_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="cc-label" htmlFor={`allowance-${request.id}`}>
        Mission allowance
        <input
          id={`allowance-${request.id}`}
          className="cc-input"
          type="number"
          min={1}
          max={24}
          step={1}
          value={allowance}
          onChange={(event) => setAllowance(event.target.value)}
        />
      </label>
      <label className="cc-label" htmlFor={`workspace-${request.id}`}>
        Workspace id
        <input
          id={`workspace-${request.id}`}
          className="cc-input"
          value={workspaceId}
          onChange={(event) => setWorkspaceId(event.target.value.trim())}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button
        type="button"
        className="cc-btn"
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? "Recording…" : "Record manual activation"}
      </button>
      {message ? (
        <p className={failed ? "cc-error" : "cc-muted"} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
