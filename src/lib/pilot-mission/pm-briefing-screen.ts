/**
 * Screen 6 — view-model for the PM briefing layout.
 * All copy is derived from the mission pack / brief — never a hardcoded product story.
 */
import { buildPmBrief } from "./pm-brief";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import type { OptionDraft, SupervisedMission } from "./types";

export type PmBriefingActionIntent =
  "approve_and_build" | "discuss" | "more_research" | "change_direction";

export type PmBriefingCard = {
  id: string;
  title: string;
  body: string;
  wide?: boolean;
};

export type PmBriefingOptionCard = {
  id: string;
  label: string;
  title: string;
  detail: string;
  basis: string;
};

export type PmBriefingScreenModel = {
  ready: boolean;
  headline: string;
  ariaMessage: string;
  honesty: string;
  roleDisclosure: string;
  cards: PmBriefingCard[];
  options: PmBriefingOptionCard[];
};

function audienceLine(mission: SupervisedMission): string {
  const audience = mission.brief.audience.trim();
  if (!audience || /specialists will refine/i.test(audience)) {
    return "Still to be validated through research — not yet treated as proven users.";
  }
  return audience;
}

function evidenceLines(mission: SupervisedMission, pattern: RegExp, empty: string): string {
  const rows = mission.evidence.filter((item) => pattern.test(item.statement)).slice(0, 3);
  if (!rows.length) return empty;
  return rows
    .map((item) => {
      const tag =
        item.classification === "supplied"
          ? "Finding"
          : item.classification === "gap"
            ? "Gap"
            : "Assumption";
      return `${tag}: ${item.statement}`;
    })
    .join(" ");
}

function composeAriaMessage(
  mission: SupervisedMission,
  pack: ReturnType<typeof buildPmBriefingPack>,
): string {
  const idea = pack.understoodIdea || "your idea";
  const users = audienceLine(mission);
  const opportunity =
    pack.swot.find((item) => item.kind === "opportunity")?.statement ??
    pack.recommendationRationale.split(/(?<=\.)\s/)[0] ??
    "The investigation is still forming a clear opportunity statement.";
  const risks =
    pack.unknowns
      .slice(0, 2)
      .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""))
      .join("; ") ||
    pack.swot.find((item) => item.kind === "threat" || item.kind === "weakness")?.statement ||
    "Main risks are still labelled as unknowns on the register.";
  const recommendation =
    pack.recommendationLabel != null
      ? `${pack.recommendationLabel}. ${pack.smallestNextStep}`
      : pack.smallestNextStep;

  return `I understand your idea as: ${idea}. Likely users today: ${users}. ${opportunity} The main risks and unknowns include: ${risks}. I recommend: ${recommendation}`;
}

function optionCards(mission: SupervisedMission): PmBriefingOptionCard[] {
  const draftOptions = mission.proposal?.options ?? [];

  // A proposal records options, not which one is recommended. Aria’s recommendation is the
  // next path in the briefing pack, so no option is marked by its position in the list.
  // Do not invent Option A/B/C beyond what the proposal recorded.
  const labels = ["Option A", "Option B", "Option C"];

  return draftOptions.slice(0, 3).map((option: OptionDraft, index) => ({
    id: option.id,
    label: labels[index] ?? `Option ${index + 1}`,
    title: option.title,
    detail: option.tradeoff,
    basis: option.basis,
  }));
}

export function buildPmBriefingScreen(mission: SupervisedMission): PmBriefingScreenModel {
  const pack = buildPmBriefingPack(mission);
  if (!pack.ready) {
    return {
      ready: false,
      headline: "Briefing not ready",
      ariaMessage:
        "The briefing opens when options or a decision are on the mission record — not before investigation work completes.",
      honesty: pack.honesty,
      roleDisclosure: pack.roleDisclosure,
      cards: [],
      options: [],
    };
  }

  const brief = buildPmBrief(mission);
  const options = optionCards(mission);
  const differentiation =
    pack.assessments.find((item) => item.dimension === "proposition")?.summary ??
    "Differentiation is not yet assessed on this case.";
  const teamLine = brief.team.activeLabels.length
    ? brief.team.activeLabels.join(", ")
    : `${brief.team.staffing.activeSpecialists} available specialists sized for this case. Planned catalogue roles do not run.`;

  const cards: PmBriefingCard[] = [
    { id: "understanding", title: "Understanding", body: pack.understoodIdea },
    { id: "users", title: "Likely users", body: audienceLine(mission) },
    {
      id: "problems",
      title: "Core problems",
      body:
        mission.brief.outcome.trim() ||
        evidenceLines(
          mission,
          /problem|pain|need|waste|friction/i,
          "Core problems are not yet evidenced beyond the brief.",
        ),
    },
    {
      id: "competitors",
      title: "Competitors and alternatives",
      body:
        pack.alternatives.slice(0, 3).join(" · ") ||
        evidenceLines(
          mission,
          /competitor|alternative|existing|substitute/i,
          "Competitors and alternatives are not yet recorded.",
        ),
    },
    { id: "differentiation", title: "Differentiation", body: differentiation },
    {
      id: "risks",
      title: "Risks and unknowns",
      body:
        pack.unknowns
          .slice(0, 3)
          .map((line) => line.replace(/^\[[^\]]+\]\s*/, ""))
          .join(" · ") || "No gaps labelled yet — inspect the evidence register.",
    },
    {
      id: "first-version",
      title: "Recommended first version",
      body: `${pack.recommendationLabel ?? "Recommendation pending"}. ${pack.smallestNextStep}`,
      wide: true,
    },
    {
      id: "timeline-cost",
      title: "Indicative timeline and cost",
      body: `${brief.roughTime.label}. ${brief.roughTime.detail} Cost band: ${brief.roughCost.band} — comparison units, not a money quote or product-build budget.`,
    },
    {
      id: "team",
      title: "Proposed agent team",
      body: teamLine,
    },
  ];

  return {
    ready: true,
    headline: "Initial investigation complete",
    ariaMessage: composeAriaMessage(mission, pack),
    honesty: pack.honesty,
    roleDisclosure: pack.roleDisclosure,
    cards,
    options,
  };
}
