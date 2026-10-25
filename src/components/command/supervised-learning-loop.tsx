import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useVersionedDraft } from "@/hooks/use-versioned-draft";
import {
  approveSupervisedFollowUp,
  recordSupervisedExpectation,
  recordSupervisedObservation,
  recordSupervisedReview,
} from "@/lib/pilot-mission.functions";
import { learningLinks } from "@/lib/pilot-mission/learning";
import {
  OWNER_SUPPLIED_OBSERVATION_LABEL,
  type OutcomeReading,
  type SupervisedMission,
} from "@/lib/pilot-mission/types";

const READINGS: Array<{ id: OutcomeReading; label: string }> = [
  { id: "consistent", label: "Consistent with what I expected" },
  { id: "different", label: "Different from what I expected" },
  { id: "uncertain", label: "Not enough to tell" },
];

export function LearningChain({ mission }: { mission: SupervisedMission }) {
  const links = learningLinks(mission);
  return (
    <ol
      className="mt-3 grid gap-2"
      aria-label="Decision, observation, review and proposed next mission"
    >
      {links.map((link, index) => (
        <li key={link.step} id={`learning-${link.step}`}>
          <span className="cc-chip">
            {index + 1} · {link.title} · {link.state}
          </span>
          <p className="cc-muted mt-1 text-sm">{link.detail}</p>
        </li>
      ))}
    </ol>
  );
}

export function SupervisedLearningLoop({
  mission,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  if (mission.stage === "cancelled" || (!mission.approval && !mission.origin)) return null;
  return (
    <section className="cc-panel" aria-label="Outcome review">
      <h2 className="cc-panel-title">Outcome review</h2>
      <p className="cc-muted text-sm">
        Record what you expect before the change. Later, supply what you actually observed. DeliverX
        does not measure the result, and a follow-up mission stays proposed until you approve it.
      </p>
      <LearningChain mission={mission} />
      {mission.origin ? (
        <p className="cc-muted mt-3 text-sm">
          This mission opened after you approved review version {mission.origin.reviewVersion} on{" "}
          <Link
            to="/command/supervised/$missionId"
            params={{ missionId: mission.origin.parentMissionId }}
            className="underline"
          >
            the previous mission
          </Link>
          . The decision pack was “{mission.origin.artefactTitle}”. No later step is approved.
        </p>
      ) : null}
      {mission.approval ? (
        <ExpectationForm mission={mission} onDone={onDone} onError={onError} />
      ) : null}
      <ObservationForm mission={mission} onDone={onDone} onError={onError} />
      <ReviewHistory mission={mission} />
      <ReviewForm mission={mission} onDone={onDone} onError={onError} />
      <FollowUpApproval mission={mission} onDone={onDone} onError={onError} />
    </section>
  );
}

function ExpectationForm({
  mission,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const existing = mission.expectation;
  const draft = useVersionedDraft(
    {
      hypothesis: existing?.hypothesis ?? "",
      expectedMetric: existing?.expectedMetric ?? "",
      baseline: existing?.baseline ?? "",
      observationWindow: existing?.observationWindow ?? "",
    },
    mission.version,
  );
  const { hypothesis, expectedMetric, baseline, observationWindow } = draft.value;
  const setHypothesis = (value: string) => draft.setValue({ ...draft.value, hypothesis: value });
  const setExpectedMetric = (value: string) =>
    draft.setValue({ ...draft.value, expectedMetric: value });
  const setBaseline = (value: string) => draft.setValue({ ...draft.value, baseline: value });
  const setObservationWindow = (value: string) =>
    draft.setValue({ ...draft.value, observationWindow: value });
  const save = useMutation({
    mutationFn: () =>
      recordSupervisedExpectation({
        data: {
          id: mission.id,
          expectedVersion: draft.expectedVersion,
          hypothesis,
          expectedMetric,
          baseline,
          observationWindow,
        },
      }),
    onSuccess: async (result) => {
      draft.saved(result.mission.version);
      await onDone();
    },
    onError,
  });
  if (mission.exportBody || mission.observation) {
    return existing ? (
      <div className="mt-4">
        {draft.stale && (
          <div role="alert" className="cc-error">
            The saved record changed. Your edits are kept.{" "}
            <button type="button" className="cc-btn cc-btn-secondary" onClick={draft.reset}>
              Discard these edits and load saved values
            </button>
          </div>
        )}
        <h3 className="font-medium">Measurement plan</h3>
        <p>{existing.hypothesis}</p>
        <p className="cc-muted text-sm">
          Expected metric: {existing.expectedMetric}. Baseline: {existing.baseline}. Window:{" "}
          {existing.observationWindow}. This plan is a hypothesis, not an observed result.
        </p>
      </div>
    ) : null;
  }
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <h3 className="font-medium">Before the change</h3>
      <p className="cc-muted text-sm">
        These fields are what you expect. They are not a result DeliverX has measured.
      </p>
      <label className="cc-label" htmlFor="expectation-hypothesis">
        Hypothesis
      </label>
      <textarea
        id="expectation-hypothesis"
        className="cc-input cc-textarea"
        rows={2}
        value={hypothesis}
        onChange={(event) => setHypothesis(event.target.value)}
      />
      <label className="cc-label" htmlFor="expectation-metric">
        Expected metric
      </label>
      <input
        id="expectation-metric"
        className="cc-input"
        value={expectedMetric}
        onChange={(event) => setExpectedMetric(event.target.value)}
      />
      <label className="cc-label" htmlFor="expectation-baseline">
        Baseline
      </label>
      <input
        id="expectation-baseline"
        className="cc-input"
        value={baseline}
        onChange={(event) => setBaseline(event.target.value)}
      />
      <label className="cc-label" htmlFor="expectation-window">
        Observation window
      </label>
      <input
        id="expectation-window"
        className="cc-input"
        value={observationWindow}
        onChange={(event) => setObservationWindow(event.target.value)}
      />
      <div>
        <button type="submit" className="cc-btn cc-btn-primary" disabled={save.isPending}>
          {save.isPending
            ? "Saving…"
            : existing
              ? "Update measurement plan"
              : "Save measurement plan"}
        </button>
      </div>
    </form>
  );
}

function ObservationForm({
  mission,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const existing = mission.observation;
  const draft = useVersionedDraft(
    {
      result: existing?.result ?? "",
      evidence: existing?.evidence ?? "",
      source: existing?.source ?? "",
    },
    mission.version,
  );
  const { result, evidence, source } = draft.value;
  const setResult = (value: string) => draft.setValue({ ...draft.value, result: value });
  const setEvidence = (value: string) => draft.setValue({ ...draft.value, evidence: value });
  const setSource = (value: string) => draft.setValue({ ...draft.value, source: value });
  const save = useMutation({
    mutationFn: () =>
      recordSupervisedObservation({
        data: { id: mission.id, expectedVersion: draft.expectedVersion, result, evidence, source },
      }),
    onSuccess: async (result) => {
      draft.saved(result.mission.version);
      await onDone();
    },
    onError,
  });
  if (!mission.expectation || !mission.exportBody) return null;
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      {draft.stale && (
        <div role="alert" className="cc-error">
          The saved record changed. Your edits are kept.{" "}
          <button type="button" className="cc-btn cc-btn-secondary" onClick={draft.reset}>
            Discard these edits and load saved values
          </button>
        </div>
      )}
      <h3 className="font-medium">Observed result</h3>
      <p className="cc-muted text-sm">{OWNER_SUPPLIED_OBSERVATION_LABEL}</p>
      <label className="cc-label" htmlFor="observation-result">
        Result you observed
      </label>
      <textarea
        id="observation-result"
        className="cc-input cc-textarea"
        rows={2}
        value={result}
        onChange={(event) => setResult(event.target.value)}
      />
      <label className="cc-label" htmlFor="observation-evidence">
        Evidence for that result
      </label>
      <textarea
        id="observation-evidence"
        className="cc-input cc-textarea"
        rows={2}
        value={evidence}
        onChange={(event) => setEvidence(event.target.value)}
      />
      <label className="cc-label" htmlFor="observation-source">
        Where you saw it
      </label>
      <input
        id="observation-source"
        className="cc-input"
        value={source}
        onChange={(event) => setSource(event.target.value)}
      />
      <div>
        <button type="submit" className="cc-btn cc-btn-secondary" disabled={save.isPending}>
          {save.isPending
            ? "Saving…"
            : existing
              ? "Update supplied result"
              : "Save supplied result"}
        </button>
      </div>
    </form>
  );
}

function ReviewHistory({ mission }: { mission: SupervisedMission }) {
  if (!mission.reviews.length) return null;
  return (
    <div className="mt-4">
      <h3 className="font-medium">Review history</h3>
      <p className="cc-muted text-sm">
        A later edit adds a version. Earlier versions stay on the record.
      </p>
      <ol className="mt-2 grid gap-3">
        {mission.reviews.map((review) => (
          <li key={review.version} className="cc-panel">
            <p>
              Version {review.version} · {review.reading}
            </p>
            <p className="text-sm">Expected: {review.expectedMetric}</p>
            <p className="text-sm">Observed: {review.observedResult}</p>
            <p className="cc-muted text-sm">{review.observationLabel}</p>
            <p className="text-sm">Uncertainty: {review.uncertainty}</p>
            <p className="cc-muted text-sm">
              Linked to {review.artefactTitle}, decision {review.decision.optionId}, proposal
              version {review.decision.version}.
            </p>
            <p className="cc-muted text-sm">
              Proposed follow-up: {review.proposedFollowUp.question}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReviewForm({
  mission,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const latest = mission.reviews.at(-1);
  const draft = useVersionedDraft(
    {
      reading: (latest?.reading ?? "uncertain") as OutcomeReading,
      uncertainty: "",
      question: latest?.proposedFollowUp.question ?? "",
      audience: latest?.proposedFollowUp.audience ?? mission.brief.audience,
      outcome: latest?.proposedFollowUp.outcome ?? "",
      constraints: latest?.proposedFollowUp.constraints ?? mission.brief.constraints,
    },
    mission.version,
  );
  const { reading, uncertainty, question, audience, outcome, constraints } = draft.value;
  const setReading = (value: OutcomeReading) => draft.setValue({ ...draft.value, reading: value });
  const setUncertainty = (value: string) => draft.setValue({ ...draft.value, uncertainty: value });
  const setQuestion = (value: string) => draft.setValue({ ...draft.value, question: value });
  const setAudience = (value: string) => draft.setValue({ ...draft.value, audience: value });
  const setOutcome = (value: string) => draft.setValue({ ...draft.value, outcome: value });
  const setConstraints = (value: string) => draft.setValue({ ...draft.value, constraints: value });
  const save = useMutation({
    mutationFn: () =>
      recordSupervisedReview({
        data: {
          id: mission.id,
          expectedVersion: draft.expectedVersion,
          reading,
          uncertainty,
          followUp: { question, audience, outcome, constraints },
        },
      }),
    onSuccess: async (result) => {
      draft.saved(result.mission.version);
      await onDone();
    },
    onError,
  });
  if (!mission.observation || !mission.artefact) return null;
  const locked = mission.followUp?.status === "approved";
  return (
    <form
      className="mt-4 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      {draft.stale && (
        <div role="alert" className="cc-error">
          The saved record changed. Your edits are kept.{" "}
          <button type="button" className="cc-btn cc-btn-secondary" onClick={draft.reset}>
            Discard these edits and load saved values
          </button>
        </div>
      )}
      <h3 className="font-medium">Compare expected and observed</h3>
      <p className="text-sm">Expected metric: {mission.expectation?.expectedMetric}</p>
      <p className="text-sm">Observed result: {mission.observation.result}</p>
      <p className="cc-muted text-sm">
        Write what is still unknown. Do not replace that note with a confidence score.
      </p>
      <label className="cc-label" htmlFor="review-reading">
        Your reading
      </label>
      <select
        id="review-reading"
        className="cc-input"
        value={reading}
        onChange={(event) => setReading(event.target.value as OutcomeReading)}
      >
        {READINGS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <label className="cc-label" htmlFor="review-uncertainty">
        Uncertainty
      </label>
      <textarea
        id="review-uncertainty"
        className="cc-input cc-textarea"
        rows={3}
        value={uncertainty}
        onChange={(event) => setUncertainty(event.target.value)}
      />
      <h3 className="font-medium">One proposed follow-up</h3>
      <p className="cc-muted text-sm">
        Saving this review stores a proposal. It does not open or approve the next mission.
      </p>
      <label className="cc-label" htmlFor="follow-up-question">
        Follow-up question
      </label>
      <textarea
        id="follow-up-question"
        className="cc-input cc-textarea"
        rows={2}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      <label className="cc-label" htmlFor="follow-up-audience">
        Audience
      </label>
      <input
        id="follow-up-audience"
        className="cc-input"
        value={audience}
        onChange={(event) => setAudience(event.target.value)}
      />
      <label className="cc-label" htmlFor="follow-up-outcome">
        Intended outcome
      </label>
      <input
        id="follow-up-outcome"
        className="cc-input"
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
      />
      <label className="cc-label" htmlFor="follow-up-constraints">
        Constraints
      </label>
      <input
        id="follow-up-constraints"
        className="cc-input"
        value={constraints}
        onChange={(event) => setConstraints(event.target.value)}
      />
      {locked ? (
        <p className="cc-muted text-sm">
          The follow-up is already approved. Another review stays on this mission and does not start
          a second mission.
        </p>
      ) : null}
      <div>
        <button type="submit" className="cc-btn cc-btn-primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save review"}
        </button>
      </div>
    </form>
  );
}

function FollowUpApproval({
  mission,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const followUp = mission.followUp;
  const approve = useMutation({
    mutationFn: () =>
      approveSupervisedFollowUp({ data: { id: mission.id, expectedVersion: mission.version } }),
    onSuccess: onDone,
    onError,
  });
  if (!followUp) return null;
  if (followUp.status === "approved" && followUp.missionId) {
    return (
      <div className="mt-4">
        <h3 className="font-medium">Follow-up mission</h3>
        <p className="cc-muted text-sm">
          You approved this on {followUp.approvedAt}. It is a separate mission. Approving it did not
          approve a comparison or any later step.
        </p>
        <Link
          to="/command/supervised/$missionId"
          params={{ missionId: followUp.missionId }}
          className="cc-btn cc-btn-secondary mt-2 inline-flex"
        >
          Open the follow-up mission
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-4">
      <h3 className="font-medium">Approve the follow-up</h3>
      {mission.reviews.at(-1)?.observationId !== mission.observation?.id && (
        <p className="cc-error">
          The observation changed. Save a new review before approving this follow-up.
        </p>
      )}
      <p>{followUp.brief.question}</p>
      <p className="cc-muted text-sm">
        This is a proposal, not an active mission. Nothing starts until you approve it.
      </p>
      <button
        type="button"
        className="cc-btn cc-btn-primary mt-2"
        disabled={
          approve.isPending || mission.reviews.at(-1)?.observationId !== mission.observation?.id
        }
        onClick={() => approve.mutate()}
      >
        {approve.isPending ? "Approving…" : "Approve follow-up mission"}
      </button>
    </div>
  );
}
