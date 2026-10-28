import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { recordSupervisedCaseStepGate } from "@/lib/pilot-mission.functions";
import {
  caseRoomTraceLines,
  type CaseRoom,
  type CaseStepGate,
} from "@/lib/pilot-mission/case-room";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const GATES: { id: CaseStepGate; label: string }[] = [
  { id: "proceed", label: "Proceed" },
  { id: "revise", label: "Revise" },
  { id: "pause", label: "Pause" },
  { id: "stop", label: "Stop" },
];

export function CaseRoomPanel({
  mission,
  recordVersion,
  missionId,
  onDone,
  onError,
}: {
  mission: SupervisedMission;
  recordVersion: number;
  missionId: string;
  onDone: () => Promise<void>;
  onError: (error: unknown) => void;
}) {
  const room = mission.caseRoom as CaseRoom;
  const [folderKey, setFolderKey] = useState(room.folders[0]?.ownerKey ?? "");
  const [artefactId, setArtefactId] = useState(room.artefacts[0]?.id ?? "");
  const [gate, setGate] = useState<CaseStepGate>("proceed");
  const [note, setNote] = useState("");

  const folder = room.folders.find((f) => f.ownerKey === folderKey) ?? room.folders[0];
  const artefact = room.artefacts.find((a) => a.id === artefactId) ?? room.artefacts[0];

  const saveGate = useMutation({
    mutationFn: () =>
      recordSupervisedCaseStepGate({
        data: {
          id: missionId,
          expectedVersion: recordVersion,
          gate,
          note,
        },
      }),
    onSuccess: onDone,
    onError,
  });

  const folderArtefacts = room.artefacts.filter((a) =>
    folder ? a.ownerKey === folder.ownerKey : false,
  );
  const inbound = room.handoffs.filter((h) => folder && h.toOwnerKey === folder.ownerKey);
  const outbound = room.handoffs.filter((h) => folder && h.fromOwnerKey === folder.ownerKey);

  return (
    <section className="cc-panel" id="case-room" aria-label="Case room">
      <h2 className="cc-panel-title">Case room</h2>
      <p className="cc-muted text-sm">
        Same persistent case as the investigation and continuation plan. Folders expose roles,
        artefacts, and handoffs — not a separate catalogue.
      </p>
      <p className="cc-muted mt-1 text-xs">
        Decision on record: {room.linkedDecision.humanNextPath}
        {room.linkedDecision.agentRecommendation
          ? ` · Act A: ${room.linkedDecision.agentRecommendation}`
          : ""}
      </p>

      {room.openAsks.length ? (
        <div className="mt-3">
          <h3 className="text-sm font-medium">Open asks</h3>
          <ul className="mt-1 grid gap-1 text-sm cc-muted">
            {room.openAsks.map((ask) => (
              <li key={ask.slice(0, 40)}>{ask}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="cc-label" htmlFor="case-folder">
            Agent folder
          </label>
          <select
            id="case-folder"
            className="cc-input"
            value={folder?.ownerKey ?? ""}
            onChange={(event) => {
              const key = event.target.value;
              setFolderKey(key);
              const first = room.artefacts.find((a) => a.ownerKey === key);
              if (first) setArtefactId(first.id);
            }}
          >
            {room.folders.map((f) => (
              <option key={f.ownerKey} value={f.ownerKey}>
                {f.label}
                {f.capabilityId ? ` (${f.capabilityId})` : ""}
              </option>
            ))}
          </select>
          {folder ? (
            <div className="mt-3 grid gap-2 text-sm">
              <p>
                <strong>Responsibility:</strong> {folder.responsibility}
              </p>
              <p className="cc-muted">Why: {folder.why}</p>
              <p className="cc-muted text-xs">
                Artefacts: {folderArtefacts.length} · In: {inbound.length} · Out: {outbound.length}
              </p>
              {inbound.length ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide">Inbound</h4>
                  <ul className="mt-1 grid gap-1 cc-muted">
                    {inbound.map((h) => (
                      <li key={h.id}>
                        {h.fromLabel} → {h.finding}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {outbound.length ? (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wide">Outbound</h4>
                  <ul className="mt-1 grid gap-1 cc-muted">
                    {outbound.map((h) => (
                      <li key={h.id}>
                        → {h.toLabel}: {h.request}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className="cc-label" htmlFor="case-artefact">
            Artefact
          </label>
          <select
            id="case-artefact"
            className="cc-input"
            value={artefact?.id ?? ""}
            onChange={(event) => setArtefactId(event.target.value)}
          >
            {room.artefacts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} · {a.ownerLabel} [{a.status}]
              </option>
            ))}
          </select>
          {artefact ? (
            <div className="mt-3 grid gap-2">
              <ul className="grid gap-1 text-xs cc-muted">
                {caseRoomTraceLines(artefact, room).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-[var(--cc-border,currentColor)]/20 p-3 text-xs">
                {artefact.body}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6" aria-label="Information flow">
        <h3 className="text-sm font-medium">Information flow</h3>
        <p className="cc-muted text-xs">
          How findings moved between agents for this case (from persisted handoffs).
        </p>
        {room.flowEdges.length === 0 ? (
          <p className="cc-muted mt-2 text-sm">No handoffs on this path yet.</p>
        ) : (
          <svg
            viewBox={`0 0 640 ${Math.max(120, room.flowEdges.length * 56 + 24)}`}
            className="mt-3 w-full max-w-3xl"
            role="img"
            aria-label="Agent information flow diagram"
          >
            {room.flowEdges.map((edge, index) => {
              const y = 28 + index * 56;
              const from =
                room.folders.find((f) => f.ownerKey === edge.fromOwnerKey)?.label ??
                edge.fromOwnerKey;
              const to =
                room.folders.find((f) => f.ownerKey === edge.toOwnerKey)?.label ?? edge.toOwnerKey;
              return (
                <g key={edge.id}>
                  <rect
                    x="8"
                    y={y - 14}
                    width="160"
                    height="28"
                    rx="4"
                    fill="currentColor"
                    opacity="0.08"
                  />
                  <text x="16" y={y + 4} className="fill-current" fontSize="11">
                    {from.slice(0, 22)}
                  </text>
                  <line
                    x1="176"
                    y1={y}
                    x2="440"
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    markerEnd="url(#case-arrow)"
                  />
                  <text x="200" y={y - 6} className="fill-current" fontSize="10" opacity="0.7">
                    {edge.label.slice(0, 42)}
                  </text>
                  <rect
                    x="448"
                    y={y - 14}
                    width="180"
                    height="28"
                    rx="4"
                    fill="currentColor"
                    opacity="0.08"
                  />
                  <text x="456" y={y + 4} className="fill-current" fontSize="11">
                    {to.slice(0, 24)}
                  </text>
                </g>
              );
            })}
            <defs>
              <marker
                id="case-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
              </marker>
            </defs>
          </svg>
        )}
      </div>

      <form
        className="mt-6 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          saveGate.mutate();
        }}
      >
        <h3 className="text-sm font-medium">Step gate</h3>
        <p className="cc-muted text-xs">
          Record how you want to move on this case. Does not start a new mission.
        </p>
        <select
          className="cc-input"
          aria-label="Step gate"
          value={gate}
          onChange={(event) => setGate(event.target.value as CaseStepGate)}
        >
          {GATES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <textarea
          className="cc-input cc-textarea"
          rows={2}
          aria-label="Step gate note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note"
        />
        {room.stepGate ? (
          <p className="cc-muted text-sm">
            Last gate: {room.stepGate}
            {room.stepGateAt ? ` at ${room.stepGateAt}` : ""}
            {room.stepGateNote ? ` — ${room.stepGateNote}` : ""}
          </p>
        ) : null}
        <button type="submit" className="cc-btn cc-btn-primary" disabled={saveGate.isPending}>
          {saveGate.isPending ? "Recording…" : "Record step gate"}
        </button>
      </form>
    </section>
  );
}
