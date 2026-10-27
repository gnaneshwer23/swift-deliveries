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
  work: "Living work",
};

/** Product-language roadmap beats (not lifecycle pipeline tattoos). */
export const ROADMAP_BEATS = [
  { id: "frame", label: "Frame", detail: "Restate the case and bound the investigation." },
  { id: "research", label: "Research", detail: "Gather findings or label honest gaps." },
  { id: "options", label: "Options", detail: "Specialists draft alternatives with tradeoffs." },
  { id: "decide", label: "Your decision", detail: "You accept an option or request more evidence." },
  { id: "pack", label: "Pack", detail: "Decision pack you can inspect and export." },
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

/** Compact honesty badges — never essay walls. */
export function honestyBadges(mission: SupervisedMission): Array<{ id: string; label: string }> {
  const badges: Array<{ id: string; label: string }> = [
    { id: "sim", label: "Simulated draft" },
  ];
  if ((mission.researchGaps ?? []).length > 0) {
    badges.push({ id: "gaps", label: "Research gaps labelled" });
  }
  if (mission.proposal?.generation) {
    badges.push({
      id: "gen",
      label: mission.proposal.generation.ran
        ? `Model · ${mission.proposal.generation.model ?? "configured"}`
        : mission.proposal.generation.label,
    });
  }
  const band = mission.team?.staffingBand;
  if (band) {
    badges.push({ id: "band", label: `Cast band ${band}` });
  }
  return badges;
}
