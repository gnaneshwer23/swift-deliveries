/**
 * PM brief for the supervised "one-liner → case" loop.
 * Derived from the founder statement + bounded team plan — not a second questionnaire.
 * Staffing bands select a deterministic Available Wave 1 subset (not the full catalogue).
 */
import { planResearchMode, type ResearchMode } from "./research-mode";
import {
  selectCapabilityIdsForBand,
  type StaffingBand,
} from "./specialist-team";
import type { Brief, EvidenceItem, SupervisedMission } from "./types";

export const DEFAULT_MISSION_OUTCOME = "A decision pack and an experiment brief.";

/** Soft defaults so the founder is not interviewed for audience/outcome up front. */
export const RESEARCH_REFINE_AUDIENCE = "Primary customers — specialists will refine via research";
export const RESEARCH_FIRST_CONSTRAINT =
  "Research first. Ask the founder only for decisions or real blockers. No customer contact or deployment without approval.";

export type { StaffingBand };

export const STAFFING_BAND_LABELS: Record<StaffingBand, string> = {
  S: "Band S — Simple (~8–20 catalogue intent)",
  M: "Band M — Standard (~20–50 catalogue intent)",
  L: "Band L — Complex (~50–100 catalogue intent)",
  XL: "Band XL — Ceiling (≤150 catalogue intent)",
};

export type StaffingEstimate = {
  band: StaffingBand;
  /** Roles active on this pilot mission (Available Wave 1 subset for the band). */
  activeSpecialists: number;
  /** Intended catalogue headcount band for this case complexity — not auto-enabled. */
  catalogueTargetMin: number;
  catalogueTargetMax: number;
  reason: string;
};

export type PmBrief = {
  version: "pm-brief-v1";
  problemStatement: string;
  knowns: string[];
  unknowns: string[];
  whatWillHappen: string[];
  roughCost: {
    band: string;
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
  honesty: string;
};

const COMPLEX_HINTS =
  /\b(competitor|competitors|market|markets|segment|segments|pricing|go[- ]to[- ]market|gtm|launch|multi[- ]sided|platform|enterprise|regulated|international|global|series|fundraising)\b/i;
const SIMPLE_HINTS =
  /\b(copy|wording|button|label|one step|single|tiny|small tweak|onboarding field|setup field)\b/i;

/**
 * Heuristic complexity → staffing band.
 * Active count is a deterministic Available Wave 1 subset (4 / 6 / 8 / 8).
 * Catalogue min/max remain honesty labels — the full 150 is not enabled.
 */
export function estimateStaffingBand(question: string): StaffingEstimate {
  const text = question.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  if (SIMPLE_HINTS.test(text) && words < 40) {
    const band: StaffingBand = "S";
    const activeSpecialists = selectCapabilityIdsForBand(band).length;
    return {
      band,
      activeSpecialists,
      catalogueTargetMin: 8,
      catalogueTargetMax: 20,
      reason: `Narrow product question — ${activeSpecialists} Available Wave 1 specialists proposed (core spine). Catalogue intent ${8}–${20}; full catalogue not enabled.`,
    };
  }
  if (/\b(programme|program-scale|multi[- ]geo|enterprise rollout)\b/i.test(text) && words > 100) {
    const band: StaffingBand = "XL";
    const activeSpecialists = selectCapabilityIdsForBand(band).length;
    return {
      band,
      activeSpecialists,
      catalogueTargetMin: 100,
      catalogueTargetMax: 150,
      reason: `Programme-scale signals — ${activeSpecialists} Available Wave 1 specialists proposed (cap). Catalogue ceiling ≤150 needs an explicit later accept; Planned roles stay off.`,
    };
  }
  if (COMPLEX_HINTS.test(text) || words > 80) {
    const band: StaffingBand = "L";
    const activeSpecialists = selectCapabilityIdsForBand(band).length;
    return {
      band,
      activeSpecialists,
      catalogueTargetMin: 50,
      catalogueTargetMax: 100,
      reason: `Broad market or multi-thread case — ${activeSpecialists} Available Wave 1 specialists proposed. Catalogue intent 50–100 labelled, not auto-staffed beyond Available.`,
    };
  }
  const band: StaffingBand = "M";
  const activeSpecialists = selectCapabilityIdsForBand(band).length;
  return {
    band,
    activeSpecialists,
    catalogueTargetMin: 20,
    catalogueTargetMax: 50,
    reason: `Standard decision case — ${activeSpecialists} Available Wave 1 specialists proposed (core + options). Catalogue intent 20–50 as research proves need.`,
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
  const team = mission.team;
  const activeCount = team?.capabilityIds.length ?? staffing.activeSpecialists;
  const activeLabels = team
    ? [
        ...new Set(
          team.tasks
            .filter((t) => t.actor === "specialist" && t.ownerLabel)
            .map((t) => t.ownerLabel),
        ),
      ]
    : [];
  const initiating =
    team?.tasks.find((t) => t.key === "frame_objective")?.ownerLabel ??
    activeLabels[0] ??
    "Problem-Framing Agent";
  const knowns = [
    "Founder supplied a one-liner business case.",
    `Research mode: ${research.label}.`,
    `Proposed staffing: ${activeCount} Available Wave 1 specialists (${STAFFING_BAND_LABELS[staffing.band]}).`,
  ];
  const unknowns = [
    ...(mission.brief.audience === RESEARCH_REFINE_AUDIENCE
      ? ["Primary audience is not yet validated."]
      : []),
    "Market and competitor facts are not yet evidenced.",
    ...research.externalGaps,
  ];

  return {
    version: "pm-brief-v1",
    problemStatement: mission.brief.question,
    knowns,
    unknowns: unknowns.length
      ? unknowns
      : ["No blocking unknowns listed yet — research will surface gaps."],
    whatWillHappen: [
      `${initiating} restates the case and proposes a bounded specialist plan.`,
      "After you approve, a research pass writes findings or honest external gaps into the evidence register.",
      "Specialists draft options; you decide. A decision pack (Markdown + PDF) is prepared only after your approval gates.",
      "Outcome review stays owner-supplied; follow-ups never start without your approval.",
    ],
    roughCost: {
      band:
        mission.usageCeiling <= 0
          ? "Blocked — no comparison units left"
          : mission.usageCeiling <= 2
            ? "Low — ≈1 comparison unit / run"
            : "Modest — ≈1 comparison unit / run within mission ceiling",
      comparisonUnitsReserved: 1,
      missionCeiling: mission.usageCeiling,
      detail:
        mission.usageCeiling > 0
          ? `Banded cost: roughly one comparison unit per options run (mission ceiling ${mission.usageCeiling}). Plan approval and the research pass are not billable.`
          : "No comparison units remain on this mission allowance. You can still review the plan; billable comparison is blocked until usage is available.",
    },
    roughTime: {
      label:
        staffing.band === "S"
          ? "Same-session decision loop"
          : staffing.band === "L" || staffing.band === "XL"
            ? "Multi-pass research then decision"
            : "One focused research pass then decision",
      detail:
        "Time is a banded plan estimate for the supervised loop (brief → research → options → your decision → pack). It is not a wall-clock SLA.",
    },
    team: {
      initiatingAgent: initiating,
      activeLabels,
      staffing: { ...staffing, activeSpecialists: activeCount },
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
    honesty:
      "Simulated / deterministic PM draft — no model call for this brief. Active staffing is an Available Wave 1 subset sized by band; catalogue ranges above that are labels only (full 150 not enabled).",
  };
}
