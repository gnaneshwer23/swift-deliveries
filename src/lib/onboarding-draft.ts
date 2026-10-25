import { DX_GOALS, DX_ROLES, DX_TEAM_SIZES, type DxProfile } from "./dx-profile";
import type { ProductBrief } from "./marketing/product-resources";
export type SetupFields = Omit<DxProfile, "completedAt">;
export type SetupDraft = SetupFields & { savedAt?: string; step?: number };
export const EMPTY_SETUP: SetupFields = {
  fullName: "",
  role: "",
  teamSize: "",
  goal: "",
  firstIdea: "",
};

/** Untrusted browser drafts must not restore invalid enum values or arbitrary steps. */
export function parseSetupDraft(raw: string | null): SetupDraft | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    return {
      fullName:
        typeof (data.fullName ?? data.name) === "string"
          ? (data.fullName ?? data.name).slice(0, 80)
          : "",
      role: DX_ROLES.includes(data.role) ? data.role : "",
      teamSize: DX_TEAM_SIZES.includes(data.teamSize) ? data.teamSize : "",
      goal: DX_GOALS.includes(data.goal) ? data.goal : "",
      firstIdea: typeof data.firstIdea === "string" ? data.firstIdea.slice(0, 1000) : "",
      savedAt:
        typeof data.savedAt === "string" && Number.isFinite(Date.parse(data.savedAt))
          ? data.savedAt
          : undefined,
      step: Number.isInteger(data.step) ? Math.max(0, Math.min(2, data.step)) : 0,
    };
  } catch {
    return null;
  }
}
export function contextComplete(draft: SetupFields): boolean {
  return (
    draft.fullName.trim().length >= 2 &&
    DX_ROLES.includes(draft.role as (typeof DX_ROLES)[number]) &&
    DX_TEAM_SIZES.includes(draft.teamSize as (typeof DX_TEAM_SIZES)[number])
  );
}
export function directionComplete(draft: SetupFields): boolean {
  return DX_GOALS.includes(draft.goal as (typeof DX_GOALS)[number]);
}
export function safeSetupStep(step: number, fields: SetupFields): number {
  if (!contextComplete(fields)) return 0;
  if (!directionComplete(fields)) return Math.min(step, 1);
  return Math.max(0, Math.min(2, step));
}
/** One snapshot wins as a whole; clearing a field must not resurrect an older value. */
export function restoreSetup(input: {
  existing?: DxProfile | null;
  local?: SetupDraft | null;
  server?: (SetupFields & { updatedAt?: string; completedAt?: string | null }) | null;
  brief?: ProductBrief | null;
  accountName?: string;
}): {
  fields: SetupFields;
  step: number;
  source: "profile" | "browser" | "account" | "brief" | "new";
} {
  const { existing, local, server, brief, accountName } = input;
  if (existing)
    return {
      fields: {
        fullName: existing.fullName,
        role: existing.role,
        teamSize: existing.teamSize,
        goal: existing.goal,
        firstIdea: existing.firstIdea,
      },
      step: 0,
      source: "profile",
    };
  const localTime = Date.parse(local?.savedAt ?? "") || 0;
  const serverTime = Date.parse(server?.updatedAt ?? "") || 0;
  const chosen = local && (!server || !local.savedAt || localTime >= serverTime) ? local : server;
  const fields: SetupFields = chosen
    ? {
        fullName: chosen.fullName,
        role: chosen.role,
        teamSize: chosen.teamSize,
        goal: chosen.goal,
        firstIdea: chosen.firstIdea,
      }
    : {
        ...EMPTY_SETUP,
        fullName: accountName ?? "",
        firstIdea: brief?.problem.slice(0, 1000) ?? "",
      };
  return {
    fields,
    step: safeSetupStep(chosen === local ? (local?.step ?? 0) : 0, fields),
    source: chosen ? (chosen === local ? "browser" : "account") : brief?.problem ? "brief" : "new",
  };
}
