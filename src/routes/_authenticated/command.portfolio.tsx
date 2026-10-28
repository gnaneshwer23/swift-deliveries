import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import type { OwnerInboxState } from "@/components/command/owner-inbox";
import {
  getSupervisedMission,
  getSupervisedMissionHome,
  saveSupervisedStudioMeta,
} from "@/lib/pilot-mission.functions";
import {
  attentionChipTone,
  filterPortfolio,
  missionNeedsAttention,
  portfolioSummary,
} from "@/lib/pilot-mission/portfolio";
import { findSimilarIdeas } from "@/lib/pilot-mission/similar-ideas";
import { INBOX_KIND_LABELS } from "@/lib/workforce/owner-inbox";
import { ownerInboxQuery } from "@/lib/workforce-queries";

export const Route = createFileRoute("/_authenticated/command/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — DeliverX Studio" },
      {
        name: "description",
        content:
          "Search and filter Investigation cases. Decisions awaiting action — no agent-graph wall.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(ownerInboxQuery);
  },
  component: PortfolioPage,
});

const since = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function PortfolioPage() {
  const queryClient = useQueryClient();
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const inbox = useQuery(ownerInboxQuery);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(true);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const missions = home.data?.ready ? home.data.missions : [];
    return missions.map((m) => ({
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
    }));
  }, [home.data]);

  const filtered = filterPortfolio(rows, {
    query,
    stage,
    attentionOnly,
    favouritesOnly,
    includeArchived,
  });
  const summary = portfolioSummary(rows);
  const stages = [...new Set(rows.map((r) => r.stage))].sort();
  const attentionSupervised = useMemo(
    () => rows.filter((r) => !r.archived && missionNeedsAttention(r.nextId)),
    [rows],
  );
  const attentionCount = (inbox.data?.items.length ?? 0) + attentionSupervised.length;

  const similar = useMemo(() => {
    if (query.trim().length < 12) return [];
    return findSimilarIdeas(
      query,
      rows.map((r) => ({ id: r.id, question: r.question })),
      3,
    );
  }, [query, rows]);

  const inboxState: OwnerInboxState = inbox.isPending
    ? { status: "loading" }
    : inbox.isError
      ? { status: "error" }
      : {
          status: "ready",
          items: inbox.data?.items ?? [],
          truncated: inbox.data?.truncated ?? false,
        };

  const toggleMeta = useMutation({
    mutationFn: async (input: { id: string; favourite?: boolean; archived?: boolean }) => {
      const view = await getSupervisedMission({ data: { id: input.id } });
      return saveSupervisedStudioMeta({
        data: {
          id: input.id,
          expectedVersion: view.mission.version,
          favourite: input.favourite,
          archived: input.archived,
        },
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["supervised"] });
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : "Could not update portfolio preferences."),
  });

  return (
    <CommandShell title="Portfolio" hideHeading>
      <div className="ps-room ps-room-wide">
        <header className="ps-room-stage" aria-label="Portfolio">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <p className="cc-kicker ps-exec-kicker">Portfolio</p>
          <h1 className="ps-foyer-headline">Cases across this workspace</h1>
          <p className="ps-foyer-lede">
            Supervised investigations and workforce missions — search, filter, and open what needs
            you. No agent graphs on this page.
          </p>
          <p className="ps-exec-summary-strip">
            {summary.total} supervised case{summary.total === 1 ? "" : "s"} ·{" "}
            {summary.awaitingDecision} awaiting decision · {summary.outcomeDue} outcome review due
          </p>
        </header>

        <section className="ps-room-section" aria-labelledby="portfolio-attention-title">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h2 id="portfolio-attention-title" className="ps-exec-section-kicker mb-0">
              Needs your attention
            </h2>
            {attentionCount > 0 ? (
              <span className="ps-exec-count-badge" aria-label={`${attentionCount} items`}>
                {attentionCount}
              </span>
            ) : null}
          </div>
          {inboxState.status === "loading" || home.isPending ? (
            <p className="cc-muted text-sm">Loading what is waiting on you…</p>
          ) : attentionCount === 0 ? (
            <p className="cc-muted text-sm">Nothing is waiting on you in open cases.</p>
          ) : (
            <ul className="ps-exec-attention-list">
              {inboxState.status === "ready"
                ? inboxState.items.map((item) => (
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
                  ))
                : null}
              {attentionSupervised.map((row) => (
                <li key={`supervised-${row.id}`}>
                  <article className="ps-exec-card">
                    <div className="ps-exec-card-head">
                      <div>
                        <p className="ps-exec-section-kicker">Supervised case</p>
                        <h3>{row.question}</h3>
                      </div>
                      <span className="ps-exec-chip" data-tone={attentionChipTone(row.nextId)}>
                        {row.nextTitle}
                      </span>
                    </div>
                    <p className="cc-muted text-sm mb-0">
                      {row.stage}
                      {row.monitoringStatus ? ` · ${row.monitoringStatus}` : ""}
                    </p>
                    <div className="ps-exec-card-foot">
                      <span className="ps-exec-meta">Updated {since(row.updatedAt)}</span>
                      <Link
                        to="/command/supervised/$missionId"
                        params={{ missionId: row.id }}
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
          {inboxState.status === "ready" && inboxState.truncated ? (
            <p className="cc-muted text-xs mt-2 mb-0">
              Inbox lists decisions from the 200 longest-waiting open workforce missions. Newer
              missions still show decisions on their pages.
            </p>
          ) : null}
          {inboxState.status === "error" ? (
            <p className="cc-error text-sm mt-2" role="alert">
              Workforce inbox could not load — supervised cases above still reflect home data.
            </p>
          ) : null}
        </section>

        <section className="ps-room-section" aria-label="Search and filter">
          <p className="ps-exec-section-kicker">All cases</p>
          <div className="ps-exec-filter-well">
            <input
              className="cc-input"
              style={{ minWidth: "14rem", flex: "1 1 14rem" }}
              placeholder="Search questions, next actions, monitoring"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search portfolio"
            />
            <select
              className="cc-input"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              aria-label="Filter by stage"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="cc-label flex items-center gap-2 mb-0">
              <input
                type="checkbox"
                checked={attentionOnly}
                onChange={(e) => setAttentionOnly(e.target.checked)}
              />
              Needs attention
            </label>
            <label className="cc-label flex items-center gap-2 mb-0">
              <input
                type="checkbox"
                checked={favouritesOnly}
                onChange={(e) => setFavouritesOnly(e.target.checked)}
              />
              Favourites
            </label>
            <label className="cc-label flex items-center gap-2 mb-0">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              Include archives
            </label>
          </div>
        </section>

        {similar.length ? (
          <div className="ps-similar-ideas" role="region" aria-label="Similar cases">
            <p className="cc-muted text-xs mb-2">
              Similar cases for this search (suggestion only — never merged):
            </p>
            <ul className="ps-similar-ideas-list">
              {similar.map((item) => (
                <li key={item.missionId}>
                  <Link
                    to="/command/supervised/$missionId"
                    params={{ missionId: item.missionId }}
                    className="ps-similar-ideas-link"
                  >
                    {item.question}
                  </Link>
                  <p className="cc-muted text-xs mb-0">{item.basis.join(" · ")}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {error ? (
          <p className="cc-error" role="alert">
            {error}
          </p>
        ) : null}
        {home.data && !home.data.ready ? <p className="cc-error">{home.data.reason}</p> : null}

        <ul className="ps-exec-case-list">
          {filtered.map((row) => (
            <li key={row.id}>
              <article className="ps-exec-card">
                <div className="ps-exec-card-head">
                  <div className="min-w-0">
                    <Link
                      to="/command/supervised/$missionId"
                      params={{ missionId: row.id }}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {row.question}
                    </Link>
                    <p className="cc-muted mt-1 text-sm mb-0">
                      {row.stage}
                      {row.favourite ? " · favourite" : ""}
                      {row.archived ? " · archived" : ""}
                    </p>
                  </div>
                  <span
                    className="ps-exec-chip"
                    data-tone={
                      missionNeedsAttention(row.nextId) ? attentionChipTone(row.nextId) : "neutral"
                    }
                  >
                    {row.nextTitle}
                  </span>
                </div>
                {row.monitoringStatus ? (
                  <p className="cc-muted text-xs mb-0">{row.monitoringStatus}</p>
                ) : null}
                <div className="ps-exec-card-foot">
                  <span className="ps-exec-meta">Updated {since(row.updatedAt)}</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="cc-btn cc-btn-ghost"
                      disabled={toggleMeta.isPending}
                      onClick={() => toggleMeta.mutate({ id: row.id, favourite: !row.favourite })}
                    >
                      {row.favourite ? "Unfavourite" : "Favourite"}
                    </button>
                    <button
                      type="button"
                      className="cc-btn cc-btn-ghost"
                      disabled={toggleMeta.isPending}
                      onClick={() => toggleMeta.mutate({ id: row.id, archived: !row.archived })}
                    >
                      {row.archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
          {!home.isPending && filtered.length === 0 ? (
            <li className="cc-muted text-sm">No cases match these filters.</li>
          ) : null}
        </ul>

        <p className="cc-muted text-xs">
          <Link to="/command">← Studio foyer</Link>
        </p>
      </div>
    </CommandShell>
  );
}
