/**
 * Programme Lab speaks the same Acts language as supervised briefing theatre.
 * Presentation mapping only — programme engine, gates and KPIs are unchanged.
 */
import { PHASES, PHASE_LABELS, type PhaseKey, type ProgrammeState } from "./types";

export const PROGRAMME_ACTS = [
  "briefing",
  "roadmap",
  "cast",
  "approve",
  "work",
] as const;

export type ProgrammeAct = (typeof PROGRAMME_ACTS)[number];

export const PROGRAMME_ACT_LABELS: Record<ProgrammeAct, string> = {
  briefing: "Briefing",
  roadmap: "Strategy",
  cast: "Cast",
  approve: "Approve",
  work: "Build",
};

/** Map programme phases onto the shared Acts metaphor (not a second product). */
export const PHASE_TO_ACT: Record<PhaseKey, ProgrammeAct> = {
  discovery: "briefing",
  definition: "roadmap",
  design: "cast",
  build: "work",
  verification: "work",
  launch: "work",
  growth: "work",
};

export type ProgrammeTheatreState = {
  current: ProgrammeAct;
  done: ProgrammeAct[];
  phaseKey: PhaseKey | null;
  phaseLabel: string;
  awaitingHuman: boolean;
  cancelled: boolean;
  completed: boolean;
  nextGateTitle: string | null;
};

export function programmeTheatreState(state: ProgrammeState): ProgrammeTheatreState {
  if (state.status === "cancelled") {
    return {
      current: "briefing",
      done: [],
      phaseKey: null,
      phaseLabel: "Cancelled",
      awaitingHuman: false,
      cancelled: true,
      completed: false,
      nextGateTitle: null,
    };
  }
  if (state.status === "completed" || state.status === "partially_completed") {
    return {
      current: "work",
      done: [...PROGRAMME_ACTS],
      phaseKey: PHASES[PHASES.length - 1] ?? "growth",
      phaseLabel: PHASE_LABELS.growth,
      awaitingHuman: false,
      cancelled: false,
      completed: true,
      nextGateTitle: null,
    };
  }

  const openGate =
    state.roadmap.items.find(
      (i) => i.kind === "gate" && (i.status === "pending" || i.status === "running"),
    ) ??
    (state.status === "awaiting_human"
      ? state.roadmap.items.find(
          (i) => i.kind === "gate" && i.status !== "completed" && i.status !== "failed",
        )
      : undefined);
  const inProgress = state.roadmap.items.find(
    (i) => i.kind !== "gate" && (i.status === "pending" || i.status === "running"),
  );
  const phaseKey =
    (openGate?.phase as PhaseKey | undefined) ??
    (inProgress?.phase as PhaseKey | undefined) ??
    state.roadmap.phases.find((p) =>
      state.roadmap.items.some((i) => i.phase === p.key && i.status !== "completed"),
    )?.key ??
    state.roadmap.phases[0]?.key ??
    null;

  const awaitingHuman = state.status === "awaiting_human" || Boolean(openGate);
  const current: ProgrammeAct = awaitingHuman
    ? "approve"
    : phaseKey
      ? PHASE_TO_ACT[phaseKey]
      : "briefing";

  const order = PROGRAMME_ACTS.indexOf(current);
  const done = PROGRAMME_ACTS.filter((_, i) => i < order);

  return {
    current,
    done: [...done],
    phaseKey,
    phaseLabel: phaseKey ? PHASE_LABELS[phaseKey] : "Getting started",
    awaitingHuman,
    cancelled: false,
    completed: false,
    nextGateTitle: openGate?.title ?? null,
  };
}

export function programmeActState(
  theatre: ProgrammeTheatreState,
  act: ProgrammeAct,
): "done" | "current" | "upcoming" {
  if (theatre.cancelled) return act === "briefing" ? "current" : "upcoming";
  if (theatre.completed || theatre.done.includes(act)) return "done";
  if (theatre.current === act) return "current";
  return "upcoming";
}
