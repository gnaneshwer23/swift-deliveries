import { attentionLabel, orderAttention } from "@/lib/workspace-attention";
import "@/styles/psi-operations.css";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowUpRight, BrainCircuit, CheckCheck, ShieldCheck } from "lucide-react";
import { getSupervisedMissionHome } from "@/lib/pilot-mission.functions";
import { commandCentreBootstrapQuery } from "@/lib/workforce-queries";

const STAGES = ["brief", "evidence", "alternatives", "decision", "artefact", "exported"];
export function WorkspaceOverview({ pipeline }: { pipeline?: ReactNode }) {
  const home = useQuery({
    queryKey: ["supervised", "home"],
    queryFn: () => getSupervisedMissionHome(),
  });
  const legacy = useQuery(commandCentreBootstrapQuery);
  const missions = home.data?.missions ?? [];
  const old = legacy.data?.recentMissions ?? [];
  const waiting =
    missions.filter((m) => ["decide", "approve_follow_up"].includes(m.next.id)).length +
    old.filter((m) => m.status === "awaiting_approval").length;
  const attention = orderAttention(missions).filter(
    (m) => !["cancelled", "follow_up_approved"].includes(m.next.id),
  );
  const running = missions.filter((m) => ["leased", "running"].includes(m.jobStatus)).length;
  const blocked = missions.filter(
    (m) => m.jobStatus === "failed" || ["decide", "approve_follow_up"].includes(m.next.id),
  ).length;
  const outcomes = missions.filter((m) => m.observationRecorded).length;
  const followUps = missions.filter((m) => m.hasFollowUp).length;
  return (
    <>
      <section className="po-attention" aria-labelledby="attention-title">
        <div className="po-attention-heading">
          <div>
            <span className="po-overline">Your product workspace</span>
            <h2 id="attention-title">Move the next decision forward.</h2>
            <p>Pick up a saved question, inspect the work, and decide what happens next.</p>
          </div>
          <a href="#supervised-brief" className="cc-btn cc-btn-primary">
            New product question
          </a>
        </div>
        {home.isPending ? (
          <p role="status">Loading your saved work…</p>
        ) : home.isError || !home.data?.ready ? (
          <div role="alert">
            <p>{home.data?.reason || "Saved work could not load."}</p>
            <button
              className="cc-btn cc-btn-secondary"
              disabled={home.isFetching}
              onClick={() => void home.refetch()}
            >
              {home.isFetching ? "Retrying…" : "Retry saved work"}
            </button>
          </div>
        ) : attention.length === 0 ? (
          <div className="po-first">
            <BrainCircuit size={36} />
            <div>
              <h3>
                {missions.length ? "No open decision actions." : "Start with one product question."}
              </h3>
              <p>
                {missions.length
                  ? "Your saved records remain available below. Start another question when you are ready."
                  : "Your brief becomes the shared record for evidence, options, your decision and a reviewable output."}
              </p>
              <a href="#supervised-brief">
                {missions.length ? "Prepare another brief" : "Prepare your first brief"}
              </a>
            </div>
          </div>
        ) : (
          <div className="po-queue">
            {attention.slice(0, 3).map((m, index) => (
              <Link
                key={m.id}
                to="/command/supervised/$missionId"
                params={{ missionId: m.id }}
                className="po-queue-item"
                data-priority={index === 0 ? "first" : undefined}
              >
                <span className="po-queue-state" data-state={m.next.id}>
                  {attentionLabel(m.next.id)}
                </span>
                <h3>{m.question}</h3>
                <p>{m.objective}</p>
                <strong>
                  {m.nextTitle}
                  <ArrowUpRight size={17} />
                </strong>
              </Link>
            ))}
          </div>
        )}
        {old.some((m) =>
          ["awaiting_approval", "needs_clarification", "blocked", "failed"].includes(m.status),
        ) && (
          <div className="po-task-attention">
            <h3>Specialist work needing attention</h3>
            {old
              .filter((m) =>
                ["awaiting_approval", "needs_clarification", "blocked", "failed"].includes(
                  m.status,
                ),
              )
              .map((m) => (
                <Link key={m.id} to="/command/missions/$missionId" params={{ missionId: m.id }}>
                  <span>{m.title}</span>
                  <strong>
                    {m.status.replaceAll("_", " ")} <ArrowUpRight size={14} />
                  </strong>
                </Link>
              ))}
          </div>
        )}
        <div className="po-workspace-state">
          <span>Model configuration: {home.data?.providerLabel ?? "Checking…"}</span>
          <span>
            Usage units:{" "}
            {home.data?.usage
              ? `${home.data.usage.consumed} / ${home.data.usage.ceiling}`
              : "Unavailable"}
          </span>
        </div>
      </section>
      {pipeline}
      <section className="po-ops-board" aria-labelledby="ops-board-title">
        <div className="ps-section-heading">
          <div>
            <span className="po-overline">Operational view</span>
            <h2 id="ops-board-title">Know what needs a human next.</h2>
            <p>Every number below is projected from a saved mission record.</p>
          </div>
          <span className="ps-pill">Live record status</span>
        </div>
        <div className="po-ops-grid">
          <div className="po-ops-card" data-state={running ? "active" : "quiet"}>
            <small>Running comparisons</small>
            <strong>{running}</strong>
            <span>
              {running ? "Provider work has an active lease." : "No provider work is running."}
            </span>
          </div>
          <div className="po-ops-card" data-state={blocked ? "attention" : "quiet"}>
            <small>Needs attention</small>
            <strong>{blocked}</strong>
            <span>
              {blocked
                ? "Open the queue to resolve a gate or failure."
                : "No blocked approvals or failures."}
            </span>
          </div>
          <div className="po-ops-card" data-state={outcomes ? "complete" : "quiet"}>
            <small>Observed outcomes</small>
            <strong>{outcomes}</strong>
            <span>
              {outcomes
                ? "Owner-supplied results are attached."
                : "No result has been supplied yet."}
            </span>
          </div>
          <div className="po-ops-card" data-state={followUps ? "complete" : "quiet"}>
            <small>Approved follow-ups</small>
            <strong>{followUps}</strong>
            <span>
              {followUps
                ? "Next questions are linked to their review."
                : "Follow-ups stay pending until approved."}
            </span>
          </div>
        </div>
      </section>
      <div className="ps-mission-grid">
        <section className="ps-mission-feed">
          <div className="ps-section-heading">
            <div>
              <h2>Mission activity</h2>
              <p>Your saved work and its next required action.</p>
            </div>
            <span className="ps-pill">Saved records</span>
          </div>
          {home.isError ? (
            <div role="alert">
              <p className="ps-error">Mission activity could not load.</p>
              <button
                className="cc-btn cc-btn-secondary"
                disabled={home.isFetching}
                onClick={() => void home.refetch()}
              >
                Retry
              </button>
            </div>
          ) : home.isPending ? (
            <p className="ps-busy">Loading saved missions…</p>
          ) : !home.data?.ready ? (
            <p className="ps-error">{home.data?.reason}</p>
          ) : missions.length === 0 ? (
            <div className="ps-empty">
              <CheckCheck size={20} />
              <p>
                No supervised missions yet. Save your first product question below to create an
                evidence and decision trail.
              </p>
            </div>
          ) : (
            orderAttention(missions).map((m) => {
              const index = STAGES.indexOf(m.stage);
              return (
                <Link
                  className="ps-mission-item"
                  key={m.id}
                  to="/command/supervised/$missionId"
                  params={{ missionId: m.id }}
                >
                  <div>
                    <strong>{m.question}</strong>
                    <ArrowUpRight size={15} />
                  </div>
                  <div className="ps-stage-track" aria-label={`Recorded stage: ${m.stage}`}>
                    {STAGES.map((s, i) => (
                      <span key={s} className={index >= i ? "is-done" : ""} title={s} />
                    ))}
                  </div>
                  <p>
                    {m.stage === "cancelled"
                      ? "Cancelled"
                      : `Saved stage: ${m.stage} · ${m.nextTitle}`}{" "}
                    · {m.usageConsumed} usage units
                  </p>
                </Link>
              );
            })
          )}
        </section>
        <aside className="ps-mission-aside">
          <ShieldCheck size={28} />
          <h3>Progress you can inspect.</h3>
          <p>
            Task completion, owner approval and measured product outcomes are different signals.
            Each keeps its own record.
          </p>
          <Link to="/command/capabilities">Inspect specialist involvement →</Link>
          <p style={{ marginTop: 20 }}>
            Model configuration: {home.data?.providerLabel ?? "Checking…"}
          </p>
        </aside>
      </div>
    </>
  );
}
