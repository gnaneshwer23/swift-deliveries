/**
 * The readable cover of a project package: a linked index of documents that
 * exist on the case, plus an honest list of planned documents that were not saved.
 * It never writes a charter, PRD or other body the record does not already hold.
 */
import { honestyFor } from "./decision-pack";
import { projectEnding } from "./project-ending";
import { decisionTrailMarkdown } from "./room-decision-trail";
import type { SupervisedMission } from "./types";

export type PackageEntry = {
  path: string;
  note: string;
  bundled: boolean;
};

/** Delivery-stage documents the product plan can produce. Listed only when saved. */
const PLANNED_DELIVERY_DOCS: Array<{ key: string; title: string }> = [
  { key: "charter", title: "Project charter" },
  { key: "market", title: "Market and customer evidence" },
  { key: "research", title: "Deep research dossier" },
  { key: "foresight", title: "Technology foresight scan" },
  { key: "prd", title: "PRD and success metrics" },
  { key: "ux", title: "UX journeys and UI specification" },
  { key: "architecture", title: "Architecture, data model and delivery plan" },
  { key: "prototype", title: "Delivery-stage prototype" },
  { key: "verify", title: "Automated verification" },
  { key: "release_pack", title: "Release candidate pack" },
  { key: "evolution", title: "Measurement and evolution plan" },
];

const NOT_PRODUCED = "Not produced on this case";
const NOT_READ = "Not included in this download. The build record could not be read.";

function cell(value: string): string {
  return value.replace(/\|/g, "/").replace(/\n/g, " ");
}

function bundled(entries: PackageEntry[], test: RegExp): PackageEntry | undefined {
  return entries.find((entry) => entry.bundled && test.test(entry.path));
}

function deliveryFile(entries: PackageEntry[], key: string): PackageEntry | undefined {
  return bundled(entries, new RegExp(`(?:^|/)delivery/\\d+-${key}\\.`));
}

export function buildProjectPackageMarkdown(input: {
  mission: SupervisedMission;
  exportedAt: string;
  entries: PackageEntry[];
  /** False when delivery started but its rows could not be read. */
  deliveryReadable: boolean;
}): string {
  const { mission, exportedAt, entries, deliveryReadable } = input;
  const honesty = honestyFor(mission);
  const ending = projectEnding(mission);
  const produced = entries.filter((entry) => entry.bundled);

  const toc = produced.map((entry) => `- [${entry.path}](${entry.path}) — ${cell(entry.note)}`);

  const caseRows: string[] = [];
  const pushCase = (title: string, entry: PackageEntry | undefined, missing: string) => {
    if (entry) {
      caseRows.push(
        `| ${cell(title)} | On this case | [${entry.path}](${entry.path}) | ${cell(entry.note)} |`,
      );
      return;
    }
    caseRows.push(`| ${cell(title)} | ${missing} | — | — |`);
  };

  pushCase(
    "Decision pack",
    bundled(entries, /(?:^|\/)decision-pack\/decision-pack\.md$/),
    NOT_PRODUCED,
  );
  pushCase(
    "Product briefing",
    bundled(entries, /(?:^|\/)briefing\/product-briefing\.md$/),
    NOT_PRODUCED,
  );
  pushCase(
    "Decisions and roadmap",
    bundled(entries, /(?:^|\/)decision-roadmap\/decision-roadmap\.md$/),
    NOT_PRODUCED,
  );
  pushCase(
    "Evidence register",
    bundled(entries, /(?:^|\/)evidence\/evidence-register\.md$/),
    NOT_PRODUCED,
  );
  pushCase(
    "Executive pack",
    bundled(entries, /(?:^|\/)executive\/executive-pack\.md$/),
    NOT_PRODUCED,
  );
  pushCase(
    "Team and handoffs",
    bundled(entries, /(?:^|\/)team-collaboration\/team-collaboration\.md$/),
    NOT_PRODUCED,
  );
  pushCase("Meeting notes", bundled(entries, /(?:^|\/)meetings\.md$/), NOT_PRODUCED);
  pushCase("Company record", bundled(entries, /(?:^|\/)company\/README\.md$/), NOT_PRODUCED);
  pushCase(
    "Sandboxed HTML prototype",
    bundled(entries, /(?:^|\/)prototype\/prototype\.html$/),
    NOT_PRODUCED,
  );

  const deliveryMissing = deliveryReadable ? NOT_PRODUCED : NOT_READ;
  for (const doc of PLANNED_DELIVERY_DOCS) {
    pushCase(doc.title, deliveryFile(entries, doc.key), deliveryMissing);
  }

  const gateLine = ending.completed
    ? ending.nextHumanGate
      ? `Next human gate: ${ending.nextHumanGate}.`
      : "No further human gate is required to finish this case."
    : ending.nextHumanGate
      ? `Next human gate: ${ending.nextHumanGate}.`
      : "No human gate is waiting.";

  return [
    `# Project package`,
    ``,
    `**Question:** ${mission.brief.question}`,
    ``,
    `- **Mission id:** ${mission.id}`,
    `- **Stage:** ${mission.stage}`,
    `- **Exported at:** ${exportedAt}`,
    `- **Production mode:** ${honesty.productionMode}`,
    `- **Generation:** ${honesty.generationLabel || "Not recorded"}`,
    ``,
    `## Honesty`,
    ``,
    honesty.note,
    `This index links only files in this package. It does not add a charter, PRD or any other document the case did not save. Simulated drafts are deterministic templates. Model output is labelled with the model id when one was recorded. Sources are references; page bodies are not bundled.`,
    ``,
    `## How this project ends`,
    ``,
    ending.howItEnds,
    ending.meaning,
    gateLine,
    ending.completed
      ? "Status: Completed. The decision pack is saved."
      : "Status: Not completed. The decision pack export is still required before this case is complete.",
    ``,
    `## Contents`,
    ``,
    toc.length ? toc.join("\n") : "- No files are bundled.",
    ``,
    `## Documents`,
    ``,
    `| Document | On this case | File | How it was made |`,
    `| --- | --- | --- | --- |`,
    ...caseRows,
    ``,
    decisionTrailMarkdown(mission).trimEnd(),
    ``,
    `## What this package does not claim`,
    ``,
    `- No outcome, test or launch is treated as confirmed unless that result is saved on the case.`,
    `- Linked web pages, credentials and hidden model reasoning are not included.`,
    `- Quality labels stay specific (Agent-reviewed, Automatically tested, Human-reviewed, Externally attested) when a saved file carries them. This index does not add one.`,
    ``,
  ].join("\n");
}
