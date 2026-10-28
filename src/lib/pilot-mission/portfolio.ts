/**
 * PT-4 / R7 — Portfolio Command Centre helpers (no agent-graph wall).
 */
export type PortfolioMissionRow = {
  id: string;
  question: string;
  stage: string;
  nextTitle: string;
  nextId: string;
  decisionRecorded: boolean;
  observationRecorded: boolean;
  updatedAt: string;
  favourite?: boolean;
  archived?: boolean;
  monitoringStatus?: string;
};

export type PortfolioFilters = {
  query: string;
  stage: string;
  attentionOnly: boolean;
  favouritesOnly?: boolean;
  includeArchived?: boolean;
};

const ATTENTION_IDS = new Set([
  "approve_plan",
  "compare",
  "decide",
  "expectation",
  "artefact",
  "export",
  "approve_prototype",
  "observation",
  "review",
  "approve_follow_up",
  "retry",
  "recover",
]);

export function filterPortfolio(
  rows: PortfolioMissionRow[],
  filters: PortfolioFilters,
): PortfolioMissionRow[] {
  const q = filters.query.trim().toLowerCase();
  return rows
    .filter((row) => {
      if (!filters.includeArchived && row.archived) return false;
      if (filters.favouritesOnly && !row.favourite) return false;
      if (filters.stage && row.stage !== filters.stage) return false;
      if (filters.attentionOnly && !ATTENTION_IDS.has(row.nextId)) return false;
      if (!q) return true;
      return (
        row.question.toLowerCase().includes(q) ||
        row.nextTitle.toLowerCase().includes(q) ||
        row.stage.toLowerCase().includes(q) ||
        (row.monitoringStatus ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (Boolean(a.favourite) !== Boolean(b.favourite)) return a.favourite ? -1 : 1;
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
}

export function monitoringStatusFor(input: {
  watchtowerEnabled?: boolean;
  frequency?: string | null;
  lastSuccessfulCheckAt?: string | null;
  nextScheduledCheckAt?: string | null;
}): string {
  if (!input.watchtowerEnabled || input.frequency === "off" || !input.frequency) {
    return "Monitoring off";
  }
  if (!input.lastSuccessfulCheckAt && !input.nextScheduledCheckAt) {
    return `Preferences saved (${input.frequency}) — runner not live`;
  }
  return `Last check ${input.lastSuccessfulCheckAt ?? "none"} · next ${input.nextScheduledCheckAt ?? "none"}`;
}

export function portfolioSummary(rows: PortfolioMissionRow[]): {
  total: number;
  awaitingDecision: number;
  outcomeDue: number;
} {
  return {
    total: rows.length,
    awaitingDecision: rows.filter((r) => ["decide", "approve_plan", "compare"].includes(r.nextId))
      .length,
    outcomeDue: rows.filter((r) => ["observation", "review", "expectation"].includes(r.nextId))
      .length,
  };
}
