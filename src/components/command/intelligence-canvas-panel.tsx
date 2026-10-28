import { useMutation } from "@tanstack/react-query";
import { buildIntelligenceCanvas } from "@/lib/pilot-mission/intelligence-canvas";
import { cancelSupervisedMission, saveSupervisedStudioMeta } from "@/lib/pilot-mission.functions";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** PT-1 / R2 — calm investigation map; controls are honest about notify/pause limits. */
export function IntelligenceCanvasPanel({
  mission,
  missionId,
  recordVersion,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  missionId: string;
  recordVersion: number;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const canvas = buildIntelligenceCanvas(mission);
  const notifyOn = Boolean(mission.studioMeta?.notifyWhenReady);
  const paused = Boolean(mission.studioMeta?.investigationPaused);

  const saveMeta = useMutation({
    mutationFn: (patch: { notifyWhenReady?: boolean; investigationPaused?: boolean }) =>
      saveSupervisedStudioMeta({
        data: { id: missionId, expectedVersion: recordVersion, ...patch },
      }),
    onSuccess: onDone,
    onError,
  });
  const cancel = useMutation({
    mutationFn: () =>
      cancelSupervisedMission({
        data: { id: missionId, expectedVersion: recordVersion },
      }),
    onSuccess: onDone,
    onError,
  });

  return (
    <section className="ps-intel-canvas" aria-label="Intelligence canvas">
      <div className="ps-intel-canvas-head">
        <h3 className="ps-intel-canvas-title">Investigation</h3>
        <p className="ps-intel-canvas-status" role="status">
          {canvas.statusLine}
        </p>
        <p className="cc-muted text-xs">{canvas.leaveAllowed}</p>
      </div>

      <ul className="ps-intel-nodes" aria-label="Investigation map">
        {canvas.nodes.map((node) => (
          <li key={node.id} data-kind={node.id} data-state={node.state}>
            <span className="ps-intel-node-label">{node.label}</span>
            <span className="ps-intel-node-state">{node.state}</span>
            <p className="ps-intel-node-detail">{node.detail}</p>
            {node.eventBasis.length ? (
              <p className="ps-intel-node-basis">Basis: {node.eventBasis.join(" · ")}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <ul className="ps-intel-edges cc-muted text-xs" aria-label="Event-backed connections">
        {canvas.edges
          .filter((e) => e.eventBacked)
          .map((edge) => (
            <li key={edge.id}>
              {edge.from} → {edge.to} · {edge.label}
            </li>
          ))}
      </ul>

      <div className="ps-intel-controls" role="group" aria-label="Investigation controls">
        {canvas.controls.map((control) => {
          if (control.id === "background") {
            return (
              <p key={control.id} className="cc-muted text-xs mb-0">
                {control.label}: {control.detail}
              </p>
            );
          }
          if (control.id === "inspect") {
            return (
              <a key={control.id} className="cc-btn cc-btn-secondary" href="#mission-judgement">
                {control.label}
              </a>
            );
          }
          if (control.id === "notify") {
            return (
              <button
                key={control.id}
                type="button"
                className="cc-btn cc-btn-secondary"
                disabled={!control.available || saveMeta.isPending}
                onClick={() => saveMeta.mutate({ notifyWhenReady: !notifyOn })}
                title={control.detail}
              >
                {control.label}
              </button>
            );
          }
          if (control.id === "pause") {
            return (
              <button
                key={control.id}
                type="button"
                className="cc-btn cc-btn-secondary"
                disabled={!control.available || saveMeta.isPending}
                onClick={() => saveMeta.mutate({ investigationPaused: !paused })}
                title={control.detail}
              >
                {control.label}
              </button>
            );
          }
          if (control.id === "cancel") {
            return (
              <button
                key={control.id}
                type="button"
                className="cc-btn cc-btn-ghost"
                disabled={!control.available || cancel.isPending}
                onClick={() => cancel.mutate()}
                title={control.detail}
              >
                {cancel.isPending ? "Cancelling…" : control.label}
              </button>
            );
          }
          return null;
        })}
      </div>
      <p className="cc-muted text-xs mt-2">
        {mission.studioMeta?.honesty ?? canvas.controls[1]?.detail}
      </p>
    </section>
  );
}
