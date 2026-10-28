import { PERMISSION_LEVELS, type PermissionLevel, type TaskStatus } from "./types";

/**
 * Deterministic permission ladder (infrastructure service — not an agent).
 *
 * Governance (Workforce Architecture Spec §7): DX-148 Execution Monitoring and
 * DX-149 Cost and Budget Control may advise, but permission ceilings and budget
 * hard-stops remain enforced here / in usage.ts — never by agent recommendation alone.
 */
const RANK: Record<PermissionLevel, number> = {
  plan: 0,
  create: 1,
  execute_internally: 2,
  act_externally: 3,
};

/** True when the granted ceiling is high enough for the required level. */
export function permissionAllows(granted: PermissionLevel, required: PermissionLevel): boolean {
  return RANK[granted] >= RANK[required];
}

/** Highest permission among a set of task requirements. */
export function maxPermission(levels: PermissionLevel[]): PermissionLevel {
  if (levels.length === 0) return "plan";
  return levels.reduce((acc, level) => (RANK[level] > RANK[acc] ? level : acc));
}

/** External actions always need an explicit extra approval beyond plan approval. */
export function requiresExternalApproval(
  required: PermissionLevel,
  externalActionsApproved: boolean,
): boolean {
  return required === "act_externally" && !externalActionsApproved;
}

export function isPermissionLevel(value: string): value is PermissionLevel {
  return (PERMISSION_LEVELS as readonly string[]).includes(value);
}

export function permissionRank(level: PermissionLevel): number {
  return RANK[level];
}

/**
 * A task that needs the owner to approve acting externally before it runs:
 * the executor blocks it, and the views say it waits on the owner.
 */
export function awaitsExternalApproval(
  task: { isExternal: boolean; permissionRequired: PermissionLevel },
  externalActionsApproved: boolean,
): boolean {
  return (
    requiresExternalApproval(task.permissionRequired, externalActionsApproved) ||
    (task.isExternal && !externalActionsApproved)
  );
}

/**
 * A blocked task the worker puts back in the schedule once the owner has
 * approved acting externally: any task the executor would hold for that
 * approval, by the same rule as `awaitsExternalApproval`.
 */
export function rerunsAfterExternalApproval(
  task: { status: TaskStatus; isExternal: boolean; permissionRequired: PermissionLevel },
  externalActionsApproved: boolean,
): boolean {
  return (
    task.status === "blocked" && externalActionsApproved && awaitsExternalApproval(task, false)
  );
}
