import { useMemo, useState } from "react";
import { decisionLog, evidenceRegister, type EvidenceLabel } from "@/lib/pilot-mission/case-log";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const LABELS: EvidenceLabel[] = ["Source-backed", "User-provided", "Assumption", "Unverified"];

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const labelKind = (label: EvidenceLabel) =>
  label === "Source-backed" ? "source-backed" : label === "Unverified" ? "unverified" : "plain";

/** Screen 12 — why each decision was made, and the evidence register behind it. */
export function CaseEvidenceView({ mission }: { mission: SupervisedMission }) {
  const decisions = decisionLog(mission);
  const register = evidenceRegister(mission);
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<EvidenceLabel | "all">("all");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return register.filter(
      (e) =>
        (label === "all" || e.label === label) &&
        (!q || `${e.statement} ${e.source ?? ""}`.toLowerCase().includes(q)),
    );
  }, [register, query, label]);

  return (
    <div className="sx-doc">
      <section aria-labelledby="sx-decisions">
        <h3 id="sx-decisions">Decisions</h3>
        {decisions.length ? (
          <ol className="sx-list">
            {decisions.map((d) => (
              <li key={d.id}>
                <div className="sx-row">
                  <strong>{d.title}</strong>
                  <span className="sx-mono sx-muted">{when(d.at)}</span>
                </div>
                {d.superseded ? (
                  <p className="sx-detail">
                    <span className="sx-status" data-state="blocked">
                      No longer applies
                    </span>{" "}
                    {d.superseded}
                  </p>
                ) : null}
                <dl className="sx-detail">
                  <dt className="sx-muted">Proposed</dt>
                  <dd>{d.proposedBy}</dd>
                  <dt className="sx-muted">You approved</dt>
                  <dd>{d.approved}</dd>
                  {d.alternatives.length ? (
                    <>
                      <dt className="sx-muted">Alternatives considered</dt>
                      <dd>{d.alternatives.join(" · ")}</dd>
                    </>
                  ) : null}
                  {d.basis.length ? (
                    <>
                      <dt className="sx-muted">Basis</dt>
                      <dd>{d.basis.join(" · ")}</dd>
                    </>
                  ) : null}
                  <dt className="sx-muted">What it changed</dt>
                  <dd>{d.changed}</dd>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sx-empty">No decisions are recorded on this case yet.</p>
        )}
      </section>

      <section aria-labelledby="sx-evidence">
        <h3 id="sx-evidence">Evidence register</h3>
        <div className="sx-filter">
          <label className="sr-only" htmlFor="sx-evidence-search">
            Search evidence
          </label>
          <input
            id="sx-evidence-search"
            className="sx-input"
            type="search"
            placeholder="Search statements and sources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="sr-only" htmlFor="sx-evidence-label">
            Filter by label
          </label>
          <select
            id="sx-evidence-label"
            className="sx-input"
            style={{ maxWidth: "14rem" }}
            value={label}
            onChange={(e) => setLabel(e.target.value as EvidenceLabel | "all")}
          >
            <option value="all">All labels ({register.length})</option>
            {LABELS.map((l) => (
              <option key={l} value={l}>
                {l} ({register.filter((e) => e.label === l).length})
              </option>
            ))}
          </select>
        </div>
        {shown.length ? (
          <ul className="sx-list">
            {shown.map((e) => (
              <li key={e.id}>
                <div className="sx-row">
                  <span>{e.statement}</span>
                  <span className="sx-label" data-kind={labelKind(e.label)}>
                    {e.label}
                  </span>
                </div>
                {e.source ? (
                  /^https?:\/\//i.test(e.source) ? (
                    <a
                      className="sx-detail sx-mono"
                      href={e.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {e.source}
                    </a>
                  ) : (
                    <p className="sx-detail sx-mono">{e.source}</p>
                  )
                ) : (
                  <p className="sx-detail">No source recorded.</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sx-empty">
            {register.length
              ? "No evidence matches this search."
              : "The evidence register is empty on this case."}
          </p>
        )}
      </section>
    </div>
  );
}
