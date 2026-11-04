/**
 * Editable DOCX set and a 20-slide PPTX, rendered only from the saved case.
 * Missing parts stay in the file and are labelled. No currency figure is added.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
} from "docx";
import PptxGenJS from "pptxgenjs";
import type { ArchiveDownloadFile } from "@/lib/download-file";
import { CHIEF_OF_STAFF_ID, chiefOfStaffName, usageBudgetLines } from "./chief-of-staff";
import { honestyFor } from "./decision-pack";
import { nextGateLabel } from "./next-gate";
import { projectEnding } from "./project-ending";
import type { SupervisedMission } from "./types";
import { nextRequiredAction } from "./types";
import {
  AGENT_RECOMMENDATION_LABELS,
  HUMAN_NEXT_PATH_LABELS,
  normalizeDecisionChoice,
  type AgentRecommendation,
} from "./verdict";

export const OFFICE_MISSING = "Not produced on this case.";

const INK = "1C1B19";
const BRONZE = "985808";
const MUTED = "6F6961";
const PAPER = "F6F3EE";
const RULE = "E6DFD4";

export type OfficeSection = {
  title: string;
  paragraphs: string[];
};

export type OfficeDocumentPlan = {
  path: string;
  title: string;
  note: string;
  sections: OfficeSection[];
};

export type OfficeSlidePlan = {
  title: string;
  bullets: string[];
};

export type RenderedOfficeFile = {
  path: string;
  base64: string;
  note: string;
};

export type RenderedOfficePackage = {
  files: RenderedOfficeFile[];
  documents: OfficeDocumentPlan[];
  slides: OfficeSlidePlan[];
  productionNote: string;
};

function clip(items: string[], max = 6): string[] {
  if (!items.length) return [OFFICE_MISSING];
  const shown = items.slice(0, max);
  if (items.length > max) shown.push(`${items.length - max} more are on the case record.`);
  return shown;
}

function orMissing(value: string): string[] {
  const trimmed = value.trim();
  return trimmed ? [trimmed] : [OFFICE_MISSING];
}

function recommendationLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return value in AGENT_RECOMMENDATION_LABELS
    ? AGENT_RECOMMENDATION_LABELS[value as AgentRecommendation]
    : null;
}

export function officeProductionLines(mission: SupervisedMission): string[] {
  const honesty = honestyFor(mission);
  const generation = mission.proposal?.generation;
  const model = generation?.ran
    ? `The case comparison recorded model ${generation.model ?? generation.provider ?? "(id not recorded)"}.`
    : "Model id: none for this file. The case comparison did not record a model run.";
  return [
    "Production mode for these office files: simulated draft.",
    `Rendered by ${chiefOfStaffName()} (${CHIEF_OF_STAFF_ID}) from the saved case. No model was called to write this file.`,
    `Case comparison on the record: ${honesty.productionMode}. ${honesty.generationLabel}.`,
    model,
    "This file does not add a quality label. Saved stage files keep their own labels when the archive includes them.",
  ];
}

function produced(title: string, paragraphs: string[]): OfficeSection {
  return { title, paragraphs: paragraphs.length ? paragraphs : [OFFICE_MISSING] };
}

export function planOfficeDocuments(mission: SupervisedMission): OfficeDocumentPlan[] {
  const honesty = officeProductionLines(mission);
  const approval = mission.approval;
  const decision = approval
    ? [
        `${HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(approval.choice)]}${approval.note ? ` — ${approval.note}` : ""}`,
        `Recorded ${approval.decidedAt}.`,
      ]
    : [OFFICE_MISSING];
  const invalidated = (mission.invalidatedApprovals ?? []).map(
    (item) => `${item.choice} · ${item.decidedAt} · ${item.reason}`,
  );
  const options = (mission.proposal?.options ?? []).map(
    (option) => `${option.title} — ${option.tradeoff}`,
  );
  const supplied = mission.evidence
    .filter((item) => item.classification === "supplied")
    .map((item) => (item.source ? `${item.statement} — ${item.source}` : item.statement));
  const assumptions = mission.evidence
    .filter((item) => item.classification === "assumption")
    .map((item) => item.statement);
  const gaps = [
    ...mission.evidence
      .filter((item) => item.classification === "gap")
      .map((item) => item.statement),
    ...mission.researchGaps,
  ];
  const tasks = (mission.team?.tasks ?? []).map(
    (task) =>
      `${task.title} · ${task.ownerLabel}${task.capabilityId ? ` (${task.capabilityId})` : ""} · ${task.status}`,
  );
  const handoffs = [
    ...(mission.teamCollaboration?.handoffs ?? []).map((handoff) => handoff.findingSummary),
    ...(mission.caseRoom?.handoffs ?? []).map((handoff) => handoff.finding),
  ];
  const continuation = (mission.continuationPlan?.roles ?? []).map(
    (role) => `${role.label}: ${role.responsibility}`,
  );

  return [
    {
      path: "office/01-project-charter.docx",
      title: "Project charter",
      note: "Charter fields taken from the saved brief",
      sections: [
        produced("How this file was produced", honesty),
        produced("Question", orMissing(mission.brief.question)),
        produced("Audience", orMissing(mission.brief.audience)),
        produced("Outcome", orMissing(mission.brief.outcome)),
        produced("Constraints", orMissing(mission.brief.constraints)),
      ],
    },
    {
      path: "office/02-prd-decision-brief.docx",
      title: "PRD and decision brief",
      note: "Decision brief, experiment brief and options saved on the case",
      sections: [
        produced("How this file was produced", honesty),
        produced("Decision brief", orMissing(mission.artefact?.decisionBrief ?? "")),
        produced("Experiment brief", orMissing(mission.artefact?.experimentBrief ?? "")),
        produced("Options", clip(options)),
        produced("Success metric", orMissing(mission.expectation?.expectedMetric ?? "")),
      ],
    },
    {
      path: "office/03-evidence-summary.docx",
      title: "Evidence summary",
      note: "Evidence register statements and source references",
      sections: [
        produced("How this file was produced", honesty),
        produced("Supplied evidence", clip(supplied)),
        produced("Assumptions", clip(assumptions)),
        produced("Gaps", clip(gaps)),
      ],
    },
    {
      path: "office/04-decision-log.docx",
      title: "Decision log",
      note: "Human decision and invalidated decisions on the record",
      sections: [
        produced("How this file was produced", honesty),
        produced("Current decision", decision),
        produced("Earlier decisions", clip(invalidated)),
        produced(
          "Recommendation on the record",
          orMissing(
            recommendationLabel(
              approval?.agentRecommendation ??
                mission.continuationPlan?.derivedFrom.agentRecommendation,
            ) ?? "",
          ),
        ),
      ],
    },
    {
      path: "office/05-team-and-handoffs.docx",
      title: "Team and handoffs",
      note: "Team tasks, handoffs and continuation roles saved on the case",
      sections: [
        produced("How this file was produced", honesty),
        produced("Team", clip(tasks, 8)),
        produced("Handoffs", clip(handoffs)),
        produced("Continuation roles", clip(continuation)),
      ],
    },
  ];
}

export function planOfficeSlides(mission: SupervisedMission): OfficeSlidePlan[] {
  const ending = projectEnding(mission);
  const next = nextRequiredAction(mission);
  const gate = ending.nextHumanGate ?? nextGateLabel(next);
  const supplied = mission.evidence
    .filter((item) => item.classification === "supplied")
    .map((item) => item.statement);
  const assumptions = mission.evidence
    .filter((item) => item.classification === "assumption")
    .map((item) => item.statement);
  const gaps = mission.evidence
    .filter((item) => item.classification === "gap")
    .map((item) => item.statement);
  const options = (mission.proposal?.options ?? []).map(
    (option) => `${option.title} — ${option.tradeoff}`,
  );
  const tasks = (mission.team?.tasks ?? []).map((task) => `${task.ownerLabel}: ${task.title}`);
  const handoffs = [
    ...(mission.teamCollaboration?.handoffs ?? []).map((handoff) => handoff.findingSummary),
    ...(mission.caseRoom?.handoffs ?? []).map((handoff) => handoff.finding),
  ];
  const roadmap = (mission.continuationPlan?.roadmap ?? []).map((step) =>
    step.blocked && step.blockedReason
      ? `${step.title} · ${step.ownerLabel} · blocked: ${step.blockedReason}`
      : `${step.title} · ${step.ownerLabel}`,
  );
  const risks = [...(mission.continuationPlan?.unresolvedRisks ?? []), ...mission.researchGaps];
  const artefacts = [
    ...(mission.caseRoom?.artefacts ?? []).map(
      (artefact) => `${artefact.title} · ${artefact.status} · ${artefact.ownerLabel}`,
    ),
    mission.artefact ? `Decision pack: ${mission.artefact.title}` : "",
    mission.exportBody ? "Decision pack export is saved." : "",
    mission.delivery
      ? "Delivery has started under the recorded approval."
      : "Delivery has not started.",
  ].filter(Boolean);
  const recommendation = recommendationLabel(
    mission.approval?.agentRecommendation ??
      mission.continuationPlan?.derivedFrom.agentRecommendation,
  );
  const decision = mission.approval
    ? [
        HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)],
        mission.approval.note || OFFICE_MISSING,
      ]
    : [OFFICE_MISSING];

  const slides: OfficeSlidePlan[] = [
    {
      title: mission.brief.question.trim() || "Untitled case",
      bullets: [
        `${chiefOfStaffName()} · ${CHIEF_OF_STAFF_ID}`,
        "Project briefing from the saved case",
        `Stage: ${mission.stage}`,
      ],
    },
    { title: "How this deck was produced", bullets: officeProductionLines(mission) },
    { title: "The question", bullets: orMissing(mission.brief.question) },
    { title: "Audience", bullets: orMissing(mission.brief.audience) },
    { title: "Outcome", bullets: orMissing(mission.brief.outcome) },
    { title: "Constraints", bullets: orMissing(mission.brief.constraints) },
    {
      title: "Stage and next human gate",
      bullets: [`Stage: ${mission.stage}`, `Next human gate: ${gate}`, next.detail],
    },
    { title: "Evidence", bullets: clip(supplied) },
    { title: "Assumptions", bullets: clip(assumptions) },
    { title: "Gaps", bullets: clip(gaps.length ? gaps : mission.researchGaps) },
    { title: "Options", bullets: clip(options) },
    {
      title: "Recommendation",
      bullets: recommendation
        ? [recommendation, "Stored on the case. It is not a new recommendation from this deck."]
        : [OFFICE_MISSING],
    },
    { title: "Decision", bullets: decision },
    { title: "Team", bullets: clip(tasks, 8) },
    { title: "Handoffs", bullets: clip(handoffs) },
    {
      title: "Roadmap",
      bullets: mission.continuationPlan
        ? clip([mission.continuationPlan.summary, ...roadmap])
        : [OFFICE_MISSING],
    },
    { title: "Risks", bullets: clip(risks) },
    { title: "Usage", bullets: usageBudgetLines(mission) },
    { title: "Artefacts", bullets: clip(artefacts, 8) },
    {
      title: "What this deck does not claim",
      bullets: [
        "No customer, interview, meeting or currency amount was added.",
        "Linked pages are not included.",
        "A confirm click on the case is still required to cancel, pause, resume or pass a gate.",
        `Next human gate: ${gate}`,
      ],
    },
  ];
  if (slides.length !== 20) {
    throw new Error(`Chief of Staff deck must be 20 slides; built ${slides.length}.`);
  }
  return slides;
}

function runs(text: string, options?: { bold?: boolean; color?: string; size?: number }): TextRun {
  return new TextRun({
    text,
    font: "Calibri",
    size: options?.size ?? 22,
    color: options?.color ?? INK,
    ...(options?.bold ? { bold: true } : {}),
  });
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 140, line: 276 },
    children: [runs(text)],
  });
}

async function renderDocx(
  mission: SupervisedMission,
  plan: OfficeDocumentPlan,
): Promise<Uint8Array> {
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      border: {
        bottom: { color: BRONZE, space: 1, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [runs("DELIVERX", { bold: true, color: BRONZE, size: 18 })],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { before: 200, after: 80 },
      children: [runs(plan.title, { bold: true, size: 40 })],
    }),
    new Paragraph({
      spacing: { after: 280 },
      children: [
        runs(`${chiefOfStaffName()}  ·  ${CHIEF_OF_STAFF_ID}  ·  ${mission.id}`, {
          color: MUTED,
          size: 18,
        }),
      ],
    }),
  ];
  for (const section of plan.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        border: {
          bottom: { color: RULE, space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [runs(section.title, { bold: true, size: 28 })],
      }),
    );
    for (const paragraph of section.paragraphs) {
      children.push(bodyParagraph(paragraph));
    }
  }

  const doc = new Document({
    creator: `${chiefOfStaffName()} (${CHIEF_OF_STAFF_ID})`,
    title: plan.title,
    description: "Simulated draft rendered from the saved DeliverX case.",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1080, bottom: 900, left: 1080 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [runs("DeliverX case record", { color: BRONZE, size: 16 })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: {
                  top: { color: RULE, space: 8, style: BorderStyle.SINGLE, size: 6 },
                },
                children: [
                  runs("Simulated draft from the case record  ·  ", { color: MUTED, size: 16 }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Calibri",
                    size: 16,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

function bytesOf(value: string | ArrayBuffer | Blob | Uint8Array): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return Uint8Array.from(Buffer.from(value, "binary"));
  throw new Error("The slide deck could not be encoded.");
}

async function renderPptx(
  mission: SupervisedMission,
  slides: OfficeSlidePlan[],
): Promise<Uint8Array> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = `${chiefOfStaffName()} (${CHIEF_OF_STAFF_ID})`;
  pptx.company = "DeliverX";
  pptx.subject = "Simulated draft from the saved case record";
  pptx.title = mission.brief.question.slice(0, 120) || "DeliverX case";
  pptx.revision = "1";
  pptx.defineSlideMaster({
    title: "DX",
    background: { color: PAPER },
    slideNumber: { x: 12.35, y: 7.12, color: MUTED, fontFace: "Calibri", fontSize: 11 },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: INK } } },
      { rect: { x: 0, y: 0.08, w: "100%", h: 0.06, fill: { color: BRONZE } } },
      {
        text: {
          text: `DeliverX  ·  ${chiefOfStaffName()} (${CHIEF_OF_STAFF_ID})  ·  Simulated draft`,
          options: {
            x: 0.45,
            y: 7.1,
            w: 11.4,
            h: 0.28,
            fontFace: "Calibri",
            fontSize: 11,
            color: MUTED,
          },
        },
      },
    ],
  });

  slides.forEach((slidePlan, index) => {
    const slide = pptx.addSlide({ masterName: "DX" });
    const titleSize = index === 0 ? 32 : 26;
    slide.addText(slidePlan.title, {
      x: 0.55,
      y: index === 0 ? 1.7 : 0.42,
      w: 12.2,
      h: index === 0 ? 1.8 : 0.7,
      fontFace: "Calibri",
      fontSize: titleSize,
      bold: true,
      color: INK,
      margin: 0,
    });
    slide.addText(
      slidePlan.bullets.map((bullet) => ({ text: bullet, options: { breakLine: true } })),
      {
        x: 0.55,
        y: index === 0 ? 3.7 : 1.35,
        w: 12.2,
        h: index === 0 ? 2.8 : 5.4,
        fontFace: "Calibri",
        fontSize: 18,
        color: INK,
        paraSpaceAfter: 10,
        valign: "top",
      },
    );
  });

  return bytesOf(await pptx.write({ outputType: "uint8array" }));
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export async function renderOfficePackage(
  mission: SupervisedMission,
): Promise<RenderedOfficePackage> {
  const documents = planOfficeDocuments(mission);
  const slides = planOfficeSlides(mission);
  const files: RenderedOfficeFile[] = [];
  for (const document of documents) {
    const bytes = await renderDocx(mission, document);
    files.push({ path: document.path, base64: toBase64(bytes), note: document.note });
  }
  const deck = await renderPptx(mission, slides);
  files.push({
    path: "office/project-briefing.pptx",
    base64: toBase64(deck),
    note: "Twenty-slide briefing rendered from the saved case",
  });
  return {
    files,
    documents,
    slides,
    productionNote: officeProductionLines(mission).join(" "),
  };
}

export function appendOfficeIndex(
  index: string,
  entries: Array<{ path: string; note: string }>,
): string {
  const block = [
    "## Editable office documents",
    "",
    "DOCX and PPTX files below are a simulated draft: Chief of Staff (DX-001) rendered them from this case. No model was called to write them. A section with no saved data says “Not produced on this case.”",
    "",
    ...entries.map((entry) => `- [${entry.path}](${entry.path}) — ${entry.note}`),
    "",
  ].join("\n");
  const marker = "## What this package does not claim";
  if (index.includes(marker)) return index.replace(marker, `${block}${marker}`);
  return `${index.trimEnd()}\n\n${block}`;
}

type ArchiveLike = {
  files: Array<{ path: string; content: string }>;
  filename: string;
  title: string;
};

export function mergeOfficePackage<T extends ArchiveLike>(
  archive: T,
  office: RenderedOfficePackage,
): Omit<T, "files"> & { files: ArchiveDownloadFile[] } {
  const project = archive.files.find((file) => file.path.endsWith("/PROJECT.md"));
  const root = project
    ? project.path.slice(0, -"/PROJECT.md".length)
    : archive.filename.replace(/\.zip$/, "");
  const files: ArchiveDownloadFile[] = archive.files.map((file) => ({ ...file }));
  if (project) {
    const index = files.find((file) => file.path === project.path);
    if (index) index.content = appendOfficeIndex(index.content, office.files);
  }
  for (const file of office.files) {
    files.push({
      path: `${root}/${file.path}`,
      content: file.base64,
      encoding: "base64",
    });
  }
  const manifest = files.find((file) => file.path.endsWith("/archive-manifest.json"));
  if (manifest && manifest.encoding !== "base64") {
    const json = JSON.parse(manifest.content) as Record<string, unknown>;
    json["officePackageIncluded"] = true;
    json["officeFiles"] = office.files.map((file) => file.path);
    manifest.content = JSON.stringify(json, null, 2);
  }
  return { ...archive, files };
}

export function buildOfficeOnlyArchive(
  mission: SupervisedMission,
  office: RenderedOfficePackage,
  exportedAt: string,
): { files: ArchiveDownloadFile[]; filename: string; title: string } {
  const root = `deliverx-office-${mission.id.slice(0, 8)}`;
  const index = [
    `# Project package`,
    ``,
    `**Question:** ${mission.brief.question}`,
    ``,
    `- **Mission id:** ${mission.id}`,
    `- **Stage:** ${mission.stage}`,
    `- **Exported at:** ${exportedAt}`,
    `- **Production mode:** simulated draft`,
    ``,
    `This download is the editable office set for the case. The Markdown decision archive is separate and is included when that export has been saved.`,
    ``,
    appendOfficeIndex(
      "## What this package does not claim\n\n- No outcome is treated as confirmed unless it is saved on the case.\n",
      office.files,
    ),
  ].join("\n");
  const files: ArchiveDownloadFile[] = [
    { path: `${root}/PROJECT.md`, content: index },
    ...office.files.map((file) => ({
      path: `${root}/${file.path}`,
      content: file.base64,
      encoding: "base64" as const,
    })),
  ];
  return {
    files,
    filename: `${root}.zip`,
    title: mission.brief.question,
  };
}
