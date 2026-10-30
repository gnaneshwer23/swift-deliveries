import { useMutation } from "@tanstack/react-query";
import { useVersionedDraft } from "@/hooks/use-versioned-draft";
import { reviseSupervisedBrief } from "@/lib/pilot-mission.functions";

/** Edit mission brief fields before plan approval; clears proposal when scope changes. */
export function SupervisedBriefEditor({
  recordVersion,
  missionId,
  initial,
  locked,
  onDone,
  onError,
  defaultOpen = false,
}: {
  recordVersion: number;
  missionId: string;
  initial: { question: string; audience: string; outcome: string; constraints: string };
  locked: boolean;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
  defaultOpen?: boolean;
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
    <details className="cc-panel ps-scope-brief-edit" open={defaultOpen || undefined}>
      <summary>
        <strong>Edit PM understanding</strong>
        <span className="cc-muted block text-sm font-normal">
          Vision, outcome, constraints, and non-goals. Saving clears an unapproved proposal.
        </span>
      </summary>
      {draft.stale ? (
        <div role="alert" className="cc-error mt-3">
          The saved record changed. Your edits are kept here.{" "}
          <button type="button" className="cc-btn cc-btn-secondary" onClick={draft.reset}>
            Discard these edits and load saved values
          </button>
        </div>
      ) : null}
      <div className="mt-3 grid gap-2">
        <label className="cc-label" htmlFor="scope-brief-question">
          Product question
        </label>
        <textarea
          id="scope-brief-question"
          className="cc-input cc-textarea"
          aria-label="Business case"
          rows={2}
          value={brief.question}
          onChange={(event) => setBrief({ ...brief, question: event.target.value })}
        />
        <label className="cc-label" htmlFor="scope-brief-audience">
          Audience
        </label>
        <input
          id="scope-brief-audience"
          className="cc-input"
          aria-label="Audience"
          value={brief.audience}
          onChange={(event) => setBrief({ ...brief, audience: event.target.value })}
        />
        <label className="cc-label" htmlFor="scope-brief-outcome">
          Intended outcome
        </label>
        <input
          id="scope-brief-outcome"
          className="cc-input"
          aria-label="Outcome"
          value={brief.outcome}
          onChange={(event) => setBrief({ ...brief, outcome: event.target.value })}
        />
        <label className="cc-label" htmlFor="scope-brief-constraints">
          Constraints and non-goals
        </label>
        <input
          id="scope-brief-constraints"
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
          {save.isPending ? "Saving…" : "Save understanding"}
        </button>
      </div>
    </details>
  );
}
