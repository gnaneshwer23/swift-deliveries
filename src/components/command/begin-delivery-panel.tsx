/**
 * Begin delivery — what you are approving: the team, what they will build, where you will be
 * asked, and the AI work budget. One action starts the build; gates stay yours.
 */
import { useMutation } from "@tanstack/react-query";
import { AgentAvatar } from "@/components/command/agent-avatar";
import { beginSupervisedDelivery } from "@/lib/pilot-mission.functions";
import { deliveryEligibility, deliveryPlanPreview } from "@/lib/pilot-mission/delivery";
import { TASK_PERSONA } from "@/lib/pilot-mission/delivery-room";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** "Human gate: approve product scope" → "Approve product scope". */
function gateLabel(title: string): string {
  const t = title.replace(/^human gate:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function BeginDeliveryPanel({
  mission,
  onDone,
}: {
  mission: SupervisedMission;
  onDone: () => Promise<void>;
}) {
  const eligibility = deliveryEligibility(mission);
  const plan = eligibility.ok ? deliveryPlanPreview(mission) : null;
  const option = mission.proposal?.options.find((o) => o.id === mission.approval?.optionId);
  const begin = useMutation({
    mutationFn: () =>
      beginSupervisedDelivery({ data: { id: mission.id, expectedVersion: mission.version } }),
    onSuccess: onDone,
  });

  if (!eligibility.ok || !plan) {
    return (
      <div className="plan">
        <p className="plan-hint">{eligibility.ok ? "" : eligibility.reason}</p>
      </div>
    );
  }

  const work = plan.stages.filter((s) => !s.gate);
  const gates = plan.stages.filter((s) => s.gate);
  const team = [...new Set(work.map((s) => TASK_PERSONA[s.key]).filter(Boolean))] as string[];

  return (
    <div className="plan">
      <div className="plan-aria">
        <AgentAvatar name="Aria" role="Product Manager" size={40} />
        <p>
          Ready to build
          {option ? (
            <>
              {" "}
              <b>{option.title}</b>
            </>
          ) : (
            " your chosen direction"
          )}
          . Here’s who does what, and where I’ll stop for you.
        </p>
      </div>

      <section aria-label="The team">
        <span className="room-mono">The team</span>
        <ul className="plan-team">
          {team.map((name) => (
            <li key={name}>
              <AgentAvatar name={name} size={36} />
              <span>
                <b>{name}</b>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="What they build">
        <span className="room-mono">What they build, in order</span>
        <ol className="plan-steps">
          {work.map((s) => (
            <li key={s.key}>
              <span>
                {s.title}
                {TASK_PERSONA[s.key] ? (
                  <span className="plan-hint"> · {TASK_PERSONA[s.key]}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Where you decide">
        <span className="room-mono">Where I’ll stop for you</span>
        <ul className="plan-unknowns">
          {gates.map((g) => (
            <li key={g.key}>{gateLabel(g.title)}</li>
          ))}
        </ul>
        <p className="plan-hint">Agents can stop at these points but never pass them.</p>
      </section>

      <dl className="plan-facts">
        <div>
          <dt>AI work budget</dt>
          <dd>About {plan.estimatedUsage} usage units</dd>
          <dd className="plan-hint">Work stops at your usage ceiling.</dd>
        </div>
        <div>
          <dt>Outside actions</dt>
          <dd>{plan.stages.some((s) => s.outside) ? "Need your separate approval" : "None"}</dd>
          <dd className="plan-hint">Nothing is published or sent without you.</dd>
        </div>
      </dl>

      <div className="plan-actions">
        {begin.error ? (
          <p className="plan-error" role="alert">
            {begin.error instanceof Error ? begin.error.message : "Delivery could not start."}
          </p>
        ) : null}
        <button
          type="button"
          className="room-pill room-pill-primary"
          disabled={begin.isPending}
          onClick={() => begin.mutate()}
        >
          {begin.isPending ? "Starting…" : "Start the build"}
        </button>
        <p className="plan-hint">Your approval is saved with the plan it starts.</p>
      </div>
    </div>
  );
}
