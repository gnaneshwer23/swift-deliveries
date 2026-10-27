/**
 * PM brief for the supervised "one-liner → case" loop.
 * Derived from the founder statement + bounded team plan — not a second questionnaire.
 * Staffing bands describe intended scale; the pilot still activates the Wave 1 core
 * (not the full catalogue) until complexity-scaled assignment lands.
 */
import { planResearchMode, type ResearchMode } from "./research-mode";
import type { PilotTeamPlan } from "./specialist-team";
import type { Brief, EvidenceItem, SupervisedMission } from "./types";

export const DEFAULT_MISSION_OUTCOME = "A decision pack and an experiment brief.";

/** Soft defaults so the founder is not interviewed for audience/outcome up front. */
export const RESEARCH_REFINE_AUDIENCE = "Primary customers — specialists will refine via research";
export const RESEARCH_FIRST_CONSTRAINT =
  "Research first. Ask the founder only for decisions or real blockers. No customer contact or deployment without approval.";

export type StaffingBand = "focused" | "standard" | "expanded";

export type StaffingEstimate = {
  band: StaffingBand;
  /** Roles active on this pilot mission (Wave 1 core). */
  activeSpecialists: number;
  /** Intended catalogue headcount band for this case complexity — not auto-enabled. */
  catalogueTargetMin: number;
  catalogueTargetMax: number;
  reason: string;
};

export type PmBrief = {
  version: "pm-brief-v1";
  problemStatement: string;
  whatWillHappen: string[];
  roughCost: {
    comparisonUnitsReserved: number;
    missionCeiling: number;
    detail: string;
  };
  roughTime: {
    label: string;
    detail: string;
  };
  team: {
    initiatingAgent: string;
    activeLabels: string[];
    staffing: StaffingEstimate;
  };
  research: {
    mode: ResearchMode;
    stance: string;
    toolsSummary: string;
    externalGaps: string[];
  };
  askFounderOnlyWhen: string;
};

const COMPLEX_HINTS =
  /\b(competitor|competitors|market|markets|segment|segments|pricing|go[- ]to[- ]market|gtm|launch|multi[- ]sided|platform|enterprise|regulated|international|global|series|fundraising)\b/i;
const SIMPLE_HINTS =
  /\b(copy|wording|button|label|one step|single|tiny|small tweak|onboarding field|setup field)\b/i;

/**
 * Heuristic complexity → staffing band. Does not enable the full catalogue.
 * Focused ~20, standard ~40–60, expanded toward ~100, always under catalogue ceiling.
 */
export function estimateStaffingBand(question: string): StaffingEstimate {
  const text = question.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (SIMPLE_HINTS.test(text) && words < 40) {
    return {
      band: "focused",
      activeSpecialists: 8,
      catalogueTargetMin: 12,
      catalogueTargetMax: 24,
      reason:
        "Narrow product question — keep a focused Wave 1 core; scale only if research widens scope.",
    };
  }
  if (COMPLEX_HINTS.test(text) || words > 80) {
    return {
      band: "expanded",
      activeSpecialists: 8,
      catalogueTargetMin: 60,
      catalogueTargetMax: 100,
      reason:
        "Broad market or multi-thread case — Wave 1 core runs now; expanded catalogue staffing is planned, not all roles at once.",
    };
  }
  return {
    band: "standard",
    activeSpecialists: 8,
    catalogueTargetMin: 24,
    catalogueTargetMax: 48,
    reason:
      "Standard decision case — Wave 1 core now; mid-band catalogue staffing as research proves need.",
  };
}

/** Expand a one-liner into a brief without forcing a form interview. */
export function expandOneLinerBrief(input: {
  question: string;
  audience?: string;
  outcome?: string;
  constraints?: string;
}): Brief {
  const question = input.question.trim();
  return {
    question,
    audience: (input.audience?.trim() || RESEARCH_REFINE_AUDIENCE).slice(0, 400),
    outcome: (input.outcome?.trim() || DEFAULT_MISSION_OUTCOME).slice(0, 2000),
    constraints: (input.constraints?.trim() || RESEARCH_FIRST_CONSTRAINT).slice(0, 2000),
  };
}

/** Seed honest research placeholders so comparison is not blocked on a user questionnaire. */
export function seedResearchEvidence(mode: ResearchMode): EvidenceItem[] {
  const plan = planResearchMode(mode);
  const items: EvidenceItem[] = [
    {
      id: "e1",
      statement:
        "Founder supplied a one-liner business case. Audience, market facts and competitor details are not yet validated.",
      source: "Mission intake",
      classification: "assumption",
    },
    {
      id: "e2",
      statement:
        "Specialists should research market, competitors and public product surfaces before asking the founder for more detail.",
      source: "Research-first default",
      classification: "gap",
    },
  ];
  for (const gap of plan.externalGaps) {
    items.push({
      id: `e${items.length + 1}`,
      statement: gap,
      source: "Research mode disclosure",
      classification: "gap",
    });
  }
  return items.slice(0, 20);
}

export function buildPmBrief(
  mission: Pick<
    SupervisedMission,
    "brief" | "team" | "researchMode" | "researchGaps" | "usageCeiling"
  >,
): PmBrief {
  const staffing = estimateStaffingBand(mission.brief.question);
  const research = planResearchMode(mission.researchMode ?? "combined");
  const team = mission.team ?? ({ capabilityIds: [], tasks: [] } as PilotTeamPlan);
  const activeLabels = [
    ...new Set(
      team.tasks
        .filter((t) => t.actor === "specialist" && t.ownerLabel)
        .map((t) => t.ownerLabel),
    ),
  ];
  const initiating =
    team.tasks.find((t) => t.key === "frame_objective")?.ownerLabel ??
    activeLabels[0] ??
    "Problem-Framing Agent";

  return {
    version: "pm-brief-v1",
    problemStatement: mission.brief.question,
    whatWillHappen: [
      `${initiating} restates the case and proposes a bounded specialist plan.`,
      "Research fills market and competitor gaps using the selected research mode — without inventing live web results when tools are missing.",
      "Specialists draft options; you decide. A decision pack (Markdown + PDF) is prepared only after your approval gates.",
      "Outcome review stays owner-supplied; follow-ups never start without your approval.",
    ],
    roughCost: {
      comparisonUnitsReserved: 1,
      missionCeiling: mission.usageCeiling,
      detail:
        mission.usageCeiling > 0
          ? `About 1 comparison unit per options run against this mission’s remaining ceiling of ${mission.usageCeiling}. Plan approval and evidence edits are not billable.`
          : "No comparison units remain on this mission allowance. You can still review the plan; billable comparison is blocked until usage is available.",
    },
    roughTime: {
      label:
        staffing.band === "focused"
          ? "Same-session decision loop"
          : staffing.band === "expanded"
            ? "Multi-pass research then decision"
            : "One focused research pass then decision",
      detail:
        "Time is a plan estimate for the supervised loop (brief → research → options → your decision → pack). It is not a wall-clock SLA.",
    },
    team: {
      initiatingAgent: initiating,
      activeLabels,
      staffing,
    },
    research: {
      mode: research.mode,
      stance:
        research.mode === "provided"
          ? "Using only founder-supplied evidence. Switch to Combined or Web when you want specialists to research outward."
          : "Research-first: specialists use available tools before asking you. Missing providers are disclosed as gaps, never invented.",
      toolsSummary: research.tools
        .map((t) => `${t.label}${t.available ? "" : " (unavailable)"}`)
        .join(" · "),
      externalGaps: [...new Set([...(mission.researchGaps ?? []), ...research.externalGaps])],
    },
    askFounderOnlyWhen:
      "A real decision gate, a missing fact only you can supply, consent to contact customers, or approval to act externally.",
  };
}
