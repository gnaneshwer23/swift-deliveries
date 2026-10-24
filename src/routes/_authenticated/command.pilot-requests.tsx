import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import {
  listPilotRequests,
  updatePilotRequest,
  type OperatorPilotRequest,
} from "@/lib/pilot/enquiry.functions";
import { FOLLOW_UP_LABELS, FOLLOW_UP_STATUSES, PILOT_PLAN_LABELS } from "@/lib/pilot/model";

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
      subtitle="Authorised follow-up only. Saving a status does not send a message."
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
        Scope agreed means the request can be discussed. It does not start billing or create a
        subscription. Saving this record does not send a message.
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
    </li>
  );
}
