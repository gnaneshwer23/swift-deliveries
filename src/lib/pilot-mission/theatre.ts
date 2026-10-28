/**
 * Briefing theatre acts for the supervised mission spine (Option 2 IA).
 * Presentation only — honesty, gates and persistence rules are unchanged.
 */
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";

export const THEATRE_ACTS = [
  "briefing",
  "roadmap",
  "cast",
  "approve",
  "work",
] as const;

export type TheatreAct = (typeof THEATRE_ACTS)[number];

export const THEATRE_ACT_LABELS: Record<TheatreAct, string> = {
  briefing: "Briefing",
  roadmap: "Strategy",
  cast: "Cast",
  approve: "Approve",
  work: "Build",
};

/** Product-language roadmap beats (not lifecycle pipeline tattoos). */
export const ROADMAP_BEATS = [
  { id: "frame", label: "Frame", detail: "Restate the case and bound the investigation." },
  { id: "research", label: "Research", detail: "Gather findings or label honest gaps." },
  { id: "options", label: "Options", detail: "Specialists draft alternatives with tradeoffs." },
  {
    id: "decide",
    label: "Your next path",
    detail:
      "Record a next path (test, revise, gather evidence, or close). Disagreeing does not erase the agent recommendation.",
  },
  { id: "pack", label: "Pack", detail: "Decision pack you can inspect and export." },
  {
    id: "prototype",
    label: "Prototype",
    detail: "Sandboxed HTML after Pack — human gate, then static verify.",
  },
  { id: "learn", label: "Learn", detail: "Owner-supplied outcome; follow-up only if you approve." },
] as const;

export type TheatreState = {
  current: TheatreAct;
  /** Acts already passed (or completed for this mission). */
  done: TheatreAct[];
  planApproved: boolean;
  cancelled: boolean;
};

export function theatreState(mission: SupervisedMission): TheatreState {
  if (mission.stage === "cancelled") {
    return { current: "briefing", done: [], planApproved: false, cancelled: true };
  }
  const planApproved = Boolean(mission.team?.approvedAt);
  if (!planApproved) {
    const next = nextRequiredAction(mission);
    const current: TheatreAct = next.id === "approve_plan" ? "approve" : "briefing";
    return {
      current,
      done: current === "approve" ? ["briefing", "roadmap", "cast"] : [],
      planApproved: false,
      cancelled: false,
    };
  }
  // After plan approval the stage is living work; earlier acts remain readable.
  return {
    current: "work",
    done: ["briefing", "roadmap", "cast", "approve"],
    planApproved: true,
    cancelled: false,
  };
}

export function actState(
  theatre: TheatreState,
  act: TheatreAct,
): "done" | "current" | "upcoming" {
  if (theatre.cancelled) return act === "briefing" ? "current" : "upcoming";
  if (theatre.done.includes(act)) return "done";
  if (theatre.current === act) return "current";
  return "upcoming";
}

/** Compact honesty badges — never essay walls. Same slot for stub vs model (P4). */
export function honestyBadges(mission: SupervisedMission): Array<{ id: string; label: string }> {
  const gen = mission.proposal?.generation;
  const badges: Array<{ id: string; label: string }> = [];
  if (gen?.ran) {
    badges.push({
      id: "gen",
      label: `Model · ${gen.model ?? gen.provider ?? "configured"}`,
    });
  } else {
    badges.push({ id: "sim", label: "Simulated draft" });
  }
  if ((mission.researchGaps ?? []).length > 0) {
    badges.push({ id: "gaps", label: "Research gaps labelled" });
  }
  const band = mission.team?.staffingBand;
  if (band) {
    badges.push({ id: "band", label: `Cast band ${band}` });
  }
  return badges;
}
