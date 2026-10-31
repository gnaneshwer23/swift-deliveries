/**
 * Screen 8 — Team formation view-model.
 * Assigned roles come from the mission; catalogue placeholders are never shown as working.
 */
import type { ContinuationRole } from "./continuation-plan";
import type { PilotSpecialistTask } from "./specialist-team";
import type { SupervisedMission } from "./types";

export type TeamFormationStatus = "planned" | "working" | "complete" | "blocked" | "not_assigned";

export type TeamFormationCard = {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  status: TeamFormationStatus;
  statusLabel: string;
  assigned: boolean;
  capabilityId: string | null;
  why: string;
  tasks: string[];
  outputs: string[];
  evidence: string[];
  question: string | null;
  /** Catalogue illustration not on this case — never claim activity. */
  catalogueOnly: boolean;
};

/** Preferred first-phase display roles from the product brief (matched when present on the case). */
export const TEAM_FORMATION_CATALOGUE = [
  {
    role: "Product Manager",
    name: "Aria",
    responsibility: "Owns the brief, decisions, and specialist coordination.",
    match: /product manager|chief of staff|pm\b|aria/i,
  },
  {
    role: "Idea Analyst",
    name: "Iris",
    responsibility: "Frames the problem and sharpens the one-liner.",
    match: /idea|problem-fram|framing/i,
  },
  {
    role: "Market Researcher",
    name: "Scout",
    responsibility: "Maps market context from the evidence register.",
    match: /market/i,
  },
  {
    role: "Competitor Analyst",
    name: "Rex",
    responsibility: "Compares alternatives already on the record.",
    match: /competit|alternativ/i,
  },
  {
    role: "User Researcher",
    name: "Maya",
    responsibility: "Surfaces user needs and evidence gaps.",
    match: /user research|customer|audience|need/i,
  },
  {
    role: "Product Strategist",
    name: "Atlas",
    responsibility: "Shapes options and the recommended first version.",
    match: /strateg|proposition|option/i,
  },
  {
    role: "UX Designer",
    name: "Lumen",
    responsibility: "Designs the first workflow for day-one value.",
    match: /ux|experience design|workflow/i,
  },
  {
    role: "UI Designer",
    name: "Pixel",
    responsibility: "Defines interface structure for the first surface.",
    match: /ui design|interface|visual design/i,
  },
  {
    role: "Frontend Engineer",
    name: "Forge",
    responsibility: "Implements the client experience for the approved slice.",
    match: /frontend|front-end|client/i,
  },
  {
    role: "Backend Engineer",
    name: "Relay",
    responsibility: "Builds services and data paths for the approved slice.",
    match: /backend|back-end|api|service/i,
  },
  {
    role: "QA Engineer",
    name: "Nova",
    responsibility: "Defines acceptance checks and recorded risks.",
    match: /qa|quality|test|acceptance/i,
  },
  {
    role: "Technical Architect",
    name: "Keystone",
    responsibility: "Guides feasible architecture boundaries for phase one.",
    match: /architect|feasib|technical/i,
  },
  {
    role: "Project Coordinator",
    name: "Harbor",
    responsibility: "Sequences handoffs and keeps blockers visible.",
    match: /coordina|project|delivery manager|ops/i,
  },
  {
    role: "Documentation Agent",
    name: "Quill",
    responsibility: "Keeps the decision trail and exports readable.",
    match: /document|pack|artefact|export|writer/i,
  },
] as const;

const STATUS_LABELS: Record<TeamFormationStatus, string> = {
  planned: "Planned",
  working: "In progress",
  complete: "Complete",
  blocked: "Needs attention",
  not_assigned: "Not on this path",
};

type AssignedAgent = {
  id: string;
  label: string;
  capabilityId: string | null;
  responsibility: string;
  why: string;
  tasks: string[];
  outputs: string[];
  evidence: string[];
  status: Exclude<TeamFormationStatus, "not_assigned">;
  question: string | null;
};

function statusFromEvents(
  mission: SupervisedMission,
  capabilityId: string | null,
  label: string,
  blocked: boolean,
  taskKeys: string[] = [],
): Exclude<TeamFormationStatus, "not_assigned"> {
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
    .filter(
      (handoff) =>
        handoff.fromActor === capabilityId ||
        handoff.toActor === capabilityId ||
        handoff.fromActor === label ||
        handoff.toActor === label,
    )
    .flatMap((handoff) => handoff.evidenceIds);
}

export function assignedAgentsForMission(mission: SupervisedMission): AssignedAgent[] {
  const plan = mission.continuationPlan;
  if (plan?.roles.length) {
    return plan.roles
      .filter((role) => role.capabilityId !== null || role.label.trim())
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
          outputs: role.plannedArtefacts,
          evidence: handoffEvidence(mission, role.capabilityId, role.label),
          status,
          question:
            blockedStep?.blockedReason ??
            (plan.executionBlocked ? plan.executionBlockedReason : null),
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
    outputs: [task.produces],
    evidence: handoffEvidence(mission, task.capabilityId, task.ownerLabel),
    status: statusFromEvents(
      mission,
      task.capabilityId,
      task.ownerLabel,
      task.status === "blocked" || task.status === "awaiting_approval",
      [task.key],
    ),
    question: task.blockedReason,
  }));
}

export function buildTeamFormationCards(mission: SupervisedMission): TeamFormationCard[] {
  const assigned = assignedAgentsForMission(mission);
  const used = new Set<string>();
  const cards: TeamFormationCard[] = [];

  for (const catalogue of TEAM_FORMATION_CATALOGUE) {
    const match = assigned.find(
      (agent) =>
        !used.has(agent.id) &&
        (catalogue.match.test(agent.label) ||
          catalogue.match.test(agent.responsibility) ||
          catalogue.match.test(agent.why)),
    );
    if (match) {
      used.add(match.id);
      cards.push({
        id: match.id,
        name: catalogue.name,
        role: catalogue.role,
        responsibility: match.responsibility || catalogue.responsibility,
        status: match.status,
        statusLabel: STATUS_LABELS[match.status],
        assigned: true,
        capabilityId: match.capabilityId,
        why: match.why,
        tasks: match.tasks,
        outputs: match.outputs,
        evidence: match.evidence,
        question: match.question,
        catalogueOnly: false,
      });
    } else {
      cards.push({
        id: `catalogue:${catalogue.role}`,
        name: catalogue.name,
        role: catalogue.role,
        responsibility: catalogue.responsibility,
        status: "not_assigned",
        statusLabel: STATUS_LABELS.not_assigned,
        assigned: false,
        capabilityId: null,
        why: "This catalogue role is not selected for the approved path on this case.",
        tasks: [],
        outputs: [],
        evidence: [],
        question: null,
        catalogueOnly: true,
      });
    }
  }

  // Any assigned agents that did not map to the brief’s named set still appear.
  for (const agent of assigned) {
    if (used.has(agent.id)) continue;
    cards.push({
      id: agent.id,
      name: agent.label,
      role: agent.label,
      responsibility: agent.responsibility,
      status: agent.status,
      statusLabel: STATUS_LABELS[agent.status],
      assigned: true,
      capabilityId: agent.capabilityId,
      why: agent.why,
      tasks: agent.tasks,
      outputs: agent.outputs,
      evidence: agent.evidence,
      question: agent.question,
      catalogueOnly: false,
    });
  }

  return cards;
}

export function teamFormationIntro(mission: SupervisedMission): {
  headline: string;
  message: string;
} {
  const assignedCount = assignedAgentsForMission(mission).length;
  if (!mission.approval && !mission.continuationPlan) {
    return {
      headline: "Team formation waits on your decision",
      message:
        "Approve a direction first. Aria will then show only the specialists selected for that path.",
    };
  }
  if (assignedCount === 0) {
    return {
      headline: "No delivery team on this path",
      message:
        "Your decision is on the record, but no specialist roles were assigned to the authorised path yet.",
    };
  }
  return {
    headline: "Your delivery team is ready",
    message: `Based on your approved direction, I’ve selected ${assignedCount} specialist${
      assignedCount === 1 ? "" : "s"
    } for the first phase. Status changes only when work is saved to this case — roles marked “Not on this path” are catalogue illustrations, not active agents.`,
  };
}
