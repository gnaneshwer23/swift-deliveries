import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { orderAttention } from "@/lib/workspace-attention";
import { QuietStudioNotifications } from "@/components/command/quiet-studio-notifications";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";
import { ConversationPanel } from "@/components/command/conversation-panel";

/**
 * Quiet Studio foyer: brand, command line, voice, status — notifications when you are needed.
 */
export function WorkspaceFoyer() {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const missions = home.data?.missions ?? [];
  const attention = orderAttention(missions).filter(
    (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
  );
  const current = attention[0] ?? null;

  return (
    <div className="ps-foyer ps-foyer-first-viewport ps-quiet-foyer">
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
          <div className="ps-foyer-cta">
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
      ) : (
        <section className="ps-foyer-stage ps-foyer-stage-open" aria-label="Studio">
          <p className="ps-foyer-brand">DeliverX Studio</p>
          <h2 className="ps-foyer-headline">One product question.</h2>
          <p className="ps-foyer-lede ps-quiet-foyer-lede">
            Agents work in the background. You see this line, voice or text, and a ping when a gate
            needs you. Decisions and the full roadmap are in your downloads.
          </p>
          {current ? (
            <p className="ps-quiet-bar-status" data-presence="needs_you" role="status">
              <span className="ps-quiet-bar-status-label">Needs your decision</span>
              <span className="ps-quiet-bar-status-detail">{current.nextTitle}</span>
            </p>
          ) : (
            <p className="ps-quiet-bar-status" data-presence="idle" role="status">
              <span className="ps-quiet-bar-status-label">Idle</span>
              <span className="ps-quiet-bar-status-detail">Start a case below or open Portfolio.</span>
            </p>
          )}
        </section>
      )}

      <QuietStudioNotifications missions={missions} />

      <div className="ps-foyer-primary-brief">
        <SupervisedMissionStart tone="hero" />
      </div>

      <footer className="ps-foyer-footnotes">
        <p className="ps-foyer-side-links">
          <Link to="/command/portfolio">Portfolio</Link>
          <span aria-hidden="true">·</span>
          <Link to="/command/capabilities" hash="agents-office">
            Agents office
          </Link>
        </p>
        <details>
          <summary>Inspect · voice &amp; honesty</summary>
          <StudioReadiness />
          <p className="cc-muted text-xs mt-2 mb-3">
            Artefacts disclose Simulated draft or the model id. Voice uses browser speech; nothing
            is approved by voice alone.
          </p>
          <ConversationPanel />
        </details>
      </footer>
    </div>
  );
}
