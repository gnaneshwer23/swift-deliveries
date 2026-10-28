/**
 * PT-6 — Watchtower config. Optional monitoring preferences — not continuous agent thinking.
 * Scheduled checks do not run until a runner exists; UI must stay honest.
 */
export type WatchtowerFrequency = "off" | "weekly" | "monthly";

export type WatchtowerConfig = {
  version: "watchtower-v1";
  enabled: boolean;
  topics: string[];
  competitors: string[];
  sourcesNote: string;
  frequency: WatchtowerFrequency;
  geography: string;
  budgetCeilingUnits: number;
  notify: "off" | "digest" | "important";
  pauseUntil: string | null;
  /** Always null until a scheduled runner exists. */
  lastSuccessfulCheckAt: string | null;
  nextScheduledCheckAt: string | null;
  lastFailure: string | null;
  honesty: string;
  updatedAt: string;
};

export const WATCHTOWER_HONESTY =
  "Watchtower stores monitoring preferences only. No continuous agent loop is running. Last/next check stay empty until a scheduled runner is deployed.";

export function emptyWatchtowerConfig(nowIso: string): WatchtowerConfig {
  return {
    version: "watchtower-v1",
    enabled: false,
    topics: [],
    competitors: [],
    sourcesNote: "",
    frequency: "off",
    geography: "",
    budgetCeilingUnits: 0,
    notify: "off",
    pauseUntil: null,
    lastSuccessfulCheckAt: null,
    nextScheduledCheckAt: null,
    lastFailure: null,
    honesty: WATCHTOWER_HONESTY,
    updatedAt: nowIso,
  };
}

export function saveWatchtowerConfig(
  input: {
    enabled: boolean;
    topics: string[];
    competitors: string[];
    sourcesNote: string;
    frequency: WatchtowerFrequency;
    geography: string;
    budgetCeilingUnits: number;
    notify: "off" | "digest" | "important";
    pauseUntil: string | null;
  },
  nowMs: number,
): WatchtowerConfig {
  const budget = Math.max(0, Math.min(100, Math.floor(input.budgetCeilingUnits)));
  return {
    version: "watchtower-v1",
    enabled: input.enabled && input.frequency !== "off",
    topics: input.topics
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12),
    competitors: input.competitors
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12),
    sourcesNote: input.sourcesNote.trim().slice(0, 2000),
    frequency: input.frequency,
    geography: input.geography.trim().slice(0, 200),
    budgetCeilingUnits: budget,
    notify: input.notify,
    pauseUntil: input.pauseUntil,
    lastSuccessfulCheckAt: null,
    nextScheduledCheckAt: null,
    lastFailure: null,
    honesty: WATCHTOWER_HONESTY,
    updatedAt: new Date(nowMs).toISOString(),
  };
}
