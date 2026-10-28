/**
 * Download-facing timeline: human gates, agent work, recommendation, path, artefacts.
 * Uses persisted mission fields and activity events only — no fabricated steps.
 */
import { honestyFor } from "./decision-pack";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  deriveAgentRecommendation,
  normalizeDecisionChoice,
} from "./verdict";

export type RoadmapEntry = {
  at: string | null;
  kind: "human_gate" | "agent_work" | "recommendation" | "human_path" | "artefact" | "note";
  title: string;
  detail: string;
  productionLabel?: string;
};

export function buildDecisionRoadmapEntries(mission: SupervisedMission): RoadmapEntry[] {
  const entries: RoadmapEntry[] = [];
  const honesty = honestyFor(mission);

  entries.push({
    at: mission.updatedAt,
    kind: "note",
    title: "Mission opened",
    detail: mission.brief.question,
  });

  if (mission.team?.approvedAt) {
    entries.push({
      at: mission.team.approvedAt,
      kind: "human_gate",
      title: "Plan approved",
      detail: `PM brief and specialist plan approved. Team size on record: ${mission.team.tasks.length} tasks.`,
    });
  } else if (mission.team) {
    entries.push({
      at: null,
      kind: "human_gate",
      title: "Plan awaiting approval",
      detail: "Nothing billable runs until you approve the bounded plan.",
    });
  }

  if (mission.researchPassCompletedAt) {
    entries.push({
      at: mission.researchPassCompletedAt,
      kind: "agent_work",
      title: "Research pass recorded",
      detail: mission.researchProvider
        ? `Research cited via ${mission.researchProvider}. Gaps stay labelled when tools are missing.`
        : "Research pass on record (simulated or supplied evidence only).",
      productionLabel: mission.researchProvider
        ? "model-assisted retrieval"
        : honesty.generationLabel,
    });
  }

  if (mission.proposal) {
    const gen = mission.proposal.generation;
    entries.push({
      at: null,
      kind: "agent_work",
      title: "Options compared",
      detail: `${mission.proposal.options.length} options · scope ${mission.proposal.scopeHash.slice(0, 12)} · ${gen.label}`,
      productionLabel: gen.ran ? `${gen.label} (model)` : gen.label,
    });
  }

  const rec =
    mission.approval?.agentRecommendation ?? deriveAgentRecommendation(mission).recommendation;
  if (mission.proposal || mission.approval) {
    entries.push({
      at: mission.approval?.decidedAt ?? null,
      kind: "recommendation",
      title: "Agent recommendation",
      detail: AGENT_RECOMMENDATION_LABELS[rec],
      ...(mission.proposal?.generation.label
        ? { productionLabel: mission.proposal.generation.label }
        : {}),
    });
  }

  if (mission.approval) {
    entries.push({
      at: mission.approval.decidedAt,
      kind: "human_path",
      title: "Human next path",
      detail: `${HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]} · option ${mission.approval.optionId}${
        mission.approval.disagreesWithRecommendation ? " (differs from recommendation)" : ""
      }`,
    });
  }

  if (mission.expectation) {
    entries.push({
      at: mission.expectation.recordedAt,
      kind: "human_gate",
      title: "Expectation recorded",
      detail: `Hypothesis: ${mission.expectation.hypothesis} · metric: ${mission.expectation.expectedMetric}`,
    });
  }

  if (mission.artefact) {
    entries.push({
      at: null,
      kind: "artefact",
      title: mission.artefact.title,
      detail: mission.artefact.provenance,
      productionLabel: mission.artefact.provenance,
    });
  }

  if (mission.exportBody) {
    entries.push({
      at: null,
      kind: "artefact",
      title: "Decision pack exported",
      detail: "Markdown/PDF stored on the mission. Re-download does not add usage.",
    });
  }

  if (mission.prototype?.approvedAt) {
    entries.push({
      at: mission.prototype.producedAt,
      kind: "artefact",
      title: mission.prototype.title,
      detail: mission.prototype.honesty.label,
      productionLabel: mission.prototype.honesty.label,
    });
  }

  if (mission.observation) {
    entries.push({
      at: mission.observation.suppliedAt,
      kind: "human_gate",
      title: "Observation supplied",
      detail: mission.observation.label,
    });
  }

  for (const inv of mission.invalidatedApprovals ?? []) {
    entries.push({
      at: inv.decidedAt,
      kind: "note",
      title: "Prior approval cleared",
      detail: inv.reason,
    });
  }

  for (const event of (mission.activity ?? []).slice(-24)) {
    entries.push({
      at: event.at,
      kind: "agent_work",
      title: event.kind,
      detail: `${event.actor}: ${event.summary}`,
    });
  }

  return entries;
}

export function buildDecisionRoadmapMarkdown(mission: SupervisedMission): string {
  const honesty = honestyFor(mission);
  const entries = buildDecisionRoadmapEntries(mission);
  const lines = entries.map((e) => {
    const when = e.at ? e.at : "—";
    const prod = e.productionLabel ? ` · _${e.productionLabel}_` : "";
    return `- **${when}** · ${e.kind.replaceAll("_", " ")} · **${e.title}**${prod}\n  ${e.detail}`;
  });

  return [
    `# Decision roadmap`,
    ``,
    `How humans and agents reached the current recommendation and artefacts. Timestamps are persisted; missing times mean the step is proposed or in progress.`,
    ``,
    `**Question:** ${mission.brief.question}`,
    ``,
    `## Timeline`,
    lines.length ? lines.join("\n") : "- No steps recorded yet.",
    ``,
    `## Honesty`,
    `- Production mode: ${honesty.productionMode}`,
    `- ${honesty.note}`,
    `- Simulated drafts and model ids are disclosed on each artefact; this roadmap does not replace the full evidence register.`,
  ].join("\n");
}
