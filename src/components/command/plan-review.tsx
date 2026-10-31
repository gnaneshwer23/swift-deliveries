/**
 * Review the plan — Aria's plan in plain words, one decision: approve and start.
 * The detailed brief editor and research settings stay one click away.
 */
import { useState, type ReactNode } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { buildPlanReview } from "@/lib/pilot-mission/plan-review";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

export function PlanReview({
  mission,
  onApprove,
  approving,
  canApprove,
  error,
  editSlot,
}: {
  mission: SupervisedMission;
  onApprove: () => void;
  approving: boolean;
  canApprove: boolean;
  error: string | null;
  editSlot: ReactNode;
}) {
  const plan = buildPlanReview(mission);
  const [editing, setEditing] = useState(false);

  return (
    <div className="plan">
      <div className="plan-aria">
        <AgentAvatar name="Aria" role="Product Manager" size={40} />
        <p>Here’s how I’d investigate your idea. Have a look, then start when you’re ready.</p>
      </div>

      <section className="plan-idea" aria-label="Your idea">
        <span className="room-mono">Your idea</span>
        <p>{plan.idea}</p>
        <button type="button" className="plan-link" onClick={() => setEditing((e) => !e)}>
          {editing ? "Close editing" : "Edit"}
        </button>
      </section>

      <section aria-label="What happens">
        <span className="room-mono">What happens</span>
        <ol className="plan-steps">
          {plan.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <dl className="plan-facts">
        {plan.facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
            <dd className="plan-hint">{f.hint}</dd>
          </div>
        ))}
      </dl>

      {plan.team.length ? (
        <section aria-label="Your team">
          <span className="room-mono">Your team</span>
          <ul className="plan-team">
            {plan.team.map((m) => (
              <li key={`${m.name}-${m.role}`}>
                <AgentAvatar name={m.name} role={m.role} size={36} />
                <span>
                  <b>{m.name}</b>
                  {m.name !== m.role ? <em>{m.role}</em> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Still unknown">
        <span className="room-mono">What we’ll find out</span>
        <ul className="plan-unknowns">
          {plan.unknowns.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        <p className="plan-hint">{plan.research}</p>
      </section>

      {editing ? (
        <section className="plan-edit" aria-label="Edit the brief and research settings">
          {editSlot}
        </section>
      ) : null}

      <div className="plan-actions">
        {error ? (
          <p className="plan-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="room-pill room-pill-primary"
          disabled={!canApprove || approving || Boolean(plan.blocked)}
          onClick={onApprove}
        >
          {approving ? "Starting…" : "Approve and start"}
        </button>
        {!editing ? (
          <button type="button" className="room-pill" onClick={() => setEditing(true)}>
            Edit the brief
          </button>
        ) : null}
        <p className="plan-hint">
          {plan.blocked ?? "Nothing runs until you approve. You can cancel at any time."}
        </p>
      </div>
    </div>
  );
}
