/**
 * Communication kit — founder-facing copy derived from persisted brief and evidence.
 */
import { buildClaimsBoundary } from "./claims-boundary";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import type { SupervisedMission } from "./types";
import { AGENT_RECOMMENDATION_LABELS, deriveAgentRecommendation } from "./verdict";

export type CommunicationAudience = "internal" | "investor" | "customer" | "partner";

export type CommunicationKit = {
  audience: CommunicationAudience;
  oneSentence: string;
  problem: string;
  pitch30s: string;
  stakeholderBrief: string;
  claimsBoundary: ReturnType<typeof buildClaimsBoundary>;
  objectionRadar: string[];
  productionLabels: string[];
};

function trimSentence(text: string, max = 220): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function buildCommunicationKit(
  mission: SupervisedMission,
  audience: CommunicationAudience = "internal",
): CommunicationKit {
  const { brief } = mission;
  const pack = buildPmBriefingPack(mission);
  const draft = deriveAgentRecommendation(mission);
  const claimsBoundary = buildClaimsBoundary(mission);

  const oneSentence = trimSentence(brief.question || "No product question on record yet.");
  const problem = trimSentence(
    [brief.question, brief.audience ? `Audience: ${brief.audience}` : ""]
      .filter(Boolean)
      .join(" — "),
    400,
  );

  const recommendationLine =
    pack.ready && draft.recommendation
      ? `Recommendation on record: ${AGENT_RECOMMENDATION_LABELS[draft.recommendation]}.`
      : "Recommendation pending — research and options must be on the record first.";

  const pitch30s = trimSentence(
    [
      oneSentence,
      brief.outcome ? `Intended outcome: ${brief.outcome}` : "",
      recommendationLine,
      brief.constraints ? `Constraints: ${brief.constraints}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    600,
  );

  const stakeholderBrief = trimSentence(
    [
      `Problem: ${brief.question || "—"}`,
      `For: ${brief.audience || "—"}`,
      `Success looks like: ${brief.outcome || "—"}`,
      `Boundaries: ${brief.constraints || "—"}`,
      audience === "investor"
        ? "Investor note: cite only supplied evidence ids; gaps stay explicit."
        : audience === "customer"
          ? "Customer note: do not imply shipped product unless export/onboarding is on record."
          : "Internal note: agents draft; humans approve plans and paths.",
    ].join("\n"),
    900,
  );

  const gaps = mission.evidence.filter((e) => e.classification === "gap");
  const assumptions = mission.evidence.filter((e) => e.classification === "assumption");
  const objectionRadar = [
    ...gaps.slice(0, 3).map((g) => `Gap: ${g.statement}`),
    ...assumptions
      .filter((a) => /risk|cost|competitor|already|saturated/i.test(a.statement))
      .slice(0, 2)
      .map((a) => `Challenge: ${a.statement}`),
  ];
  if (!objectionRadar.length) {
    objectionRadar.push(
      "No structured objections on the register yet — add gaps or assumptions before external pitches.",
    );
  }

  const productionLabels: string[] = [];
  if (mission.proposal?.generation.label) productionLabels.push(mission.proposal.generation.label);
  if (mission.artefact?.provenance) productionLabels.push(mission.artefact.provenance);
  if (mission.prototype?.honesty.label) productionLabels.push(mission.prototype.honesty.label);
  if (!productionLabels.length)
    productionLabels.push("Simulated draft until model keys and gates say otherwise.");

  return {
    audience,
    oneSentence,
    problem,
    pitch30s,
    stakeholderBrief,
    claimsBoundary,
    objectionRadar,
    productionLabels,
  };
}
