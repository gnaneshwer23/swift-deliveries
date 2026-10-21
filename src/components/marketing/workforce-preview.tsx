import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  listAssignableCapabilities,
  listCapabilities,
  listDepartments,
  listInfrastructureServices,
  WAVE1_AVAILABLE_IDS,
} from "@/lib/workforce/registry";

/** Showcase Wave 1 Available roles plus a few Planned catalogue examples. */
const PLANNED_SHOWCASE_IDS = ["DX-003", "DX-014", "DX-022", "DX-050"] as const;

function statusLabel(status: string): "Available" | "Planned" {
  return status === "available" ? "Available" : "Planned";
}

export function WorkforcePreview({
  showPlanned = true,
  maxAvailable = 12,
}: {
  showPlanned?: boolean;
  maxAvailable?: number;
}) {
  const [filter, setFilter] = useState<"all" | "available" | "planned">("all");
  const available = listAssignableCapabilities().slice(0, maxAvailable);
  const planned = showPlanned
    ? listCapabilities().filter((c) =>
        (PLANNED_SHOWCASE_IDS as readonly string[]).includes(c.capability_id),
      )
    : [];
  const allCards = [...available, ...planned];
  const cards = filter === "available" ? available : filter === "planned" ? planned : allCards;

  const availableCount = WAVE1_AVAILABLE_IDS.length;
  const totalCatalogue = listCapabilities().length;
  const departmentCount = listDepartments().length;
  const infraServices = listInfrastructureServices();

  return (
    <section className="workforce-section" id="capabilities">
      <div className="workforce-head-grid">
        <div>
          <div className="x-label">Capability Registry · Architecture v1.0</div>
          <h2 className="heading-1" style={{ margin: "14px 0 0", maxWidth: 640 }}>
            Specialist capabilities under human authority.
          </h2>
          <p className="body" style={{ marginTop: 14, maxWidth: 600 }}>
            The catalogue defines {totalCatalogue} specialist roles across {departmentCount}{" "}
            departments.{" "}
            <strong style={{ color: "var(--x-ink)", fontWeight: 600 }}>
              {availableCount} Wave 1 roles are Available
            </strong>{" "}
            for assignment in the Command Centre today. Everything else is{" "}
            <strong style={{ color: "var(--x-ink)", fontWeight: 600 }}>Planned</strong> — disclosed
            openly and never routed as operational labour.
          </p>
        </div>

        {/* Registry KPI Summary Strip */}
        <div className="workforce-kpi-strip" aria-label="Registry summary metrics">
          <div className="workforce-kpi-card is-highlight">
            <span className="workforce-kpi-val">{availableCount}</span>
            <span className="workforce-kpi-label">Wave 1 Available</span>
            <small>Assignable in Command Centre</small>
          </div>
          <div className="workforce-kpi-card">
            <span className="workforce-kpi-val">{totalCatalogue - availableCount}</span>
            <span className="workforce-kpi-label">Planned Roles</span>
            <small>Catalogue only · non-operational</small>
          </div>
          <div className="workforce-kpi-card">
            <span className="workforce-kpi-val">{infraServices.length}</span>
            <span className="workforce-kpi-label">Deterministic Services</span>
            <small>Budget, permissions &amp; audit</small>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      {showPlanned && (
        <div className="workforce-filter-bar" role="group" aria-label="Filter capability preview">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`workforce-filter-btn${filter === "all" ? " is-active" : ""}`}
          >
            All previewed ({allCards.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === "available"}
            onClick={() => setFilter("available")}
            className={`workforce-filter-btn${filter === "available" ? " is-active" : ""}`}
          >
            Wave 1 Available ({available.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === "planned"}
            onClick={() => setFilter("planned")}
            className={`workforce-filter-btn${filter === "planned" ? " is-active" : ""}`}
          >
            Planned sample ({planned.length})
          </button>
        </div>
      )}

      <div className="workforce-grid" role="list">
        {cards.map((cap) => {
          const label = statusLabel(cap.lifecycle_status);
          const isAvail = label === "Available";
          return (
            <article
              className={`workforce-card${isAvail ? " is-available" : " is-planned"}`}
              key={cap.capability_id}
              role="listitem"
            >
              <div className="workforce-card-top">
                <span className="workforce-id">{cap.capability_id}</span>
                <span className={`pill ${isAvail ? "pill-teal" : "pill-neutral"}`}>
                  {isAvail ? "Available · Wave 1" : "Planned"}
                </span>
              </div>
              <h3 className="workforce-card-name">{cap.name}</h3>
              <p className="workforce-card-dept">
                Dept {String(cap.department_number).padStart(2, "0")} · {cap.department}
              </p>
              <p className="workforce-card-desc">{cap.description}</p>
              <div className="workforce-card-foot">
                <span>
                  Ceiling: <strong>{cap.permission_profile.replace(/_/g, " ")}</strong>
                </span>
                <span>{isAvail ? "Assignable" : "Catalogue only"}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="workforce-bottom-bar">
        <p className="caption" style={{ margin: 0 }}>
          Available roles may be assigned to missions. Planned roles appear in the catalogue only —
          they are never routed as operational labour.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/signup" className="btn btn-primary">
            Open Command Centre →
          </Link>
          <Link to="/how-it-works" className="btn btn-secondary">
            Read governance model
          </Link>
        </div>
      </div>
    </section>
  );
}
