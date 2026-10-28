import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import {
  getSupervisedMission,
  getSupervisedMissionHome,
  saveSupervisedStudioMeta,
} from "@/lib/pilot-mission.functions";
import { filterPortfolio, portfolioSummary } from "@/lib/pilot-mission/portfolio";
import { findSimilarIdeas } from "@/lib/pilot-mission/similar-ideas";

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
  component: PortfolioPage,
});

function PortfolioPage() {
  const queryClient = useQueryClient();
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
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
  const similar = useMemo(() => {
    if (query.trim().length < 12) return [];
    return findSimilarIdeas(
      query,
      rows.map((r) => ({ id: r.id, question: r.question })),
      3,
    );
  }, [query, rows]);

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
    <CommandShell
      title="Portfolio"
      subtitle="Cases across this workspace — no agent graphs on this page"
    >
      <p className="cc-muted text-sm">
        {summary.total} case{summary.total === 1 ? "" : "s"} · {summary.awaitingDecision} awaiting
        decision · {summary.outcomeDue} outcome review due
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="cc-input"
          style={{ minWidth: "16rem" }}
          placeholder="Search questions, next actions, or monitoring"
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
        <label className="cc-label flex items-center gap-2">
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.target.checked)}
          />
          Needs attention
        </label>
        <label className="cc-label flex items-center gap-2">
          <input
            type="checkbox"
            checked={favouritesOnly}
            onChange={(e) => setFavouritesOnly(e.target.checked)}
          />
          Favourites
        </label>
        <label className="cc-label flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Include archives
        </label>
      </div>

      {similar.length ? (
        <div className="ps-similar-ideas mt-4" role="region" aria-label="Similar cases">
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
        <p className="cc-error mt-4" role="alert">
          {error}
        </p>
      ) : null}
      {home.isPending ? <p className="mt-4">Loading…</p> : null}
      {home.data && !home.data.ready ? <p className="cc-error mt-4">{home.data.reason}</p> : null}

      <ul className="mt-6 grid gap-3">
        {filtered.map((row) => (
          <li key={row.id} className="cc-panel">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  to="/command/supervised/$missionId"
                  params={{ missionId: row.id }}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {row.question}
                </Link>
                <p className="cc-muted mt-1 text-sm">
                  {row.stage} · {row.nextTitle}
                  {row.favourite ? " · favourite" : ""}
                  {row.archived ? " · archived" : ""}
                </p>
                <p className="cc-muted text-xs mb-0">{row.monitoringStatus}</p>
              </div>
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
          </li>
        ))}
        {!home.isPending && filtered.length === 0 ? (
          <li className="cc-muted text-sm">No cases match these filters.</li>
        ) : null}
      </ul>

      <p className="cc-muted mt-6 text-xs">
        <Link to="/command">← Studio foyer</Link>
      </p>
    </CommandShell>
  );
}
