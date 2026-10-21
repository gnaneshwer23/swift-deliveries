import { PERMISSION_LEVELS, type PermissionLevel } from "./types";

const RANK: Record<PermissionLevel, number> = {
  plan: 0,
  create: 1,
  execute_internally: 2,
  act_externally: 3,
};

/** True when the granted ceiling is high enough for the required level. */
export function permissionAllows(
  granted: PermissionLevel,
  required: PermissionLevel,
): boolean {
  return RANK[granted] >= RANK[required];
}

/** Highest permission among a set of task requirements. */
export function maxPermission(levels: PermissionLevel[]): PermissionLevel {
  if (levels.length === 0) return "plan";
  return levels.reduce((acc, level) =>
    RANK[level] > RANK[acc] ? level : acc,
  );
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
