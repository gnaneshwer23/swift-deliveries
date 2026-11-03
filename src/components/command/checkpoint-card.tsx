/**
 * Checkpoint: where this project stands, in five lines read from the saved record —
 * status, the last thing that happened, the next step, what is already done, and what to
 * check before acting. It lets anyone, including a student coming back after a week, pick
 * up exactly where the work stopped.
 */
import { CheckCircle2, Circle, CircleAlert } from "lucide-react";
import { useMemo } from "react";
import { buildCheckpoint, CHECKPOINT_STATUS_LABEL } from "@/lib/pilot-mission/checkpoint";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/checkpoint.css";

export function CheckpointCard({
  mission,
  next,
}: {
  mission: SupervisedMission;
  next: { id: string; title: string; detail: string };
}) {
  const c = useMemo(() => buildCheckpoint(mission, next), [mission, next]);
  return (
    <section className="ckp" aria-labelledby="ckp-title" data-status={c.status}>
      <header className="ckp-head">
        <h2 id="ckp-title">Checkpoint</h2>
        <span className="ckp-status">{CHECKPOINT_STATUS_LABEL[c.status]}</span>
        {c.stalled ? <span className="ckp-quiet">Quiet for {c.quietDays} days</span> : null}
      </header>
      <dl className="ckp-grid">
        <div>
          <dt>Last action</dt>
          <dd>
            {c.lastAction ? (
              <>
                <b>{c.lastAction.who}</b> {c.lastAction.what}
                <span className="ckp-when"> · {c.lastAction.when}</span>
              </>
            ) : (
              <span className="ckp-muted">Nothing recorded yet.</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Next step</dt>
          <dd>
            <b>{c.next.title}</b>
            {c.next.detail ? <span className="ckp-detail">{c.next.detail}</span> : null}
          </dd>
        </div>
        <div>
          <dt>Already done</dt>
          <dd>
            {c.done.length ? (
              <ul className="ckp-list">
                {c.done.map((d) => (
                  <li key={d}>
                    <CheckCircle2 size={14} aria-hidden="true" /> {d}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="ckp-muted">No steps finished yet.</span>
            )}
            <span className="ckp-note">Kept on the record.</span>
          </dd>
        </div>
        <div>
          <dt>Check before acting</dt>
          <dd>
            {c.checks.length ? (
              <ul className="ckp-list ckp-checks">
                {c.checks.map((x) => (
                  <li key={x}>
                    <CircleAlert size={14} aria-hidden="true" /> {x}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="ckp-muted">
                <Circle size={12} aria-hidden="true" /> Nothing flagged.
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
