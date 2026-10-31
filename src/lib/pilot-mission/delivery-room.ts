/**
 * The build, as the Room shows it — read only from the delivery engine's records
 * (`wf_mission_tasks`, `wf_artefacts`, `wf_missions`).
 *
 * Persona names (Lumen, Forge, Nova…) are display names for the catalogue roles that own
 * each task; the real role is always shown beside them. A stage is done only when its task
 * row is completed, and progress is completed tasks over all tasks — nothing is estimated.
 */
import { getCapability } from "@/lib/workforce/registry";
import { artefactProduction } from "@/lib/workforce/stage-artefacts";
import {
  QUALITY_LABEL_DISPLAY,
  type MissionBundle,
  type WfArtefact,
  type WfMissionTask,
} from "@/lib/workforce/types";

/** Display persona for each lifecycle task of the product plan (`productMissionTasks`). */
export const TASK_PERSONA: Record<string, string> = {
  charter: "Aria",
  market: "Scout",
  research: "Maya",
  foresight: "Keystone",
  prd: "Atlas",
  ux: "Lumen",
  architecture: "Keystone",
  prototype: "Forge",
  verify: "Nova",
  release_pack: "Quill",
  evolution: "Harbor",
  publish: "Quill",
};

export type BuildStageStatus =
  "done" | "working" | "next" | "waiting_on_you" | "sent_back" | "failed" | "skipped";

export const BUILD_STATUS_LABEL: Record<BuildStageStatus, string> = {
  done: "Done",
  working: "Working",
  next: "Up next",
  waiting_on_you: "Waiting on you",
  sent_back: "Sent back",
  failed: "Failed",
  skipped: "Skipped",
};

export type BuildOutput = {
  id: string;
  title: string;
  /** How the content was produced: a model id or "Simulated draft". */
  production: string;
  quality: string[];
  content: string;
  format: WfArtefact["contentFormat"];
};

export type BuildStage = {
  taskId: string;
  key: string;
  title: string;
  status: BuildStageStatus;
  gate: boolean;
  /** Display name of the owner ("You" for a human gate). */
  owner: string;
  /** Catalogue role behind the display name. */
  role: string;
  output: BuildOutput | null;
  completedAt: string | null;
};

export type BuildMember = { name: string; role: string; state: "working" | "done" | "waiting" };

export type BuildUpdate = { id: string; at: string; who: string; role: string; text: string };

export type DeliveryRoom = {
  state: "running" | "waiting_on_you" | "paused" | "done" | "failed" | "cancelled";
  progress: { done: number; total: number };
  stages: BuildStage[];
  team: BuildMember[];
  /** Newest last: one line per completed stage with the output it saved. */
  updates: BuildUpdate[];
  /** The gate the owner must decide now, with the outputs it signs off. */
  gate: { taskId: string; title: string; inputs: BuildOutput[] } | null;
  /** True when the engine has runnable work and nothing is running: a step may be requested. */
  canAdvance: boolean;
};

/** "Human gate: approve product scope" → "Approve product scope". */
function displayTitle(task: WfMissionTask): string {
  const t = task.title.replace(/^human gate:\s*/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function roleFor(task: WfMissionTask): string {
  const id = task.capabilityIds[0];
  return (id && getCapability(id)?.name) || "Specialist";
}

function output(artefact: WfArtefact | undefined): BuildOutput | null {
  if (!artefact) return null;
  return {
    id: artefact.id,
    title: artefact.title,
    production: artefactProduction(artefact)?.label ?? "Production not recorded",
    quality: artefact.qualityLabels.map((q) => QUALITY_LABEL_DISPLAY[q]),
    content: artefact.content,
    format: artefact.contentFormat,
  };
}

function stageStatus(task: WfMissionTask, bundle: MissionBundle): BuildStageStatus {
  if (task.status === "completed") return "done";
  if (task.status === "skipped") return "skipped";
  if (task.status === "running") return "working";
  if (task.status === "failed") return task.gate ? "sent_back" : "failed";
  const byKey = new Map(bundle.tasks.map((t) => [t.key, t.status]));
  const ready = task.dependsOn.every((d) => byKey.get(d) === "completed");
  if (task.gate && ready) return "waiting_on_you";
  return "next";
}

export function buildDeliveryRoom(bundle: MissionBundle): DeliveryRoom {
  const tasks = [...bundle.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
  const latestFor = new Map<string, WfArtefact>();
  for (const a of [...bundle.artefacts].sort((x, y) => x.updatedAt.localeCompare(y.updatedAt))) {
    if (a.taskId) latestFor.set(a.taskId, a);
  }

  const stages: BuildStage[] = tasks.map((task) => ({
    taskId: task.id,
    key: task.key,
    title: displayTitle(task),
    status: stageStatus(task, bundle),
    gate: task.gate,
    owner: task.gate ? "You" : (TASK_PERSONA[task.key] ?? roleFor(task)),
    role: task.gate ? "Owner decision" : roleFor(task),
    output: output(latestFor.get(task.id)),
    completedAt: task.completedAt,
  }));

  const members = new Map<string, BuildMember>();
  for (const s of stages) {
    if (s.gate) continue;
    const prev = members.get(s.owner);
    const state: BuildMember["state"] =
      s.status === "working"
        ? "working"
        : s.status === "done" || s.status === "skipped"
          ? "done"
          : "waiting";
    const merged = !prev
      ? state
      : prev.state === "working" || state === "working"
        ? "working"
        : prev.state === "waiting" || state === "waiting"
          ? "waiting"
          : "done";
    members.set(s.owner, { name: s.owner, role: prev?.role ?? s.role, state: merged });
  }

  const updates: BuildUpdate[] = stages
    .filter((s) => s.status === "done" && s.completedAt)
    .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
    .map((s) => ({
      id: s.taskId,
      at: s.completedAt!,
      who: s.owner,
      role: s.role,
      text: s.gate
        ? `You approved: ${s.title}.`
        : s.output
          ? `${s.owner} finished “${s.title}”${s.output.title !== s.title ? ` and saved “${s.output.title}”` : ""} — ${s.output.production.toLowerCase()}.`
          : `${s.owner} finished “${s.title}”.`,
    }));

  const waitingGate = stages.find((s) => s.status === "waiting_on_you") ?? null;
  const gateTask = waitingGate ? tasks.find((t) => t.id === waitingGate.taskId) : null;
  const gate =
    waitingGate && gateTask
      ? {
          taskId: waitingGate.taskId,
          title: waitingGate.title,
          inputs: stages
            .filter((s) => gateTask.dependsOn.includes(s.key) && s.output)
            .map((s) => s.output!),
        }
      : null;

  const status = bundle.mission.status;
  const work = stages.filter((s) => !s.gate);
  const done = stages.filter((s) => s.status === "done" || s.status === "skipped").length;
  const state: DeliveryRoom["state"] =
    status === "cancelled"
      ? "cancelled"
      : status === "paused"
        ? "paused"
        : status === "failed" ||
            stages.some((s) => s.status === "failed" || s.status === "sent_back")
          ? "failed"
          : stages.length > 0 && done === stages.length
            ? "done"
            : gate
              ? "waiting_on_you"
              : "running";

  const anyRunning = stages.some((s) => s.status === "working");
  const anyRunnable = work.some((s) => s.status === "next") && !gate;

  return {
    state,
    progress: { done, total: stages.length },
    stages,
    team: [...members.values()],
    updates,
    gate,
    canAdvance:
      state === "running" && anyRunnable && !anyRunning && ["queued", "running"].includes(status),
  };
}
