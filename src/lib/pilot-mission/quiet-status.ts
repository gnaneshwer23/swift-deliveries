import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export type QuietPresence = "idle" | "investigating" | "needs_you";

export type QuietStatus = {
  presence: QuietPresence;
  label: string;
  detail: string;
  nextId: string;
};

const NEEDS_YOU = new Set([
  "approve_plan",
  "decide",
  "expectation",
  "observation",
  "review",
  "approve_follow_up",
  "approve_prototype",
  "export",
  "evidence",
  "compare",
  "retry",
  "artefact",
]);

/** Event-backed studio presence — never timer-fake progress. */
export function deriveQuietStatus(mission: SupervisedMission): QuietStatus {
  const next = nextRequiredAction(mission);
  const job = mission.job;

  if (job.status === "leased" || next.id === "recover") {
    return {
      presence: "investigating",
      label: "Investigating…",
      detail: next.title,
      nextId: next.id,
    };
  }

  if (next.id === "cancelled") {
    return { presence: "idle", label: "Closed", detail: next.title, nextId: next.id };
  }
  if (next.id === "follow_up_approved") {
    return { presence: "idle", label: "Idle", detail: next.title, nextId: next.id };
  }

  if (NEEDS_YOU.has(next.id)) {
    return {
      presence: "needs_you",
      label: "Needs your decision",
      detail: next.title,
      nextId: next.id,
    };
  }

  return {
    presence: "investigating",
    label: "Investigating…",
    detail: next.title,
    nextId: next.id,
  };
}
