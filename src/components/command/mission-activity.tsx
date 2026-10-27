import { useEffect, useRef, useState } from "react";
import { getMissionEvents } from "@/lib/workforce.functions";
import { describeEvent } from "@/lib/workforce/event-labels";
import type { WfMissionEvent, WfMissionTask } from "@/lib/workforce/types";
import "@/styles/mission-activity.css";

const POLL_MS = 3000;
const SHOWN = 12;

/**
 * Live activity for one mission, read from its event log by cursor. It polls
 * only while work can happen; it never advances the mission itself.
 */
export function MissionActivity({
  missionId,
  active,
  tasks,
  onProgress,
}: {
  missionId: string;
  /** True while the worker may be running steps (queued or running). */
  active: boolean;
  tasks: readonly WfMissionTask[];
  /** Called when new events arrive, so the page can refresh the mission. */
  onProgress: () => void;
}) {
  const [events, setEvents] = useState<WfMissionEvent[]>([]);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const cursor = useRef(0);
  const progress = useRef(onProgress);
  progress.current = onProgress;

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      let more = false;
      try {
        const page = await getMissionEvents({
          data: { missionId, ...(cursor.current ? { after: cursor.current } : {}) },
        });
        if (stopped) return;
        setFailed(false);
        if (page.events.length) {
          cursor.current = page.cursor;
          setEvents((prev) => [...prev, ...page.events].slice(-200));
          progress.current();
          more = page.events.length >= 100;
        }
      } catch {
        if (!stopped) setFailed(true);
      }
      if (!stopped && (more || active)) timer = setTimeout(poll, more ? 0 : POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [missionId, active]);

  const titles = new Map(tasks.map((t) => [t.id, t.title]));
  const newest = [...events].reverse();
  const shown = showAll ? newest : newest.slice(0, SHOWN);

  return (
    <section className="cc-panel ma" aria-labelledby="mission-activity">
      <div className="ma-head">
        <h2 id="mission-activity" className="cc-panel-title mb-0">
          Activity
        </h2>
        <span className={`ma-live${active ? " is-on" : ""}`}>
          {active ? "Live · the worker is on this mission" : "Not running"}
        </span>
      </div>
      {failed ? (
        <p className="cc-muted mt-2">Activity could not be loaded. It will retry.</p>
      ) : null}
      {!events.length && !failed ? (
        <p className="cc-muted mt-2">Nothing has happened on this mission yet.</p>
      ) : (
        <ol className="ma-list" aria-live="polite">
          {shown.map((e) => {
            const line = describeEvent(e, e.taskId ? titles.get(e.taskId) : null);
            return (
              <li key={e.id} className={`ma-item is-${line.tone}`}>
                <time dateTime={e.createdAt}>
                  {new Date(e.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                <span>{line.text}</span>
              </li>
            );
          })}
        </ol>
      )}
      {newest.length > SHOWN ? (
        <button type="button" className="ma-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${newest.length}`}
        </button>
      ) : null}
    </section>
  );
}
