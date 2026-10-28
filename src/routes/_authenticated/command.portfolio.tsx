import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandShell } from "@/components/command/command-shell";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { filterPortfolio, portfolioSummary } from "@/lib/pilot-mission/portfolio";

export const Route = createFileRoute("/_authenticated/command/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — DeliverX Studio" },
      {
        name: "description",
        content: "Search and filter Investigation cases. Decisions awaiting action — no agent-graph wall.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(true);

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
    }));
  }, [home.data]);

  const filtered = filterPortfolio(rows, { query, stage, attentionOnly });
  const summary = portfolioSummary(rows);
  const stages = [...new Set(rows.map((r) => r.stage))].sort();

  return (
    <CommandShell title="Portfolio" subtitle="Cases across this workspace — no agent graphs on this page">
      <p className="cc-muted text-sm">
        {summary.total} case{summary.total === 1 ? "" : "s"} · {summary.awaitingDecision} awaiting
        decision · {summary.outcomeDue} outcome review due
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="cc-input"
          style={{ minWidth: "16rem" }}
          placeholder="Search questions or next actions"
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
      </div>

      {home.isPending ? <p className="mt-4">Loading…</p> : null}
      {home.data && !home.data.ready ? (
        <p className="cc-error mt-4">{home.data.reason}</p>
      ) : null}

      <ul className="mt-6 grid gap-3">
        {filtered.map((row) => (
          <li key={row.id} className="cc-panel">
            <Link
              to="/command/supervised/$missionId"
              params={{ missionId: row.id }}
              className="font-medium underline-offset-2 hover:underline"
            >
              {row.question}
            </Link>
            <p className="cc-muted mt-1 text-sm">
              {row.stage} · {row.nextTitle}
            </p>
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
