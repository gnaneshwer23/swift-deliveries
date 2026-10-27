/**
 * Plain-language lines for the mission event log. Each line says only what
 * the event records; unknown event types are shown by name, never guessed.
 */
import type { WfMissionEvent } from "./types";

export type EventTone = "progress" | "done" | "waiting" | "problem" | "control";

export type EventLine = { text: string; tone: EventTone };

const who = (e: WfMissionEvent) =>
  e.actorKind === "user" ? "You" : e.actorKind === "worker" ? "The worker" : "The system";

export function describeEvent(e: WfMissionEvent, taskTitle?: string | null): EventLine {
  const task = taskTitle ? `“${taskTitle}”` : "a task";
  const attempt = typeof e.data["attempt"] === "number" ? Number(e.data["attempt"]) : null;
  const retry = attempt && attempt > 1 ? ` (attempt ${attempt})` : "";
  switch (e.type) {
    case "mission.created":
      return {
        text:
          e.data["via"] === "conversation"
            ? "Mission created from a brief you confirmed in conversation"
            : "Mission created",
        tone: "control",
      };
    case "plan.proposed":
      return { text: `Plan version ${String(e.data["version"] ?? "")} proposed`, tone: "waiting" };
    case "plan.needs_clarification":
      return { text: "Plan needs your answers before it has tasks", tone: "waiting" };
    case "plan.approved":
      return {
        text: `${who(e)} approved plan version ${String(e.data["version"] ?? "")}`,
        tone: "control",
      };
    case "plan.rejected":
      return { text: `${who(e)} sent the plan back for revision`, tone: "control" };
    case "external_actions.approved":
      return { text: `${who(e)} approved outside actions`, tone: "control" };
    case "task.started":
      return { text: `Started ${task}${retry}`, tone: "progress" };
    case "task.completed":
      return {
        text: `Finished ${task}${e.data["generation"] === "simulated" ? " · simulated draft" : ""}`,
        tone: "done",
      };
    case "task.failed":
      return {
        text:
          e.data["reason"] === "max_attempts" || e.data["reason"] === "lease_expired"
            ? `${task} failed after repeated attempts`
            : `${task} failed its checks`,
        tone: "problem",
      };
    case "task.blocked":
      return { text: `${task} needs your approval before it can run`, tone: "waiting" };
    case "task.errored":
      return { text: `${task} hit an error and went back in the queue`, tone: "problem" };
    case "task.requeued":
      return { text: `${task} stopped responding and went back in the queue`, tone: "problem" };
    case "task.lease_lost":
      return { text: `A late result for ${task} was discarded`, tone: "problem" };
    case "gate.waiting":
      return { text: `${task} is waiting for your decision`, tone: "waiting" };
    case "gate.approved":
      return { text: `${who(e)} approved ${task}`, tone: "control" };
    case "gate.rejected":
      return { text: `${who(e)} rejected ${task}`, tone: "control" };
    case "artefact.reviewed":
      return {
        text: `${who(e)} signed off “${String(e.data["title"] ?? "an artefact")}” as human-reviewed`,
        tone: "control",
      };
    case "mission.paused":
      return { text: `${who(e)} paused the mission`, tone: "control" };
    case "mission.resumed":
      return { text: `${who(e)} resumed the mission`, tone: "control" };
    case "mission.cancelled":
      return { text: `${who(e)} cancelled the mission`, tone: "control" };
    case "mission.usage_ceiling":
      return { text: "Stopped at the usage ceiling", tone: "problem" };
    case "mission.finished":
      return {
        text:
          e.data["status"] === "completed"
            ? "Mission completed"
            : `Mission ended: ${String(e.data["status"] ?? "").replace(/_/g, " ")}`,
        tone: e.data["status"] === "completed" ? "done" : "problem",
      };
    case "evidence.added": {
      const title = `“${String(e.data["title"] ?? "")}”`;
      if (e.data["status"] === "unreadable")
        return {
          text: `${title} could not be read: ${String(e.data["reason"] ?? "")}`,
          tone: "problem",
        };
      return {
        text: e.data["withheldFromModel"]
          ? `${who(e)} added ${title}; it may hold personal details, so it is not sent to a model`
          : `${who(e)} added evidence ${title}`,
        tone: "control",
      };
    }
    case "evidence.removed":
      return {
        text: `${who(e)} removed evidence “${String(e.data["title"] ?? "")}”`,
        tone: "control",
      };
    case "workspace.stopped":
      return { text: `${who(e)} stopped all work in the workspace`, tone: "control" };
    case "workspace.resumed":
      return { text: `${who(e)} let work continue in the workspace`, tone: "control" };
    default:
      return { text: e.type, tone: "progress" };
  }
}
