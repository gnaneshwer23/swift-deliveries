/**
 * Screen 10 — Mission dashboard view-model.
 * Cards and nav panels are filled only from mission / collaboration records.
 */
import { assignedAgentsForMission } from "./team-formation-screen";
import type { SupervisedMission } from "./types";
import { nextRequiredAction, PROGRESS_STEPS, stepState } from "./types";
import { HUMAN_NEXT_PATH_LABELS, normalizeDecisionChoice } from "./verdict";

export const MISSION_DASH_NAV = [
  { id: "overview", label: "Overview" },
  { id: "pm-chat", label: "PM Chat" },
  { id: "team", label: "Team" },
  { id: "research", label: "Research" },
  { id: "product-plan", label: "Product Plan" },
  { id: "design", label: "Design" },
  { id: "engineering", label: "Engineering" },
  { id: "qa", label: "QA & Quality" },
  { id: "data", label: "Data & Metrics" },
  { id: "marketing", label: "Marketing" },
  { id: "decisions", label: "Decisions" },
  { id: "evidence", label: "Evidence" },
  { id: "timeline", label: "Timeline" },
  { id: "downloads", label: "Downloads" },
] as const;

export type MissionDashNavId = (typeof MISSION_DASH_NAV)[number]["id"];

export type DeliveryRailStep = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

export type MissionDashAgent = {
  id: string;
  label: string;
  status: string;
  responsibility: string;
};

export type MissionDashOutput = {
  id: string;
  title: string;
  honestyLabel: string;
};

export type MissionDashRisk = {
  id: string;
  text: string;
  kind: "blocker" | "risk" | "gap";
};

export type MissionDashTimelineItem = {
  id: string;
  at: string;
  actor: string;
  summary: string;
};

export type MissionDashboardModel = {
  projectName: string;
  stageLabel: string;
  stageDetail: string;
  progressLabel: string;
  progressPercent: number;
  downloadAvailable: boolean;
  downloadHint: string;
  rail: DeliveryRailStep[];
  currentStage: { title: string; detail: string };
  activeAgents: MissionDashAgent[];
  completedOutputs: MissionDashOutput[];
  pendingApprovals: string[];
  risks: MissionDashRisk[];
  latestPmUpdate: { summary: string; at: string | null; honesty: string };
  usage: {
    consumed: number;
    ceiling: number;
    remaining: number;
    label: string;
    hardStop: boolean;
  };
  timeline: MissionDashTimelineItem[];
  teamLines: string[];
  researchLines: string[];
  productPlanLines: string[];
  designLines: string[];
  engineeringLines: string[];
  qaLines: string[];
  dataLines: string[];
  marketingLines: string[];
  decisionLines: string[];
  evidenceLines: string[];
  emptySectionNote: string;
};

const EMPTY_SECTION =
  "Nothing is recorded for this section on the case yet. DeliverX does not invent progress here.";

function railFromMission(mission: SupervisedMission): DeliveryRailStep[] {
  // Product delivery rail — mapped from recorded mission state, not a fake clock.
  const hasResearch = mission.evidence.length > 0 || Boolean(mission.researchPassCompletedAt);
  const hasPlan = Boolean(mission.approval || mission.continuationPlan);
  const hasDesign = Boolean(mission.prototype);
  const hasEngineering = Boolean(
    mission.artefact ||
    mission.team?.tasks.some(
      (t) =>
        t.status === "completed" &&
        /build|prototype|implement|service|api/i.test(`${t.title} ${t.produces}`),
    ),
  );
  const hasQa =
    (mission.prototype?.checks.length ?? 0) > 0 ||
    mission.reviews.length > 0 ||
    Boolean(mission.observation);
  const hasHandover = Boolean(mission.exportBody || mission.stage === "exported");

  const flags = [
    true, // Discovery always started once a mission exists
    hasResearch,
    hasPlan,
    hasDesign,
    hasEngineering,
    hasQa,
    hasHandover,
  ];
  const labels = [
    "Discovery",
    "Research",
    "Product plan",
    "Design",
    "Engineering",
    "QA",
    "Handover",
  ];
  const ids = ["discovery", "research", "plan", "design", "engineering", "qa", "handover"];

  let currentIdx = 0;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i]) currentIdx = i;
  }
  // If handover is done, current is handover; else current is the furthest complete,
  // or the next incomplete after the furthest complete.
  if (!flags[flags.length - 1]) {
    const nextOpen = flags.findIndex((f, i) => i > 0 && !f);
    if (nextOpen >= 0) currentIdx = nextOpen;
  }

  return ids.map((id, index) => ({
    id,
    label: labels[index]!,
    state: index < currentIdx ? "done" : index === currentIdx ? "current" : "upcoming",
  }));
}

function progressFromMission(mission: SupervisedMission): { label: string; percent: number } {
  const states = PROGRESS_STEPS.map((_, i) => stepState(mission.stage, i));
  const done = states.filter((s) => s === "done").length;
  const current = states.some((s) => s === "current") ? 1 : 0;
  const percent = Math.round(((done + current * 0.5) / PROGRESS_STEPS.length) * 100);
  const currentStep = PROGRESS_STEPS.find((s) => s.id === mission.stage);
  return {
    label: currentStep
      ? `${currentStep.label} · record stage`
      : mission.stage === "exported"
        ? "Outcome · record stage"
        : `${mission.stage} · record stage`,
    percent: Math.min(100, Math.max(0, percent)),
  };
}

export function buildMissionDashboard(mission: SupervisedMission): MissionDashboardModel {
  const next = nextRequiredAction(mission);
  const progress = progressFromMission(mission);
  const assigned = assignedAgentsForMission(mission);

  const activeAgents: MissionDashAgent[] = assigned
    .filter((a) => a.status === "working" || a.status === "planned" || a.status === "blocked")
    .map((a) => ({
      id: a.id,
      label: a.label,
      status:
        a.status === "working"
          ? "In progress"
          : a.status === "blocked"
            ? "Needs attention"
            : "Planned",
      responsibility: a.responsibility,
    }));

  const completedOutputs: MissionDashOutput[] = [];
  if (mission.artefact) {
    completedOutputs.push({
      id: "artefact",
      title: mission.artefact.title,
      honestyLabel: "Decision pack on the record",
    });
  }
  if (mission.prototype) {
    completedOutputs.push({
      id: "prototype",
      title: mission.prototype.title,
      honestyLabel: mission.prototype.honesty.label,
    });
  }
  for (const task of mission.team?.tasks ?? []) {
    if (task.status === "completed") {
      completedOutputs.push({
        id: `task-${task.key}`,
        title: task.produces || task.title,
        honestyLabel: "Marked complete on the team plan",
      });
    }
  }

  const pendingApprovals: string[] = [];
  if (
    /approve|decide|expectation|export|gate|record|authorise|authorize/i.test(
      `${next.id} ${next.title}`,
    )
  ) {
    pendingApprovals.push(`${next.title} — ${next.detail}`);
  }
  if (mission.job.status === "failed") {
    pendingApprovals.push(`Retry required: ${mission.job.lastError ?? "comparison failed"}`);
  }
  for (const task of mission.team?.tasks ?? []) {
    if (task.status === "awaiting_approval") {
      pendingApprovals.push(`${task.title} awaits approval`);
    }
  }

  const risks: MissionDashRisk[] = [];
  if (
    mission.continuationPlan?.executionBlocked &&
    mission.continuationPlan.executionBlockedReason
  ) {
    risks.push({
      id: "exec-block",
      text: mission.continuationPlan.executionBlockedReason,
      kind: "blocker",
    });
  }
  for (const [i, risk] of (mission.continuationPlan?.unresolvedRisks ?? []).entries()) {
    risks.push({ id: `risk-${i}`, text: risk, kind: "risk" });
  }
  for (const step of mission.continuationPlan?.roadmap ?? []) {
    if (step.blocked && step.blockedReason) {
      risks.push({ id: `road-${step.id}`, text: step.blockedReason, kind: "blocker" });
    }
  }
  for (const task of mission.team?.tasks ?? []) {
    if (task.blockedReason) {
      risks.push({ id: `task-block-${task.key}`, text: task.blockedReason, kind: "blocker" });
    }
  }
  for (const [i, gap] of mission.researchGaps.slice(0, 4).entries()) {
    risks.push({ id: `rgap-${i}`, text: gap, kind: "gap" });
  }
  for (const [i, item] of mission.evidence
    .filter((e) => e.classification === "gap")
    .slice(0, 4)
    .entries()) {
    risks.push({ id: `egap-${i}`, text: item.statement, kind: "gap" });
  }

  const pmActors = /aria|chief of staff|product manager|pm\b|dx-001/i;
  const pmEvents = [...(mission.activity ?? [])]
    .filter((e) => pmActors.test(e.actor) || /brief|recommend|decision|plan/i.test(e.kind))
    .reverse();
  const latestEvent = pmEvents[0] ?? [...(mission.activity ?? [])].reverse()[0] ?? null;
  const latestPmUpdate = latestEvent
    ? {
        summary: `${latestEvent.actor}: ${latestEvent.summary}`,
        at: latestEvent.at,
        honesty: "From saved mission activity",
      }
    : mission.approval
      ? {
          summary: `Decision recorded: ${
            HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]
          }${mission.approval.note ? ` — ${mission.approval.note}` : ""}`,
          at: mission.approval.decidedAt,
          honesty: "From the decision record (no newer PM activity yet)",
        }
      : mission.continuationPlan
        ? {
            summary: mission.continuationPlan.summary,
            at: mission.continuationPlan.createdAt,
            honesty: "From the continuation plan",
          }
        : {
            summary: "No PM update is recorded on this case yet.",
            at: null,
            honesty: "Empty — not invented",
          };

  const remaining = Math.max(0, mission.usageCeiling - mission.usageConsumed);
  const hardStop = mission.usageConsumed >= mission.usageCeiling;

  const timeline: MissionDashTimelineItem[] = [...(mission.activity ?? [])]
    .slice(-12)
    .reverse()
    .map((e) => ({
      id: e.id,
      at: e.at,
      actor: e.actor,
      summary: e.summary,
    }));

  const teamLines = assigned.map((a) => `${a.label} · ${a.status} — ${a.responsibility}`);

  const researchLines = [
    `Research mode: ${mission.researchMode}`,
    mission.researchPassCompletedAt
      ? `Research pass completed at ${mission.researchPassCompletedAt}`
      : mission.researchPassQueuedAt
        ? `Research pass queued at ${mission.researchPassQueuedAt}`
        : "No research pass completion is recorded yet.",
    mission.researchProvider
      ? `Provider on record: ${mission.researchProvider}`
      : "No search provider credited on this pass.",
    ...mission.evidence.slice(0, 6).map((e) => `[${e.classification}] ${e.statement}`),
  ];

  const productPlanLines = mission.continuationPlan
    ? [
        mission.continuationPlan.title,
        mission.continuationPlan.summary,
        ...mission.continuationPlan.roadmap.map(
          (s) => `${s.title} (${s.ownerLabel})${s.blocked ? " — blocked" : ""}`,
        ),
        ...(mission.continuationPlan.notIncluded.length
          ? [`Not included: ${mission.continuationPlan.notIncluded.join("; ")}`]
          : []),
      ]
    : ["No continuation plan is on the record yet."];

  const designLines = mission.prototype
    ? [
        mission.prototype.title,
        mission.prototype.honesty.label,
        ...mission.prototype.checks.map((c) => `${c.passed ? "Pass" : "Fail"}: ${c.label}`),
      ]
    : ["No design / prototype artefact is saved on this case yet."];

  const engineeringLines = (mission.team?.tasks ?? [])
    .filter((t) => /build|prototype|implement|service|api|pack/i.test(`${t.title} ${t.produces}`))
    .map((t) => `${t.title} · ${t.status} — ${t.produces}`);
  if (!engineeringLines.length) {
    engineeringLines.push("No engineering tasks are recorded for this path yet.");
  }

  const qaLines = [
    ...(mission.prototype?.checks.map((c) => `${c.passed ? "Pass" : "Fail"}: ${c.label}`) ?? []),
    ...mission.reviews.map((r) => `Review: ${r.reading} — ${r.uncertainty || r.observedResult}`),
    mission.observation
      ? `Observation: ${mission.observation.result}`
      : "No outcome observation is recorded yet.",
  ];
  if (!mission.prototype?.checks.length && !mission.reviews.length && !mission.observation) {
    qaLines.length = 0;
    qaLines.push("No QA checks or reviews are on the record yet.");
  }

  const dataLines = mission.expectation
    ? [
        `Hypothesis: ${mission.expectation.hypothesis}`,
        `Metric: ${mission.expectation.expectedMetric}`,
        `Baseline: ${mission.expectation.baseline}`,
        `Window: ${mission.expectation.observationWindow}`,
      ]
    : ["No measurement plan is recorded yet."];

  const marketingLines = [
    "Marketing work is out of the Stage 1 delivery path unless roles are explicitly assigned.",
    ...assigned
      .filter((a) => /market|growth|content/i.test(`${a.label} ${a.responsibility}`))
      .map((a) => `${a.label}: ${a.responsibility}`),
  ];

  const decisionLines = [
    mission.approval
      ? `Path: ${HUMAN_NEXT_PATH_LABELS[normalizeDecisionChoice(mission.approval.choice)]}`
      : "No human decision is recorded yet.",
    mission.approval?.note ? `Note: ${mission.approval.note}` : null,
    mission.approval?.agentRecommendation
      ? `Agent recommendation at decide time: ${mission.approval.agentRecommendation}`
      : null,
    ...mission.invalidatedApprovals.map((inv) => `Invalidated: ${inv.choice} (${inv.reason})`),
  ].filter(Boolean) as string[];

  const evidenceLines = mission.evidence.length
    ? mission.evidence.map(
        (e) => `[${e.classification}] ${e.statement}${e.source ? ` — ${e.source}` : ""}`,
      )
    : ["Evidence register is empty on this case."];

  return {
    projectName: mission.brief.question || "Untitled mission",
    stageLabel: next.title,
    stageDetail: next.detail,
    progressLabel: progress.label,
    progressPercent: progress.percent,
    downloadAvailable: Boolean(mission.exportBody || mission.artefact),
    downloadHint: mission.exportBody
      ? "Export pack is available on the record"
      : mission.artefact
        ? "Decision pack is prepared — export when ready"
        : "Downloads appear after a pack is prepared or exported",
    rail: railFromMission(mission),
    currentStage: { title: next.title, detail: next.detail },
    activeAgents,
    completedOutputs,
    pendingApprovals,
    risks,
    latestPmUpdate,
    usage: {
      consumed: mission.usageConsumed,
      ceiling: mission.usageCeiling,
      remaining,
      label: hardStop
        ? "Usage ceiling reached — billable steps are hard-stopped"
        : `${remaining} of ${mission.usageCeiling} units remaining`,
      hardStop,
    },
    timeline,
    teamLines,
    researchLines,
    productPlanLines,
    designLines,
    engineeringLines,
    qaLines,
    dataLines,
    marketingLines,
    decisionLines,
    evidenceLines,
    emptySectionNote: EMPTY_SECTION,
  };
}
