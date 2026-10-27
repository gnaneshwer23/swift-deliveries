/**
 * Full supervised mission ZIP: decision pack + meaningful artefacts with honesty
 * about what is / is not bundled. Reuses programme createZip; never invents files.
 */
import {
  buildDecisionPackMarkdown,
  buildDecisionPackPdf,
  honestyFor,
} from "./decision-pack";
import type { SupervisedMission } from "./types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "mission";

export type SupervisedZipFile = { path: string; content: string };

/** Package decision pack, evidence register, prototype HTML (when present), and manifest. */
export function buildSupervisedZip(
  mission: SupervisedMission,
  exportedAt = new Date().toISOString(),
): { files: SupervisedZipFile[]; title: string; filename: string } {
  const root = `supervised-${slug(mission.brief.question.slice(0, 40))}-${mission.id.slice(0, 8)}`;
  const honesty = honestyFor(mission);
  const files: SupervisedZipFile[] = [];
  const inventory: Array<{ path: string; bundled: boolean; note: string }> = [];

  const add = (path: string, content: string, meta: { bundled: boolean; note: string }) => {
    files.push({ path: `${root}/${path}`, content });
    inventory.push({ path, ...meta });
  };

  add(
    "README.md",
    `# Supervised mission export

**Question:** ${mission.brief.question}

- **Mission id:** ${mission.id}
- **Stage:** ${mission.stage}
- **Exported at:** ${exportedAt}
- **Production mode:** ${honesty.productionMode}
- **Generation:** ${honesty.generationLabel}

## What is bundled
- Decision pack (Markdown + plain-text PDF as base64)
- Evidence register (statements + source *references* only)
- Sandboxed HTML prototype when the prototype beat completed
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

  const md = buildDecisionPackMarkdown(mission);
  add("decision-pack/decision-pack.md", md, {
    bundled: true,
    note: "Decision pack markdown",
  });

  const pdfBytes = buildDecisionPackPdf(md);
  let binary = "";
  for (let i = 0; i < pdfBytes.length; i++) binary += String.fromCharCode(pdfBytes[i]!);
  add("decision-pack/decision-pack.pdf.base64.txt", btoa(binary), {
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
    `# Evidence register\n\nSources are referenced, not bundled.\n\n${evidenceLines}\n`,
    { bundled: true, note: "Evidence statements + source refs only" },
  );

  if (mission.prototype?.html) {
    add("prototype/prototype.html", mission.prototype.html, {
      bundled: true,
      note: `Sandboxed HTML · ${mission.prototype.honesty.label}`,
    });
    if (mission.prototype.checks?.length) {
      add("prototype/verify.json", JSON.stringify(mission.prototype.checks, null, 2), {
        bundled: true,
        note: "Static verify rows (failures remain visible)",
      });
    }
  } else {
    add(
      "prototype/README.md",
      `# Prototype\n\nNot produced yet. Approve the sandboxed HTML prototype beat after Pack to include it here.\n`,
      { bundled: false, note: "Prototype not yet built" },
    );
  }

  const gaps = [
    ...(mission.researchGaps ?? []),
    ...mission.evidence.filter((e) => e.classification === "gap").map((e) => e.statement),
  ];
  add(
    "project-manifest.json",
    JSON.stringify(
      {
        kind: "supervised-mission-export",
        missionId: mission.id,
        exportedAt,
        productionMode: honesty.productionMode,
        generationLabel: honesty.generationLabel,
        sourcesBundled: false,
        prototypeBundled: Boolean(mission.prototype?.html),
        simulated: honesty.productionMode === "simulated" || honesty.productionMode === "mixed",
        inventory,
        researchGaps: gaps.slice(0, 40),
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
  };
}
