/**
 * The build inside the Room: stages with their owners and saved outputs, and the gate review.
 * Every row is a delivery-engine record; outputs show how they were made.
 */
import { useState } from "react";
import { AgentAvatar } from "@/components/command/agent-avatar";
import {
  BUILD_STATUS_LABEL,
  type BuildOutput,
  type DeliveryRoom,
} from "@/lib/pilot-mission/delivery-room";

function OutputPreview({ out, label }: { out: BuildOutput; label?: string }) {
  return (
    <details className="room-output">
      <summary>
        {label ?? out.title}
        <span className="room-mono">{out.production}</span>
      </summary>
      {out.quality.length ? <p className="room-output-quality">{out.quality.join(" · ")}</p> : null}
      {out.format === "html" ? (
        <p className="room-output-note">
          Prototype HTML — open it from the full record or the package.
        </p>
      ) : (
        <pre className="room-output-body">{out.content.slice(0, 4000)}</pre>
      )}
    </details>
  );
}

export function BuildCard({ room }: { room: DeliveryRoom }) {
  const pct = room.progress.total
    ? Math.round((room.progress.done / room.progress.total) * 100)
    : 0;
  return (
    <div className="room-card room-build">
      <div className="room-build-head">
        <span className="room-mono">
          Build · {room.progress.done} of {room.progress.total} steps done
        </span>
        <span
          className="room-build-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={room.progress.total}
          aria-valuenow={room.progress.done}
          aria-label="Build steps completed"
        >
          <span style={{ width: `${pct}%` }} />
        </span>
      </div>
      <ol className="room-build-list">
        {room.stages.map((s) => (
          <li key={s.taskId} data-status={s.status} data-gate={s.gate ? "true" : "false"}>
            <span className="room-build-tick" aria-hidden="true" />
            {s.gate ? (
              <span className="room-build-you" aria-hidden="true">
                You
              </span>
            ) : (
              <AgentAvatar name={s.owner} role={s.role} size={30} />
            )}
            <div className="room-build-main">
              <p>
                <b>{s.title}</b>
                <span className="room-build-status">{BUILD_STATUS_LABEL[s.status]}</span>
              </p>
              <p className="room-build-role">
                {s.gate ? "Your decision" : `${s.owner} · ${s.role}`}
              </p>
              {s.output ? (
                <OutputPreview
                  out={s.output}
                  {...(s.output.title === s.title ? { label: "View the output" } : {})}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GateReview({
  gate,
  pending,
  onDecide,
}: {
  gate: NonNullable<DeliveryRoom["gate"]>;
  pending: boolean;
  onDecide: (decision: "approve" | "reject", note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="room-gate">
      <p>
        Approving <b>{gate.title}</b> lets the team start the next stage. Sending it back stops this
        path; the reason is recorded.
      </p>
      {gate.inputs.length ? (
        <div className="room-gate-inputs">
          <span className="room-mono">What you are signing off</span>
          {gate.inputs.map((out) => (
            <OutputPreview key={out.id} out={out} />
          ))}
        </div>
      ) : null}
      <label className="room-gate-note">
        Note (optional)
        <textarea
          rows={3}
          maxLength={1000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What should the team keep in mind?"
        />
      </label>
      <div className="room-gate-actions">
        <button
          type="button"
          className="room-pill room-pill-primary"
          disabled={pending}
          onClick={() => onDecide("approve", note)}
        >
          {pending ? "Saving…" : "Approve and continue"}
        </button>
        <button
          type="button"
          className="room-pill"
          disabled={pending || !note.trim()}
          title={note.trim() ? undefined : "Add a note saying why"}
          onClick={() => onDecide("reject", note)}
        >
          Send back
        </button>
      </div>
    </div>
  );
}
