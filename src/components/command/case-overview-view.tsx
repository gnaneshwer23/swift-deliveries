import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  buildMissionDashboard,
  RAIL_STATE_LABELS,
  type MissionDashboardModel,
} from "@/lib/pilot-mission/mission-dashboard-screen";
import type { SupervisedMission } from "@/lib/pilot-mission/types";

const RAIL_TO_STATUS = { done: "done", current: "next", upcoming: "upcoming" } as const;

const WORK_AREAS: Array<{ key: keyof MissionDashboardModel; label: string }> = [
  { key: "researchLines", label: "Research" },
  { key: "productPlanLines", label: "Product plan" },
  { key: "designLines", label: "Design" },
  { key: "engineeringLines", label: "Engineering" },
  { key: "qaLines", label: "QA & quality" },
  { key: "dataLines", label: "Data & metrics" },
  { key: "marketingLines", label: "Marketing" },
];

/**
 * Screen 10 inside the case workspace: what stage the case is in, what waits on you, what is
 * recorded, and what is at risk. Same model as the mission dashboard; every line is read from
 * the saved case.
 */
export function CaseOverviewView({
  mission,
  onOpen,
  nextStep,
}: {
  mission: SupervisedMission;
  onOpen: (view: "team" | "timeline" | "package") => void;
  /** The case's own action controls, shown when a step waits on the owner. */
  nextStep?: ReactNode;
}) {
  const model = buildMissionDashboard(mission);
  return (
    <div className="sx-doc">
      <section aria-labelledby="sx-ov-stage">
        <h3 id="sx-ov-stage">Where the case is</h3>
        <ol className="sx-steps" aria-label="Delivery stages">
          {model.rail.map((step) => (
            <li key={step.id} data-state={step.state === "done" ? "done" : undefined}>
              <span className="sx-status" data-state={RAIL_TO_STATUS[step.state]}>
                {step.label} · {RAIL_STATE_LABELS[step.state]}
              </span>
            </li>
          ))}
        </ol>
        <p className="sx-detail">
          <strong>{model.currentStage.title}.</strong> {model.currentStage.detail}
        </p>
      </section>

      <section aria-labelledby="sx-ov-waiting">
        <h3 id="sx-ov-waiting">Waiting on you</h3>
        {model.waitingOnYou.length ? (
          <ul className="sx-list">
            {model.waitingOnYou.map((line, i) => (
              <li key={i}>
                <span className="sx-status" data-state="waiting">
                  Waiting on you
                </span>
                <p className="sx-detail">{line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sx-empty">Nothing is waiting on you right now.</p>
        )}
        {model.waitingOnYou.length && nextStep ? (
          <details open>
            <summary>
              <strong>Take the next step</strong>
            </summary>
            <div style={{ marginTop: "var(--sx-space-xs)" }}>{nextStep}</div>
          </details>
        ) : null}
      </section>

      <section aria-labelledby="sx-ov-delivery">
        <h3 id="sx-ov-delivery">Delivery</h3>
        {mission.delivery ? (
          <div className="sx-row">
            <p className="sx-detail">
              You approved delivery. The build mission runs the staged plan and waits on you at each
              human gate.
            </p>
            <Link
              to="/command/missions/$missionId"
              params={{ missionId: mission.delivery.wfMissionId }}
              className="sx-btn sx-btn-primary"
            >
              Open delivery mission
            </Link>
          </div>
        ) : (
          <div className="sx-row">
            <p className="sx-detail">Delivery has not started. You approve it from the team.</p>
            <button type="button" className="sx-btn" onClick={() => onOpen("team")}>
              Go to the team
            </button>
          </div>
        )}
      </section>

      <section aria-labelledby="sx-ov-risks">
        <h3 id="sx-ov-risks">Risks and open questions</h3>
        {model.risks.length ? (
          <ul className="sx-list">
            {model.risks.slice(0, 8).map((risk) => (
              <li key={risk.id}>
                <div className="sx-row">
                  <span>{risk.text}</span>
                  <span
                    className="sx-status"
                    data-state={risk.kind === "blocker" ? "blocked" : "upcoming"}
                  >
                    {risk.kind === "blocker" ? "Blocked" : risk.kind === "gap" ? "Gap" : "Risk"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sx-empty">No risks, blockers or gaps are recorded on this case.</p>
        )}
      </section>

      <section aria-labelledby="sx-ov-latest">
        <h3 id="sx-ov-latest">Latest update</h3>
        <p className="sx-detail">{model.latestPmUpdate.summary}</p>
        <p className="sx-detail sx-muted">{model.latestPmUpdate.honesty}</p>
      </section>

      <section aria-labelledby="sx-ov-usage">
        <h3 id="sx-ov-usage">Usage</h3>
        <p className="sx-detail">
          <span className="sx-mono">
            {model.usage.consumed} / {model.usage.ceiling}
          </span>{" "}
          units · {model.usage.label}
        </p>
      </section>

      <section aria-labelledby="sx-ov-areas">
        <h3 id="sx-ov-areas">Work areas</h3>
        <ul className="sx-list">
          {WORK_AREAS.map((area) => {
            const lines = model[area.key] as string[];
            return (
              <li key={area.label}>
                <details>
                  <summary>
                    <strong>{area.label}</strong>
                  </summary>
                  <ul className="sx-detail" style={{ margin: "var(--sx-space-2xs) 0 0" }}>
                    {lines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
