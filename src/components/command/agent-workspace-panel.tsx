import { useState } from "react";
import {
  buildAgentWorkspace,
  type AgentWorkspaceTab,
} from "@/lib/pilot-mission/agent-workspace-screen";
import type { TeamFormationCard } from "@/lib/pilot-mission/team-formation-screen";
import type { SupervisedMission } from "@/lib/pilot-mission/types";
import "@/styles/agent-workspace-screen.css";

const TABS: Array<{ id: AgentWorkspaceTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Tasks" },
  { id: "inputs", label: "Inputs" },
  { id: "outputs", label: "Outputs" },
  { id: "evidence", label: "Evidence" },
  { id: "handoffs", label: "Handoffs" },
];

function formatTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Screen 9 — Individual agent workspace (auditable profile, not a chat log).
 */
export function AgentWorkspacePanel({
  mission,
  card,
}: {
  mission: SupervisedMission;
  card: TeamFormationCard;
}) {
  const model = buildAgentWorkspace(mission, card);
  const [tab, setTab] = useState<AgentWorkspaceTab>("overview");

  return (
    <section className="aws" aria-label="Agent workspace" data-studio-screen="agent-workspace">
      <header className="aws-header">
        <span className="aws-avatar" aria-hidden="true">
          {card.name.slice(0, 1)}
        </span>
        <div>
          <h3>
            {card.name}
            {card.catalogueOnly ? <em className="aws-sample">Catalogue</em> : null}
          </h3>
          <p className="aws-role">{card.role}</p>
        </div>
        <span className="aws-status" data-state={card.status}>
          <i aria-hidden="true" />
          {card.statusLabel}
        </span>
      </header>

      <div className="aws-tabs" role="tablist" aria-label="Workspace sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            className="aws-tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="aws-panel" role="tabpanel">
        {tab === "overview" ? (
          <>
            <article className="aws-card">
              <h4>Current assignment</h4>
              <p>{model.currentAssignment}</p>
            </article>
            <article className="aws-card">
              <h4>Progress</h4>
              <p>{model.progressLabel} — based on saved events for this role, not a timer.</p>
            </article>
            <article className="aws-card">
              <h4>Dependencies</h4>
              {model.dependencies.length ? (
                <ul>
                  {model.dependencies.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="aws-empty">No recorded dependencies for this specialist yet.</p>
              )}
            </article>
            <article className="aws-card">
              <h4>Blockers</h4>
              {model.blockers.length ? (
                <ul>
                  {model.blockers.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="aws-empty">No blockers recorded for this role.</p>
              )}
            </article>
            <article className="aws-card">
              <h4>Questions for Aria</h4>
              {model.questionsForAria.length ? (
                <ul>
                  {model.questionsForAria.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="aws-empty">No open questions generated from the record.</p>
              )}
            </article>
          </>
        ) : null}

        {tab === "tasks" ? (
          model.tasks.length ? (
            model.tasks.map((task) => (
              <article key={task.id} className="aws-card aws-task">
                <h4>{task.title}</h4>
                <p>{task.detail}</p>
                <div className="aws-task-meta">
                  <span>Status: {task.status}</span>
                  <span>Due stage: {task.dueStage}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="aws-empty">No tasks are assigned to this role on the current plan.</p>
          )
        ) : null}

        {tab === "inputs" ? (
          <article className="aws-card">
            <h4>Inputs</h4>
            {model.inputs.length ? (
              <ul>
                {model.inputs.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="aws-empty">No role-specific inputs are listed yet.</p>
            )}
          </article>
        ) : null}

        {tab === "outputs" ? (
          model.outputs.length ? (
            model.outputs.map((output) => (
              <article key={output.id} className="aws-card">
                <h4>{output.title}</h4>
                <p>{output.summary}</p>
                <p className="aws-task-meta">{output.honestyLabel}</p>
              </article>
            ))
          ) : (
            <p className="aws-empty">
              No artefact cards yet. Outputs appear when planned on the team plan or saved to the
              case — personas, flows, and specs are not invented here.
            </p>
          )
        ) : null}

        {tab === "evidence" ? (
          model.evidence.length ? (
            model.evidence.map((row) => (
              <article key={row.id} className="aws-card">
                <h4>
                  {row.classification} · {row.id}
                </h4>
                <p>{row.statement}</p>
                <p className="aws-task-meta">
                  Source:{" "}
                  {row.href ? (
                    <a className="aws-link" href={row.href} target="_blank" rel="noreferrer">
                      {row.source}
                    </a>
                  ) : (
                    row.source
                  )}
                </p>
                <p className="aws-task-meta">
                  Confidence is not shown — DeliverX does not invent confidence scores.
                </p>
              </article>
            ))
          ) : (
            <p className="aws-empty">
              No evidence is linked to this specialist yet. The mission evidence register remains
              available on the case.
            </p>
          )
        ) : null}

        {tab === "handoffs" ? (
          model.handoffs.length ? (
            model.handoffs.map((handoff) => (
              <article key={handoff.id} className="aws-card">
                <h4>
                  {handoff.direction === "received" ? "Received from" : "Sent to"}{" "}
                  {handoff.counterpart}
                </h4>
                <p>{handoff.summary}</p>
                <div className="aws-task-meta">
                  <span>{formatTime(handoff.at)}</span>
                  <span>{handoff.productionLabel}</span>
                  {handoff.evidenceIds.length ? (
                    <span>Evidence: {handoff.evidenceIds.join(", ")}</span>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="aws-empty">
              No handoffs involving this specialist are recorded on the case yet.
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}
