/**
 * A spoken progress update, read only from the mission's event log, so the
 * assistant reports what happened and nothing it inferred.
 */
import { describeEvent } from "@/lib/workforce/event-labels";
import {
  STATUS_LABELS,
  TERMINAL_MISSION_STATUSES,
  type MissionStatus,
  type WfMissionEvent,
} from "@/lib/workforce/types";

const LATEST = 3;

export function spokenStatus(
  mission: { title: string; status: MissionStatus },
  events: readonly WfMissionEvent[],
  taskTitles: ReadonlyMap<string, string> = new Map(),
  /** Steps finished over the mission's whole log; the events given may be only the latest. */
  finished = events.filter((e) => e.type === "task.completed").length,
): string {
  const head = `“${mission.title}” is ${STATUS_LABELS[mission.status].toLowerCase()}.`;
  if (!events.length) return `${head} The event log has no entries for it yet.`;
  // A task waits for a decision only while its latest event says so; a later decision ends it.
  const lastByTask = new Map<string, WfMissionEvent>();
  for (const e of [...events].sort((a, b) => a.id - b.id))
    if (e.taskId) lastByTask.set(e.taskId, e);
  const waiting = [...lastByTask.values()].some(
    (e) => e.type === "gate.waiting" || e.type === "task.blocked",
  );
  const latest = [...events]
    .sort((a, b) => b.id - a.id)
    .slice(0, LATEST)
    .map((e) => describeEvent(e, e.taskId ? taskTitles.get(e.taskId) : null).text);
  const counts = `${finished} ${finished === 1 ? "step" : "steps"} finished so far.`;
  const latestText = `Latest in the event log: ${latest.join("; ")}.`;
  const ask =
    waiting && !TERMINAL_MISSION_STATUSES.includes(mission.status)
      ? " Something is waiting for your decision; it is shown on the mission page."
      : "";
  return `${head} ${counts} ${latestText}${ask}`;
}
