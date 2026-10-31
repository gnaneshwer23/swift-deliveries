/**
 * The investigation plan, said plainly — what Aria shows before anything runs.
 * Built from the same PM brief and team plan as the detailed review; only the words change.
 */
import { buildPmBrief, RESEARCH_REFINE_AUDIENCE } from "./pm-brief";
import { TEAM_FORMATION_CATALOGUE } from "./team-formation-screen";
import type { SupervisedMission } from "./types";

export type PlanReview = {
  idea: string;
  steps: string[];
  facts: Array<{ label: string; value: string; hint: string }>;
  team: Array<{ name: string; role: string }>;
  unknowns: string[];
  research: string;
  /** Why approval cannot go ahead now, if it cannot. */
  blocked: string | null;
};

/** Display names for the investigation roles; the real role is always shown beside them. */
const INVESTIGATION_PERSONA: Array<[RegExp, string]> = [
  [/problem-fram/i, "Iris"],
  [/evidence verif/i, "Scout"],
  [/research synth/i, "Maya"],
  [/product discovery/i, "Atlas"],
  [/test strateg/i, "Nova"],
  [/chief of staff/i, "Aria"],
];

function persona(label: string): { name: string; role: string } {
  const named = INVESTIGATION_PERSONA.find(([re]) => re.test(label));
  if (named) return { name: named[1], role: label.replace(/\s+agent$/i, "") };
  const hit = TEAM_FORMATION_CATALOGUE.find((entry) => entry.match.test(label));
  const role = label.replace(/\s+agent$/i, "");
  return hit ? { name: hit.name, role } : { name: role, role };
}

const TIME: Record<string, string> = {
  S: "One short pass, then your decision",
  M: "One research pass, then your decision",
  L: "A few research passes, then your decision",
  XL: "Several research passes, then your decision",
};

export function buildPlanReview(mission: SupervisedMission): PlanReview {
  const brief = buildPmBrief(mission);
  const team = brief.team.activeLabels.map(persona);
  const units = mission.usageCeiling;

  const unknowns = [
    ...(mission.brief.audience === RESEARCH_REFINE_AUDIENCE ? ["Who your first users are"] : []),
    "What the market and competitors look like",
    "What the smallest useful first version is",
  ];

  const webMissing = brief.research.externalGaps.some((g) => /no search provider/i.test(g));
  const research =
    brief.research.mode === "provided"
      ? "The team works only from what you give it."
      : webMissing
        ? "Web research isn’t connected yet, so the team works from what you’ve told it and marks every gap."
        : "The team researches the web first and only asks you what it can’t find.";

  return {
    idea: mission.brief.question,
    steps: [
      `${team.length ? `${team.length} specialists` : "The team"} look into your market, users and competitors.`,
      "They draft two or three directions, each with its trade-offs.",
      "I bring you a briefing with my recommendation — you decide what happens next.",
      "Nothing is built or sent anywhere without your approval.",
    ],
    facts: [
      {
        label: "Time",
        value: TIME[brief.team.staffing.band] ?? "One research pass, then your decision",
        hint: "A planning estimate, not a deadline.",
      },
      {
        label: "Cost",
        value: units > 0 ? "About 1 usage unit" : "No usage left",
        hint:
          units > 0
            ? `Only the options run uses units; approving and researching don’t. ${units} left on this case.`
            : "You can review the plan, but options can’t run until usage is available.",
      },
      {
        label: "Team",
        value: team.length ? `${team.length} specialists` : "Assigned when you approve",
        hint: "Each one’s work is saved to this case.",
      },
    ],
    team,
    unknowns,
    research,
    blocked: mission.stage === "cancelled" ? "This case is cancelled." : null,
  };
}
