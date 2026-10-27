import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setWorkspaceStopped } from "@/lib/workforce.functions";
import type { WfWorkspace } from "@/lib/workforce/types";
import "@/styles/mission-activity.css";

/**
 * Emergency stop for the whole workspace. While stopped, no mission step
 * starts; missions keep their status and continue when work is allowed again.
 */
export function WorkspaceStopControl({
  workspace,
}: {
  workspace: Pick<WfWorkspace, "stoppedAt" | "stopReason">;
}) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toggle = useMutation({
    mutationFn: (stopped: boolean) =>
      setWorkspaceStopped({
        data: { stopped, ...(stopped && reason.trim() ? { reason: reason.trim() } : {}) },
      }),
    onSuccess: async () => {
      setError(null);
      setConfirming(false);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["command"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "The change did not save."),
  });

  if (workspace.stoppedAt) {
    return (
      <div className="ws-stop is-stopped" role="status">
        <div>
          <strong>All work is stopped.</strong>{" "}
          <span>
            No mission step will start until you let work continue
            {workspace.stopReason ? ` · Reason: ${workspace.stopReason}` : ""}.
          </span>
        </div>
        <button
          type="button"
          className="cc-btn cc-btn-primary"
          disabled={toggle.isPending}
          onClick={() => toggle.mutate(false)}
        >
          {toggle.isPending ? "Saving…" : "Let work continue"}
        </button>
        {error ? <p className="ws-stop-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="ws-stop">
      {confirming ? (
        <form
          className="ws-stop-form"
          onSubmit={(e) => {
            e.preventDefault();
            toggle.mutate(true);
          }}
        >
          <label className="cc-label" htmlFor="ws-stop-reason">
            Stop all work in this workspace? Steps already running finish; nothing new starts.
          </label>
          <input
            id="ws-stop-reason"
            className="cc-input"
            maxLength={400}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="ws-stop-actions">
            <button type="submit" className="cc-btn ws-stop-danger" disabled={toggle.isPending}>
              {toggle.isPending ? "Stopping…" : "Stop all work"}
            </button>
            <button
              type="button"
              className="cc-btn cc-btn-ghost"
              onClick={() => setConfirming(false)}
            >
              Keep working
            </button>
          </div>
          {error ? <p className="ws-stop-error">{error}</p> : null}
        </form>
      ) : (
        <button
          type="button"
          className="cc-btn cc-btn-ghost ws-stop-open"
          onClick={() => setConfirming(true)}
        >
          Emergency stop
        </button>
      )}
    </div>
  );
}
