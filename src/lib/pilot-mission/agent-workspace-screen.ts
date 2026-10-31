/**
 * Screen 9 — Agent workspace view-model.
 * Tabs are populated only from mission / collaboration records.
 */
import { ensureTeamCollaboration } from "./team-collaboration";
import type { TeamFormationCard } from "./team-formation-screen";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type AgentWorkspaceTab =
  "overview" | "tasks" | "inputs" | "outputs" | "evidence" | "handoffs";

export type AgentWorkspaceTask = {
  id: string;
  title: string;
  detail: string;
  status: string;
  dueStage: string;
};

export type AgentWorkspaceOutput = {
  id: string;
  title: string;
  summary: string;
  honestyLabel: string;
};

export type AgentWorkspaceEvidence = {
  id: string;
  statement: string;
  classification: string;
  source: string;
  href: string | null;
};

export type AgentWorkspaceHandoff = {
  id: string;
  direction: "received" | "sent";
  counterpart: string;
  summary: string;
  at: string;
  productionLabel: string;
  evidenceIds: string[];
};

export type AgentWorkspaceModel = {
  card: TeamFormationCard;
  currentAssignment: string;
  progressLabel: string;
  dependencies: string[];
  blockers: string[];
  questionsForAria: string[];
  tasks: AgentWorkspaceTask[];
  inputs: string[];
  outputs: AgentWorkspaceOutput[];
  evidence: AgentWorkspaceEvidence[];
  handoffs: AgentWorkspaceHandoff[];
};

function actorMatches(card: TeamFormationCard, actor: string): boolean {
  if (!actor || card.catalogueOnly) return false;
  if (card.capabilityId && actor === card.capabilityId) return true;
  if (actor === card.name || actor === card.role) return true;
  return false;
}

function dueStageFor(mission: SupervisedMission): string {
  const next = nextRequiredAction(mission);
  if (mission.continuationPlan) return "First-phase delivery plan";
  if (mission.approval) return "Post-decision continuation";
  return next.title || mission.stage;
}

/** Labels this card may appear under on the mission (catalogue name vs plan label). */
function ownerLabelsFor(mission: SupervisedMission, card: TeamFormationCard): Set<string> {
  const labels = new Set<string>([card.name, card.role].filter(Boolean));
  for (const role of mission.continuationPlan?.roles ?? []) {
    if (
      (card.capabilityId != null && role.capabilityId === card.capabilityId) ||
      role.label === card.name ||
      role.label === card.role
    ) {
      labels.add(role.label);
    }
  }
  return labels;
}

function ownsTask(
  card: TeamFormationCard,
  labels: Set<string>,
  capabilityId: string | null,
  ownerLabel: string,
): boolean {
  if (card.catalogueOnly) return false;
  if (card.capabilityId != null && capabilityId != null && capabilityId === card.capabilityId) {
    return true;
  }
  return labels.has(ownerLabel);
}

export function buildAgentWorkspace(
  mission: SupervisedMission,
  card: TeamFormationCard,
): AgentWorkspaceModel {
  const collab = ensureTeamCollaboration(mission);
  const assignments = collab?.assignments ?? [];
  const collabHandoffs = collab?.handoffs ?? [];
  const collabEdges = collab?.edges ?? [];
  const stage = dueStageFor(mission);
  const labels = ownerLabelsFor(mission, card);

  const teamTasks =
    mission.team?.tasks.filter((task) =>
      ownsTask(card, labels, task.capabilityId, task.ownerLabel),
    ) ?? [];

  const roadmapSteps =
    mission.continuationPlan?.roadmap.filter((step) => labels.has(step.ownerLabel)) ?? [];

  const tasks: AgentWorkspaceTask[] = [
    ...teamTasks.map((task) => ({
      id: task.key,
      title: task.title,
      detail: task.produces,
      status:
        task.status === "completed"
          ? "Complete"
          : task.status === "blocked" || task.status === "awaiting_approval"
            ? "Needs attention"
            : task.status === "ready"
              ? "Ready"
              : task.status === "skipped"
                ? "Skipped"
                : "Planned",
      dueStage: stage,
    })),
    ...roadmapSteps.map((step) => ({
      id: step.id,
      title: step.title,
      detail: step.detail,
      status: step.blocked ? "Needs attention" : "Planned",
      dueStage: stage,
    })),
  ];

  // Fall back to formation card task lines when no structured tasks exist.
  if (!tasks.length && card.tasks.length) {
    for (const [index, line] of card.tasks.entries()) {
      tasks.push({
        id: `${card.id}-task-${index}`,
        title: line.split(":")[0] ?? line,
        detail: line,
        status: card.statusLabel,
        dueStage: stage,
      });
    }
  }

  const assignment =
    assignments.find(
      (row) =>
        (card.capabilityId != null && row.capabilityId === card.capabilityId) ||
        labels.has(row.ownerLabel),
    ) ?? null;

  const inputs = [
    ...(assignment?.inputsExpected ?? []),
    ...teamTasks.flatMap((task) => task.uses),
  ].filter(Boolean);
  const uniqueInputs = [...new Set(inputs)];
  if (!uniqueInputs.length && !card.catalogueOnly) {
    uniqueInputs.push("Approved brief, decision, and evidence register on this mission");
  }

  const outputs: AgentWorkspaceOutput[] = [
    ...card.outputs.map((line, index) => ({
      id: `${card.id}-out-${index}`,
      title: line,
      summary: "Planned output on the continuation / team plan.",
      honestyLabel: "Planned — not produced unless saved on the case",
    })),
    ...teamTasks.map((task) => ({
      id: `task-out-${task.key}`,
      title: task.produces,
      summary: task.title,
      honestyLabel:
        task.status === "completed"
          ? "Recorded complete on the plan"
          : "Expected output — not yet complete",
    })),
  ];

  // Optional: proposal artefacts for strategist-like roles when options exist.
  if (
    mission.proposal &&
    /strateg|product manager|option|atlas|aria/i.test(`${card.role} ${card.name}`)
  ) {
    for (const option of mission.proposal.options.slice(0, 3)) {
      outputs.push({
        id: `option-${option.id}`,
        title: option.title,
        summary: option.tradeoff,
        honestyLabel: mission.proposal.generation.ran
          ? mission.proposal.generation.label
          : "Simulated / draft option on the record",
      });
    }
  }

  const evidenceIds = new Set(card.evidence);
  for (const handoff of collabHandoffs) {
    if (actorMatches(card, handoff.fromActor) || actorMatches(card, handoff.toActor)) {
      for (const id of handoff.evidenceIds) evidenceIds.add(id);
    }
  }

  const evidence: AgentWorkspaceEvidence[] = mission.evidence
    .filter((row) => evidenceIds.has(row.id))
    .map((row) => ({
      id: row.id,
      statement: row.statement,
      classification: row.classification,
      source: row.source || "—",
      href: row.source && /^https?:\/\//i.test(row.source.trim()) ? row.source.trim() : null,
    }));

  const handoffs: AgentWorkspaceHandoff[] = collabHandoffs
    .filter(
      (handoff) =>
        !handoff.id.endsWith("-use") &&
        (actorMatches(card, handoff.fromActor) || actorMatches(card, handoff.toActor)),
    )
    .map((handoff) => {
      const received = actorMatches(card, handoff.toActor);
      return {
        id: handoff.id,
        direction: received ? ("received" as const) : ("sent" as const),
        counterpart: received ? handoff.fromActor : handoff.toActor,
        summary: handoff.findingSummary || handoff.request,
        at: handoff.sharedAt,
        productionLabel: handoff.productionLabel,
        evidenceIds: handoff.evidenceIds,
      };
    });

  const dependencies = [
    ...collabEdges
      .filter((edge) => {
        const fromTask = mission.team?.tasks.find((t) => t.key === edge.fromTaskKey);
        const toTask = mission.team?.tasks.find((t) => t.key === edge.toTaskKey);
        return (
          (fromTask && ownsTask(card, labels, fromTask.capabilityId, fromTask.ownerLabel)) ||
          (toTask && ownsTask(card, labels, toTask.capabilityId, toTask.ownerLabel))
        );
      })
      .map((edge) => `${edge.label}: ${edge.fromTaskKey} → ${edge.toTaskKey}`),
  ];

  const blockers = [
    ...(card.question ? [card.question] : []),
    ...roadmapSteps.filter((s) => s.blocked && s.blockedReason).map((s) => s.blockedReason!),
    ...teamTasks.filter((t) => t.blockedReason).map((t) => t.blockedReason as string),
  ];

  const questionsForAria = [
    ...blockers.map((b) => `Blocker to resolve: ${b}`),
    ...(card.catalogueOnly ? ["Should this catalogue role be added to the approved path?"] : []),
    ...(!tasks.length && card.assigned
      ? ["What is the next concrete task for this specialist?"]
      : []),
  ];

  return {
    card,
    currentAssignment:
      assignment?.why ??
      card.why ??
      (card.catalogueOnly
        ? "Not assigned on this case — catalogue illustration only."
        : card.responsibility),
    progressLabel: card.statusLabel,
    dependencies: [...new Set(dependencies)],
    blockers: [...new Set(blockers)],
    questionsForAria,
    tasks,
    inputs: uniqueInputs,
    outputs,
    evidence,
    handoffs,
  };
}
