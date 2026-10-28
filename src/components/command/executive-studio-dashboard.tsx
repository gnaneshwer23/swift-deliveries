import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ownerInboxQuery } from "@/lib/workforce-queries";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import {
  attentionChipTone,
  missionNeedsAttention,
  portfolioSummary,
} from "@/lib/pilot-mission/portfolio";
import { buildStudioInbox } from "@/lib/pilot-mission/studio-inbox";
import { INBOX_KIND_LABELS } from "@/lib/workforce/owner-inbox";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";

const since = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function jobStatusLabel(status: string): {
  tone: "success" | "pending" | "urgent" | "neutral";
  text: string;
} {
  if (status === "leased") return { tone: "success", text: "Worker leased" };
  if (status === "failed") return { tone: "urgent", text: "Job failed" };
  if (status === "cancelled") return { tone: "neutral", text: "Cancelled" };
  return { tone: "neutral", text: status };
}

/**
 * Executive Studio foyer (Stitch B): dispatch board with real inbox, job status, and cases —
 * no fabricated telemetry or intelligence walls.
 */
export function ExecutiveStudioDashboard() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const inbox = useQuery(ownerInboxQuery);
  const [caseQuery, setCaseQuery] = useState("");

  const missions = home.data?.ready ? home.data.missions : [];
  const inboxRows = buildStudioInbox(missions);

  const portfolioRows = useMemo(
    () =>
      missions.map((m) => ({
        id: m.id,
        question: m.question,
        stage: m.stage,
        nextTitle: m.nextTitle,
        nextId: m.next.id,
        decisionRecorded: m.decisionRecorded,
        observationRecorded: m.observationRecorded,
        updatedAt: m.updatedAt,
        favourite: m.favourite,
        archived: m.archived,
        monitoringStatus: m.monitoringStatus,
      })),
    [missions],
  );

  const summary = portfolioSummary(portfolioRows);
  const attentionSupervised = useMemo(
    () => portfolioRows.filter((r) => !r.archived && missionNeedsAttention(r.nextId)),
    [portfolioRows],
  );
  const attentionCount = (inbox.data?.items.length ?? 0) + attentionSupervised.length;

  const runningLeased = missions.filter((m) => !m.archived && m.jobStatus === "leased");
  const researchQueued = missions.filter((m) => !m.archived && m.researchPassQueued);

  const openCases = useMemo(() => {
    const q = caseQuery.trim().toLowerCase();
    return missions
      .filter((m) => !m.archived)
      .filter((m) => {
        if (!q) return true;
        return (
          m.question.toLowerCase().includes(q) ||
          m.nextTitle.toLowerCase().includes(q) ||
          m.stage.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 12);
  }, [missions, caseQuery]);

  if (home.isPending) {
    return (
      <p className="ps-exec-meta" role="status">
        Loading studio dispatch…
      </p>
    );
  }

  if (home.isError || (home.data && !home.data.ready)) {
    return (
      <div role="alert" className="ps-exec-card">
        <h2 className="ps-foyer-headline">Saved work could not load</h2>
        <p className="cc-muted text-sm mb-0">
          {home.data?.reason || "Check your connection and try again."}
        </p>
        <div className="ps-exec-card-foot">
          <span className="ps-exec-meta">Studio</span>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-exec-dashboard ps-room ps-room-wide">
      <header className="ps-room-stage" aria-label="Executive dispatch">
        <p className="ps-foyer-brand">DeliverX Studio</p>
        <p className="cc-kicker ps-exec-kicker">Executive dispatch</p>
        <h1 className="ps-foyer-headline">What needs you, and what is running</h1>
        <p className="ps-foyer-lede">
          One line to open a case. Attention rows and job status come from saved mission and
          workforce records — not simulated agent telemetry.
        </p>
        <p className="ps-exec-summary-strip">
          {summary.total} open case{summary.total === 1 ? "" : "s"} · {summary.awaitingDecision}{" "}
          awaiting decision · {runningLeased.length} worker leased · {researchQueued.length}{" "}
          research pass queued
        </p>
      </header>

      <section className="ps-room-section ps-exec-omnibox-well" aria-label="Start a case">
        <p className="ps-exec-section-kicker">New case</p>
        <SupervisedMissionStart tone="hero" />
      </section>

      <section className="ps-room-section" aria-labelledby="exec-attention-title">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 id="exec-attention-title" className="ps-exec-section-kicker mb-0">
            Needs your attention
          </h2>
          {attentionCount > 0 ? (
            <span className="ps-exec-count-badge" aria-label={`${attentionCount} items`}>
              {attentionCount}
            </span>
          ) : null}
        </div>
        {inbox.isPending ? (
          <p className="cc-muted text-sm">Loading workforce inbox…</p>
        ) : attentionCount === 0 && inboxRows.length === 0 ? (
          <p className="cc-muted text-sm">Nothing is waiting on you in open cases.</p>
        ) : (
          <ul className="ps-exec-attention-list">
            {inbox.data?.items.map((item) => (
              <li key={`inbox-${item.kind}-${item.missionId}-${item.taskId ?? ""}`}>
                <article className="ps-exec-card">
                  <div className="ps-exec-card-head">
                    <div>
                      <p className="ps-exec-section-kicker">Workforce mission</p>
                      <h3>{item.action}</h3>
                    </div>
                    <span className="ps-exec-chip" data-tone="pending">
                      {INBOX_KIND_LABELS[item.kind]}
                    </span>
                  </div>
                  <p className="cc-muted text-sm mb-0">
                    {item.missionTitle} · waiting since {since(item.since)}
                  </p>
                  <div className="ps-exec-card-foot">
                    <span className="ps-exec-meta">Human gate</span>
                    <Link
                      to="/command/missions/$missionId"
                      params={{ missionId: item.missionId }}
                      {...(item.hash ? { hash: item.hash } : {})}
                      className="cc-btn cc-btn-primary"
                    >
                      Open mission
                    </Link>
                  </div>
                </article>
              </li>
            ))}
            {attentionSupervised.map((row) => (
              <li key={`supervised-${row.id}`}>
                <article className="ps-exec-card">
                  <div className="ps-exec-card-head">
                    <div>
                      <p className="ps-exec-section-kicker">Supervised case</p>
                      <h3>{row.nextTitle}</h3>
                    </div>
                    <span
                      className="ps-exec-chip"
                      data-tone={
                        attentionChipTone(row.nextId) === "neutral"
                          ? undefined
                          : attentionChipTone(row.nextId)
                      }
                    >
                      {row.stage}
                    </span>
                  </div>
                  <p className="cc-muted text-sm mb-0">{row.question}</p>
                  <div className="ps-exec-card-foot">
                    <span className="ps-exec-meta">Human gate</span>
                    <Link
                      to="/command/supervised/$missionId"
                      params={{ missionId: row.id }}
                      hash="mission-inspect"
                      className="cc-btn cc-btn-primary"
                    >
                      Open case
                    </Link>
                  </div>
                </article>
              </li>
            ))}
            {inboxRows
              .filter((item) => !attentionSupervised.some((r) => r.id === item.missionId))
              .slice(0, 3)
              .map((item) => (
                <li key={`inbox-soft-${item.key}`}>
                  <article className="ps-exec-card">
                    <div className="ps-exec-card-head">
                      <div>
                        <p className="ps-exec-section-kicker">{item.gateLabel}</p>
                        <h3>{item.headline}</h3>
                      </div>
                      <span className="ps-exec-chip" data-tone="review">
                        Inbox
                      </span>
                    </div>
                    <p className="cc-muted text-sm mb-0">{item.question}</p>
                    {item.detail ? <p className="cc-muted text-xs mb-0">{item.detail}</p> : null}
                    <div className="ps-exec-card-foot">
                      <span className="ps-exec-meta">Inspect</span>
                      <Link
                        to="/command/supervised/$missionId"
                        params={{ missionId: item.missionId }}
                        hash="mission-team-activity"
                        className="cc-btn cc-btn-secondary"
                      >
                        Team activity
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
          </ul>
        )}
      </section>

      {(runningLeased.length > 0 || researchQueued.length > 0) && (
        <section className="ps-room-section" aria-labelledby="exec-running-title">
          <h2 id="exec-running-title" className="ps-exec-section-kicker">
            Running on record
          </h2>
          <ul className="ps-exec-case-list">
            {runningLeased.map((m) => {
              const chip = jobStatusLabel(m.jobStatus);
              return (
                <li key={`run-${m.id}`}>
                  <article className="ps-exec-card">
                    <div className="ps-exec-card-head">
                      <h3>{m.question}</h3>
                      <span
                        className="ps-exec-chip"
                        data-tone={chip.tone === "neutral" ? undefined : chip.tone}
                      >
                        {chip.text}
                      </span>
                    </div>
                    <p className="cc-muted text-sm mb-0">
                      Next: {m.nextTitle} · updated {since(m.updatedAt)}
                    </p>
                    <div className="ps-exec-card-foot">
                      <span className="ps-exec-meta">{m.stage}</span>
                      <Link
                        to="/command/supervised/$missionId"
                        params={{ missionId: m.id }}
                        className="cc-btn cc-btn-ghost"
                      >
                        Open
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
            {researchQueued.map((m) => (
              <li key={`research-${m.id}`}>
                <article className="ps-exec-card">
                  <div className="ps-exec-card-head">
                    <h3>{m.question}</h3>
                    <span className="ps-exec-chip" data-tone="success">
                      Research queued
                    </span>
                  </div>
                  <p className="cc-muted text-sm mb-0">
                    Post-approval research pass is queued on the saved record.
                  </p>
                  <div className="ps-exec-card-foot">
                    <span className="ps-exec-meta">{m.stage}</span>
                    <Link
                      to="/command/supervised/$missionId"
                      params={{ missionId: m.id }}
                      className="cc-btn cc-btn-ghost"
                    >
                      Open
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ps-room-section" aria-labelledby="exec-cases-title">
        <h2 id="exec-cases-title" className="ps-exec-section-kicker">
          Cases
        </h2>
        <div className="ps-exec-filter-well mb-3">
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="ps-exec-meta">Search</span>
            <input
              type="search"
              className="cc-input"
              placeholder="Question, stage, or next action"
              value={caseQuery}
              onChange={(e) => setCaseQuery(e.target.value)}
            />
          </label>
          <Link to="/command/portfolio" className="cc-btn cc-btn-secondary self-end">
            Full portfolio
          </Link>
        </div>
        {openCases.length === 0 ? (
          <p className="cc-muted text-sm">No open cases match. Start one above or clear search.</p>
        ) : (
          <ul className="ps-exec-case-list">
            {openCases.map((m) => (
              <li key={m.id}>
                <article className="ps-exec-card">
                  <div className="ps-exec-card-head">
                    <div>
                      <p className="ps-exec-section-kicker">{m.stage}</p>
                      <h3>{m.question}</h3>
                    </div>
                    {missionNeedsAttention(m.next.id) ? (
                      <span className="ps-exec-chip" data-tone={attentionChipTone(m.next.id)}>
                        {m.nextTitle}
                      </span>
                    ) : (
                      <span className="ps-exec-chip">{m.nextTitle}</span>
                    )}
                  </div>
                  <p className="ps-exec-meta mb-0">
                    Updated {since(m.updatedAt)}
                    {m.monitoringStatus ? ` · ${m.monitoringStatus}` : ""}
                  </p>
                  <div className="ps-exec-card-foot">
                    <span className="ps-exec-meta">{jobStatusLabel(m.jobStatus).text}</span>
                    <Link
                      to="/command/supervised/$missionId"
                      params={{ missionId: m.id }}
                      className="cc-btn cc-btn-primary"
                    >
                      Open case
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="ps-foyer-footnotes ps-exec-dashboard-foot">
        <p className="ps-foyer-side-links">
          <Link to="/command/capabilities">Specialists &amp; office</Link>
          <span aria-hidden="true">·</span>
          <Link to="/command/projects">Projects shelf</Link>
        </p>
        <details>
          <summary>Inspect · readiness &amp; honesty</summary>
          <StudioReadiness />
          <p className="cc-muted text-xs mt-2 mb-0">
            Handoff inspector shows persisted teamCollaboration only. Downloads remain the full
            depth layer.
          </p>
        </details>
      </footer>
    </div>
  );
}
