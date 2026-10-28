/**
 * Phase 4 — Deduplicated in-app inbox rows from saved mission state (no push/email).
 */
import { attentionLabel, attentionPriority } from "@/lib/workspace-attention";
import { countUnresolvedQuestions } from "./mission-inspection";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type StudioInboxKind = "gate" | "paused" | "open_questions" | "research_queued";

export type StudioInboxItem = {
  /** Stable dedupe key — one row per mission in the foyer inbox. */
  key: string;
  missionId: string;
  question: string;
  gateLabel: string;
  headline: string;
  detail: string;
  kinds: StudioInboxKind[];
  priority: number;
  updatedAt: string;
};

export type StudioInboxMissionRow = {
  id: string;
  question: string;
  next: { id: string; title: string; detail: string };
  nextTitle: string;
  updatedAt: string;
  investigationPaused?: boolean;
  openQuestionCount?: number;
  researchPassQueued?: boolean;
};

const SKIP_NEXT = new Set(["cancelled", "follow_up_approved"]);

const INFORMATIONAL_NEXT = new Set(["recover"]);

function inboxKinds(row: StudioInboxMissionRow): StudioInboxKind[] {
  const kinds: StudioInboxKind[] = [];
  if (!SKIP_NEXT.has(row.next.id) && !INFORMATIONAL_NEXT.has(row.next.id)) {
    kinds.push("gate");
  }
  if (row.investigationPaused) kinds.push("paused");
  if ((row.openQuestionCount ?? 0) > 0) kinds.push("open_questions");
  if (row.researchPassQueued) kinds.push("research_queued");
  return kinds;
}

function buildDetail(row: StudioInboxMissionRow, kinds: StudioInboxKind[]): string {
  const parts: string[] = [];
  if (kinds.includes("gate")) parts.push(row.next.detail);
  if (kinds.includes("paused")) {
    parts.push("Investigation is paused on your preference — resume when you are ready.");
  }
  if (kinds.includes("open_questions")) {
    const n = row.openQuestionCount ?? 0;
    parts.push(
      `${n} open question${n === 1 ? "" : "s"} on team handoffs (Inspect → team activity).`,
    );
  }
  if (kinds.includes("research_queued")) {
    parts.push(
      "Research pass is queued — it finishes on reload or the worker tick, not only while a tab stays open.",
    );
  }
  return parts.join(" ");
}

/** One deduplicated inbox row per mission; merges gate, pause, and open-question signals. */
export function buildStudioInbox(rows: readonly StudioInboxMissionRow[]): StudioInboxItem[] {
  const byMission = new Map<string, StudioInboxItem>();

  for (const row of rows) {
    const kinds = inboxKinds(row);
    if (kinds.length === 0) continue;

    const key = row.id;
    const existing = byMission.get(key);
    const priority = attentionPriority(row.next.id);
    const gateLabel =
      kinds.includes("gate") || kinds.includes("paused")
        ? kinds.includes("paused") && !kinds.includes("gate")
          ? "Paused"
          : attentionLabel(row.next.id)
        : "Open questions";

    const item: StudioInboxItem = {
      key,
      missionId: row.id,
      question: row.question,
      gateLabel,
      headline: row.nextTitle,
      detail: buildDetail(row, kinds),
      kinds,
      priority: kinds.includes("gate") ? priority : priority + 0.5,
      updatedAt: row.updatedAt,
    };

    if (!existing || item.priority < existing.priority) {
      byMission.set(key, item);
    } else if (item.priority === existing.priority) {
      const mergedKinds = [...new Set([...existing.kinds, ...item.kinds])] as StudioInboxKind[];
      byMission.set(key, {
        ...existing,
        kinds: mergedKinds,
        detail: buildDetail(row, mergedKinds),
        gateLabel: mergedKinds.includes("gate") ? attentionLabel(row.next.id) : existing.gateLabel,
      });
    }
  }

  return [...byMission.values()].sort(
    (a, b) =>
      a.priority - b.priority ||
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.missionId.localeCompare(b.missionId),
  );
}

/** Map full missions for server/home enrichment. */
export function studioInboxFields(mission: SupervisedMission): {
  investigationPaused: boolean;
  openQuestionCount: number;
  researchPassQueued: boolean;
} {
  return {
    investigationPaused: Boolean(mission.studioMeta?.investigationPaused),
    openQuestionCount: countUnresolvedQuestions(mission),
    researchPassQueued: Boolean(mission.researchPassQueuedAt && !mission.researchPassCompletedAt),
  };
}

export function missionToInboxRow(
  mission: SupervisedMission,
  extra: { nextTitle: string },
): StudioInboxMissionRow {
  const next = nextRequiredAction(mission);
  const fields = studioInboxFields(mission);
  return {
    id: mission.id,
    question: mission.brief.question,
    next,
    nextTitle: extra.nextTitle ?? next.title,
    updatedAt: mission.updatedAt,
    ...fields,
  };
}
