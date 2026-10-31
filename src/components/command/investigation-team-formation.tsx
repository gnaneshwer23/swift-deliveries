import { useState } from "react";
import { ConversationPanel } from "@/components/command/conversation-panel";
import type { ContinuationRole } from "@/lib/pilot-mission/continuation-plan";
import type { PilotSpecialistTask } from "@/lib/pilot-mission/specialist-team";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

type AgentStatus = "planned" | "working" | "complete" | "blocked";

type FormationAgent = {
  id: string;
  label: string;
  capabilityId: string | null;
  responsibility: string;
  why: string;
  tasks: string[];
  inputs: string[];
  outputs: string[];
  evidence: string[];
  status: AgentStatus;
  question: string | null;
};

function statusFromEvents(
  mission: SupervisedMission,
  capabilityId: string | null,
  label: string,
  blocked: boolean,
  taskKeys: string[] = [],
): AgentStatus {
  if (blocked) return "blocked";
  const relevant = taskKeys.length
    ? (mission.activity ?? []).filter(
        (event) =>
          (event.actor === capabilityId || event.actor === label) &&
          event.taskKey !== null &&
          taskKeys.includes(event.taskKey),
      )
    : [];
  if (relevant.some((event) => /complete|finished|settled/i.test(event.kind))) return "complete";
  if (relevant.some((event) => /start|running|leased/i.test(event.kind))) return "working";
  return "planned";
}

function handoffEvidence(mission: SupervisedMission, capabilityId: string | null, label: string) {
  const handoffs = mission.teamCollaboration?.handoffs ?? [];
  return handoffs
    .filter((handoff) => handoff.fromActor === capabilityId || handoff.toActor === capabilityId ||
      handoff.fromActor === label || handoff.toActor === label)
    .flatMap((handoff) => handoff.evidenceIds);
}

function agentsForMission(mission: SupervisedMission): FormationAgent[] {
  const plan = mission.continuationPlan;
  if (plan?.roles.length) {
    return plan.roles
      .filter((role) => role.capabilityId !== null)
      .map((role: ContinuationRole) => {
        const steps = plan.roadmap.filter((step) => step.ownerLabel === role.label);
        const blockedStep = steps.find((step) => step.blocked);
        const status = statusFromEvents(
          mission,
          role.capabilityId,
          role.label,
          Boolean(blockedStep || plan.executionBlocked),
          steps.map((step) => step.id),
        );
        return {
          id: role.capabilityId ?? role.label,
          label: role.label,
          capabilityId: role.capabilityId,
          responsibility: role.responsibility,
          why: role.why,
          tasks: steps.length
            ? steps.map((step) => `${step.title}: ${step.detail}`)
            : ["No roadmap task is assigned to this role yet."],
          inputs: [],
          outputs: role.plannedArtefacts,
          evidence: handoffEvidence(mission, role.capabilityId, role.label),
          status,
          question: blockedStep?.blockedReason ?? (plan.executionBlocked ? plan.executionBlockedReason : null),
        };
      });
  }

  const tasks = mission.team?.tasks.filter((task) => task.actor === "specialist") ?? [];
  return tasks.map((task: PilotSpecialistTask) => ({
    id: task.capabilityId ?? task.key,
    label: task.ownerLabel,
    capabilityId: task.capabilityId,
    responsibility: task.title,
    why: task.produces,
    tasks: [task.title],
    inputs: task.uses,
    outputs: [task.produces],
    evidence: handoffEvidence(mission, task.capabilityId, task.ownerLabel),
    status: task.status === "completed" ? "complete" : task.status === "blocked" ? "blocked" : task.status === "ready" ? "working" : "planned",
    question: task.blockedReason,
  }));
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  planned: "Planned",
  working: "In progress",
  complete: "Complete",
  blocked: "Needs attention",
};

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
  ) : <p className="cc-muted text-sm">{empty}</p>;
}

/** Introduces only roles assigned on this mission record; status and evidence are record-backed. */
export function InvestigationTeamFormation({ mission }: { mission: SupervisedMission }) {
  const agents = agentsForMission(mission);
  const [selectedId, setSelectedId] = useState<string | null>(agents[0]?.id ?? null);
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0] ?? null;
  const updates = [...(mission.activity ?? [])].slice(-6).reverse();
  const taskCount = mission.continuationPlan?.roadmap.length ?? mission.team?.tasks.filter((task) => task.actor === "specialist").length ?? 0;
  const blockerCount = mission.continuationPlan?.roadmap.filter((step) => step.blocked).length ?? mission.team?.tasks.filter((task) => task.status === "blocked").length ?? 0;
  const workingCount = agents.filter((agent) => agent.status === "working").length;
  const recordedUpdatesCount = updates.length;
  const suppliedCount = mission.evidence.filter((item) => item.classification === "supplied").length;
  const gapCount = mission.evidence.filter((item) => item.classification === "gap").length;

  return (
    <section className="ps-team-formation" aria-label="Team formation">
      <header className="ps-team-formation-head">
        <p className="cc-kicker">Step 5 · team formation</p>
        <h2>Meet your project team</h2>
        <p className="cc-muted text-sm">
          These are the specialist roles selected for your approved path. Open a role to see its
          responsibilities, tasks, inputs, outputs, evidence, and recorded status.
        </p>
      </header>

      <p className="ps-team-formation-disclosure">
        DeliverX has a larger specialist catalogue. This screen shows only roles in this mission’s
        approved continuation plan. Planned roles have not started work; status changes appear only
        when worker events are saved to the mission record.
      </p>

      <div className="ps-team-formation-metrics" aria-label="Team summary">
        <div><strong>{agents.length}</strong><span>assigned specialist roles</span></div>
        <div><strong>{taskCount}</strong><span>planned tasks</span></div>
        <div><strong>{recordedUpdatesCount}</strong><span>saved mission updates</span></div>
        <div><strong>{blockerCount}</strong><span>recorded blockers</span></div>
      </div>

      {mission.continuationPlan ? (
        <section className="ps-team-roadmap-review" id="continuation-plan">
          <h3>Review the proposed work before implementation</h3>
          <p className="cc-muted text-sm">{mission.continuationPlan.summary}</p>
          <ol>
            {mission.continuationPlan.roadmap.map((step) => (
              <li key={step.id} data-blocked={step.blocked ? "true" : undefined}>
                <strong>{step.title}</strong><span>{step.ownerLabel}</span>
                <p>{step.detail}</p>
                {step.blockedReason ? <p className="ps-team-blocker">Needs attention: {step.blockedReason}</p> : null}
              </li>
            ))}
          </ol>
          <p className="cc-muted text-xs">
            This plan is for review. Implementation status changes only after the next approval and recorded worker activity.
          </p>
        </section>
      ) : null}

      {mission.continuationPlan ? (
        <div className="ps-team-formation-plan">
          <div>
            <p className="cc-kicker">Approved path</p>
            <h3>{mission.continuationPlan.title}</h3>
            <p>{mission.continuationPlan.summary}</p>
          </div>
          <a className="cc-btn cc-btn-secondary" href="#continuation-plan">Review plan</a>
        </div>
      ) : null}

      {agents.length ? (
        <div className="ps-team-formation-grid">
          <nav className="ps-team-roster" aria-label="Assigned specialist roles">
            <h3>Your team</h3>
            <ul>
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    type="button"
                    className="ps-team-roster-agent"
                    data-selected={selected?.id === agent.id ? "true" : undefined}
                    aria-pressed={selected?.id === agent.id}
                    onClick={() => setSelectedId(agent.id)}
                  >
                    <span className="ps-team-avatar" aria-hidden="true">{agent.label.slice(0, 1)}</span>
                    <span className="ps-team-roster-copy">
                      <strong>{agent.label}</strong>
                      <small>{agent.capabilityId ?? "Human role"}</small>
                    </span>
                    <span className="ps-team-status" data-state={agent.status}>{STATUS_LABELS[agent.status]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {selected ? (
            <article className="ps-team-agent-profile" aria-live="polite">
              <header>
                <span className="ps-team-avatar ps-team-avatar-large" aria-hidden="true">{selected.label.slice(0, 1)}</span>
                <div>
                  <p className="cc-kicker">Assigned specialist · {selected.capabilityId}</p>
                  <h3>{selected.label}</h3>
                </div>
                <span className="ps-team-status" data-state={selected.status}>{STATUS_LABELS[selected.status]}</span>
              </header>
              <p className="ps-team-agent-purpose">{selected.responsibility}</p>
              <p className="ps-team-agent-why"><strong>Why this role:</strong> {selected.why}</p>

              <div className="ps-team-detail-grid">
                <section><h4>Current tasks</h4><BulletList items={selected.tasks} empty="No task assigned." /></section>
                <section>
                  <h4>Inputs</h4>
                  {selected.inputs.length ? <BulletList items={selected.inputs} empty="" /> :
                    <p className="cc-muted text-sm">The approved brief, decision, and evidence register remain on the mission. Role-specific inputs are not listed in this plan.</p>}
                </section>
                <section><h4>Outputs</h4><BulletList items={selected.outputs} empty="No output recorded yet." /></section>
                <section><h4>Evidence</h4>
                  {selected.evidence.length ? <BulletList items={[...new Set(selected.evidence)]} empty="" /> :
                    <p className="cc-muted text-sm">Mission register: {suppliedCount} supplied finding(s), {gapCount} labelled gap(s). No role-specific evidence handoff is recorded yet.</p>}
                </section>
              </div>

              <div className="ps-team-progress" data-state={selected.status}>
                <div><strong>Recorded progress</strong><span>{STATUS_LABELS[selected.status]}</span></div>
                <p>{selected.question ? `Blocker: ${selected.question}` : "No question or blocker is recorded for this role yet."}</p>
                <small>Progress reflects saved events; no percentage is estimated.</small>
              </div>

              <p className="ps-team-agent-actions">
                <a className="cc-btn cc-btn-secondary" href="#conversation-title">Ask the PM about this role</a>
                <a className="cc-btn cc-btn-secondary" href="#pr-artefacts">View project work</a>
              </p>
            </article>
          ) : null}
        </div>
      ) : (
        <p className="cc-muted text-sm">No specialist roles are assigned to this path. The approved case will be retained without a delivery team.</p>
      )}

      <section className="ps-team-updates" aria-label="Recorded mission updates">
        <div><h3>Latest mission updates</h3><p className="cc-muted text-xs">Events already saved to this mission; they may include earlier investigation work.</p></div>
        {updates.length ? (
          <ul>{updates.map((event) => <li key={event.id}><strong>{event.actor}</strong><span>{event.summary}</span></li>)}</ul>
        ) : <p className="cc-muted text-sm">No continuation work events are recorded yet.</p>}
      </section>

      <details className="ps-team-ask-pm" id="ps-team-ask-pm">
        <summary>Ask the PM about this team</summary>
        <ConversationPanel
          currentMissionId={mission.id}
          title="Discuss the team with your PM"
          helperText="Ask why a role was selected, challenge an assignment, or request a change. The conversation does not approve new work."
          placeholder="Ask about an agent, task, or blocker…"
          suggestedPrompts={[
            "Why is this role needed for my project?",
            "What is blocking the next task?",
            "Suggest a smaller team for this scope.",
          ]}
        />
      </details>
    </section>
  );
}
