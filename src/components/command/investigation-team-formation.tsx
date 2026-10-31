import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { AgentWorkspacePanel } from "@/components/command/agent-workspace-panel";
import { CaseChatPanel } from "@/components/command/case-chat-panel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  buildTeamFormationCards,
  teamFormationIntro,
} from "@/lib/pilot-mission/team-formation-screen";
import { beginSupervisedDelivery } from "@/lib/pilot-mission.functions";
import { deliveryEligibility, deliveryPlanPreview } from "@/lib/pilot-mission/delivery";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/team-formation-screen.css";

/**
 * Screen 8 — Team formation after an approved direction.
 * Clicking a specialist opens Screen 9 Agent workspace.
 */
export function InvestigationTeamFormation({
  mission,
  onBeginDelivery,
  onDone,
}: {
  mission: SupervisedMission;
  /** Moves the journey on once delivery has started. */
  onBeginDelivery?: () => void;
  /** Reloads the case after delivery starts. */
  onDone?: () => Promise<void>;
}) {
  const cards = buildTeamFormationCards(mission);
  const intro = teamFormationIntro(mission);
  const assigned = cards.filter((card) => card.assigned);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = cards.find((card) => card.id === selectedId) ?? null;
  const updates = [...(mission.activity ?? [])].slice(-6).reverse();

  return (
    <section className="tf" aria-label="Team formation" data-studio-screen="team-formation">
      <header className="tf-head">
        <div className="tf-aria">
          <span className="tf-avatar-aria" aria-hidden="true">
            AR
          </span>
          <div>
            <strong>Aria</strong>
            <span>AI Product Manager</span>
          </div>
        </div>
        <h2>{intro.headline}</h2>
        <p className="tf-intro">{intro.message}</p>
        <p className="tf-disclosure">
          DeliverX has a larger specialist catalogue. Cards marked “Not on this path” are
          illustrative catalogue roles for this screen — they are not activated workers on your
          case. Open a card for the Agent workspace.
        </p>
      </header>

      {mission.continuationPlan ? (
        <section className="tf-head" id="continuation-plan">
          <p className="cc-kicker">Approved path plan</p>
          <h3 className="text-base font-semibold m-0 mb-2">{mission.continuationPlan.title}</h3>
          <p className="tf-intro">{mission.continuationPlan.summary}</p>
          {mission.continuationPlan.executionBlocked ? (
            <p className="cc-muted text-sm mt-2 mb-0">
              Execution blocked: {mission.continuationPlan.executionBlockedReason}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="tf-stage">
        <div className="tf-constellation" aria-hidden="true">
          <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1">
              <path d="M80 80 L220 140 L360 90 L520 160 L680 100 L820 150" />
              <path d="M100 300 L260 250 L420 320 L600 240 L780 300" />
            </g>
            <g fill="rgba(34,211,238,0.35)">
              <circle cx="220" cy="140" r="3" />
              <circle cx="520" cy="160" r="3" />
              <circle cx="420" cy="320" r="2.5" />
              <circle cx="680" cy="100" r="3" />
            </g>
          </svg>
        </div>

        <div className="tf-grid" role="list" aria-label="Specialist team">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className="tf-card"
              role="listitem"
              data-assigned={card.assigned ? "true" : "false"}
              onClick={() => setSelectedId(card.id)}
            >
              <div className="tf-card-top">
                <span className="tf-avatar" aria-hidden="true">
                  {card.name.slice(0, 1)}
                </span>
                <div>
                  <h3>{card.name}</h3>
                  <p className="tf-role">{card.role}</p>
                </div>
              </div>
              <p>{card.responsibility}</p>
              <span className="tf-status" data-state={card.status}>
                <i aria-hidden="true" />
                {card.statusLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      <BeginDelivery
        mission={mission}
        teamAssigned={assigned.length > 0}
        onStarted={onBeginDelivery}
        onDone={onDone}
      />

      <section className="tf-head" aria-label="Recorded mission updates">
        <h3 className="text-base font-semibold m-0 mb-2">Latest mission updates</h3>
        {updates.length ? (
          <ul className="m-0 pl-4 text-sm text-[color:var(--sx-muted)]">
            {updates.map((event) => (
              <li key={event.id}>
                <strong>{event.actor}</strong> — {event.summary}
              </li>
            ))}
          </ul>
        ) : (
          <p className="tf-intro">No continuation work events are recorded yet.</p>
        )}
      </section>

      <details className="tf-head" id="ps-team-ask-pm">
        <summary>Ask the PM about this team</summary>
        <div className="mt-3">
          <CaseChatPanel
            mission={mission}
            title="Discuss the team with Aria"
            helperText="Ask why a role was selected, what is blocking the next task, or what the team has produced."
            placeholder="Ask about an agent, task, or blocker…"
            suggestedPrompts={[
              "Why is this role needed for my project?",
              "What is blocking the next task?",
              "Which outputs has the team completed?",
            ]}
          />
        </div>
      </details>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="sx w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Agent workspace</SheetTitle>
            <SheetDescription>
              Auditable profile for this specialist — overview, tasks, inputs, outputs, evidence,
              and handoffs from the case record.
            </SheetDescription>
          </SheetHeader>
          {selected ? <AgentWorkspacePanel mission={mission} card={selected} /> : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

/**
 * "Begin delivery" is the owner's approval to start the build mission for the decided
 * direction. It is confirmed first, and once delivery exists it links to it instead.
 */
function BeginDelivery({
  mission,
  teamAssigned,
  onStarted,
  onDone,
}: {
  mission: SupervisedMission;
  teamAssigned: boolean;
  onStarted: (() => void) | undefined;
  onDone: (() => Promise<void>) | undefined;
}) {
  const [confirming, setConfirming] = useState(false);
  const caseEligibility = deliveryEligibility(mission);
  const eligibility: typeof caseEligibility =
    caseEligibility.ok && !teamAssigned
      ? { ok: false, reason: "No specialists are assigned to this path yet." }
      : caseEligibility;
  const plan = confirming && eligibility.ok ? deliveryPlanPreview(mission) : null;
  const begin = useMutation({
    mutationFn: () =>
      beginSupervisedDelivery({ data: { id: mission.id, expectedVersion: mission.version } }),
    onSuccess: async () => {
      setConfirming(false);
      await onDone?.();
      onStarted?.();
    },
  });

  if (mission.delivery) {
    return (
      <div className="tf-actions" role="status">
        <p className="tf-disclosure m-0">
          Delivery started{" "}
          {new Date(mission.delivery.approvedAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Scope, design and release wait on your approval in the delivery mission.
        </p>
        <Link
          to="/command/missions/$missionId"
          params={{ missionId: mission.delivery.wfMissionId }}
          className="tf-btn tf-btn-primary"
        >
          Open delivery mission
        </Link>
        <a className="tf-btn tf-btn-ghost" href="#ps-team-ask-pm">
          Ask Aria about the team
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="tf-actions">
        <button
          type="button"
          className="tf-btn tf-btn-primary"
          disabled={!eligibility.ok || confirming}
          onClick={() => setConfirming(true)}
        >
          Begin delivery
        </button>
        <a className="tf-btn tf-btn-ghost" href="#ps-team-ask-pm">
          Ask Aria about the team
        </a>
      </div>
      {!eligibility.ok ? <p className="tf-disclosure">{eligibility.reason}</p> : null}
      {confirming && plan ? (
        <section className="tf-head" role="region" aria-label="Approve delivery">
          <h3 className="text-base font-semibold m-0 mb-2">Approve delivery</h3>
          <p className="text-sm m-0 mb-2">
            This starts a build mission for the direction you approved. Specialists work through:
          </p>
          <ol className="m-0 mb-2 pl-5 text-sm">
            {plan.stages.map((stage) => (
              <li key={stage.key}>
                {stage.gate ? (
                  <strong>{stage.title} (your approval)</strong>
                ) : stage.outside ? (
                  `${stage.title} (needs its own approval for outside actions)`
                ) : (
                  stage.title
                )}
              </li>
            ))}
          </ol>
          <p className="text-sm m-0 mb-3">
            The plan estimates about {plan.estimatedUsage} usage units; work stops if your workspace
            ceiling is reached. Each output says how it was produced (model id or Simulated draft).
            Outside actions are not approved now, and this case’s brief and evidence stay fixed from
            now on.
          </p>
          <div className="tf-actions">
            <button
              type="button"
              className="tf-btn tf-btn-primary"
              disabled={begin.isPending}
              onClick={() => begin.mutate()}
            >
              {begin.isPending ? "Starting delivery…" : "Approve and begin delivery"}
            </button>
            <button
              type="button"
              className="tf-btn tf-btn-ghost"
              disabled={begin.isPending}
              onClick={() => setConfirming(false)}
            >
              Not yet
            </button>
          </div>
          {begin.isError ? (
            <p className="cc-error mt-2" role="alert">
              {begin.error instanceof Error
                ? begin.error.message
                : "Delivery could not be started. Nothing was changed."}
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
