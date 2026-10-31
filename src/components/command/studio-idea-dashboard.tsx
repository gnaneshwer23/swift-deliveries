import { Link } from "@tanstack/react-router";
import { QuietStudioNotifications } from "@/components/command/quiet-studio-notifications";
import { SupervisedMissionStart } from "@/components/command/supervised-mission-start";
import { StudioReadiness } from "@/components/command/studio-readiness";
import { missionNeedsAttention } from "@/lib/pilot-mission/portfolio";
import type { StudioInboxItem, StudioInboxMissionRow } from "@/lib/pilot-mission/studio-inbox";

type IdeaMission = StudioInboxMissionRow & {
  stage: string;
  archived?: boolean;
};

/**
 * Screen 3 — Idea submission (centered Studio form).
 * Starts a supervised case via startSupervisedMission → scope review with Aria.
 */
export function StudioIdeaDashboard({
  missions,
  recent,
  current,
  allowanceLine,
  onBackToWelcome,
  onContinueToClarifying,
}: {
  missions: IdeaMission[];
  recent: IdeaMission[];
  current: StudioInboxItem | null;
  allowanceLine: string | null;
  onBackToWelcome?: () => void;
  onContinueToClarifying: () => void;
}) {
  return (
    <div className="sd-shell sd-shell-submission" data-studio-screen="idea-submission">
      <div className="sd-constellation" aria-hidden="true">
        <svg viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="rgba(99,102,241,0.22)" strokeWidth="1">
            <path d="M80 90 L180 140 L260 80 L360 160 L480 100 L580 180 L700 120" />
            <path d="M120 320 L220 280 L340 340 L460 260 L600 320 L720 280" />
            <path d="M200 200 L320 240 L440 190 L560 250" />
          </g>
          <g fill="rgba(34,211,238,0.35)">
            <circle cx="80" cy="90" r="3" />
            <circle cx="180" cy="140" r="2.5" />
            <circle cx="260" cy="80" r="3" />
            <circle cx="360" cy="160" r="2.5" />
            <circle cx="480" cy="100" r="3" />
            <circle cx="580" cy="180" r="2.5" />
            <circle cx="700" cy="120" r="3" />
            <circle cx="220" cy="280" r="2.5" />
            <circle cx="340" cy="340" r="3" />
            <circle cx="460" cy="260" r="2.5" />
            <circle cx="560" cy="250" r="3" />
          </g>
        </svg>
      </div>

      <div className="sd-topbar">
        <p className="sd-brand">DeliverX</p>
        <p className="sd-step-pill">
          Screen <strong>3</strong> · Idea submission
          {onBackToWelcome ? (
            <>
              <span aria-hidden="true"> · </span>
              <button
                type="button"
                className="sd-btn sd-btn-ghost"
                style={{ minHeight: "1.75rem", padding: "0.2rem 0.7rem", fontSize: "0.72rem" }}
                onClick={onBackToWelcome}
              >
                Welcome
              </button>
            </>
          ) : null}
        </p>
      </div>

      {allowanceLine ? (
        <p className="sd-note" style={{ margin: 0 }} role="status">
          {allowanceLine}
        </p>
      ) : null}

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

      <section className="sd-card sd-submission-card" aria-labelledby="sd-submission-title">
        <SupervisedMissionStart tone="submission" onContinueToClarifying={onContinueToClarifying} />
      </section>

      {recent.length > 0 ? (
        <section className="sd-card sd-submission-recent" aria-labelledby="sd-recent-title">
          <p className="sd-rail-kicker">Continue</p>
          <h2 id="sd-recent-title">Recent investigations</h2>
          <ul className="sd-recent">
            {recent.slice(0, 5).map((m) => (
              <li key={m.id}>
                <Link to="/command/supervised/$missionId" params={{ missionId: m.id }}>
                  <strong>{m.question}</strong>
                  <small>
                    {m.stage}
                    {missionNeedsAttention(m.next.id) ? " · needs you" : ""}
                  </small>
                </Link>
              </li>
            ))}
          </ul>
          <p className="sd-note" style={{ marginTop: "0.85rem" }}>
            <Link to="/command/portfolio">Portfolio</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/command/capabilities">Specialists</Link>
          </p>
        </section>
      ) : null}

      <QuietStudioNotifications missions={missions} />

      <footer className="ps-foyer-footnotes">
        <details>
          <summary>Inspect · readiness</summary>
          <StudioReadiness />
        </details>
      </footer>
    </div>
  );
}
