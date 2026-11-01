/**
 * Full supervised mission ZIP: decision pack + meaningful artefacts with honesty
 * about what is / is not bundled. Reuses programme createZip; never invents files.
 */
import { honestyFor } from "./decision-pack";
import { buildDecisionRoadmapMarkdown } from "./decision-roadmap";
import { buildDeliveryPackage } from "./delivery-package";
import { MEETING_READER_LABEL, meetingBacklogMarkdown } from "./meeting-notes";
import { authorisedDecisionPackMarkdown, authorisedDecisionPackPdfBytes } from "./export-snapshot";
import { buildPmBriefingMarkdown } from "./pm-briefing-pack";
import { buildTeamCollaborationMarkdown } from "./team-collaboration";
import type { SupervisedMission } from "./types";
import type { MissionBundle } from "@/lib/workforce/types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "mission";

export type SupervisedZipFile = { path: string; content: string };
export type SupervisedZipInventoryItem = { path: string; bundled: boolean; note: string };

/** Package decision pack, evidence register, prototype HTML (when present), and manifest. */
export function buildSupervisedZip(
  mission: SupervisedMission,
  exportedAt = new Date().toISOString(),
  /** The linked delivery build, when delivery has started (read from the caller's workspace). */
  delivery: MissionBundle | null = null,
): {
  files: SupervisedZipFile[];
  title: string;
  filename: string;
  /** What the archive holds, as recorded in its manifest. */
  inventory: SupervisedZipInventoryItem[];
} {
  return assembleSupervisedZip(mission, exportedAt, true, delivery);
}

/**
 * What the archive would hold, without building any file body (no PDF, no base64). Same
 * assembly as buildSupervisedZip, so the list cannot drift from the download.
 */
export function supervisedZipInventory(
  mission: SupervisedMission,
  delivery: MissionBundle | null = null,
): SupervisedZipInventoryItem[] {
  return assembleSupervisedZip(mission, new Date().toISOString(), false, delivery).inventory;
}

function assembleSupervisedZip(
  mission: SupervisedMission,
  exportedAt: string,
  withContent: boolean,
  delivery: MissionBundle | null,
): {
  files: SupervisedZipFile[];
  title: string;
  filename: string;
  inventory: SupervisedZipInventoryItem[];
} {
  const root = `supervised-${slug(mission.brief.question.slice(0, 40))}-${mission.id.slice(0, 8)}`;
  const honesty = honestyFor(mission);
  const files: SupervisedZipFile[] = [];
  const inventory: SupervisedZipInventoryItem[] = [];

  // File bodies are built only when the archive itself is wanted.
  const add = (path: string, content: () => string, meta: { bundled: boolean; note: string }) => {
    if (withContent) files.push({ path: `${root}/${path}`, content: content() });
    inventory.push({ path, ...meta });
  };

  add(
    "README.md",
    () => `# Supervised mission export

**Question:** ${mission.brief.question}

- **Mission id:** ${mission.id}
- **Stage:** ${mission.stage}
- **Exported at:** ${exportedAt}
- **Production mode:** ${honesty.productionMode}
- **Generation:** ${honesty.generationLabel}

## What is bundled
- Decision pack (Markdown + plain-text PDF as base64) from the authorised export snapshot when present
- Product briefing summary and decision roadmap
- Recorded team collaboration (assignments / handoffs) when present
- Evidence register (statements + source *references* only)
- Sandboxed HTML prototype when the prototype beat completed
- The build (\`delivery/\`) when delivery has started: every saved stage output with who made it and how, the team record and your gate decisions
- Meeting notes you supplied and the backlog you accepted from them (\`meetings.md\`), when present
- This manifest of honesty labels

## What is not bundled
- Live web page bodies behind cited URLs (\`sourcesBundled: false\`)
- API keys, credentials, or private workspace data beyond this mission
- Fabricated customer interviews or meetings
- Production deployable source — the prototype is sandboxed HTML only

${honesty.note}
`,
    { bundled: true, note: "Honesty README" },
  );

  add("decision-pack/decision-pack.md", () => authorisedDecisionPackMarkdown(mission), {
    bundled: true,
    note: mission.exportBody
      ? "Decision pack markdown (authorised export snapshot)"
      : "Decision pack markdown (draft — export in-app to freeze snapshot)",
  });

  add("decision-roadmap/decision-roadmap.md", () => buildDecisionRoadmapMarkdown(mission), {
    bundled: true,
    note: "Human gates, agent work, recommendation, path, artefacts",
  });

  add("briefing/product-briefing.md", () => buildPmBriefingMarkdown(mission), {
    bundled: true,
    note: "Focused PM briefing — recommendation, evidence, unknowns, next step",
  });

  const collabMd = buildTeamCollaborationMarkdown(mission);
  if (collabMd) {
    add("team-collaboration/team-collaboration.md", () => collabMd, {
      bundled: true,
      note: "Persisted assignments and handoffs",
    });
  }

  const pdfBase64 = () => {
    const pdfBytes = authorisedDecisionPackPdfBytes(mission);
    let binary = "";
    for (let i = 0; i < pdfBytes.length; i++) binary += String.fromCharCode(pdfBytes[i]!);
    return btoa(binary);
  };
  add("decision-pack/decision-pack.pdf.base64.txt", pdfBase64, {
    bundled: true,
    note: "Plain-text PDF as base64 (use in-app Download PDF for a binary file)",
  });

  const evidenceLines =
    mission.evidence
      .map(
        (e) =>
          `- [${e.classification}] ${e.statement}${e.source ? ` — ref: ${e.source}` : " — no source ref"}`,
      )
      .join("\n") || "- None recorded.";
  add(
    "evidence/evidence-register.md",
    () => `# Evidence register\n\nSources are referenced, not bundled.\n\n${evidenceLines}\n`,
    { bundled: true, note: "Evidence statements + source refs only" },
  );

  if (mission.prototype?.html) {
    const html = mission.prototype.html;
    add("prototype/prototype.html", () => html, {
      bundled: true,
      note: `Sandboxed HTML · ${mission.prototype.honesty.label}`,
    });
    if (mission.prototype.checks?.length) {
      const checks = mission.prototype.checks;
      add("prototype/verify.json", () => JSON.stringify(checks, null, 2), {
        bundled: true,
        note: "Static verify rows (failures remain visible)",
      });
    }
  } else {
    add(
      "prototype/README.md",
      () =>
        `# Prototype\n\nNot produced yet. Approve the sandboxed HTML prototype beat after Pack to include it here.\n`,
      { bundled: false, note: "Prototype not yet built" },
    );
  }

  // The build: every saved stage output, the team record and the owner's gate decisions.
  const deliveryPack = delivery ? buildDeliveryPackage(delivery) : null;
  if (deliveryPack) {
    for (const f of deliveryPack.files) {
      const body = f.content;
      add(f.path, () => body, { bundled: true, note: f.note });
    }
  } else if (mission.delivery) {
    add(
      "delivery/README.md",
      () => "# The build\n\nThe build could not be read for this export.\n",
      {
        bundled: false,
        note: "Build outputs are added when the archive is built",
      },
    );
  }

  // Meetings: the owner's own notes and what they accepted. Proposals are rule-based.
  if ((mission.meetings ?? []).length) {
    add("meetings.md", () => meetingBacklogMarkdown(mission.meetings) ?? "", {
      bundled: true,
      note: "Owner-supplied meeting notes and the accepted backlog",
    });
  }

  const gaps = [
    ...(mission.researchGaps ?? []),
    ...mission.evidence.filter((e) => e.classification === "gap").map((e) => e.statement),
  ];
  add(
    "project-manifest.json",
    () =>
      JSON.stringify(
        {
          kind: "supervised-mission-export",
          missionId: mission.id,
          exportedAt,
          productionMode: honesty.productionMode,
          generationLabel: honesty.generationLabel,
          sourcesBundled: false,
          prototypeBundled: Boolean(mission.prototype?.html),
          teamCollaborationBundled: Boolean(collabMd),
          exportSnapshotFrozen: Boolean(mission.exportBody),
          simulated:
            honesty.productionMode === "simulated" ||
            honesty.productionMode === "mixed" ||
            Boolean(deliveryPack?.manifest.outputs.some((o) => o.simulated !== false)),
          delivery:
            deliveryPack?.manifest ??
            (mission.delivery
              ? { wfMissionId: mission.delivery.wfMissionId, bundled: false }
              : null),
          meetings: (mission.meetings ?? []).length
            ? {
                count: (mission.meetings ?? []).length,
                notesSuppliedBy: "project owner",
                proposalsProducedBy: MEETING_READER_LABEL,
                accepted: (mission.meetings ?? []).reduce(
                  (n, m) => n + m.proposals.filter((p) => p.status === "accepted").length,
                  0,
                ),
              }
            : null,
          inventory,
          researchGaps: gaps.slice(0, 40),
          workerLink: mission.workerLink ?? null,
          permissionsNote:
            "Export is workspace-scoped. Linked source URLs are not fetched into this archive.",
        },
        null,
        2,
      ),
    { bundled: true, note: "Honesty manifest" },
  );

  return {
    files,
    title: mission.brief.question,
    filename: `${root}.zip`,
    inventory,
  };
}
