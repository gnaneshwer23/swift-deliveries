/**
 * R2/R7 — Studio preferences on a mission (notify, pause, favourite, archive).
 * Additive JSON — no silent runners; notify/pause are preferences until wiring exists.
 */
export type StudioMeta = {
  version: "studio-meta-v1";
  favourite: boolean;
  archived: boolean;
  /** Preference only — push/email is not claimed until a notifier exists. */
  notifyWhenReady: boolean;
  /** Soft pause: blocks further billable/research steps; does not cancel the case. */
  investigationPaused: boolean;
  honesty: string;
  updatedAt: string;
};

export const STUDIO_META_HONESTY =
  "Notify and pause are preferences on this case. Email/push delivery is not active until a notifier is deployed. Pause stops further research steps; it is not continuous agent thinking.";

export function emptyStudioMeta(nowIso: string): StudioMeta {
  return {
    version: "studio-meta-v1",
    favourite: false,
    archived: false,
    notifyWhenReady: false,
    investigationPaused: false,
    honesty: STUDIO_META_HONESTY,
    updatedAt: nowIso,
  };
}

export function saveStudioMeta(
  input: Partial<Omit<StudioMeta, "version" | "honesty" | "updatedAt">>,
  prior: StudioMeta | null | undefined,
  nowMs: number,
): StudioMeta {
  const base = prior ?? emptyStudioMeta(new Date(nowMs).toISOString());
  return {
    version: "studio-meta-v1",
    favourite: input.favourite ?? base.favourite,
    archived: input.archived ?? base.archived,
    notifyWhenReady: input.notifyWhenReady ?? base.notifyWhenReady,
    investigationPaused: input.investigationPaused ?? base.investigationPaused,
    honesty: STUDIO_META_HONESTY,
    updatedAt: new Date(nowMs).toISOString(),
  };
}
