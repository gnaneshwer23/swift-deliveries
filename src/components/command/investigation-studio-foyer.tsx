import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { buildStudioInbox } from "@/lib/pilot-mission/studio-inbox";
import { missionNeedsAttention } from "@/lib/pilot-mission/portfolio";
import { QuietStudioNotifications } from "@/components/command/quiet-studio-notifications";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";

/**
 * Screen 1 — spacious Studio foyer: describe the idea, recent cases, no dispatch theatre.
 */
export function InvestigationStudioFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.ready ? home.data.missions : [];
  const inbox = buildStudioInbox(missions);
  const current = inbox[0] ?? null;

  const recent = missions
    .filter((m) => !m.archived)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 8);

  const allowanceLine = (() => {
    if (!home.data?.ready) return null;
    if (home.data.investigationAllowanceLoad === "failed") {
      return home.data.investigationAllowanceLoadReason ?? "Allowance could not be loaded.";
    }
    if (home.data.investigationAllowance) {
      const n = home.data.investigationAllowance.remaining;
      return `${n} Investigation${n === 1 ? "" : "s"} remaining on your plan.`;
    }
    if (home.data.usage) {
      const left = Math.max(0, home.data.usage.ceiling - home.data.usage.consumed);
      return `Demo ceiling: ${left} of ${home.data.usage.ceiling} units.`;
    }
    return "Demo mode — no paid Investigation pilot on this workspace.";
  })();

  return (
    <div className="ps-foyer ps-foyer-first-viewport ps-quiet-foyer ps-investigation-foyer">
      {home.isPending ? (
        <p className="ps-foyer-loading" role="status">
          Opening…
        </p>
      ) : home.isError || (home.data && !home.data.ready) ? (
        <div role="alert" className="ps-foyer-stage">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <h2 className="ps-foyer-headline">Saved work could not load</h2>
          <p className="ps-foyer-lede">
            {home.data?.reason || "Check your connection and try again."}
          </p>
          <button
            type="button"
            className="cc-btn cc-btn-primary"
            disabled={home.isFetching}
            onClick={() => void home.refetch()}
          >
            {home.isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      ) : (
        <section className="ps-foyer-stage ps-foyer-stage-open" aria-label="Studio">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <h2 className="ps-foyer-headline">What are you thinking of building?</h2>
          <p className="ps-foyer-lede ps-quiet-foyer-lede">
            Describe the product question in a line or two. Agents investigate in the background;
            you return for scope, briefing, and path — not agent-card dashboards.
          </p>
          {allowanceLine ? <p className="ps-exec-summary-strip">{allowanceLine}</p> : null}
          {current ? (
            <p className="ps-quiet-bar-status" data-presence="needs_you" role="status">
              <span className="ps-quiet-bar-status-label">Needs you</span>
              <span className="ps-quiet-bar-status-detail">{current.headline}</span>
              <Link
                to="/command/supervised/$missionId"
                params={{ missionId: current.missionId }}
                className="cc-btn cc-btn-secondary"
              >
                Open case
              </Link>
            </p>
          ) : null}
        </section>
      )}

      <div className="ps-foyer-primary-brief">
        <SupervisedMissionStart tone="hero" />
      </div>

      {recent.length > 0 ? (
        <section className="ps-investigation-recent" aria-labelledby="recent-cases-title">
          <h2 id="recent-cases-title" className="ps-exec-section-kicker">
            Recent investigations
          </h2>
          <ul className="ps-investigation-recent-list">
            {recent.map((m) => (
              <li key={m.id}>
                <Link
                  to="/command/supervised/$missionId"
                  params={{ missionId: m.id }}
                  className="ps-investigation-recent-card"
                >
                  <span className="ps-investigation-recent-question">{m.question}</span>
                  <span className="cc-muted text-xs">
                    {m.stage}
                    {missionNeedsAttention(m.next.id) ? " · needs you" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <QuietStudioNotifications missions={missions} />

      <footer className="ps-foyer-footnotes">
        <p className="ps-foyer-side-links">
          <Link to="/command/portfolio">Portfolio</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/command/capabilities">Specialists</Link>
        </p>
        <details>
          <summary>Inspect · readiness</summary>
          <StudioReadiness />
        </details>
      </footer>
    </div>
  );
}
