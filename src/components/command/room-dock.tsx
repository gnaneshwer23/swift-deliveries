/**
 * The Room's floating next-step dock. It can minimize to a chip that still
 * shows the status and the primary action, so a waiting gate stays in reach.
 * The minimized choice is remembered for this tab, per mission.
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  browserSessionStorage,
  readAriaDockMinimized,
  writeAriaDockMinimized,
} from "@/components/command/room-dock-preference";

export type RoomDockAction = {
  id: string;
  label: string;
  primary?: boolean;
  count?: number;
  onClick: () => void;
};

function DockButton({ action }: { action: RoomDockAction }) {
  return (
    <button
      type="button"
      className={action.primary ? "room-pill room-pill-primary" : "room-pill"}
      onClick={action.onClick}
    >
      {action.label}
      {action.count ? <span className="room-pill-count">{action.count}</span> : null}
    </button>
  );
}

export function RoomDockView({
  minimized,
  onMinimizedChange,
  waiting,
  statusLabel,
  actions,
  peekId,
  downloads,
}: {
  minimized: boolean;
  onMinimizedChange: (minimized: boolean) => void;
  waiting: boolean;
  statusLabel: string;
  actions: RoomDockAction[];
  peekId?: string;
  downloads?: ReactNode;
}) {
  const peek = peekId ? actions.find((action) => action.id === peekId) : undefined;
  // The next-step button stays after the download note, as it did before minimize existed.
  const leading = actions.filter((action) => action.id !== "next");
  const trailing = actions.filter((action) => action.id === "next");
  return (
    <div
      className="room-dock"
      data-minimized={minimized ? "true" : "false"}
      role="region"
      aria-label="What happens next"
    >
      <div className="room-dock-in">
        <span className={waiting ? "room-waiting" : "room-working"}>{statusLabel}</span>
        {minimized && peek ? (
          <div className="room-dock-peek">
            <DockButton action={peek} />
          </div>
        ) : null}
        <div id="room-dock-panel" className="room-dock-actions" hidden={minimized}>
          {leading.map((action) => (
            <DockButton key={action.id} action={action} />
          ))}
          {downloads ? <div className="room-dock-downloads">{downloads}</div> : null}
          {trailing.map((action) => (
            <DockButton key={action.id} action={action} />
          ))}
        </div>
        <button
          type="button"
          className="room-dock-toggle"
          aria-expanded={!minimized}
          aria-controls="room-dock-panel"
          onClick={() => onMinimizedChange(!minimized)}
        >
          {minimized ? (
            <ChevronUp aria-hidden="true" size={16} />
          ) : (
            <ChevronDown aria-hidden="true" size={16} />
          )}
          {minimized ? "Expand" : "Minimize"}
        </button>
      </div>
    </div>
  );
}

export function RoomDock({
  missionId,
  ...view
}: {
  missionId: string;
  waiting: boolean;
  statusLabel: string;
  actions: RoomDockAction[];
  peekId?: string;
  downloads?: ReactNode;
}) {
  const [minimized, setMinimized] = useState(false);

  // First paint matches the server (expanded). The saved preference applies after mount.
  useEffect(() => {
    setMinimized(readAriaDockMinimized(missionId, browserSessionStorage()));
  }, [missionId]);

  return (
    <RoomDockView
      {...view}
      minimized={minimized}
      onMinimizedChange={(next) => {
        setMinimized(next);
        writeAriaDockMinimized(missionId, next, browserSessionStorage());
      }}
    />
  );
}
