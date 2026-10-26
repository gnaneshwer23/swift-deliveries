import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listComparisonReviews,
  resolveComparisonReview,
} from "@/lib/pilot-mission/reconciliation.functions";

export function ComparisonReviews() {
  const queue = useQuery({
    queryKey: ["pilot", "comparison-reviews"],
    queryFn: () => listComparisonReviews(),
  });
  return (
    <section className="mt-8" aria-labelledby="comparison-reviews-title">
      <h2 id="comparison-reviews-title" className="cc-panel-title">
        Provider attempts needing review
      </h2>
      <p className="cc-muted">
        Check provider records before releasing allowance. A timeout alone does not prove that a
        call was not billed.
      </p>
      {queue.isPending && <p role="status">Loading attempts...</p>}
      {queue.isError && (
        <p className="cc-error" role="alert">
          Attempt reviews are unavailable. Check the reconciliation migration and try again.
        </p>
      )}
      {queue.data?.length === 0 && <p className="cc-muted">No unresolved attempts.</p>}
      <ul className="cc-mission-list">
        {queue.data?.map((attempt) => (
          <ReviewAttempt key={`${attempt.missionId}:${attempt.spendKey}`} attempt={attempt} />
        ))}
      </ul>
    </section>
  );
}

function ReviewAttempt({
  attempt,
}: {
  attempt: Awaited<ReturnType<typeof listComparisonReviews>>[number];
}) {
  const client = useQueryClient();
  const [outcome, setOutcome] = useState<"charged" | "not_dispatched">("charged");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const save = useMutation({
    mutationFn: () =>
      resolveComparisonReview({
        data: {
          workspaceId: attempt.workspaceId,
          missionId: attempt.missionId,
          spendKey: attempt.spendKey,
          outcome,
          evidenceNote: note,
        },
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["pilot"] });
    },
  });
  return (
    <li className="cc-panel my-4">
      <h3 className="cc-panel-title">Mission {attempt.missionId}</h3>
      <p className="cc-muted text-sm break-all">
        Workspace {attempt.workspaceId}. {attempt.units} unit held. Status: {attempt.status}.
      </p>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed) save.mutate();
        }}
      >
        <label className="cc-label">
          Provider finding
          <select
            className="cc-input"
            value={outcome}
            onChange={(event) => {
              setOutcome(event.target.value as typeof outcome);
              setConfirmed(false);
            }}
          >
            <option value="charged">Provider dispatched or billed: retain allowance</option>
            <option value="not_dispatched">Confirmed no dispatch: release allowance</option>
          </select>
        </label>
        <label className="cc-label">
          Evidence and provider reference
          <textarea
            className="cc-input"
            required
            minLength={20}
            maxLength={2000}
            rows={3}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setConfirmed(false);
            }}
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          I checked the provider evidence. This decision is recorded permanently and does not rerun
          the provider.
        </label>
        <button
          type="submit"
          className="cc-btn"
          disabled={save.isPending || !confirmed || note.trim().length < 20}
        >
          {save.isPending ? "Recording..." : "Record reconciliation"}
        </button>
        {save.isError && (
          <p className="cc-error" role="alert">
            {save.error.message}
          </p>
        )}
      </form>
    </li>
  );
}
