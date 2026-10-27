/**
 * A spoken progress update, read only from the mission's event log, so the
 * assistant reports what happened and nothing it inferred.
 */
import { describeEvent } from "@/lib/workforce/event-labels";
import { STATUS_LABELS, type MissionStatus, type WfMissionEvent } from "@/lib/workforce/types";

const LATEST = 3;

export function spokenStatus(
  mission: { title: string; status: MissionStatus },
  events: readonly WfMissionEvent[],
  taskTitles: ReadonlyMap<string, string> = new Map(),
): string {
  const head = `“${mission.title}” is ${STATUS_LABELS[mission.status].toLowerCase()}.`;
  if (!events.length) return `${head} The event log has no entries for it yet.`;
  const done = events.filter((e) => e.type === "task.completed").length;
  const waiting = events.some((e) => e.type === "gate.waiting" || e.type === "task.blocked");
  const latest = [...events]
    .sort((a, b) => b.id - a.id)
    .slice(0, LATEST)
    .map((e) => describeEvent(e, e.taskId ? taskTitles.get(e.taskId) : null).text);
  const counts = `${done} ${done === 1 ? "step" : "steps"} finished so far.`;
  const latestText = `Latest in the event log: ${latest.join("; ")}.`;
  const ask =
    waiting && mission.status !== "cancelled"
      ? " Something has waited for your decision; it is shown on the mission page."
      : "";
  return `${head} ${counts} ${latestText}${ask}`;
}
