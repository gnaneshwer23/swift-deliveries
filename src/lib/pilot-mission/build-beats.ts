/**
 * Sequential product-build beats for Act V (P1).
 * Bridges the supervised PSI loop into theatre language — Frame → Research →
 * Options → Decide → Pack → Prototype — with one focal artefact per beat.
 * Upstream readiness follows the specialist DAG; no second product surface.
 */
import { buildPmBrief } from "./pm-brief";
import { syncTeamWithMission, type PilotSpecialistTask } from "./specialist-team";
import type { SupervisedMission } from "./types";

export const BUILD_BEAT_IDS = [
  "frame",
  "research",
  "options",
  "decide",
  "pack",
  "prototype",
] as const;
export type BuildBeatId = (typeof BUILD_BEAT_IDS)[number];

export type BeatHandoffStatus =
  | "waiting_upstream"
  | "in_progress"
  | "awaiting_you"
  | "handed_off"
  | "blocked";

export type ArtefactHonestyMode = "simulated" | "model" | "human" | "gap" | "cited";

export type ArtefactHonesty = {
  mode: ArtefactHonestyMode;
  /** Short badge for the same UI slot — Simulated draft | Model · id | Human gate | Gap labelled */
  label: string;
  modelId: string | null;
};

export type FocalArtefact = {
  kind: string;
  title: string;
  summary: string;
  honesty: ArtefactHonesty;
  gaps: string[];
  /** Sandboxed HTML body when the beat produced a prototype (P5). */
  html?: string | null;
  /** Static verify rows — failures remain visible. */
  verification?: Array<{ id: string; label: string; passed: boolean }>;
};

export type BuildBeatView = {
  id: BuildBeatId;
  label: string;
  detail: string;
  state: "done" | "current" | "upcoming" | "blocked";
  owner: {
    label: string;
    capabilityId: string | null;
    actor: "specialist" | "human";
  };
  contribution: string;
  handoff: {
    status: BeatHandoffStatus;
    detail: string;
  };
  artefact: FocalArtefact | null;
};

export type BuildSequence = {
  planApproved: boolean;
  beats: BuildBeatView[];
  currentId: BuildBeatId | null;
  currentOwner: BuildBeatView["owner"] | null;
};

const BEAT_META: Record<
  BuildBeatId,
  { label: string; detail: string; taskKeys: string[] }
> = {
  frame: {
    label: "Frame",
    detail: "Restate the case and bound the investigation.",
    taskKeys: ["frame_objective"],
  },
  research: {
    label: "Research",
    detail: "Gather findings or label honest gaps.",
    taskKeys: ["register_evidence", "synthesise_findings"],
  },
  options: {
    label: "Options",
    detail: "Specialists draft alternatives with tradeoffs.",
    taskKeys: ["draft_options", "challenge_options", "structure_recommendation"],
  },
  decide: {
    label: "Decide",
    detail: "You accept an option or request more evidence.",
    taskKeys: ["human_decision"],
  },
  pack: {
    label: "Pack",
    detail: "Decision pack you can inspect and export.",
    taskKeys: ["product_brief", "assemble_pack"],
  },
  prototype: {
    label: "Prototype",
    detail: "Sandboxed HTML of the primary journey — after your go-ahead.",
    taskKeys: ["approve_prototype", "build_prototype"],
  },
};

/** Honesty ladder for the same artefact chrome (P4). Never silent upgrade. */
export function artefactHonesty(mission: SupervisedMission): ArtefactHonesty {
  const gen = mission.proposal?.generation;
  if (gen?.ran) {
    const modelId = gen.model ?? gen.provider ?? "configured";
    return {
      mode: "model",
      label: `Model · ${modelId}`,
      modelId,
    };
  }
  if (gen && !gen.ran) {
    return {
      mode: "simulated",
      label: "Simulated draft",
      modelId: null,
    };
  }
  return {
    mode: "simulated",
    label: "Simulated draft",
    modelId: null,
  };
}

function beatDone(mission: SupervisedMission, id: BuildBeatId): boolean {
  switch (id) {
    case "frame":
      return Boolean(mission.team?.approvedAt) && mission.stage !== "brief";
    case "research":
      return (
        Boolean(mission.researchPassCompletedAt) ||
        Boolean(mission.proposal) ||
        ["alternatives", "decision", "artefact", "exported"].includes(mission.stage)
      );
    case "options":
      return (
        Boolean(mission.proposal) ||
        ["alternatives", "decision", "artefact", "exported"].includes(mission.stage)
      );
    case "decide":
      return Boolean(mission.approval);
    case "pack":
      return Boolean(mission.artefact) || Boolean(mission.exportBody);
    case "prototype":
      return Boolean(mission.prototype);
  }
}

function pickOwner(
  tasks: PilotSpecialistTask[],
  keys: string[],
): BuildBeatView["owner"] {
  for (const key of keys) {
    const task = tasks.find((t) => t.key === key);
    if (task && ["ready", "awaiting_approval", "blocked", "completed"].includes(task.status)) {
      return {
        label: task.ownerLabel,
        capabilityId: task.capabilityId,
        actor: task.actor,
      };
    }
  }
  const first = tasks.find((t) => keys.includes(t.key));
  if (first) {
    return {
      label: first.ownerLabel,
      capabilityId: first.capabilityId,
      actor: first.actor,
    };
  }
  return { label: "Specialist", capabilityId: null, actor: "specialist" };
}

function contributionFor(tasks: PilotSpecialistTask[], keys: string[]): string {
  const parts = keys
    .map((key) => tasks.find((t) => t.key === key)?.produces)
    .filter((v): v is string => Boolean(v));
  return parts[0] ?? "Build artefact";
}

function handoffFor(
  mission: SupervisedMission,
  id: BuildBeatId,
  done: boolean,
  upstreamReady: boolean,
  tasks: PilotSpecialistTask[],
  keys: string[],
): BuildBeatView["handoff"] {
  if (done) {
    return { status: "handed_off", detail: "Artefact handed to the next beat." };
  }
  if (!mission.team?.approvedAt) {
    return { status: "waiting_upstream", detail: "Plan not approved yet." };
  }
  if (!upstreamReady) {
    const missing = BUILD_BEAT_IDS.slice(0, BUILD_BEAT_IDS.indexOf(id)).filter(
      (bid) => !beatDone(mission, bid),
    );
    return {
      status: "waiting_upstream",
      detail: missing.length
        ? `Waiting on: ${missing.map((m) => BEAT_META[m].label).join(", ")}`
        : "Waiting on upstream beat.",
    };
  }
  const relevant = tasks.filter((t) => keys.includes(t.key));
  if (
    id === "prototype" &&
    !done &&
    upstreamReady &&
    !mission.prototype
  ) {
    return {
      status: "awaiting_you",
      detail: "Human gate — approve before the UX Prototype Agent builds sandboxed HTML.",
    };
  }
  if (relevant.some((t) => t.status === "awaiting_approval" || t.actor === "human")) {
    return { status: "awaiting_you", detail: "Human gate — nothing advances without your yes." };
  }
  if (relevant.some((t) => t.status === "blocked")) {
    const reason = relevant.find((t) => t.blockedReason)?.blockedReason;
    return { status: "blocked", detail: reason ?? "Blocked on upstream work." };
  }
  if (relevant.some((t) => t.status === "ready")) {
    return { status: "in_progress", detail: "Owner is producing this beat’s artefact." };
  }
  return { status: "in_progress", detail: "Ready when upstream work lands." };
}

function focalArtefact(
  mission: SupervisedMission,
  id: BuildBeatId,
  honesty: ArtefactHonesty,
): FocalArtefact | null {
  const brief = buildPmBrief(mission);
  switch (id) {
    case "frame": {
      if (!mission.team?.approvedAt) return null;
      return {
        kind: "frame",
        title: "Product frame",
        summary: brief.problemStatement,
        honesty: { ...honesty, mode: "simulated", label: "Simulated draft" },
        gaps: brief.unknowns.slice(0, 3),
      };
    }
    case "research": {
      if (!beatDone(mission, "frame")) return null;
      const findings = mission.evidence.filter((e) => e.classification === "supplied");
      const citedFindings = findings.filter((e) => /^https?:\/\//i.test(e.source.trim()));
      const gaps = [
        ...mission.evidence.filter((e) => e.classification === "gap").map((e) => e.statement),
        ...(mission.researchGaps ?? []),
      ];
      if (findings.length === 0 && gaps.length > 0) {
        return {
          kind: "research-gaps",
          title: "Research gaps",
          summary: gaps[0] ?? "Research gaps labelled — nothing invented.",
          honesty: { mode: "gap", label: "Gap labelled", modelId: null },
          gaps: gaps.slice(0, 5),
        };
      }
      if (!beatDone(mission, "research") && findings.length === 0) return null;
      const citedProvider = mission.researchProvider;
      const researchHonesty: ArtefactHonesty =
        citedFindings.length > 0
          ? {
              mode: "cited",
              label: citedProvider ? `Cited · ${citedProvider}` : "Cited sources",
              modelId: citedProvider,
            }
          : gaps.length > 0 && findings.length === 0
            ? { mode: "gap", label: "Gap labelled", modelId: null }
            : { ...honesty, mode: "simulated", label: "Simulated draft" };
      return {
        kind: "research",
        title: citedFindings.length
          ? "Cited research findings"
          : findings.length
            ? "Research findings"
            : "Research register",
        summary:
          findings[0]?.statement ??
          "Research pass recorded. Gaps stay labelled when providers are missing.",
        honesty: researchHonesty,
        gaps: gaps.slice(0, 5),
      };
    }
    case "options": {
      const proposal = mission.proposal;
      if (!proposal) return null;
      const lines = proposal.options.map((o) => `${o.title} — ${o.tradeoff}`).join(" · ");
      return {
        kind: "options",
        title: "Option set",
        summary: lines || proposal.generation.output.slice(0, 280) || "Options on the record.",
        honesty: artefactHonesty(mission),
        gaps: proposal.generation.gaps.slice(0, 5),
      };
    }
    case "decide": {
      const approval = mission.approval;
      if (!approval) return null;
      const option = mission.proposal?.options.find((o) => o.id === approval.optionId);
      return {
        kind: "decision",
        title: "Owner decision",
        summary: option
          ? `${approval.choice}: ${option.title}`
          : `${approval.choice} · option ${approval.optionId}`,
        honesty: { mode: "human", label: "Human gate", modelId: null },
        gaps: [],
      };
    }
    case "pack": {
      const pack = mission.artefact;
      if (!pack) return null;
      return {
        kind: "pack",
        title: pack.title,
        summary: pack.decisionBrief.slice(0, 320) || pack.experimentBrief.slice(0, 320),
        honesty: artefactHonesty(mission),
        gaps: [],
      };
    }
    case "prototype": {
      const proto = mission.prototype;
      if (!proto) return null;
      const failed = proto.checks.filter((c) => !c.passed).map((c) => c.label);
      const gaps = [
        ...(proto.failureDetail ? [proto.failureDetail] : []),
        ...failed,
      ];
      return {
        kind: "prototype_html",
        title: proto.title,
        summary: proto.verified
          ? "Sandboxed HTML prototype — static checks passed. Not a production deploy."
          : proto.failureDetail ??
            "Sandboxed HTML prototype — static verify reported failures (visible below).",
        honesty: {
          mode: proto.honesty.mode,
          label: proto.honesty.label,
          modelId: proto.honesty.modelId,
        },
        gaps,
        html: proto.html,
        verification: proto.checks,
      };
    }
  }
}

/**
 * Derive the Act V build sequence from the mission record.
 * Beats advance only when upstream is ready (DAG-aligned).
 */
export function buildSequence(mission: SupervisedMission): BuildSequence {
  const planApproved = Boolean(mission.team?.approvedAt);
  const honesty = artefactHonesty(mission);
  const synced = mission.team
    ? syncTeamWithMission(mission.team, mission)
    : null;
  const tasks = synced?.tasks ?? [];

  const doneFlags = Object.fromEntries(
    BUILD_BEAT_IDS.map((id) => [id, beatDone(mission, id)]),
  ) as Record<BuildBeatId, boolean>;

  let currentId: BuildBeatId | null = null;
  if (planApproved) {
    for (const id of BUILD_BEAT_IDS) {
      if (!doneFlags[id]) {
        currentId = id;
        break;
      }
    }
  }

  const beats: BuildBeatView[] = BUILD_BEAT_IDS.map((id, index) => {
    const meta = BEAT_META[id];
    const done = doneFlags[id];
    const upstreamReady =
      planApproved && BUILD_BEAT_IDS.slice(0, index).every((bid) => doneFlags[bid]);
    const owner = pickOwner(tasks, meta.taskKeys);
    const handoff = handoffFor(mission, id, done, upstreamReady, tasks, meta.taskKeys);
    let state: BuildBeatView["state"] = "upcoming";
    if (done) state = "done";
    else if (id === currentId) {
      state = handoff.status === "blocked" || handoff.status === "waiting_upstream" ? "blocked" : "current";
    } else if (!upstreamReady) state = "upcoming";

    const artefact =
      done || id === currentId ? focalArtefact(mission, id, honesty) : null;

    return {
      id,
      label: meta.label,
      detail: meta.detail,
      state,
      owner:
        id === "decide"
          ? { label: "You", capabilityId: null, actor: "human" }
          : id === "prototype" && mission.prototype
            ? {
                label: mission.prototype.ownerLabel,
                capabilityId: mission.prototype.ownerCapabilityId,
                actor: "specialist" as const,
              }
            : id === "prototype" && !done
              ? { label: "You", capabilityId: null, actor: "human" }
              : owner,
      contribution: contributionFor(tasks, meta.taskKeys),
      handoff,
      artefact,
    };
  });

  const current = beats.find((b) => b.id === currentId) ?? null;
  return {
    planApproved,
    beats,
    currentId,
    currentOwner: current?.owner ?? null,
  };
}

/** Cast rows for Act III / Specialists — owner, contribution, handoff (P2). */
export function castForMission(mission: SupervisedMission): Array<{
  id: string;
  label: string;
  contribution: string;
  handoff: string;
  status: string;
  actor: "specialist" | "human";
  isCurrentOwner: boolean;
}> {
  const sequence = buildSequence(mission);
  const currentBeat = sequence.beats.find((b) => b.id === sequence.currentId) ?? null;
  const synced = mission.team ? syncTeamWithMission(mission.team, mission) : null;
  const rows: Array<{
    id: string;
    label: string;
    contribution: string;
    handoff: string;
    status: string;
    actor: "specialist" | "human";
    isCurrentOwner: boolean;
  }> = [];

  if (synced) {
    for (const task of synced.tasks.filter((t) => t.actor === "specialist")) {
      const id = task.capabilityId ?? task.key;
      if (rows.some((r) => r.id === id)) continue;
      const ownsCurrent =
        Boolean(currentBeat) &&
        currentBeat!.owner.capabilityId === task.capabilityId &&
        currentBeat!.owner.actor === "specialist";
      const beatForTask = sequence.beats.find((b) =>
        BEAT_META[b.id].taskKeys.includes(task.key),
      );
      rows.push({
        id,
        label: task.ownerLabel,
        contribution: task.produces,
        handoff: ownsCurrent
          ? currentBeat!.handoff.detail
          : beatForTask?.handoff.detail ?? task.blockedReason ?? task.status.replaceAll("_", " "),
        status: task.status,
        actor: "specialist",
        isCurrentOwner: ownsCurrent,
      });
    }
  }

  rows.push({
    id: "human",
    label: "You",
    contribution: "Approve the plan, decide options, and own gates",
    handoff:
      currentBeat?.owner.actor === "human"
        ? currentBeat.handoff.detail
        : "Human gates stay with you",
    status: currentBeat?.owner.actor === "human" ? "awaiting_approval" : "ready",
    actor: "human",
    isCurrentOwner: currentBeat?.owner.actor === "human",
  });

  return rows;
}

/** Compact project-shelf rows from a mission (P3). */
export function projectShelfItems(mission: SupervisedMission): {
  missionId: string;
  question: string;
  stage: string;
  artefacts: Array<{ title: string; honesty: string; kind: string }>;
  decisions: Array<{ summary: string; at: string }>;
} {
  const honesty = artefactHonesty(mission);
  const artefacts: Array<{ title: string; honesty: string; kind: string }> = [];
  const sequence = buildSequence(mission);
  for (const beat of sequence.beats) {
    if (beat.artefact && beat.state === "done") {
      artefacts.push({
        title: beat.artefact.title,
        honesty: beat.artefact.honesty.label,
        kind: beat.artefact.kind,
      });
    }
  }
  if (mission.artefact && !artefacts.some((a) => a.kind === "pack")) {
    artefacts.push({
      title: mission.artefact.title,
      honesty: honesty.label,
      kind: "pack",
    });
  }
  const decisions: Array<{ summary: string; at: string }> = [];
  if (mission.approval) {
    const option = mission.proposal?.options.find((o) => o.id === mission.approval!.optionId);
    decisions.push({
      summary: option
        ? `${mission.approval.choice}: ${option.title}`
        : `${mission.approval.choice} · ${mission.approval.optionId}`,
      at: mission.approval.decidedAt,
    });
  }
  return {
    missionId: mission.id,
    question: mission.brief.question,
    stage: mission.stage,
    artefacts,
    decisions,
  };
}
