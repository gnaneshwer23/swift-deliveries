/**
 * A sample project you can open before starting your own: the same screens a real project
 * uses, filled with invented content. It is built in memory on each visit and is never
 * saved, sent or mixed with your projects. Every name, source and finding is marked as a
 * sample, because DeliverX never presents simulated work as real.
 */
import { SAMPLE_MISSION_REQUEST } from "@/lib/marketing/sample-mission";
import type { SupervisedMission } from "./types";

export const SAMPLE_PROJECT_ID = "sample-project";

/** Shown on every sample surface. */
export const SAMPLE_NOTICE =
  "Sample project. Everything here is invented to show how DeliverX works. Nothing is saved, and it is not one of your projects.";

const SOURCE = "Sample source (invented)";

export type SampleOption = {
  id: string;
  title: string;
  tradeOff: string;
  recommended: boolean;
};

/** The options the sample team compared, for the decision step. */
export const SAMPLE_OPTIONS: SampleOption[] = [
  {
    id: "A",
    title: "Shorten setup to three steps",
    tradeOff: "Fastest to test; may hide settings some users need later.",
    recommended: true,
  },
  {
    id: "B",
    title: "Add a guided checklist",
    tradeOff: "Keeps every setting; more to build and maintain.",
    recommended: false,
  },
  {
    id: "C",
    title: "Gather more evidence first",
    tradeOff: "Lowest risk; delays any change by a few weeks.",
    recommended: false,
  },
];

/** The sample as a project record, with times relative to `now` so it reads as recent. */
export function buildSampleProject(now: number = Date.now()): SupervisedMission {
  const ago = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
  const ev = (
    id: string,
    hours: number,
    kind: string,
    actor: string,
    summary: string,
  ): SupervisedMission["activity"][number] => ({
    id: `sample-${id}`,
    at: ago(hours),
    taskKey: null,
    kind,
    summary,
    actor,
  });

  return {
    id: SAMPLE_PROJECT_ID,
    workspaceId: "sample",
    ownerUserId: "sample",
    version: 1,
    stage: "alternatives",
    brief: {
      question: SAMPLE_MISSION_REQUEST,
      audience: "The founder and the product lead (sample).",
      outcome: "Name the top two reasons people leave, each backed by a source (sample).",
      constraints: "Do not contact users, change the live product or deploy (sample).",
    },
    evidence: [
      {
        id: "s-e1",
        statement: "Most people who leave do so on the account-details step (invented figure).",
        source: SOURCE,
        classification: "supplied",
      },
      {
        id: "s-e2",
        statement: "People who connect a payment method first finish setup more often (invented).",
        source: SOURCE,
        classification: "supplied",
      },
      {
        id: "s-e3",
        statement: "New users want to see the product before entering settings.",
        source: "Team assumption (sample)",
        classification: "assumption",
      },
      {
        id: "s-e4",
        statement: "No interviews with people who left; nobody has spoken to them yet.",
        source: "Evidence gap (sample)",
        classification: "gap",
      },
    ],
    // The options the sample team compared, held where a real project holds them.
    proposal: {
      action: "compare_options",
      version: 1,
      scopeHash: "sample",
      options: SAMPLE_OPTIONS.map((o) => ({
        id: o.id,
        title: o.title,
        tradeoff: o.tradeOff,
        basis: "Sample evidence above (invented).",
      })),
      generation: {
        ran: false,
        label: "Simulated draft (sample)",
        provider: null,
        model: null,
        output: "",
        citations: [],
        gaps: ["No interviews with people who left (sample gap)."],
      },
    },
    approval: null,
    invalidatedApprovals: [],
    artefact: null,
    prototype: null,
    exportBody: null,
    exportPdfBase64: null,
    job: {
      status: "idle",
      ownerId: null,
      leaseUntil: null,
      attempts: 0,
      lastError: null,
      idempotencyKey: null,
    },
    usageCeiling: 4,
    usageConsumed: 1,
    spendRecords: [],
    expectation: null,
    observation: null,
    reviews: [],
    followUp: null,
    origin: null,
    researchMode: "provided",
    researchGaps: [],
    researchPassCompletedAt: ago(20),
    // Cleared once the pass completes, as on a real project.
    researchPassQueuedAt: null,
    researchProvider: null,
    team: {
      version: "pilot-team-v1",
      capabilityIds: [],
      staffingBand: "S",
      tasks: [],
      approvedAt: ago(40),
      approvedBy: "sample",
    },
    continuationPlan: null,
    caseRoom: null,
    teamCollaboration: null,
    activity: [
      ev("1", 48, "mission.created", "human", "Sample project started."),
      ev("2", 47, "pm_brief.drafted", "system", "Sample PM brief drafted."),
      ev("3", 46, "plan.proposed", "system", "Sample plan proposed for approval."),
      ev("4", 40, "plan.approved", "human", "Sample plan approved."),
      ev("5", 30, "research.pass.started", "system", "Sample research started."),
      ev("6", 21, "research.external_gap", "system", "No interviews with people who left."),
      ev("7", 20, "research.pass.completed", "system", "Sample research pass finished."),
      ev("8", 3, "options.compared", "system", "Three sample options compared."),
    ],
    projectId: null,
    updatedAt: ago(3),
  } as SupervisedMission;
}
