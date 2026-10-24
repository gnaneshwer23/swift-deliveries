import { containsLikelyPersonalIdentifiers } from "@/lib/workforce/privacy";
import { generateJson, resolveProvider } from "@/lib/workforce/model-runner.server";
import {
  notConfiguredGeneration,
  parseModelOptions,
  withheldGeneration,
  WITHHELD_LABEL,
} from "./generate";
import type { GenerationResult, SupervisedMission } from "./types";

export type GenerationPlan = {
  mode: "not_configured" | "withheld" | "model";
  cost: 0 | 1;
  provider: string | null;
  model: string | null;
};

export function generationPlan(
  env: Record<string, string | undefined>,
  text: string,
): GenerationPlan {
  if (containsLikelyPersonalIdentifiers(text)) {
    return { mode: "withheld", cost: 0, provider: null, model: null };
  }
  const provider = resolveProvider(env);
  if (!provider) return { mode: "not_configured", cost: 0, provider: null, model: null };
  return { mode: "model", cost: 1, provider: provider.name, model: provider.model };
}

export function providerLabel(env: Record<string, string | undefined> = process.env): string {
  try {
    const plan = generationPlan(env, "");
    if (plan.mode === "model") return `Provider configured: ${plan.provider} / ${plan.model}`;
    if (plan.mode === "withheld") return WITHHELD_LABEL;
    return "not run — provider not configured";
  } catch (error) {
    return error instanceof Error ? error.message : "Provider configuration is invalid.";
  }
}

export function missionScreenText(mission: Pick<SupervisedMission, "brief" | "evidence">): string {
  return [
    mission.brief.question,
    mission.brief.audience,
    mission.brief.outcome,
    mission.brief.constraints,
    ...mission.evidence.map(
      (item) => `${item.id} ${item.classification} ${item.statement} ${item.source}`,
    ),
  ].join("\n");
}

/** One comparison. Catalogue roles are not called. */
export async function generateComparison(mission: SupervisedMission): Promise<GenerationResult> {
  const screenText = missionScreenText(mission);
  const plan = generationPlan(process.env, screenText);
  if (plan.mode === "not_configured") return notConfiguredGeneration();
  if (plan.mode === "withheld") return withheldGeneration();

  const evidence = mission.evidence
    .map(
      (item) =>
        `- ${item.id} (${item.classification}) ${item.statement} [${item.source || "no source"}]`,
    )
    .join("\n");
  const result = await generateJson({
    system: [
      "You compare options for one product question.",
      "Use only the evidence in the user message. Do not invent customers, interviews, metrics or sources.",
      "Return JSON with options (at least two), citations and gaps.",
      "Each option has id (lowercase letters, numbers, hyphens), title, tradeoff and basis.",
      "basis is an evidence id from the list, or the exact word gap.",
      "citations is an array of those evidence ids. Put anything you cannot support into gaps.",
    ].join(" "),
    user: [
      `Question: ${mission.brief.question}`,
      `Audience: ${mission.brief.audience}`,
      `Outcome: ${mission.brief.outcome}`,
      `Constraints: ${mission.brief.constraints || "None recorded."}`,
      `Evidence:\n${evidence}`,
    ].join("\n"),
    screenText,
    validate: (text) => {
      try {
        const parsed = parseModelOptions(text, mission.evidence);
        return { ok: true, value: parsed };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Invalid comparison." };
      }
    },
  });
  if (!result.ok) throw new Error(result.reason);
  const parsed = result.value;
  return {
    ran: true,
    label: result.model,
    provider: plan.provider,
    model: result.model,
    output: JSON.stringify(parsed),
    citations: parsed.citations,
    gaps: parsed.gaps,
  };
}
