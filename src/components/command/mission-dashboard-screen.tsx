import { useState, type ReactNode } from "react";
import { ConversationPanel } from "@/components/command/conversation-panel";
import {
  buildMissionDashboard,
  MISSION_DASH_NAV,
  type MissionDashNavId,
} from "@/lib/pilot-mission/mission-dashboard-screen";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/mission-dashboard-screen.css";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Lines({ lines, empty }: { lines: string[]; empty: string }) {
  if (!lines.length) return <p className="mdash-empty">{empty}</p>;
  return (
    <ul>
      {lines.map((line) => (
        <li key={line.slice(0, 80)}>{line}</li>
      ))}
    </ul>
  );
}

/**
 * Screen 10 — Mission dashboard: one place to understand the whole mission.
 */
export function MissionDashboardScreen({
  mission,
  downloadsSlot,
  onOpenTeam,
}: {
  mission: SupervisedMission;
  downloadsSlot?: ReactNode | null;
  onOpenTeam?: () => void;
}) {
  const model = buildMissionDashboard(mission);
  const [nav, setNav] = useState<MissionDashNavId>("overview");

  const go = (id: MissionDashNavId) => setNav(id);

  return (
    <section
      className="mdash"
      aria-label="Mission dashboard"
      data-studio-screen="mission-dashboard"
    >
      <header className="mdash-top">
        <div>
          <h2>{model.projectName}</h2>
          <div className="mdash-top-meta">
            <span>
              Stage: <strong>{model.stageLabel}</strong>
            </span>
            <span>
              Progress: <strong>{model.progressPercent}%</strong> · {model.progressLabel}
            </span>
          </div>
        </div>
        <div className="mdash-top-actions">
          <button type="button" className="mdash-btn" onClick={() => go("pm-chat")}>
            PM chat
          </button>
          {model.downloadAvailable ? (
            <button
              type="button"
              className="mdash-btn mdash-btn-primary"
              onClick={() => go("downloads")}
            >
              Download
            </button>
          ) : (
            <button type="button" className="mdash-btn" disabled title={model.downloadHint}>
              Download
            </button>
          )}
        </div>
      </header>

      <div className="mdash-body">
        <nav className="mdash-nav" aria-label="Mission sections">
          <span className="mdash-nav-label">Mission</span>
          {MISSION_DASH_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={nav === item.id ? "page" : undefined}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mdash-main">
          {nav === "overview" ? (
            <>
              <div className="mdash-rail" aria-label="Delivery stage rail">
                {model.rail.map((step) => (
                  <div key={step.id} className="mdash-rail-step" data-state={step.state}>
                    {step.label}
                  </div>
                ))}
              </div>

              <div className="mdash-grid">
                <article className="mdash-card">
                  <h3>Current stage</h3>
                  <p className="mdash-metric" style={{ fontSize: "1rem" }}>
                    {model.currentStage.title}
                  </p>
                  <p>{model.currentStage.detail}</p>
                </article>

                <article className="mdash-card">
                  <h3>Active agents</h3>
                  {model.activeAgents.length ? (
                    <ul>
                      {model.activeAgents.slice(0, 5).map((agent) => (
                        <li key={agent.id}>
                          {agent.label} · {agent.status}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mdash-empty">No specialists are active on the record yet.</p>
                  )}
                </article>

                <article className="mdash-card">
                  <h3>Completed outputs</h3>
                  {model.completedOutputs.length ? (
                    <ul>
                      {model.completedOutputs.slice(0, 4).map((out) => (
                        <li key={out.id}>
                          {out.title}
                          <span className="mdash-badge">{out.honestyLabel}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mdash-empty">No completed outputs are saved on this case yet.</p>
                  )}
                </article>

                <article className="mdash-card">
                  <h3>Pending approvals</h3>
                  {model.pendingApprovals.length ? (
                    <ul>
                      {model.pendingApprovals.slice(0, 3).map((line) => (
                        <li key={line.slice(0, 60)}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mdash-empty">No human gates are waiting right now.</p>
                  )}
                </article>

                <article className="mdash-card mdash-card-wide">
                  <h3>Risks and blockers</h3>
                  {model.risks.length ? (
                    <ul>
                      {model.risks.slice(0, 6).map((risk) => (
                        <li key={risk.id}>
                          <span className="mdash-badge" data-kind={risk.kind}>
                            {risk.kind}
                          </span>{" "}
                          {risk.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mdash-empty">No risks or blockers are recorded on this path.</p>
                  )}
                </article>

                <article className="mdash-card mdash-card-wide">
                  <h3>Latest PM update</h3>
                  <p>{model.latestPmUpdate.summary}</p>
                  <p className="mdash-disclosure" style={{ marginTop: "0.45rem" }}>
                    {formatTime(model.latestPmUpdate.at)} · {model.latestPmUpdate.honesty}
                  </p>
                </article>

                <article className="mdash-card">
                  <h3>Usage / budget</h3>
                  <p className="mdash-metric">
                    {model.usage.consumed}/{model.usage.ceiling}
                  </p>
                  <p>{model.usage.label}</p>
                  <div className="mdash-bar" aria-hidden="true">
                    <i
                      style={{
                        width: `${Math.min(
                          100,
                          model.usage.ceiling
                            ? (model.usage.consumed / model.usage.ceiling) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                </article>

                <article className="mdash-card">
                  <h3>Timeline progress</h3>
                  <p className="mdash-metric">{model.progressPercent}%</p>
                  <p>{model.progressLabel}</p>
                  <div className="mdash-bar" aria-hidden="true">
                    <i style={{ width: `${model.progressPercent}%` }} />
                  </div>
                </article>
              </div>

              <p className="mdash-disclosure">
                Dashboard cards reflect saved mission activity only. Stage rail markers advance when
                artefacts or decisions exist on the case — not from simulated timers.
              </p>
            </>
          ) : null}

          {nav === "pm-chat" ? (
            <div className="mdash-section" id="mdash-pm-chat">
              <h3>PM chat</h3>
              <p className="mdash-disclosure" style={{ marginBottom: "0.75rem" }}>
                Aria drafts; you approve. Chat never authorises external work by itself.
              </p>
              <ConversationPanel
                currentMissionId={mission.id}
                title="Talk with Aria"
                helperText="Ask about stage, blockers, team, or next approvals."
                placeholder="Ask Aria about this mission…"
                suggestedPrompts={[
                  "What is blocking the next step?",
                  "Summarise active agents and outputs.",
                  "What should I approve next?",
                ]}
              />
            </div>
          ) : null}

          {nav === "team" ? (
            <div className="mdash-section">
              <h3>Team</h3>
              <Lines lines={model.teamLines} empty={model.emptySectionNote} />
              {onOpenTeam ? (
                <p style={{ marginTop: "0.85rem" }}>
                  <button type="button" className="mdash-btn" onClick={onOpenTeam}>
                    Open team formation
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}

          {nav === "research" ? (
            <div className="mdash-section">
              <h3>Research</h3>
              <Lines lines={model.researchLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "product-plan" ? (
            <div className="mdash-section">
              <h3>Product plan</h3>
              <Lines lines={model.productPlanLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "design" ? (
            <div className="mdash-section">
              <h3>Design</h3>
              <Lines lines={model.designLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "engineering" ? (
            <div className="mdash-section">
              <h3>Engineering</h3>
              <Lines lines={model.engineeringLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "qa" ? (
            <div className="mdash-section">
              <h3>QA &amp; quality</h3>
              <Lines lines={model.qaLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "data" ? (
            <div className="mdash-section">
              <h3>Data &amp; metrics</h3>
              <Lines lines={model.dataLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "marketing" ? (
            <div className="mdash-section">
              <h3>Marketing</h3>
              <Lines lines={model.marketingLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "decisions" ? (
            <div className="mdash-section">
              <h3>Decisions</h3>
              <Lines lines={model.decisionLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "evidence" ? (
            <div className="mdash-section">
              <h3>Evidence</h3>
              <Lines lines={model.evidenceLines} empty={model.emptySectionNote} />
            </div>
          ) : null}

          {nav === "timeline" ? (
            <div className="mdash-section">
              <h3>Timeline</h3>
              {model.timeline.length ? (
                <div className="mdash-timeline">
                  {model.timeline.map((item) => (
                    <article key={item.id}>
                      <strong>
                        {item.actor} — {item.summary}
                      </strong>
                      <time dateTime={item.at}>{formatTime(item.at)}</time>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mdash-empty">No activity events are saved on this case yet.</p>
              )}
            </div>
          ) : null}

          {nav === "downloads" ? (
            <div className="mdash-section">
              <h3>Downloads</h3>
              <p className="mdash-disclosure" style={{ marginBottom: "0.75rem" }}>
                {model.downloadHint}
              </p>
              {downloadsSlot ?? (
                <p className="mdash-empty">
                  No export is recorded yet. Downloads appear when a pack is prepared or exported.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
