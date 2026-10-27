/**
 * What is waiting on the owner, across every open mission. Each item is one
 * decision only the owner can make (agents and the scheduler can block on a
 * gate but never pass one), and each links to the record where it is made.
 * Nothing is inferred: an item exists only because a mission or task row says
 * it is waiting.
 */
import { TERMINAL_MISSION_STATUSES, type WfMission, type WfMissionTask } from "./types";

export type InboxKind =
  | "finish_request"
  | "answer_questions"
  | "approve_plan"
  | "decide_gate"
  | "approve_external"
  | "resume";

export type InboxItem = {
  kind: InboxKind;
  missionId: string;
  missionTitle: string;
  /** What the owner is being asked to do, in a few words. */
  action: string;
  /** The task the decision is on, when it is on one. */
  taskId: string | null;
  /** The anchor on the mission page where the decision is made. */
  hash: string;
  /** When the mission last changed, so the oldest waits can be read first. */
  since: string;
};

export const INBOX_KIND_LABELS: Record<InboxKind, string> = {
  finish_request: "Request to finish",
  answer_questions: "Questions to answer",
  approve_plan: "Plan to approve",
  decide_gate: "Stage decision",
  approve_external: "Outside action to approve",
  resume: "Paused by you",
};

// A decision that unblocks downstream work comes before one that starts work.
const ORDER: Record<InboxKind, number> = {
  decide_gate: 0,
  approve_external: 1,
  approve_plan: 2,
  answer_questions: 3,
  finish_request: 4,
  resume: 5,
};

type MissionLike = Pick<
  WfMission,
  "id" | "title" | "status" | "updatedAt" | "externalActionsApproved"
>;
type TaskLike = Pick<
  WfMissionTask,
  | "id"
  | "missionId"
  | "title"
  | "status"
  | "gate"
  | "isExternal"
  | "permissionRequired"
  | "sortOrder"
>;

export function ownerInbox(
  missions: readonly MissionLike[],
  tasks: readonly TaskLike[],
): InboxItem[] {
  const items: InboxItem[] = [];
  for (const m of missions) {
    if (TERMINAL_MISSION_STATUSES.includes(m.status)) continue;
    const base = { missionId: m.id, missionTitle: m.title, since: m.updatedAt, taskId: null };
    if (m.status === "draft")
      items.push({
        ...base,
        kind: "finish_request",
        action: "Finish the mission request",
        hash: "",
      });
    else if (m.status === "needs_clarification")
      items.push({
        ...base,
        kind: "answer_questions",
        action: "Answer the planner’s questions",
        hash: "mission-clarify",
      });
    else if (m.status === "planned" || m.status === "awaiting_approval")
      items.push({
        ...base,
        kind: "approve_plan",
        action: "Approve or reject the plan",
        hash: "mission-plan",
      });
    else if (m.status === "paused")
      items.push({
        ...base,
        kind: "resume",
        action: "Resume or cancel the mission",
        hash: "mission-tasks",
      });

    // A gate or an outside action blocks only an approved, unpaused mission.
    if (m.status === "paused" || m.status === "draft" || m.status === "needs_clarification")
      continue;
    const blocked = tasks
      .filter((t) => t.missionId === m.id && t.status === "blocked")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const t of blocked) {
      const outside = t.isExternal || t.permissionRequired === "act_externally";
      if (t.gate)
        items.push({
          ...base,
          kind: "decide_gate",
          action: `Decide: ${t.title}`,
          taskId: t.id,
          hash: `task-${t.id}`,
        });
      else if (outside && !m.externalActionsApproved)
        items.push({
          ...base,
          kind: "approve_external",
          action: `Approve acting externally: ${t.title}`,
          taskId: t.id,
          hash: `task-${t.id}`,
        });
    }
  }
  return items.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.since.localeCompare(b.since));
}
