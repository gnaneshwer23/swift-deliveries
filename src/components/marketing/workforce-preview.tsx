import { useState } from "react";
import { EVALUATION_LABELS, roleEvaluation } from "@/lib/workforce/registry/evaluations";
import { Link } from "@tanstack/react-router";
import { CtaLink } from "@/components/marketing/cta-link";
import {
  listAssignableCapabilities,
  listCapabilities,
  WAVE1_AVAILABLE_IDS,
} from "@/lib/workforce/registry";

/** Showcase assignable roles plus a few Planned catalogue examples. */
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
  const [expanded, setExpanded] = useState(false);

  const available = listAssignableCapabilities().slice(0, maxAvailable);
  const planned = showPlanned
    ? listCapabilities().filter((c) =>
        (PLANNED_SHOWCASE_IDS as readonly string[]).includes(c.capability_id),
      )
    : [];
  const allCards = [...available, ...planned];
  const filteredCards =
    filter === "available" ? available : filter === "planned" ? planned : allCards;

  const spotlightCards =
    filter === "all" && !expanded
      ? [...available.slice(0, 4), ...planned.slice(0, 2)]
      : filteredCards.slice(0, expanded ? filteredCards.length : 6);

  const availableCount = WAVE1_AVAILABLE_IDS.length;
  const totalCatalogue = listCapabilities().length;

  return (
    <section className="workforce-section" id="capabilities">
      <div className="section-header-split">
        <div>
          <div className="x-label">Capability Registry</div>
          <h2 className="heading-1" style={{ margin: "12px 0 0", maxWidth: 640 }}>
            Specialist roles under human authority.
          </h2>
        </div>
        <p className="body" style={{ margin: 0, maxWidth: 480 }}>
          Only <strong>Available</strong> roles ({availableCount} today) can be assigned to active
          missions, and each shows whether its evaluation has passed. The remaining{" "}
          {totalCatalogue - availableCount} catalogue roles are marked <strong>Planned</strong> and
          never routed as live labour.
        </p>
      </div>

      {/* Clean Filter Tabs */}
      {showPlanned && (
        <div className="workforce-filter-bar" role="group" aria-label="Filter capability preview">
          <button
            type="button"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
            className={`workforce-filter-btn${filter === "all" ? " is-active" : ""}`}
          >
            Featured ({allCards.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === "available"}
            onClick={() => {
              setFilter("available");
              setExpanded(true);
            }}
            className={`workforce-filter-btn${filter === "available" ? " is-active" : ""}`}
          >
            Available ({available.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === "planned"}
            onClick={() => {
              setFilter("planned");
              setExpanded(true);
            }}
            className={`workforce-filter-btn${filter === "planned" ? " is-active" : ""}`}
          >
            Planned ({planned.length})
          </button>
        </div>
      )}

      <div className="workforce-grid" role="list">
        {spotlightCards.map((cap) => {
          const label = statusLabel(cap.lifecycle_status);
          const isAvail = label === "Available";
          return (
            <article
              className={`workforce-card${isAvail ? " is-available" : " is-planned"}`}
              key={cap.capability_id}
              role="listitem"
            >
              <div className="workforce-card-top">
                <span className="workforce-card-dept" style={{ margin: 0 }}>
                  {cap.department}
                </span>
                <span className={`pill ${isAvail ? "pill-teal" : "pill-neutral"}`}>
                  {isAvail
                    ? `${label} · ${EVALUATION_LABELS[roleEvaluation(cap.capability_id).status]}`
                    : label}
                </span>
              </div>
              <h3 className="workforce-card-name" style={{ marginTop: 10 }}>
                {cap.name}
              </h3>
              <p className="workforce-card-desc">{cap.description}</p>
              <div className="workforce-card-foot">
                <span>
                  Ceiling: <strong>{cap.permission_profile.replace(/_/g, " ")}</strong>
                </span>
                <span>{isAvail ? "Assignable" : "Roadmap"}</span>
              </div>
            </article>
          );
        })}
      </div>

      {filteredCards.length > 6 && (
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="btn btn-secondary"
          >
            {expanded ? "Show compact view" : `View all ${filteredCards.length} previewed roles →`}
          </button>
        </div>
      )}

      <div className="workforce-bottom-bar">
        <p className="caption" style={{ margin: 0 }}>
          Available roles can be assigned to missions today. Planned roles are listed transparently
          in the registry and are never routed as operational labour.
        </p>
        <div className="flex flex-wrap gap-3">
          <CtaLink
            signedInTo="/command/capabilities"
            signedInLabel="Explore Capability Registry →"
            signedOutLabel="Open Command Centre →"
            className="btn btn-primary"
          />
          <Link to="/how-it-works" className="btn btn-secondary">
            How it works
          </Link>
        </div>
      </div>
    </section>
  );
}
