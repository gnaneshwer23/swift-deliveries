import { Link } from "@tanstack/react-router";
import {
  listAssignableCapabilities,
  listCapabilities,
  WAVE1_AVAILABLE_IDS,
} from "@/lib/workforce/registry";

/** Showcase Wave 1 Available roles plus a few Planned catalogue examples. */
const PLANNED_SHOWCASE_IDS = ["DX-003", "DX-014", "DX-022", "DX-050"] as const;

function statusLabel(status: string): "Available" | "Planned" {
  return status === "available" ? "Available" : "Planned";
}

export function WorkforcePreview({
  showPlanned = true,
  maxAvailable = 8,
}: {
  showPlanned?: boolean;
  maxAvailable?: number;
}) {
  const available = listAssignableCapabilities().slice(0, maxAvailable);
  const planned = showPlanned
    ? listCapabilities().filter((c) =>
        (PLANNED_SHOWCASE_IDS as readonly string[]).includes(c.capability_id),
      )
    : [];
  const cards = [...available, ...planned];
  const availableCount = WAVE1_AVAILABLE_IDS.length;
  const totalCatalogue = listCapabilities().length;

  return (
    <div className="workforce-section">
      <div className="x-label">Workforce catalogue</div>
      <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
        Specialist capabilities under human authority.
      </h2>
      <p className="body" style={{ marginTop: 14, maxWidth: 560 }}>
        The catalogue lists {totalCatalogue} specialist roles across 15 departments.{" "}
        <strong style={{ color: "var(--x-ink)", fontWeight: 600 }}>
          {availableCount} Wave 1 roles are Available
        </strong>{" "}
        in the Command Centre today. Everything else is Planned — not operational.
      </p>

      <div className="workforce-grid" role="list">
        {cards.map((cap) => {
          const label = statusLabel(cap.lifecycle_status);
          return (
            <article className="workforce-card" key={cap.capability_id} role="listitem">
              <div className="workforce-card-top">
                <span className="workforce-id">{cap.capability_id}</span>
                <span className={`pill ${label === "Available" ? "pill-teal" : "pill-neutral"}`}>
                  {label}
                </span>
              </div>
              <h3 className="workforce-card-name">{cap.name}</h3>
              <p className="workforce-card-dept">{cap.department}</p>
              <p className="workforce-card-desc">{cap.description}</p>
            </article>
          );
        })}
      </div>

      <p className="caption" style={{ marginTop: 16 }}>
        Available roles may be assigned to missions. Planned roles appear in the catalogue only —
        they are never routed as operational labour.
      </p>
      <div style={{ marginTop: 20 }}>
        <Link to="/signup" className="btn btn-secondary">
          Open Command Centre →
        </Link>
      </div>
    </div>
  );
}
