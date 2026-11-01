/**
 * PT-3 — Executive pack (short) vs full archive (extends supervised ZIP).
 */
import { buildContinuationPlanMarkdown } from "./continuation-plan";
import { buildDecisionRoadmapMarkdown } from "./decision-roadmap";
import { buildDecisionPackMarkdown, honestyFor } from "./decision-pack";
import { buildPmBriefingPack } from "./pm-briefing-pack";
import {
  buildSupervisedZip,
  type CompanyRecordSources,
  type SupervisedZipFile,
} from "./supervised-zip";
import type { MissionBundle } from "@/lib/workforce/types";
import type { SupervisedMission } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
} from "./verdict";

export function buildExecutivePackMarkdown(mission: SupervisedMission): string {
  const honesty = honestyFor(mission);
  const briefing = buildPmBriefingPack(mission);
  const path = mission.approval
    ? HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]
    : "Not recorded";
  const rec =
    mission.approval?.agentRecommendation ??
    (briefing.recommendation ? briefing.recommendation : null);

  return [
    `# Executive pack`,
    ``,
    `## Idea`,
    mission.brief.question,
    ``,
    `## Recommendation`,
    rec ? AGENT_RECOMMENDATION_LABELS[rec] : "Pending options/research",
    briefing.recommendationRationale,
    ``,
    `## Human next path`,
    path,
    mission.approval?.disagreesWithRecommendation
      ? "Note: path differs from recommendation; recommendation remains on the record."
      : "",
    ``,
    `## Strongest evidence (refs only)`,
    ...mission.evidence
      .filter((e) => e.classification === "supplied")
      .slice(0, 6)
      .map((e) => `- [${e.id}] ${e.statement}${e.source ? ` — ${e.source}` : ""}`),
    ``,
    `## Important unknowns`,
    ...mission.evidence
      .filter((e) => e.classification === "gap")
      .slice(0, 6)
      .map((e) => `- [${e.id}] ${e.statement}`),
    ``,
    `## Next step`,
    briefing.smallestNextStep,
    ``,
    buildDecisionRoadmapMarkdown(mission),
    ``,
    `## Honesty`,
    honesty.note,
    `Sources are referenced, not bundled. Hidden model reasoning is not included.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Full archive = supervised ZIP + executive pack + continuation/case extras when present. */
export function buildFullArchiveZip(
  mission: SupervisedMission,
  exportedAt = new Date().toISOString(),
  /** The linked build and its records, read from the caller's workspace. */
  delivery: MissionBundle | null = null,
  records: CompanyRecordSources | null = null,
): { files: SupervisedZipFile[]; title: string; filename: string } {
  const base = buildSupervisedZip(mission, exportedAt, delivery, records);
  const root = base.filename.replace(/\.zip$/, "");
  const files = [...base.files];

  files.push({
    path: `${root}/executive/executive-pack.md`,
    content: buildExecutivePackMarkdown(mission),
  });

  if (mission.continuationPlan) {
    files.push({
      path: `${root}/continuation/continuation-plan.md`,
      content: buildContinuationPlanMarkdown(mission, mission.continuationPlan),
    });
  }

  if (mission.caseRoom) {
    files.push({
      path: `${root}/case-room/folders.json`,
      content: JSON.stringify(
        {
          folders: mission.caseRoom.folders,
          handoffs: mission.caseRoom.handoffs,
          artefacts: mission.caseRoom.artefacts.map((a) => ({
            id: a.id,
            type: a.type,
            title: a.title,
            status: a.status,
            ownerLabel: a.ownerLabel,
            evidenceIds: a.evidenceIds,
          })),
          stepGate: mission.caseRoom.stepGate,
        },
        null,
        2,
      ),
    });
  }

  // Refresh manifest note
  files.push({
    path: `${root}/archive-manifest.json`,
    content: JSON.stringify(
      {
        kind: "full-project-archive",
        missionId: mission.id,
        exportedAt,
        levels: ["executive", "full"],
        exclusions: [
          "Linked web page bodies",
          "API keys and credentials",
          "Hidden model chain-of-thought",
          "Other workspaces / customers",
        ],
        decisionPackIncluded: true,
        executivePackIncluded: true,
        note: "Permission-aware: only this mission’s authorised record.",
      },
      null,
      2,
    ),
  });

  // Prefer static import style - fix require
  return {
    files,
    title: mission.brief.question,
    filename: `${root}-full-archive.zip`,
  };
}

/** Keep decision pack builder available for tests that compare length. */
export function executiveIsShorterThanFullPack(mission: SupervisedMission): boolean {
  const exec = buildExecutivePackMarkdown(mission);
  const full = buildDecisionPackMarkdown(mission);
  return exec.length < full.length;
}
