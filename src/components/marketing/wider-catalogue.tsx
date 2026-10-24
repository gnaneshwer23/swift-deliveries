import { useId, useState, type CSSProperties } from "react";
import { capabilityRegistryData as registry } from "@/lib/workforce/registry/data";
import type { CapabilityRecord, LifecycleStatus } from "@/lib/workforce/registry/types";

const GROUPS = [
  { name: "Strategy & orchestration", ids: [1, 15] },
  { name: "Research", ids: [2] },
  { name: "Product", ids: [3] },
  { name: "Design", ids: [4] },
  { name: "Engineering", ids: [5] },
  { name: "AI & data", ids: [6] },
  { name: "Trust & governance", ids: [7, 14] },
  { name: "QA & reliability", ids: [8] },
  { name: "Infrastructure", ids: [9] },
  { name: "Growth & commercial", ids: [11, 12] },
  { name: "Foresight", ids: [10] },
  { name: "Analytics & improvement", ids: [13] },
];

const LIVE_MODEL =
  "This entry does not run a live model until provider integration, tools and permissions are verified.";

function isResearch(capability: CapabilityRecord) {
  return capability.department_number === 2;
}

function statusLabel(status: LifecycleStatus) {
  if (status === "available") return "Role foundation · stub limitations";
  if (status === "planned") return "Planned · not in use";
  return status;
}

function statusSentence(status: LifecycleStatus) {
  if (status === "available") return "Status: role foundation with stub limitations.";
  if (status === "planned") return "Status: planned. This role is not in use.";
  return `Status: ${status}.`;
}

function tone(status: LifecycleStatus) {
  if (status === "available") return "is-stub";
  if (status === "planned") return "is-planned";
  return "is-other";
}

function researchFields(capability: CapabilityRecord) {
  const stub = capability.lifecycle_status === "available";
  return {
    source: `Capability registry · ${capability.capability_id} · ${capability.department}.`,
    found: stub
      ? `${capability.description} Recorded as a role foundation with stub limitations.`
      : `${capability.description} Recorded as planned, so this role is not in use.`,
    gap: stub
      ? `${capability.known_limitations.join(" ")} Provider integration, tools and permissions still need separate verification.`
      : `${capability.known_limitations.join(" ")} Planned means this role is not in use.`,
  };
}

function CatalogueCard({
  capability,
  selected,
  onSelect,
}: {
  capability: CapabilityRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const baseId = useId();
  const readingId = `${baseId}-reading`;
  const research = isResearch(capability);
  const fields = research ? researchFields(capability) : null;
  const cardTone = tone(capability.lifecycle_status);

  return (
    <li className={`psi-clay-plinth ${cardTone}${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        className="psi-clay-card"
        aria-pressed={selected}
        aria-expanded={selected}
        aria-controls={selected ? readingId : undefined}
        onClick={onSelect}
      >
        <span className="psi-clay-mark" aria-hidden="true" />
        <span className={`psi-clay-status ${cardTone}`}>
          {statusLabel(capability.lifecycle_status)}
        </span>
        <span className="psi-clay-name">{capability.name}</span>
        <span className="psi-clay-id">
          {capability.capability_id} · {capability.department}
        </span>
        {fields && (
          <dl className="psi-evidence-lines">
            <div>
              <dt>Source</dt>
              <dd>{fields.source}</dd>
            </div>
            <div>
              <dt>What was found</dt>
              <dd>{fields.found}</dd>
            </div>
            <div className="is-gap">
              <dt>Still a gap</dt>
              <dd>{fields.gap}</dd>
            </div>
          </dl>
        )}
      </button>
      {selected && (
        <div
          className="psi-clay-reading"
          id={readingId}
          role="region"
          aria-label={`${capability.name} record`}
        >
          <p className={`psi-clay-verify ${cardTone}`}>
            {statusSentence(capability.lifecycle_status)} {LIVE_MODEL}
          </p>
          {!research && (
            <div>
              <p className="psi-clay-kicker">Defined contribution</p>
              <p>{capability.description}</p>
            </div>
          )}
          <dl className="psi-evidence-lines">
            <div>
              <dt>Execution</dt>
              <dd>{capability.implementation_type.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Known limitations</dt>
              <dd>
                <ul>
                  {capability.known_limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt>Evaluation</dt>
              <dd>{capability.evaluation_notes}</dd>
            </div>
          </dl>
        </div>
      )}
    </li>
  );
}

export function WiderCatalogue() {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("available");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedGroup = GROUPS.find((item) => item.name === group);
  const roles = registry.capabilities.filter(
    (capability) =>
      (!selectedGroup || selectedGroup.ids.includes(capability.department_number)) &&
      (!status || capability.lifecycle_status === status) &&
      `${capability.name} ${capability.description} ${capability.capability_id}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const selected = roles.find((capability) => capability.capability_id === selectedId);
  const count = `${roles.length} matching catalogue entries${
    status === "available" ? ", shown as role foundations with stub limitations" : ""
  }${status === "planned" ? ", shown as planned roles" : ""}. ${registry.capabilities.length} entries in the wider catalogue${group ? `, ${group}` : ""}.`;

  return (
    <section className="psi-section psi-catalogue" id="catalogue">
      <div className="dxl-wrap">
        <h2 className="dxl-h2">Wider catalogue</h2>
        <p className="psi-catalogue-lead">
          Read each entry as evidence. The cards name the source, what the registry records, and
          what is still a gap.
        </p>
        <div className="psi-research-bench">
          <div
            className="psi-research-bench-top"
            role="group"
            aria-label="How to read the wider catalogue"
          >
            <article className="psi-research-box">
              <div className="psi-research-box-face">
                <span className="psi-clay-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>Source</h3>
                <p>
                  The six roles above are the working set on this page. The entries below describe
                  the wider catalogue.
                </p>
              </div>
            </article>
            <article className="psi-research-box">
              <div className="psi-research-box-face">
                <span className="psi-clay-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>What was found</h3>
                <p>
                  <span className="psi-stub-mark">Available</span> means a role foundation with stub
                  limitations. <span className="psi-planned-mark">Planned</span> means the role is
                  not in use.
                </p>
              </div>
            </article>
            <article className="psi-research-box is-gap">
              <div className="psi-research-box-face">
                <span className="psi-clay-lines" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <h3>Still a gap</h3>
                <p>Provider integration, tools and permissions still need separate verification.</p>
              </div>
            </article>
          </div>
          <p className="psi-research-bench-note">
            Catalogue reading only. These cards are not the output of a live research run.
          </p>
        </div>
        <details className="psi-catalogue-note">
          <summary>How the catalogue is organised</summary>
          <p>
            Twelve browsing groups organise the specialist disciplines. They are navigation
            categories, not teams that automatically run together. A mission should select only
            capabilities evaluated for its scope.
          </p>
        </details>
        <div className="psi-wheel" aria-label="Lifecycle department explorer">
          {GROUPS.map((item, index) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={group === item.name}
              onClick={() => setGroup(group === item.name ? "" : item.name)}
              style={{ "--angle": `${index * 30}deg` } as CSSProperties}
            >
              <span>{item.name}</span>
            </button>
          ))}
          <div className="psi-wheel-centre">
            <strong>Product Brain</strong>
            <span>Evidence ↔ decisions</span>
          </div>
        </div>
        <div className="psi-catalogue-tools">
          <label>
            Search roles
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Name, role or DX ID"
            />
          </label>
          <label>
            Department
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              <option value="">All groups</option>
              {GROUPS.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Capability status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {[
                ...new Set(registry.capabilities.map((capability) => capability.lifecycle_status)),
              ].map((item) => (
                <option key={item} value={item}>
                  {item === "available"
                    ? "Role foundations (stub limitations)"
                    : item === "planned"
                      ? "Planned roles"
                      : item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="dxl-btn dxl-btn-ghost"
            onClick={() => {
              setQ("");
              setGroup("");
              setStatus("available");
              setSelectedId(null);
            }}
          >
            Reset to foundations
          </button>
        </div>
        <p className="psi-catalogue-count" role="status">
          {selected
            ? `${selected.name} selected. ${statusSentence(selected.lifecycle_status)} ${LIVE_MODEL} `
            : null}
          {count}
        </p>
        {roles.length === 0 ? (
          <p className="psi-catalogue-empty">
            No matching roles. Reset to foundations or try another discipline.
          </p>
        ) : (
          <ul className="psi-catalogue-grid">
            {roles.map((capability) => (
              <CatalogueCard
                key={capability.capability_id}
                capability={capability}
                selected={capability.capability_id === selectedId}
                onSelect={() =>
                  setSelectedId((current) =>
                    current === capability.capability_id ? null : capability.capability_id,
                  )
                }
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
