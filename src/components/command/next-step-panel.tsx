/**
 * The next step — one clear action for whatever the case needs now:
 * compare options, say what you expect, prepare the decision pack, or download it.
 * Uses the existing, version-bound actions; the detailed record stays one click away.
 */
import { useMutation } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { recordSupervisedExpectation } from "@/lib/pilot-mission.functions";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

export type NextStepActions = {
  nextId: string;
  compare: {
    run: () => void;
    pending: boolean;
    modelConfigured: boolean;
    consented: boolean;
    setConsented: (on: boolean) => void;
  };
  prepare: { run: () => void; pending: boolean };
  exportSlot: ReactNode;
  error: string | null;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
};

function Aria({ children }: { children: ReactNode }) {
  return (
    <div className="plan-aria">
      <AgentAvatar name="Aria" role="Product Manager" size={40} />
      <p>{children}</p>
    </div>
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
  const [hypothesis, setHypothesis] = useState(mission.expectation?.hypothesis ?? "");
  const [metric, setMetric] = useState(mission.expectation?.expectedMetric ?? "");
  const [baseline, setBaseline] = useState(mission.expectation?.baseline ?? "");
  const [window, setWindow] = useState(mission.expectation?.observationWindow ?? "");
  const save = useMutation({
    mutationFn: () =>
      recordSupervisedExpectation({
        data: {
          id: mission.id,
          expectedVersion: mission.version,
          hypothesis,
          expectedMetric: metric,
          baseline,
          observationWindow: window,
        },
      }),
    onSuccess: onDone,
    onError,
  });
  const ready = hypothesis.trim() && metric.trim();
  return (
    <form
      className="plan"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Aria>
        Before I prepare your decision pack: what do you expect to happen, and how will we know?
        This is what we’ll check against later.
      </Aria>
      <label className="room-gate-note">
        What you expect to happen
        <textarea
          rows={2}
          maxLength={2000}
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="e.g. Owners will log waste daily if it takes under two minutes."
        />
      </label>
      <div className="next-grid">
        <label className="room-gate-note">
          How you’ll measure it
          <input
            value={metric}
            maxLength={500}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="e.g. Days logged per week"
          />
        </label>
        <label className="room-gate-note">
          Where it is today (optional)
          <input
            value={baseline}
            maxLength={500}
            onChange={(e) => setBaseline(e.target.value)}
            placeholder="e.g. Not tracked"
          />
        </label>
        <label className="room-gate-note">
          When to check (optional)
          <input
            value={window}
            maxLength={500}
            onChange={(e) => setWindow(e.target.value)}
            placeholder="e.g. After 4 weeks"
          />
        </label>
      </div>
      <div className="plan-actions">
        <button
          type="submit"
          className="room-pill room-pill-primary"
          disabled={!ready || save.isPending}
        >
          {save.isPending ? "Saving…" : "Save and continue"}
        </button>
        <p className="plan-hint">Saved with your case. You record what actually happened later.</p>
      </div>
    </form>
  );
}

export function NextStepPanel({
  mission,
  actions,
}: {
  mission: SupervisedMission;
  actions: NextStepActions;
}) {
  const { nextId, compare, prepare, exportSlot, error } = actions;
  const errorLine = error ? (
    <p className="plan-error" role="alert">
      {error}
    </p>
  ) : null;

  if (nextId === "expectation") {
    return <ExpectationForm mission={mission} onDone={actions.onDone} onError={actions.onError} />;
  }

  if (nextId === "compare" || nextId === "evidence" || nextId === "retry") {
    return (
      <div className="plan">
        <Aria>
          {nextId === "retry"
            ? "The last comparison didn’t finish. Nothing was charged for it — let’s run it again."
            : "The team has what it needs. Next, they draft two or three directions from what they found, each with its trade-offs."}
        </Aria>
        <ul className="plan-unknowns">
          <li>Uses about 1 usage unit</li>
          <li>{mission.usageCeiling} left on this case</li>
        </ul>
        {compare.modelConfigured ? (
          <label className="next-consent">
            <input
              type="checkbox"
              checked={compare.consented}
              onChange={(e) => compare.setConsented(e.target.checked)}
            />
            Use the AI model for this run (a billable model call; otherwise the options are a
            labelled simulated draft)
          </label>
        ) : (
          <p className="plan-hint">
            AI drafting is off, so the options will be a labelled simulated draft.
          </p>
        )}
        <div className="plan-actions">
          {errorLine}
          <button
            type="button"
            className="room-pill room-pill-primary"
            disabled={compare.pending || mission.usageCeiling <= 0}
            onClick={compare.run}
          >
            {compare.pending ? "The team is drafting…" : "Draft the directions"}
          </button>
        </div>
      </div>
    );
  }

  if (nextId === "artefact") {
    return (
      <div className="plan">
        <Aria>
          I’ll put your decision, the other options, the evidence and how everything was made into
          one decision pack.
        </Aria>
        <div className="plan-actions">
          {errorLine}
          <button
            type="button"
            className="room-pill room-pill-primary"
            disabled={prepare.pending}
            onClick={prepare.run}
          >
            {prepare.pending ? "Preparing…" : "Prepare the decision pack"}
          </button>
        </div>
      </div>
    );
  }

  if (nextId === "export") {
    return (
      <div className="plan">
        <Aria>
          Your decision pack is ready. Download it as Markdown and PDF, or the full project ZIP.
        </Aria>
        {errorLine}
        <div className="next-export">{exportSlot}</div>
      </div>
    );
  }

  if (nextId === "recover") {
    return (
      <div className="plan">
        <Aria>
          A comparison is still running. If it doesn’t finish, it can be recovered — a finished
          comparison is never charged twice.
        </Aria>
      </div>
    );
  }

  return (
    <div className="plan">
      <Aria>Nothing needs you right now.</Aria>
    </div>
  );
}
