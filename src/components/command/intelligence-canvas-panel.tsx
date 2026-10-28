import { buildIntelligenceCanvas } from "@/lib/pilot-mission/intelligence-canvas";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

/** PT-1 — calm investigation map; motion/state only from the mission record. */
export function IntelligenceCanvasPanel({ mission }: { mission: SupervisedMission }) {
  const canvas = buildIntelligenceCanvas(mission);

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

      <p className="ps-intel-controls">
        <a className="cc-btn cc-btn-secondary" href="#mission-judgement">
          {canvas.inspectHint}
        </a>
      </p>
    </section>
  );
}
